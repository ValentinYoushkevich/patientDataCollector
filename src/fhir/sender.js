import { validatePatient } from './validator.js'

export async function sendBundle(bundle, endpoint, token) {
  if (!endpoint) {
    throw new Error('FHIR endpoint не настроен')
  }

  for (const entry of bundle.entry || []) {
    if (entry?.resource?.resourceType === 'Patient') {
      validatePatient(entry.resource)
    }
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/fhir+json',
      Authorization: token ? `Bearer ${token}` : '',
      Accept: 'application/fhir+json'
    },
    body: JSON.stringify(bundle)
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`FHIR endpoint error ${response.status}: ${text}`)
  }

  return response.json()
}
