import { describe, expect, it, vi } from 'vitest'
import { clampedNumericHandler } from './formUtils'

describe('clampedNumericHandler', () => {
  it('calls setter with empty string when input is cleared', () => {
    const setter = vi.fn()
    const handler = clampedNumericHandler(setter, 0, 999)
    handler({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)
    expect(setter).toHaveBeenCalledWith('')
  })

  it('calls setter with string value when input is within range', () => {
    const setter = vi.fn()
    const handler = clampedNumericHandler(setter, 0, 999)
    handler({ target: { value: '42' } } as React.ChangeEvent<HTMLInputElement>)
    expect(setter).toHaveBeenCalledWith('42')
  })

  it('clamps value to max', () => {
    const setter = vi.fn()
    const handler = clampedNumericHandler(setter, 0, 99)
    handler({ target: { value: '200' } } as React.ChangeEvent<HTMLInputElement>)
    expect(setter).toHaveBeenCalledWith('99')
  })

  it('clamps value to min', () => {
    const setter = vi.fn()
    const handler = clampedNumericHandler(setter, 1, 99)
    handler({ target: { value: '0' } } as React.ChangeEvent<HTMLInputElement>)
    expect(setter).toHaveBeenCalledWith('1')
  })

  it('ignores non-numeric input', () => {
    const setter = vi.fn()
    const handler = clampedNumericHandler(setter, 0, 999)
    handler({ target: { value: 'abc' } } as React.ChangeEvent<HTMLInputElement>)
    expect(setter).not.toHaveBeenCalled()
  })
})
