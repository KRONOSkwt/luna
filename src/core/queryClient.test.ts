import { describe, expect, it } from 'vitest'
import { memoriesKey, queryClient } from './queryClient'

describe('core/queryClient', () => {
  it('configures a 5-minute staleTime with single retry and focus refetch', () => {
    const queries = queryClient.getDefaultOptions().queries

    expect(queries?.staleTime).toBe(5 * 60_000)
    expect(queries?.retry).toBe(1)
    expect(queries?.refetchOnWindowFocus).toBe(true)
  })

  it('exports a stable singleton key for the memories query', () => {
    expect(memoriesKey).toEqual(['memories'])
    expect(memoriesKey[0]).toBe('memories')
  })
})
