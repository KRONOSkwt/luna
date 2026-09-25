import { afterEach, describe, expect, it, vi } from 'vitest'
import { detectWebGL } from './webgl'

function stubDocumentWithCanvas(getContext: () => unknown) {
  vi.stubGlobal('document', {
    createElement: () => ({ getContext }),
  })
}

describe('detectWebGL', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns false when the context lookup throws (no black void, 2D fallback)', () => {
    stubDocumentWithCanvas(() => {
      throw new Error('webgl unavailable')
    })

    expect(detectWebGL()).toBe(false)
  })

  it('returns true when webgl2 is available', () => {
    stubDocumentWithCanvas(() => ({ isWebGL2: true }))

    expect(detectWebGL()).toBe(true)
  })

  it('falls back to plain webgl when webgl2 is missing', () => {
    const context = vi.fn()
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => ({ isWebGL2: false }))
    stubDocumentWithCanvas(context)

    expect(detectWebGL()).toBe(true)
    expect(context).toHaveBeenCalledWith('webgl2')
    expect(context).toHaveBeenCalledWith('webgl')
  })

  it('returns false when both context types are unavailable', () => {
    stubDocumentWithCanvas(() => null)

    expect(detectWebGL()).toBe(false)
  })

  it('returns false when the document does not exist at all', () => {
    expect(detectWebGL()).toBe(false)
  })
})