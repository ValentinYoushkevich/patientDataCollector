const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const GENDER = ['male', 'female', 'other', 'unknown']
const BCP47 = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/

function collectErrors(resource) {
  const errors = []

  if (resource?.resourceType !== 'Patient') {
    errors.push('resourceType: expected Patient')
  }

  if (!resource?.identifier?.[0]?.value) {
    errors.push('identifier[0].value: required')
  }

  if (!resource?.name?.[0]?.family) {
    errors.push('name[0].family: required')
  }

  if (resource?.birthDate && !ISO_DATE.test(resource.birthDate)) {
    errors.push('birthDate: expected YYYY-MM-DD')
  }

  if (resource?.gender && !GENDER.includes(resource.gender)) {
    errors.push('gender: invalid code')
  }

  const lang = resource?.communication?.[0]?.language?.coding?.[0]?.code
  if (lang && !BCP47.test(lang)) {
    errors.push('communication[0].language.coding[0].code: invalid BCP-47 code')
  }

  return errors
}

export function validatePatient(patientResource) {
  const errors = collectErrors(patientResource)
  if (errors.length > 0) {
    throw new Error(`FHIR validation failed: ${errors.join('; ')}`)
  }
  return true
}

export function validatePatientSoft(patientResource) {
  return {
    errors: collectErrors(patientResource),
    warnings: []
  }
}
