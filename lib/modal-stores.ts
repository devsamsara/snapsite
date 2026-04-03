/**
 * lib/modal-stores.ts
 *
 * Lightweight promise-based stores for passing data back from modal Stack
 * screens to their callers, without needing a global state manager.
 *
 * Pattern:
 *   1. Caller: await store.open(params)  → waits for modal result
 *   2. Modal:  store.resolve(data)       → returns data to caller
 *              store.cancel()            → returns null to caller
 *
 * Usage in caller:
 *   const result = await annotationTextStore.open({ color, fontSize, x, y });
 *   if (result) { // use result.text, result.color, etc. }
 *
 * Usage in modal:
 *   annotationTextStore.resolve({ text, color, fontSize, x, y });
 *   router.back();
 */

// ─── Generic store factory ────────────────────────────────────────────────────

function createModalStore<TResult>() {
  let _resolve: ((v: TResult | null) => void) | null = null;

  return {
    /** Call from the screen that opens the modal. Returns a promise. */
    open(): Promise<TResult | null> {
      return new Promise((resolve) => {
        _resolve = resolve;
      });
    },
    /** Call from the modal screen to return a result. */
    resolve(data: TResult) {
      _resolve?.(data);
      _resolve = null;
    },
    /** Call from the modal screen when the user cancels. */
    cancel() {
      _resolve?.(null);
      _resolve = null;
    },
  };
}

// ─── Stores ───────────────────────────────────────────────────────────────────

export interface AnnotationTextResult {
  text: string;
  color: string;
  fontSize: number;
  x: number;
  y: number;
}

export interface AnnotationMeasureResult {
  label: string;
}

export interface AddNoteResult {
  projectId: string;
  text: string;
}

export interface InviteMemberResult {
  projectId: string;
  name: string;
  email: string;
  role: string;
}

export const annotationTextStore    = createModalStore<AnnotationTextResult>();
export const annotationMeasureStore = createModalStore<AnnotationMeasureResult>();
export const addNoteStore           = createModalStore<AddNoteResult>();
export const inviteMemberStore      = createModalStore<InviteMemberResult>();
