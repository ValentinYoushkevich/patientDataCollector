function normalizeGender(val) {
  const v = (val || '').toLowerCase()
  if (['male', 'man', 'm', 'мужской'].includes(v)) return 'male'
  if (['female', 'woman', 'f', 'женский'].includes(v)) return 'female'
  if (['other'].includes(v)) return 'other'
  return 'unknown'
}

export function toFHIRPatient(raw) {
  return {
    resourceType: 'Patient',
    identifier: [
      {
        system: `urn:oid:system.${raw._system}`,
        value: raw.mrn
      }
    ],
    name: [
      {
        use: 'official',
        family: raw.family,
        given: raw.given ? [raw.given] : []
      }
    ],
    gender: normalizeGender(raw.gender),
    birthDate: raw.birthDate,
    telecom: [
      raw.phone && { system: 'phone', value: raw.phone, use: 'home' },
      raw.email && { system: 'email', value: raw.email }
    ].filter(Boolean),
    address: raw.addressLine
      ? [
          {
            use: 'home',
            line: [raw.addressLine],
            city: raw.city,
            state: raw.state,
            postalCode: raw.postalCode,
            country: 'US'
          }
        ]
      : [],
    communication: raw.language
      ? [
          {
            language: {
              coding: [{ system: 'urn:ietf:bcp:47', code: raw.language }]
            },
            preferred: true
          }
        ]
      : [],
    meta: {
      source: `chrome-extension/fhir-collector/${raw._system}`,
      lastUpdated: raw._parsedAt
    }
  }
}
