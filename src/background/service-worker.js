import { sendReferral } from '../fhir/sender.js'

const MIN_SIDEPANEL_VERSION = 114

function getBrowserMajorVersion() {
  const ua = navigator.userAgent || ''
  const match = /(?:Edg|Chrome|Chromium)\/(\d+)/.exec(ua)
  return match ? Number(match[1]) : 0
}

async function showUpdateBrowserHint(currentVersion) {
  const versionPart = currentVersion ? ` (current: ${currentVersion})` : ''
  const message = `Update browser. Side panel requires Chromium ${MIN_SIDEPANEL_VERSION}+${versionPart}`
  await chrome.action.setBadgeBackgroundColor({ color: '#dc2626' })
  await chrome.action.setBadgeText({ text: 'UPD' })
  await chrome.action.setTitle({ title: message })
  console.warn(`[Referral Collector] ${message}`)
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Referral Collector] Service worker installed')
})

chrome.action.onClicked.addListener(async (tab) => {
  const majorVersion = getBrowserMajorVersion()
  const sidePanelSupported = Boolean(chrome.sidePanel?.open && chrome.sidePanel?.setOptions)
  if (!sidePanelSupported || majorVersion < MIN_SIDEPANEL_VERSION) {
    await showUpdateBrowserHint(majorVersion)
    return
  }
  if (!tab?.id) return

  chrome.action.setBadgeText({ text: '' })
  chrome.action.setTitle({ title: 'Open Referral Data Collector side panel' })
  chrome.sidePanel.setOptions({
    tabId: tab.id,
    path: 'popup/index.html',
    enabled: true
  })
  await chrome.sidePanel.open({ windowId: tab.windowId })
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'PING') {
    sendResponse({ ok: true, pong: true })
    return true
  }

  if (message?.type === 'SEND_REFERRAL') {
    ;(async () => {
      try {
        const { referralPayload, endpoint } = message.payload ?? {}
        const result = await sendReferral(referralPayload, endpoint)
        sendResponse({ ok: true, result })
      } catch (err) {
        sendResponse({ ok: false, error: err?.message ?? 'Send failed' })
      }
    })()
    return true
  }

  return false
})
