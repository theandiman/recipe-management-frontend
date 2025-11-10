export function parseQuantityString(s: string): { value: number | null; raw: string | null } {
  const m = s.trim().match(/^([0-9]+)\s+([0-9]+)\/([0-9]+)\b/)
  if (m) {
    const whole = parseInt(m[1], 10)
    const num = parseInt(m[2], 10)
    const den = parseInt(m[3], 10)
    if (den !== 0) return { value: whole + num / den, raw: m[0] }
  }
  const m2 = s.trim().match(/^([0-9]+)\/([0-9]+)\b/)
  if (m2) {
    const num = parseInt(m2[1], 10)
    const den = parseInt(m2[2], 10)
    if (den !== 0) return { value: num / den, raw: m2[0] }
  }
  const m3 = s.trim().match(/^([0-9]*\.?[0-9]+)\b/)
  if (m3) {
    return { value: parseFloat(m3[1]), raw: m3[0] }
  }
  return { value: null, raw: null }
}

export function formatQuantity(n: number) {
  if (!isFinite(n)) return String(n)
  const absN = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (Number.isInteger(absN)) return sign + String(Math.round(absN))
  const whole = Math.floor(absN)
  const frac = absN - whole
  const denominators = [2, 3, 4, 8, 16]
  let best = { den: 1, num: 0, err: 1 }
  for (const d of denominators) {
    const num = Math.round(frac * d)
    const approx = num / d
    const err = Math.abs(frac - approx)
    if (err < best.err) best = { den: d, num, err }
  }
  const ERR_THRESHOLD = 0.035
  if (best.num !== 0 && best.err <= ERR_THRESHOLD) {
    const num = best.num
    const den = best.den
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
    const g = gcd(num, den)
    const rnum = num / g
    const rden = den / g
    if (whole === 0) return sign + `${rnum}/${rden}`
    return sign + `${whole} ${rnum}/${rden}`
  }
  return sign + parseFloat(n.toFixed(2)).toString()
}

export function scaleIngredient(ing: unknown, multiplier: number) {
  if (ing == null) return ing
  if (typeof ing === 'string') {
    const { value, raw } = parseQuantityString(ing)
    if (value != null && raw) {
      const scaled = value * multiplier
      const scaledStr = formatQuantity(scaled)
      return ing.replace(raw, scaledStr)
    }
    return ing
  }
  if (typeof ing === 'object') {
    // treat as a record and only modify numeric quantity-like fields
    const rec = ing as Record<string, unknown>
    const copy: Record<string, unknown> = { ...rec }
    if (typeof copy.amount === 'number') copy.amount = (copy.amount as number) * multiplier
    if (typeof copy.quantity === 'number') copy.quantity = (copy.quantity as number) * multiplier
    if (typeof copy.value === 'number') copy.value = (copy.value as number) * multiplier
    return copy
  }
  return ing
}

export default {
  parseQuantityString,
  formatQuantity,
  scaleIngredient,
}
