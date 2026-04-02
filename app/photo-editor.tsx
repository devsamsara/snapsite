/**
 * app/photo-editor.tsx
 *
 * Ruta full-screen que vive FUERA del grupo (tabs).
 * Al navegar aquí, la NativeTab bar desaparece completamente.
 *
 * Uso desde cualquier pantalla:
 *   import { router } from 'expo-router';
 *   router.push('/photo-editor');
 */
import { router } from 'expo-router';
import PhotoEditor from '@/components/camera/PhotoEditor';

export default function PhotoEditorScreen() {
  return (
    <PhotoEditor
      onSaved={() => router.back()}
      onCancel={() => router.back()}
    />
  );
}
