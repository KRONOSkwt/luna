import { describe, expect, it } from 'vitest'
import { formatDate } from './dateFormat'

describe('formatDate (string ops only — calendar nights never cross JS Date)', () => {
  it('formats a YYYY-MM-DD string as DD.MM.YYYY', () => {
    expect(formatDate('2026-09-21')).toBe('21.09.2026')
  })

  it('keeps zero-padded day and month (no coercion to numbers)', () => {
    expect(formatDate('2026-09-06')).toBe('06.09.2026')
    expect(formatDate('2024-02-29')).toBe('29.02.2024')
  })

  it('passes a malformed string through unchanged instead of guessing', () => {
    expect(formatDate('21-09-2026')).toBe('21-09-2026')
  })
})