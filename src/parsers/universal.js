import { PATIENT_FIELDS, normalizeString } from '../referral/schema.js'

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

  for (const key of PATIENT_FIELDS) {
    parsed[key] = tryDataFieldMatch(doc, key) ||
      findByFormControls(doc, key) ||
      findByTextBlocks(doc, key) ||
      ''
  }

  parsed._parsedAt = new Date().toISOString()
  parsed._missingFields = PATIENT_FIELDS.filter((key) => !cleanValue(parsed[key]))
  return parsed
}
