import { validatePatient } from './validator.js'

export async function sendBundle(bundle, endpoint, token, timeoutMs = 15000) {
  if (!endpoint) {
    throw new Error('FHIR endpoint is not configured')
  }

  for (const entry of bundle.entry || []) {
    if (entry?.resource?.resourceType === 'Patient') {
      validatePatient(entry.resource)
    }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), Number(timeoutMs) || 15000)

  let response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/fhir+json',
        Authorization: token ? `Bearer ${token}` : '',
        Accept: 'application/fhir+json'
      },
      body: JSON.stringify(bundle),
      signal: controller.signal
    })
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`FHIR request timeout after ${timeoutMs}ms`)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`FHIR endpoint error ${response.status}: ${text}`)
  }

  return response.json()
}
