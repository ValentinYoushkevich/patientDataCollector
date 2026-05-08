import { parseUniversalPatient } from './universal.js'

export function parseSystemC(doc) {
  return {
    ...parseUniversalPatient(doc),
    _system: 'systemC'
  }
}
