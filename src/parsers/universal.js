import { PATIENT_FIELDS, isValidEmail, normalizeString } from '../referral/schema.js'

const FIELD_PATTERNS = {
  patient_first_name: /(first\s*name|given\s*name|forename)/i,
  patient_last_name: /(last\s*name|family\s*name|surname)/i,
  patient_state: /(^|[\s_-])(state|province|region)($|[\s_-])/i,
  patient_phone: /(phone|cell|mobile|tel)/i,
  patient_email: /(e-?mail|email)/i
}

function cleanValue(value) {
  const text = normalizeString(value)
  if (!text) return ''
  if (/^not provided$/i.test(text)) return ''
  return text
}

/** If the page looks like Practice Fusion / similar EMR profile (data-element layout). */
function isEmrPatientProfileLayout(doc) {
  return Boolean(
    doc.querySelector('[data-element="full-name"]') ||
      doc.querySelector('[data-element="contact-section"]') ||
      doc.querySelector('[data-element^="patient-profile-section"]') ||
      doc.querySelector('[data-element="phone-mobile"]') ||
      doc.querySelector('[data-element="patient-ribbon-patient-name"]') ||
      doc.querySelector('[data-element="city-state-zip"]')
  )
}

function isDataElementNodeHidden(el) {
  if (!el || !(el instanceof Element)) return true
  if (el.hasAttribute('hidden')) return true
  if (el.getAttribute('aria-hidden') === 'true') return true
  if (el.classList?.contains('hidden')) return true
  return false
}

function readDataElementValue(doc, id) {
  const nodes = doc.querySelectorAll(`[data-element="${id}"]`)
  for (const el of nodes) {
    if (isDataElementNodeHidden(el)) continue
    const v = cleanValue(el.textContent || el.value)
    if (v && v !== '--') return v
  }
  return ''
}

function readFirstDataElementAmong(doc, ids) {
  for (const id of ids) {
    const v = readDataElementValue(doc, id)
    if (v && v !== '--') return v
  }
  return ''
}

function splitFullNameToFirstLast(full) {
  const text = cleanValue(full)
  if (!text) return { first: '', last: '' }
  const parts = text.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { first: '', last: '' }
  if (parts.length === 1) return { first: parts[0], last: '' }
  return { first: parts[0], last: parts.slice(1).join(' ') }
}

function parseStateFromCityStateZip(value) {
  const text = cleanValue(value)
  if (!text || text === '--') return ''
  const withZipAbbr = /,\s*([A-Z]{2})\s+\d{5}(?:-\d{4})?\s*$/i
  let m = withZipAbbr.exec(text)
  if (m) return m[1].toUpperCase()
  const abbrOnly = /,\s*([A-Z]{2})\s*,?\s*$/i
  m = abbrOnly.exec(text)
  if (m) return m[1].toUpperCase()
  const withZipName = /,\s*(.+?)\s+\d{5}(?:-\d{4})?\s*$/i
  m = withZipName.exec(text)
  if (m) return cleanValue(m[1])
  return ''
}

function resolvePatientEmailFromDataElements(doc) {
  let patient_email = readFirstDataElementAmong(doc, ['email', 'patient-email'])
  if (patient_email && isValidEmail(patient_email)) return patient_email
  for (const id of ['email', 'patient-email']) {
    const nodes = doc.querySelectorAll(`[data-element="${id}"]`)
    for (const el of nodes) {
      if (isDataElementNodeHidden(el)) continue
      const v = cleanValue(el.textContent || el.value)
      if (v && isValidEmail(v)) return v
    }
  }
  return ''
}

/**
 * Read known data-element ids for EMR profile pages (Practice Fusion–style).
 */
function extractPatientFromDataElements(doc) {
  if (!isEmrPatientProfileLayout(doc)) return null

  const firstExplicit = readFirstDataElementAmong(doc, ['first-name', 'given-name', 'patient-first-name'])
  const lastExplicit = readFirstDataElementAmong(doc, ['last-name', 'family-name', 'patient-last-name', 'surname'])
  const fullName = readDataElementValue(doc, 'full-name')
  const ribbonName = readDataElementValue(doc, 'patient-ribbon-patient-name')

  let patient_first_name = ''
  let patient_last_name = ''
  if (firstExplicit || lastExplicit) {
    patient_first_name = firstExplicit
    patient_last_name = lastExplicit
  } else if (fullName) {
    const split = splitFullNameToFirstLast(fullName)
    patient_first_name = split.first
    patient_last_name = split.last
  } else if (ribbonName) {
    const split = splitFullNameToFirstLast(ribbonName)
    patient_first_name = split.first
    patient_last_name = split.last
  }

  const patient_state =
    readFirstDataElementAmong(doc, ['state', 'patient-state', 'address-state', 'us-state']) ||
    parseStateFromCityStateZip(readDataElementValue(doc, 'city-state-zip'))

  const patient_phone = readFirstDataElementAmong(doc, [
    'phone-mobile',
    'phone',
    'patient-phone',
    'phone-home',
    'phone-work'
  ])

  const patient_email = resolvePatientEmailFromDataElements(doc)

  return {
    patient_first_name,
    patient_last_name,
    patient_state,
    patient_phone,
    patient_email
  }
}

function tryDataFieldMatch(doc, key) {
  const fieldMap = {
    patient_first_name: ['first-name', 'patient-first-name'],
    patient_last_name: ['last-name', 'patient-last-name'],
    patient_state: ['state', 'patient-state'],
    patient_phone: ['phone', 'patient-phone'],
    patient_email: ['email', 'patient-email']
  }

  for (const field of fieldMap[key] || []) {
    const node = doc.querySelector(`[data-field="${field}"]`)
    if (node) {
      const value = cleanValue(node.textContent || node.value)
      if (value) return value
    }
  }
  return ''
}

function extractControlValue(control) {
  if (!control) return ''
  if (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement) {
    return cleanValue(control.value)
  }
  if (control instanceof HTMLSelectElement) {
    return cleanValue(control.value || control.selectedOptions?.[0]?.textContent)
  }
  return cleanValue(control.textContent)
}

function getControlLabel(control, doc) {
  const parts = [
    control.getAttribute('aria-label') || '',
    control.getAttribute('placeholder') || '',
    control.getAttribute('name') || '',
    control.id || ''
  ]

  if (control.id) {
    const linked = doc.querySelector(`label[for="${control.id}"]`)
    if (linked?.textContent) parts.push(linked.textContent)
  }

  const wrapperLabel = control.closest('label')
  if (wrapperLabel?.textContent) {
    parts.push(wrapperLabel.textContent)
  }

  const row = control.closest('tr, .field, .form-group, .row, .input-row, .form-row, .grid')
  if (row?.textContent) {
    parts.push(row.textContent.slice(0, 120))
  }

  return parts.join(' ').toLowerCase()
}

function findByFormControls(doc, key) {
  const controls = Array.from(doc.querySelectorAll('input, textarea, select'))
  const pattern = FIELD_PATTERNS[key]

  for (const control of controls) {
    const labelText = getControlLabel(control, doc)
    if (!pattern.test(labelText)) continue
    const value = extractControlValue(control)
    if (value) return value
  }
  return ''
}

function findByTextBlocks(doc, key) {
  const pattern = FIELD_PATTERNS[key]
  const nodes = Array.from(doc.querySelectorAll('div, span, p, td, th, li'))
  for (const node of nodes) {
    const text = cleanValue(node.textContent)
    if (!text || text.length > 90) continue
    if (!pattern.test(text.toLowerCase())) continue

    const sibling = node.nextElementSibling
    const siblingValue = cleanValue(sibling?.textContent)
    if (siblingValue) return siblingValue

    const parent = node.parentElement
    if (parent) {
      const combined = Array.from(parent.children)
      const idx = combined.indexOf(node)
      const right = combined[idx + 1]
      const rightValue = cleanValue(right?.textContent)
      if (rightValue) return rightValue
    }
  }
  return ''
}

export function parseUniversalPatient(doc) {
  const parsed = {
    patient_first_name: '',
    patient_last_name: '',
    patient_state: '',
    patient_phone: '',
    patient_email: ''
  }

  const fromDataElements = extractPatientFromDataElements(doc)
  const emrLayout = fromDataElements != null

  for (const key of PATIENT_FIELDS) {
    const fromDe = fromDataElements?.[key]
    const fromDeClean = fromDe && cleanValue(fromDe)
    const legacyText = emrLayout ? '' : findByTextBlocks(doc, key)
    parsed[key] =
      fromDeClean ||
      tryDataFieldMatch(doc, key) ||
      findByFormControls(doc, key) ||
      legacyText ||
      ''
  }

  parsed._parsedAt = new Date().toISOString()
  parsed._missingFields = PATIENT_FIELDS.filter((key) => !cleanValue(parsed[key]))
  return parsed
}
