chrome.runtime.onInstalled.addListener(() => {
  console.log('[FHIR Collector] Service worker installed')
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'PING') {
    sendResponse({ ok: true, pong: true })
  }
})
