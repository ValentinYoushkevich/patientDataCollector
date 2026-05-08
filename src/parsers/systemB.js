import { parseUniversalPatient } from './universal.js'

export function parseSystemB(doc) {
  return {
    ...parseUniversalPatient(doc),
    _system: 'systemB'
  }
}
