import { parsePatient } from '../parsers/index.js'

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'COLLECT_DATA') {
    return
  }

  const { systemId } = message.payload ?? {}

  try {
    const rawData = parsePatient(systemId, document)
    sendResponse({ ok: true, data: rawData })
  } catch (err) {
    sendResponse({ ok: false, error: err?.message ?? 'Parsing failed' })
  }

  return true
})
