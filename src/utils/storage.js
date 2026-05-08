const SETTINGS_KEY = 'settings'
const SEND_LOGS_KEY = 'sendLogs'
const DEFAULT_ENDPOINT = 'https://api.treatmyocd.com/v1/external_provider_referrals'
const LEGACY_ENDPOINT = 'https://hapi.fhir.org/baseR4'
const DEFAULTS = {
  referralEndpoint: DEFAULT_ENDPOINT,
  clinicianFirstName: '',
  clinicianLastName: '',
  clinicianEmail: '',
  npiNumber: '',
  organizationName: '',
  organizationState: ''
}

export async function getSettings() {
  const { [SETTINGS_KEY]: settings } = await chrome.storage.local.get(SETTINGS_KEY)
  if (!settings) return { ...DEFAULTS }
  const storedEndpoint = settings.referralEndpoint || settings.fhirEndpoint || ''
  const migratedEndpoint = !storedEndpoint || storedEndpoint === LEGACY_ENDPOINT
    ? DEFAULT_ENDPOINT
    : storedEndpoint

  return {
    ...DEFAULTS,
    ...settings,
    referralEndpoint: migratedEndpoint
  }
}

export async function saveSettings(partial) {
  const current = await getSettings()
  const next = {
    ...current,
    ...partial
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
