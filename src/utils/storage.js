const SETTINGS_KEY = 'settings'
const SEND_LOGS_KEY = 'sendLogs'
const DEFAULTS = {
  fhirEndpoint: 'https://hapi.fhir.org/baseR4',
  authToken: '',
  requestTimeoutMs: 15000
}

export async function getSettings() {
  const { [SETTINGS_KEY]: settings } = await chrome.storage.local.get(SETTINGS_KEY)
  return settings ? { ...DEFAULTS, ...settings } : { ...DEFAULTS }
}

export async function saveSettings(partial) {
  const current = await getSettings()
  const next = {
    ...current,
    ...partial,
    requestTimeoutMs: Number(partial?.requestTimeoutMs ?? current.requestTimeoutMs)
  }
  await chrome.storage.local.set({ [SETTINGS_KEY]: next })
  return next
}

export async function getSendLogs() {
  const { [SEND_LOGS_KEY]: logs } = await chrome.storage.local.get(SEND_LOGS_KEY)
  return Array.isArray(logs) ? logs : []
}

export async function appendSendLog(entry, maxEntries = 20) {
  const logs = await getSendLogs()
  const next = [entry, ...logs].slice(0, maxEntries)
  await chrome.storage.local.set({ [SEND_LOGS_KEY]: next })
  return next
}

export async function clearSendLogs() {
  await chrome.storage.local.set({ [SEND_LOGS_KEY]: [] })
}
