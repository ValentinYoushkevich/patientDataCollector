// Temporary parser with System A selectors as placeholder.
export function parseSystemB(doc) {
  const getText = (selector) => doc.querySelector(selector)?.textContent?.trim() ?? ''

  const raw = {
    patient_first_name: getText('[data-field="first-name"]'),
    patient_last_name: getText('[data-field="last-name"]'),
    patient_state: getText('[data-field="state"]'),
    patient_phone: getText('[data-field="phone"]'),
    patient_email: getText('[data-field="email"]'),
    _system: 'systemB',
    _parsedAt: new Date().toISOString()
  }

  const tracked = ['patient_first_name', 'patient_last_name', 'patient_state', 'patient_phone', 'patient_email']
  raw._missingFields = tracked.filter((k) => !raw[k])

  return raw
}
