import { motion } from 'framer-motion'
import { colors } from '../../../shared/tokens'

/**
 * Full-bleed golden bloom for the first-kiss night. Pure ambiance: layered
 * behind the cards (pointer-events none), breathing via a slow opacity pulse.
 */
export function FirstKissBloom() {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        background: `radial-gradient(ellipse at center, rgba(245, 179, 92, 0.35), transparent 70%)`,
        backgroundColor: colors.obsidiana,
      }}
      animate={{ opacity: [0.15, 0.45, 0.15] }}
      transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
    />
  )
}