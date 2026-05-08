export async function sendReferral(referralPayload, endpoint, _token, timeoutMs = 15000) {
  if (!endpoint) {
    throw new Error('Endpoint is not configured')
  }
  if (!referralPayload?.patient || !referralPayload?.clinician || !referralPayload?.organization) {
    throw new Error('Referral payload must include patient, clinician, and organization blocks')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), Number(timeoutMs) || 15000)

  let response
  try {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }
    response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(referralPayload),
      signal: controller.signal
    })
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Endpoint error ${response.status}: ${text}`)
  }

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }
  return response.text()
}
