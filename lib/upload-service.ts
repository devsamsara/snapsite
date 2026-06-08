/**
 * upload-service.ts
 *
 * Handles image upload to the backend REST endpoint (/api/upload).
 * The backend receives the file, processes it, and stores it in an S3 bucket,
 * returning a public URL that can then be used in the addPhoto GraphQL mutation.
 *
 * Flow:
 *   1. captureRef()  → local file URI  (react-native-view-shot)
 *   2. uploadPhoto() → POST multipart  → backend → S3
 *   3. Returns { url } which is the public S3 URL
 *   4. apolloClient.mutate(AddPhotoDocument) with that URL
 */
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { restoreAuthToken } from '@/lib/graphql-client';

// ─── Config ───────────────────────────────────────────────────────────────────
const GRAPHQL_URL: string =
  (Constants.expoConfig?.extra?.graphqlUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_API_URL ??
  'http://192.168.1.65:4000/api/graphql';

/** Derives the REST API base URL from the GraphQL URL.
 *  e.g. "https://host/api/graphql" → "https://host"
 */
const API_BASE_URL = GRAPHQL_URL.replace(/\/api\/graphql.*$/, '');

// ─── Types ────────────────────────────────────────────────────────────────────
export interface UploadResult {
  url: string;
}

export interface UploadError {
  message: string;
  code?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function getToken(): Promise<string | null> {
  try {
    return await restoreAuthToken();
  } catch {
    return null;
  }
}

/**
 * Uploads a local image URI to the backend.
 *
 * The backend endpoint POST /api/upload accepts multipart/form-data with:
 *   - field "file": the image binary
 *
 * On success it returns: { url: "https://s3.amazonaws.com/..." }
 *
 * @param localUri  - Local file URI from captureRef / ImagePicker
 * @param filename  - Optional filename hint (default: photo.jpg)
 * @returns         - Public URL of the uploaded image
 */
export async function uploadPhoto(
  localUri: string,
  filename = 'photo.jpg',
): Promise<UploadResult> {
  const token = await getToken();

  const uploadUrl = `${API_BASE_URL}/api/upload`;

  // expo-file-system UploadAsync handles multipart correctly on both iOS and Android.
  // It reads the file from the local URI and sends it as a binary stream.
  const response = await FileSystem.uploadAsync(uploadUrl, localUri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: 'file',
    mimeType: 'image/jpeg',
    parameters: {},
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (response.status < 200 || response.status >= 300) {
    let message = `Upload failed with status ${response.status}`;
    try {
      const body = JSON.parse(response.body);
      message = body?.message ?? body?.error ?? message;
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }

  let body: any;
  try {
    body = JSON.parse(response.body);
  } catch {
    throw new Error('Invalid JSON response from upload endpoint');
  }

  // Support multiple response shapes:
  //   { url: "..." }
  //   { data: { url: "..." } }
  //   { fileUrl: "..." }
  //   { location: "..." }
  const url: string =
    body?.url ??
    body?.data?.url ??
    body?.fileUrl ??
    body?.location ??
    body?.publicUrl;

  if (!url || typeof url !== 'string') {
    throw new Error(
      `Upload succeeded but no URL returned. Response: ${response.body.slice(0, 200)}`,
    );
  }

  return { url };
}
