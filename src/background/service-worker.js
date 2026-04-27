import { sendBundle } from '../fhir/sender.js'

chrome.runtime.onInstalled.addListener(() => {
  console.log('[FHIR Collector] Service worker installed')
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'PING') {
    sendResponse({ ok: true, pong: true })
    return true
  }

  if (message?.type === 'SEND_BUNDLE') {
    ;(async () => {
      try {
        const { bundle, endpoint, token, timeoutMs } = message.payload ?? {}
        const result = await sendBundle(bundle, endpoint, token, timeoutMs)
        sendResponse({ ok: true, result })
      } catch (err) {
        sendResponse({ ok: false, error: err?.message ?? 'Send failed' })
      }
    })()
    return true
  }

  return false
})
