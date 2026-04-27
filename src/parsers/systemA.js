// Parser for System A patient page.
export function parseSystemA(doc) {
  const getText = (selector) => doc.querySelector(selector)?.textContent?.trim() ?? ''

  const raw = {
    mrn: getText('[data-field="mrn"]'),
    family: getText('[data-field="last-name"]'),
    given: getText('[data-field="first-name"]'),
    birthDate: getText('[data-field="dob"]'),
    gender: getText('[data-field="gender"]'),
    phone: getText('[data-field="phone"]'),
    email: getText('[data-field="email"]'),
    addressLine: getText('[data-field="address"]'),
    city: getText('[data-field="city"]'),
    state: getText('[data-field="state"]'),
    postalCode: getText('[data-field="zip"]'),
    language: getText('[data-field="language"]'),
    _system: 'systemA',
    _parsedAt: new Date().toISOString()
  }

  const optional = ['phone', 'email', 'addressLine', 'city', 'state', 'postalCode', 'language']
  raw._missingFields = optional.filter((k) => !raw[k])

  const required = ['mrn', 'family', 'birthDate']
  const missingRequired = required.filter((key) => !raw[key])
  if (missingRequired.length > 0) {
    throw new Error(`Не найдены обязательные поля: ${missingRequired.join(', ')}`)
  }

  return raw
}
