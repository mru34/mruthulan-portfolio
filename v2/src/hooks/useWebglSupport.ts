function detectWebgl(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    return !!gl;
  } catch {
    return false;
  }
}

/** Synchronous, one-shot WebGL capability check — no state, no flash of the wrong branch. */
export function useWebglSupport(): boolean {
  return detectWebgl();
}
