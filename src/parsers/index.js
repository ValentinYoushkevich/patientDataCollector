import { parseUniversalPatient } from './universal.js'

export function parsePatient(systemId, doc) {
  const data = parseUniversalPatient(doc)
  return {
    ...data,
    _system: systemId || 'universal'
  }
}

export function detectSystem(url) {
  const value = String(url || '').toLowerCase()
  if (value.includes('systema.com')) return 'systemA'
  if (value.includes('systemb.com')) return 'systemB'
  if (value.includes('systemc.com')) return 'systemC'
  if (value.includes('localhost')) return 'systemA'
  return null
}
