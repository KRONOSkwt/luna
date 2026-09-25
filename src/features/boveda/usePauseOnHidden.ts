import { useEffect, useState } from 'react'

/**
 * Pauses a render loop while the tab is hidden or the window loses focus.
 * Drives R3F `frameloop="never"` (CelestialCanvas) and skips 2D redraws
 * (TwoDSky) — the spec requires the loop to stop in the background and
 * resume on visible/focus.
 */
export function usePauseOnHidden(): boolean {
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const onVisibilityChange = () => setPaused(document.visibilityState === 'hidden')
    const onBlur = () => setPaused(true)
    const onFocus = () => setPaused(false)

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  return paused
}