import { describe, expect, it } from 'vitest'
import { colors, spacing } from './tokens'
import { typography } from './typography'

describe('design tokens', () => {
  it('defines the Obsidiana night-sky palette', () => {
    expect(colors.obsidiana).toBe('#07080A')
    expect(colors.ambar).toBe('#F5B35C')
    expect(colors.polvoEstelar).toBe('#E8E6E3')
  })

  it('defines the 4px spacing base', () => {
    expect(spacing.base).toBe(4)
  })

  it('defines editorial and technical typefaces', () => {
    expect(typography.editorial).toBe('Cormorant Garamond')
    expect(typography.mono).toBe('JetBrains Mono')
  })
})
