/**
 * Utilidades para validación y formateo de RUT chileno
 */

/** Formatea un RUT mientras el usuario escribe: 12.345.678-9 */
export function formatRut(value: string): string {
  // Eliminar todo excepto dígitos y K
  const clean = value.replace(/[^0-9kK]/g, '').toUpperCase()
  if (clean.length === 0) return ''

  const body = clean.slice(0, -1)
  const dv   = clean.slice(-1)

  if (body.length === 0) return dv

  // Agregar puntos cada 3 dígitos desde la derecha
  let formatted = ''
  for (let i = body.length - 1, count = 0; i >= 0; i--, count++) {
    if (count > 0 && count % 3 === 0) formatted = '.' + formatted
    formatted = body[i] + formatted
  }

  return `${formatted}-${dv}`
}

/** Calcula el dígito verificador de un RUT */
function calcDv(rutBody: string): string {
  let sum  = 0
  let mult = 2
  for (let i = rutBody.length - 1; i >= 0; i--) {
    sum  += parseInt(rutBody[i]) * mult
    mult = mult === 7 ? 2 : mult + 1
  }
  const remainder = sum % 11
  if (remainder === 0) return '0'
  if (remainder === 1) return 'K'
  return String(11 - remainder)
}

/** Valida un RUT chileno (acepta formato con o sin puntos/guión) */
export function validateRut(rut: string): boolean {
  if (!rut || rut.trim().length === 0) return false

  const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase()
  if (clean.length < 2) return false

  const body = clean.slice(0, -1)
  const dv   = clean.slice(-1)

  if (!/^\d+$/.test(body)) return false

  const num = parseInt(body)
  if (num < 1_000_000 || num > 99_999_999) return false

  return calcDv(body) === dv
}

/** Limpia un RUT a formato sin puntos: "12345678-9" */
export function cleanRut(rut: string): string {
  const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase()
  if (clean.length < 2) return clean
  return `${clean.slice(0, -1)}-${clean.slice(-1)}`
}
