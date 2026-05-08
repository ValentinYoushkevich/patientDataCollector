import { parseUniversalPatient } from './universal.js'

export function parseSystemA(doc) {
  return {
    ...parseUniversalPatient(doc),
    _system: 'systemA'
  }
}
