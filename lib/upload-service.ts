/**
 * upload-service.ts
 *
 * Flujo presigned URL:
 *   1. getUploadUrl(projectId, fileName, mimeType) → { uploadUrl, fileUrl }
 *   2. PUT uploadUrl ← blob de la imagen (directo a S3, el servidor no toca el archivo)
 *   3. addPhoto(projectId, url: fileUrl) → registra en BD
 *
 * Garantía de URI:
 *   - Cualquier URI que llegue (file://, ph://, ruta absoluta sin scheme, captureRef output)
 *     se normaliza a file:// antes del fetch usando expo-file-system.
 *   - Las URIs ph:// de la galería de iOS se copian a un archivo temporal file://.
 *   - Las rutas absolutas sin scheme (/var/...) reciben el prefijo file://.
 */

import * as FileSystem from 'expo-file-system';
import { apolloClient } from '@/lib/graphql-client';
import {
  AddPhotoDocument,
  FindProjectDocument,
  GetMyProjectsDocument,
  GetUploadUrlDocument,
  UpdatePhotoDocument,
} from '@/gql/graphql';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadPhotoOptions {
  localUri: string;
  projectId: string;
  photoId?: string;
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

/**
 * Extrae nombre de archivo y mimeType a partir de la URI.
 */
function getFileInfo(localUri: string): { fileName: string; mimeType: string } {
  // Eliminar query string o fragmentos si los hay
  const cleanUri = localUri.split('?')[0].split('#')[0];
  const parts = cleanUri.split('/');
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
  const safeExt = ext === 'jpeg' ? 'jpg' : mimeMap[ext] ? ext : 'jpg';
  const fileName = rawName.match(/\.(jpg|jpeg|png|webp|heic|heif)$/i)
    ? rawName
    : `photo_${Date.now()}.${safeExt}`;

  return { fileName, mimeType };
}

/**
 * Garantiza que la URI sea accesible como file:// para fetch().
 *
 * Casos que maneja:
 *   - file:///...         → devuelve tal cual ✅
 *   - /var/... (sin scheme) → añade file:// ✅
 *   - ph://...            → copia a FileSystem.cacheDirectory con FileSystem.copyAsync ✅
 *   - content://...       → copia a cache con FileSystem.copyAsync ✅
 *   - cualquier otro      → intenta añadir file:// ✅
 */
export async function ensureFileUri(uri: string): Promise<string> {
  // Ya es file:// — listo
  if (uri.startsWith('file://')) {
    return uri;
  }

  // Ruta absoluta sin scheme (output de captureRef en algunos entornos)
  if (uri.startsWith('/')) {
    return `file://${uri}`;
  }

  // ph:// (iOS Photos asset) o content:// (Android) — necesita copia
  if (
    uri.startsWith('ph://') ||
    uri.startsWith('content://') ||
    uri.startsWith('assets-library://')
  ) {
    const { mimeType } = getFileInfo(uri);
    const extensionMap: Record<string, string> = {
      'image/png': 'png',
      'image/webp': 'webp',
    };

    // Busca en el mapa y, si no lo encuentra, usa 'jpg' como fallback
    const ext: string = extensionMap[mimeType] || 'jpg';
    const dest = `${FileSystem.cacheDirectory}upload_${Date.now()}.${ext}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  }

  // Fallback: asumir que es una ruta relativa o desconocida
  return `file://${uri}`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export const uploadPhoto = async ({
  localUri,
  projectId,
  photoId,
  caption,
  tags,
}: UploadPhotoOptions): Promise<string> => {
  // ── Paso 0: normalizar la URI a file:// garantizado ──────────────────────────
  const safeUri = await ensureFileUri(localUri);
  console.log('[uploadPhoto] safeUri:', safeUri);

  const { fileName, mimeType } = getFileInfo(safeUri);

  // ── Paso 1: obtener presigned URL del backend ─────────────────────────────────
  const { data } = await apolloClient.query({
    query: GetUploadUrlDocument,
    variables: { projectId, fileName, mimeType },
    fetchPolicy: 'no-cache',
  });

  const { uploadUrl, fileUrl } = data!.getUploadUrl;
  console.log('[uploadPhoto] uploadUrl:', uploadUrl);
  console.log('[uploadPhoto] fileUrl:', fileUrl);

  // ── Paso 2: leer el archivo local como blob y subir a S3 ──────────────────────
  // fetch() con file:// funciona en React Native (Hermes + expo-modules)
  const localResponse = await fetch(safeUri);
  if (!localResponse.ok) {
    throw new Error(
      `No se pudo leer el archivo local: ${safeUri} (status ${localResponse.status})`
    );
  }
  const blob = await localResponse.blob();
  console.log('[uploadPhoto] blob size:', blob.size, 'type:', blob.type);

  // ── Paso 3: PUT directo a S3 ──────────────────────────────────────────────────
  const s3Response = await fetch(uploadUrl, {
    method: 'PUT',
    body: blob,
    headers: {
      'Content-Type': mimeType,
    },
  });

  if (!s3Response.ok) {
    const xml = await s3Response.text().catch(() => '');
    throw new Error(`S3 upload error ${s3Response.status}: ${xml}`);
  }

  console.log('[uploadPhoto] S3 upload OK →', fileUrl);

  // ── Paso 4: registrar la foto en BD ──────────────────────────────────────────
  if (photoId) {
    // Edición — actualizar el registro existente con la nueva URL
    await apolloClient.mutate({
      mutation: UpdatePhotoDocument,
      variables: { id: photoId, url: fileUrl, caption, tags },
      refetchQueries: [FindProjectDocument, GetMyProjectsDocument],
    });
  } else {
    // Nueva foto — crear registro
    await apolloClient.mutate({
      mutation: AddPhotoDocument,
      variables: { projectId, url: fileUrl, caption, tags },
      refetchQueries: [FindProjectDocument, GetMyProjectsDocument],
    });
  }

  return fileUrl;
};

/**
 * normalizeUri — helper legacy para compatibilidad con llamadas existentes.
 * Versión síncrona que solo maneja los casos más comunes.
 * Para el flujo completo usa ensureFileUri (async).
 */
export const normalizeUri = (uri: string): string => {
  if (uri.startsWith('file://') || uri.startsWith('ph://')) return uri;
  if (uri.startsWith('/')) return `file://${uri}`;
  return uri;
};
