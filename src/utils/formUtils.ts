/**
 * Returns an onChange handler for a numeric <input> that clamps the entered
 * value to [min, max] and calls setter with a string representation.
 * An empty input clears the field (calls setter with '').
 */
export const clampedNumericHandler =
  (setter: (v: string) => void, min: number, max: number) =>
  (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw === '') {
      setter('')
      return
    }
    const n = parseInt(raw, 10)
    if (!isNaN(n)) setter(String(Math.min(max, Math.max(min, n))))
  }
