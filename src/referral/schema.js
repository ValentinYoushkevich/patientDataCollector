export const PATIENT_FIELDS = [
  'patient_first_name',
  'patient_last_name',
  'patient_state',
  'patient_phone',
  'patient_email'
]

export const CLINICIAN_FIELDS = [
  'clinicianFirstName',
  'clinicianLastName',
  'clinicianEmail',
  'npiNumber'
]

export const ORGANIZATION_FIELDS = [
  'organizationName',
  'organizationState'
]

export const FIELD_LABELS = {
  patient_first_name: 'First Name',
  patient_last_name: 'Last Name',
  patient_state: 'State',
  patient_phone: 'Phone Number',
  patient_email: 'Email',
  clinicianFirstName: 'Clinician first name',
  clinicianLastName: 'Clinician last name',
  clinicianEmail: 'Clinician email',
  npiNumber: 'NPI number',
  organizationName: 'Organization name',
  organizationState: 'Organization state'
}

export const US_STATE_OPTIONS = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'District Of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah',
  'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming', 'Other'
]

const STATE_NAMES = new Set([
  'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut', 'delaware',
  'district of columbia', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa',
  'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota',
  'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'new hampshire', 'new jersey', 'new mexico',
  'new york', 'north carolina', 'north dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania',
  'rhode island', 'south carolina', 'south dakota', 'tennessee', 'texas', 'utah', 'vermont', 'virginia',
  'washington', 'west virginia', 'wisconsin', 'wyoming'
])

export function normalizeString(value) {
  return String(value ?? '').trim()
}

export function isNonEmpty(value) {
  return normalizeString(value).length > 0
}

export function isValidEmail(value) {
  const text = normalizeString(value)
  if (!text) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)
}

export function isValidState(value) {
  const text = normalizeString(value).toLowerCase()
  if (!text) return false
  if (/^[a-z]{2}$/.test(text)) return true
  return STATE_NAMES.has(text)
}

export function isValidUsPhone(value) {
  const text = normalizeString(value)
  if (!text) return false
  const digits = text.replaceAll(/\D/g, '')
  if (digits.length === 10) return true
  if (digits.length === 11 && digits.startsWith('1')) return true
  return false
}
