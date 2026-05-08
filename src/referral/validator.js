import {
    CLINICIAN_FIELDS,
    FIELD_LABELS,
    ORGANIZATION_FIELDS,
    PATIENT_FIELDS,
    US_STATE_OPTIONS,
    isNonEmpty,
    isValidEmail,
    isValidState,
    isValidUsPhone
} from './schema.js'

function collectMissing(data, keys) {
  return keys.filter((key) => !isNonEmpty(data?.[key]))
}

const PROVIDER_STATE_SET = new Set(US_STATE_OPTIONS)

export function collectPatientIssues(patientData) {
  const missing = collectMissing(patientData, PATIENT_FIELDS)
  const invalid = []

  const state = patientData?.patient_state
  if (isNonEmpty(state) && !isValidState(state)) {
    invalid.push('patient_state')
  }

  const phone = patientData?.patient_phone
  if (isNonEmpty(phone) && !isValidUsPhone(phone)) {
    invalid.push('patient_phone')
  }

  const email = patientData?.patient_email
  if (isNonEmpty(email) && !isValidEmail(email)) {
    invalid.push('patient_email')
  }

  return { missing, invalid }
}

export function collectProviderIssues(settings) {
  const missingClinician = collectMissing(settings, CLINICIAN_FIELDS)
  const missingOrganization = collectMissing(settings, ORGANIZATION_FIELDS)
  const invalidClinician = []
  const invalidOrganization = []

  if (isNonEmpty(settings?.clinicianEmail) && !isValidEmail(settings.clinicianEmail)) {
    invalidClinician.push('clinicianEmail')
  }

  if (isNonEmpty(settings?.organizationState) && !PROVIDER_STATE_SET.has(String(settings.organizationState).trim())) {
    invalidOrganization.push('organizationState')
  }

  return {
    missingClinician,
    missingOrganization,
    invalidClinician,
    invalidOrganization
  }
}

export function buildMissingFieldLabels(keys) {
  return keys.map((key) => FIELD_LABELS[key] || key)
}

export function canSendReferral(patientData, settings) {
  const patient = collectPatientIssues(patientData)
  const provider = collectProviderIssues(settings)
  const hasPatientIssues = patient.missing.length > 0 || patient.invalid.length > 0
  const hasProviderIssues = provider.missingClinician.length > 0 ||
    provider.missingOrganization.length > 0 ||
    provider.invalidClinician.length > 0 ||
    provider.invalidOrganization.length > 0

  return {
    ok: !hasPatientIssues && !hasProviderIssues,
    patient,
    provider
  }
}
