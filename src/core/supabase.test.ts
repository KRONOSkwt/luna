import { describe, expect, it } from 'vitest'

describe('core/supabase env guard', () => {
  it('throws a descriptive error when Supabase env vars are missing', async () => {
    await expect(import('./supabase')).rejects.toThrow(
      '[supabase] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set (see .env.example)',
    )
  })

  it('points the developer at both missing variables and the env template', async () => {
    const error = await import('./supabase').then(
      () => null,
      (err: unknown) => err,
    )
    const message = error instanceof Error ? error.message : String(error)

    expect(message).toContain('VITE_SUPABASE_URL')
    expect(message).toContain('VITE_SUPABASE_ANON_KEY')
    expect(message).toContain('.env.example')
  })
})
