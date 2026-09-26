import { useEffect, useMemo, useRef } from 'react'
import { projectStars } from '../celestial'
import { STARS, nearestStarsTo, starDirectionForDate } from '../starfield'
import { usePauseOnHidden } from '../usePauseOnHidden'

const BASE_STAR_COLOR = '#E8E6E3'
const AMBER_STAR_COLOR = '#F5B35C'
const GOLDEN_NEAREST = 24

/**
 * Canvas2D projection of the SAME seeded starfield the 3D dome uses —
 * the WebGL-null fallback (and the error-boundary fallback) so the sky
 * never becomes a black void. RAF loop pauses with usePauseOnHidden.
 */
export function TwoDSky({
  date = null,
  golden = false,
}: {
  date?: string | null
  golden?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const paused = usePauseOnHidden()
  const pausedRef = useRef(paused)
  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  const forward = useMemo<[number, number, number]>(
    () => (date ? starDirectionForDate(date) : [0, 1, 0]),
    [date],
  )
  const goldenIndices = useMemo(
    () => (golden && date ? new Set(nearestStarsTo(forward, GOLDEN_NEAREST)) : new Set<number>()),
    [golden, date, forward],
  )

  // Logical size + backing-store dpr the draw loop reads. Sized once on mount
  // and on ResizeObserver events — NOT per frame (writing canvas.width/height
  // re-allocates the bitmap every RAF otherwise).
  const sizeRef = useRef({ width: 0, height: 0, dpr: 1 })
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const syncSize = () => {
      const next = {
        width: canvas.clientWidth || canvas.width,
        height: canvas.clientHeight || canvas.height,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
      }
      const current = sizeRef.current
      if (
        next.width === current.width &&
        next.height === current.height &&
        next.dpr === current.dpr
      ) {
        return
      }
      canvas.width = Math.round(next.width * next.dpr)
      canvas.height = Math.round(next.height * next.dpr)
      sizeRef.current = next
    }

    syncSize() // first paint must see the real size, even without an observer
    if (typeof ResizeObserver !== 'function') return
    const observer = new ResizeObserver(syncSize)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return // stub-friendly: nothing to paint, nothing to crash

    const draw = () => {
      const { width, height, dpr } = sizeRef.current
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)

      const points = projectStars(STARS, forward, width, height, goldenIndices)
      for (const point of points) {
        ctx.fillStyle = point.golden ? AMBER_STAR_COLOR : BASE_STAR_COLOR
        ctx.beginPath()
        ctx.arc(point.x, point.y, point.r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    draw() // first paint is synchronous — the sky never waits a frame
    if (typeof requestAnimationFrame !== 'function') return
    let frame = 0
    const loop = () => {
      if (!pausedRef.current) draw()
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [forward, goldenIndices])

  return (
    <canvas
      ref={canvasRef}
      data-testid="two-d-sky"
      aria-hidden="true"
      className="h-full w-full"
    />
  )
}