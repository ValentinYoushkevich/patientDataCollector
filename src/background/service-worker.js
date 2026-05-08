import { sendReferral } from '../fhir/sender.js'

chrome.runtime.onInstalled.addListener(() => {
  console.log('[FHIR Collector] Service worker installed')
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'PING') {
    sendResponse({ ok: true, pong: true })
    return true
  }

  if (message?.type === 'SEND_REFERRAL') {
    ;(async () => {
      try {
        const { referralPayload, endpoint, token, timeoutMs } = message.payload ?? {}
        const result = await sendReferral(referralPayload, endpoint, token, timeoutMs)
        sendResponse({ ok: true, result })
      } catch (err) {
        sendResponse({ ok: false, error: err?.message ?? 'Send failed' })
      }
    })()
    return true
  }

  return false
})
