/* Shared checks for names, emails and phone numbers on every public form
   (checkout, consultation, contact, flight passengers). QA sheet, Nov 2026. */

// Letters (any language), spaces, dots, apostrophes and hyphens; must start with a letter
const NAME_RE = /^\p{L}[\p{L}\p{M} .'-]*$/u

/** '' when the name is fine, otherwise the message to show. */
export function nameError(value: string, label = 'name', required = true): string {
  const v = value.trim()
  if (!v) return required ? `Please enter your ${label}.` : ''
  if (!NAME_RE.test(v) || v.replace(/[^\p{L}]/gu, '').length < 2) return `Please enter a valid ${label} (letters only).`
  return ''
}

export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(value.trim())

/** '' when the number is fine for the chosen dial code, otherwise the message to show.
    India (+91): exactly 10 digits starting 6–9. Other countries: at least 6 digits, 15 max including the country code. */
export function phoneError(dial: string, value: string, label = 'mobile number'): string {
  const digits = value.replace(/[\s()-]/g, '')
  if (!digits) return `Please enter your ${label}.`
  if (!/^\d+$/.test(digits)) return `Your ${label} can only contain digits.`
  if (dial === '+91') return /^[6-9]\d{9}$/.test(digits) ? '' : `Please enter a valid 10-digit ${label}.`
  return digits.length >= 6 && dial.replace(/\D/g, '').length + digits.length <= 15 ? '' : `Please enter a valid ${label}.`
}

/** Most digits allowed in the local number for a dial code (India: 10; elsewhere 15 in total incl. the code). */
export const phoneMaxDigits = (dial: string) => dial === '+91' ? 10 : Math.max(6, 15 - dial.replace(/\D/g, '').length)

/** Use in a phone field's onChange: keeps digits only (letters/symbols can't be typed) and caps the length. */
export const cleanPhone = (dial: string, raw: string) => raw.replace(/\D/g, '').slice(0, phoneMaxDigits(dial))

/** Dial code to preselect for the "Applying from" country chosen earlier (defaults to India). */
export function dialCodeFor(country: string): string {
  const c = country.trim().toLowerCase()
  if (['united kingdom', 'uk'].includes(c)) return '+44'
  if (['united states', 'usa', 'us', 'canada'].includes(c)) return '+1'
  if (['uae', 'united arab emirates'].includes(c)) return '+971'
  return '+91'
}
