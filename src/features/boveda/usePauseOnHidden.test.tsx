import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { usePauseOnHidden } from './usePauseOnHidden'

function setVisibilityState(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value: state,
  })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('usePauseOnHidden', () => {
  afterEach(() => {
    setVisibilityState('visible')
  })

  it('starts unpaused', () => {
    const { result } = renderHook(() => usePauseOnHidden())

    expect(result.current).toBe(false)
  })

  it('pauses when the document becomes hidden and resumes on visible', () => {
    const { result } = renderHook(() => usePauseOnHidden())

    act(() => setVisibilityState('hidden'))
    expect(result.current).toBe(true)

    act(() => setVisibilityState('visible'))
    expect(result.current).toBe(false)
  })

  it('pauses on window blur and resumes on window focus', () => {
    const { result } = renderHook(() => usePauseOnHidden())

    act(() => window.dispatchEvent(new Event('blur')))
    expect(result.current).toBe(true)

    act(() => window.dispatchEvent(new Event('focus')))
    expect(result.current).toBe(false)
  })

  it('cleans up its listeners on unmount', () => {
    const { unmount, result } = renderHook(() => usePauseOnHidden())

    unmount()
    act(() => setVisibilityState('hidden'))

    expect(result.current).toBe(false)
  })
})