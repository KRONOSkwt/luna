/**
 * WebGL capability probe. Returns false when no usable context exists so the
 * page can mount the 2D projection instead — never a black void.
 */
export function detectWebGL(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}