import '@testing-library/jest-dom/vitest'

// --- jsdom stubs for browser APIs the app relies on (PR b canvas work) ---
// 3D/2D canvas contexts are no-op proxies: components must mount and keep
// rendering data even when the GPU/2D context is unavailable in tests.
if (typeof HTMLCanvasElement !== 'undefined') {
  const noopContext = () => null
  HTMLCanvasElement.prototype.getContext =
    noopContext as typeof HTMLCanvasElement.prototype.getContext
}

// navigator.vibrate: present on Android WebView, absent in jsdom.
if (typeof navigator !== 'undefined' && !('vibrate' in navigator)) {
  Object.defineProperty(navigator, 'vibrate', {
    value: () => true,
    configurable: true,
  })
}
