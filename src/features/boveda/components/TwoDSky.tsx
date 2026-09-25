import { useEffect, useMemo, useRef } from 'react'
import { STARS, nearestStarsTo, starDirectionForDate } from '../starfield'
import { usePauseOnHidden } from '../usePauseOnHidden'

const BASE_STAR_COLOR = '#E8E6E3'
const AMBER_STAR_COLOR = '#F5B35C'
const GOLDEN_NEAREST = 24

export type ProjectedStar = { x: number; y: number; r: number; golden: boolean }

/**
 * Pure perspective projection of unit-vector stars onto a canvas plane facing
 * `forward`. Only stars with forward-dot > 0 are visible; screen scale grows
 * as the camera plane recedes (scale = fovK / depth).
 */
export function projectStars(
  stars: Array<[number, number, number]>,
  forward: [number, number, number],
  width: number,
  height: number,
  goldenIndices: Set<number> = new Set(),
): ProjectedStar[] {
  const [fx, fy, fz] = forward

  // Tangent axes: right = normalize(cross(forward, worldUp)), up' = cross(right, forward).
  let rx = -fz
  let ry = 0
  let rz = fx
  const rightLength = Math.hypot(rx, ry, rz)
  if (rightLength < 1e-9) {
    rx = 1
    rz = 0
  } else {
    rx /= rightLength
    rz /= rightLength
  }
  const ux = ry * fz - rz * fy
  const uy = rz * fx - rx * fz
  const uz = rx * fy - ry * fx

  const fovK = Math.min(width, height) * 1.2
  const cx = width / 2
  const cy = height / 2

  const points: ProjectedStar[] = []
  for (let i = 0; i < stars.length; i++) {
    const [sx, sy, sz] = stars[i]
    const depth = sx * fx + sy * fy + sz * fz
    if (depth <= 0) continue
    const screenX = sx * rx + sy * ry + sz * rz
    const screenY = sx * ux + sy * uy + sz * uz
    const scale = fovK / depth
    points.push({
      x: cx + screenX * scale,
      y: cy - screenY * scale,
      r: Math.max(0.4, 1.1 / depth),
      golden: goldenIndices.has(i),
    })
  }
  return points
}

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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return // stub-friendly: nothing to paint, nothing to crash

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const draw = () => {
      const width = canvas.clientWidth || canvas.width
      const height = canvas.clientHeight || canvas.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
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