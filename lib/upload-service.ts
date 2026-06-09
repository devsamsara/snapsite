
import { File } from 'expo-file-system';
import { apolloClient } from '@/lib/graphql-client';
import {
  GetUploadUrlDocument,
  AddPhotoDocument,
  FindProjectDocument,
  GetMyProjectsDocument,
} from '@/gql/graphql';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadPhotoOptions {
  localUri: string;
  projectId: string;
  caption?: string;
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


export const uploadPhoto = async ({
  projectId,
  localUri,
  caption,
  tags,
}: {
  projectId: string;
  localUri: string;
  caption?: string;
  tags?: string[];
}) => {
  // 1. Pedir la URL firmada al backend
  const { mimeType } = getFileInfo(localUri);
  const { data } = await apolloClient.query({
    query: GetUploadUrlDocument,
    variables: {
      projectId,
      fileName: localUri.split('/').pop() ?? 'photo.jpg',
      mimeType,
    },
  });

  const { uploadUrl, fileUrl } = data!.getUploadUrl;

  // 2. Leer el archivo local como blob
  const localResponse = await fetch(localUri);
  const blob = await localResponse.blob();

  // 3. Subir directamente a S3
  const s3Response = await fetch(uploadUrl, {
    method: 'PUT',
    body: blob,
    headers: {
      'Content-Type': mimeType,
    },
  });

  if (!s3Response.ok) {
    const xml = await s3Response.text();
    throw new Error(`S3 error ${s3Response.status}: ${xml}`);
  }

  // 4. Guardar el registro en BD
  await apolloClient.mutate({
    mutation: AddPhotoDocument,
    variables: { projectId, url: fileUrl, caption, tags },
  });

  return fileUrl;
};

export const normalizeUri = (uri: string): string => {
  // Si ya tiene scheme, devolverla tal cual
  if (uri.startsWith('file://') || uri.startsWith('ph://')) return uri;
  // Ruta absoluta sin scheme → añadir file://
  if (uri.startsWith('/')) return `file://${uri}`;
  return uri;
};