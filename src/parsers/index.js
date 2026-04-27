import { parseSystemA } from './systemA.js'
import { parseSystemB } from './systemB.js'
import { parseSystemC } from './systemC.js'

const PARSERS = {
  systemA: parseSystemA,
  systemB: parseSystemB,
  systemC: parseSystemC
}

export function parsePatient(systemId, doc) {
  const parser = PARSERS[systemId]
  if (!parser) {
    throw new Error(`Unknown system: ${systemId}`)
  }

  return parser(doc)
}
