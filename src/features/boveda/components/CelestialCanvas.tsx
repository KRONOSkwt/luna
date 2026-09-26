import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { DOME_POINTS_MATERIAL, buildStarColors, buildStarPositions, meanDirection, STAR_RADIUS } from '../celestial'
import { STARS, nearestStarsTo, starDirectionForDate } from '../starfield'
import { usePauseOnHidden } from '../usePauseOnHidden'

const GOLDEN_NEAREST = 24
const UP = new THREE.Vector3(0, 1, 0)

type Direction = [number, number, number]

function useGoldenStars(date: string | null, golden: boolean): Set<number> {
  return useMemo(() => {
    if (!golden || !date) return new Set<number>()
    return new Set(nearestStarsTo(starDirectionForDate(date), GOLDEN_NEAREST))
  }, [golden, date])
}

/**
 * Rotates the sky so the star of the selected night is overhead; the field
 * eases between nights with an exponential damp (≈1.5 s settle).
 */
function CameraRig({ date, children }: { date: string | null; children: ReactNode }) {
  const group = useRef<THREE.Group>(null)
  const target = useMemo(() => {
    if (!date) return new THREE.Quaternion()
    const dir = new THREE.Vector3(...starDirectionForDate(date))
    return new THREE.Quaternion().setFromUnitVectors(dir, UP)
  }, [date])

  useFrame((_, delta) => {
    if (!group.current) return
    const dt = Math.min(delta, 1 / 30)
    const t = 1 - Math.pow(0.001, dt / 1.5)
    group.current.quaternion.slerp(target, t)
  })

  return <group ref={group}>{children}</group>
}

/** Soft additive glow over the golden stars of the night. */
function GoldenGlow({ indices }: { indices: Set<number> }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
      gradient.addColorStop(0, 'rgba(245, 179, 92, 1)')
      gradient.addColorStop(0.4, 'rgba(245, 179, 92, 0.6)')
      gradient.addColorStop(1, 'rgba(245, 179, 92, 0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 64, 64)
    }
    return new THREE.CanvasTexture(canvas)
  }, [])

  useEffect(() => () => texture.dispose(), [texture])

  const sprites = useMemo(() => {
    if (indices.size === 0) return []
    const dirs: Direction[] = []
    for (const index of indices) dirs.push(STARS[index])
    const centroid = meanDirection(dirs)
    const spread = [...indices].sort((a, b) => a - b)
    const stride = Math.max(1, Math.ceil(spread.length / 3))
    const extras = spread
      .filter((_, k) => k % stride === 0)
      .slice(1, 3)
      .map((index) => STARS[index])
    return [
      { position: centroid, scale: 12 },
      ...extras.map((dir) => ({ position: dir, scale: 7 })),
    ]
  }, [indices])

  return (
    <>
      {sprites.map(({ position, scale }, key) => (
        <sprite key={key} position={[position[0] * STAR_RADIUS, position[1] * STAR_RADIUS, position[2] * STAR_RADIUS]} scale={[scale, scale, 1]}>
          <spriteMaterial
            attach="material"
            map={texture}
            blending={THREE.AdditiveBlending}
            transparent
            depthWrite={false}
          />
        </sprite>
      ))}
    </>
  )
}

/**
 * The 3D bóveda: ONE <points> draw call with the shared seeded starfield,
 * golden tint + glow, damped rotation toward the night, loop paused while the
 * tab is hidden. The SkyErrorBoundary above this swaps in TwoDSky on failure.
 */
export function CelestialCanvas({ date, golden }: { date: string | null; golden: boolean }) {
  const paused = usePauseOnHidden()
  const goldenStars = useGoldenStars(date, golden)

  const geometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(buildStarPositions(), 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(buildStarColors(goldenStars), 3))
    return geometry
  }, [goldenStars])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <Canvas
      camera={{ position: [0, 0, 0], fov: 75, near: 0.1, far: 400 }}
      dpr={typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0 ? [1, 1.5] : [1, 2]}
      frameloop={paused ? 'never' : 'always'}
      gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}
    >
      <CameraRig date={date}>
        <points frustumCulled={false} geometry={geometry}>
          <pointsMaterial attach="material" {...DOME_POINTS_MATERIAL} />
        </points>
        <GoldenGlow indices={goldenStars} />
      </CameraRig>
    </Canvas>
  )
}