/**
 * upload-service.ts
 *
 * Handles image upload to S3 via presigned URLs provided by the backend.
 *
 * Flow:
 *   1. captureRef()  → local file URI  (react-native-view-shot)
 *   2. Query getUploadUrl(projectId, fileName, mimeType)
 *      ← { uploadUrl, fileUrl }
 *   3. PUT uploadUrl ← blob de la imagen (directo a S3, el servidor no toca el archivo)
 *   4. Mutation addPhoto(projectId, url: fileUrl, caption?, tags?)
 *      ← { id, url, caption, tags, createdAt }
 */

import * as FileSystem from 'expo-file-system';
import { apolloClient } from '@/lib/graphql-client';
import {
  GetUploadUrlDocument,
  AddPhotoDocument,
  FindProjectDocument,
  GetMyProjectsDocument,
} from '@/gql/graphql';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadPhotoOptions {
  /** Local file URI from captureRef / ImagePicker */
  localUri: string;
  /** Project ID to associate the photo with */
  projectId: string;
  /** Optional caption for the photo */
  caption?: string;
  /** Optional tags for the photo */
  tags?: string[];
}

export interface UploadPhotoResult {
  id: string;
  url: string;
  caption: string;
  tags?: (string | null)[] | null;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Derives a clean filename and mimeType from a local URI.
 * Defaults to "photo_<timestamp>.jpg" if the URI has no extension.
 */
function getFileInfo(localUri: string): { fileName: string; mimeType: string } {
  const parts = localUri.split('/');
  const rawName = parts[parts.length - 1] ?? '';
  const ext = rawName.split('.').pop()?.toLowerCase() ?? 'jpg';

  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
  };

  const mimeType = mimeMap[ext] ?? 'image/jpeg';
  const safeExt = ext === 'jpeg' ? 'jpg' : ext;
  const fileName = rawName.match(/\.(jpg|jpeg|png|webp|heic|heif)$/i)
    ? rawName
    : `photo_${Date.now()}.${safeExt}`;

  return { fileName, mimeType };
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Full upload flow:
 *  1. Ask the backend for a presigned S3 URL
 *  2. PUT the image blob directly to S3
 *  3. Register the photo in the backend DB via addPhoto mutation
 *
 * @returns The created Photo object from the backend
 */
export async function uploadPhoto(options: UploadPhotoOptions): Promise<UploadPhotoResult> {
  const { localUri, projectId, caption = '', tags = [] } = options;
  const { fileName, mimeType } = getFileInfo(localUri);

  // ── Step 1: Get presigned upload URL from backend ──────────────────────────
  const { data: urlData, errors: urlErrors } = await apolloClient.query({
    query: GetUploadUrlDocument,
    variables: { projectId, fileName, mimeType },
    fetchPolicy: 'no-cache',
  });

  if (urlErrors?.length || !urlData?.getUploadUrl) {
    const msg = urlErrors?.[0]?.message ?? 'Failed to get upload URL from backend';
    throw new Error(msg);
  }

  const { uploadUrl, fileUrl } = urlData.getUploadUrl;

  // ── Step 2: Read file as base64 and convert to blob, then PUT to S3 ────────
  // expo-file-system reads the local file; fetch() sends it directly to S3.
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Convert base64 → Uint8Array → Blob for a clean binary PUT
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });

  const putResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': mimeType },
    body: blob,
  });

  if (!putResponse.ok) {
    throw new Error(
      `S3 upload failed: ${putResponse.status} ${putResponse.statusText}`,
    );
  }

  // ── Step 3: Register photo in the backend DB ───────────────────────────────
  const { data: photoData, errors: photoErrors } = await apolloClient.mutate({
    mutation: AddPhotoDocument,
    variables: {
      projectId,
      url: fileUrl,
      caption: caption || undefined,
      tags: tags.length > 0 ? tags : undefined,
    },
    refetchQueries: [
      { query: FindProjectDocument, variables: { findProjectId: projectId } },
      GetMyProjectsDocument,
    ],
  });

  if (photoErrors?.length || !photoData?.addPhoto) {
    const msg = photoErrors?.[0]?.message ?? 'Failed to register photo in backend';
    throw new Error(msg);
  }

  return photoData.addPhoto as UploadPhotoResult;
}
