<template>
  <div class="p-4 flex flex-col gap-4">
    <Toast />

    <div class="fpc-surface rounded-lg p-4">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <img :src="brandIconUrl" alt="Referral Collector icon" class="h-10 w-10 rounded-sm mt-0.5" />
          <div>
            <h2 class="text-base font-semibold fpc-title">Referral Data Collector</h2>
          </div>
        </div>
        <div v-if="uiScreen === 'main'" class="flex items-center gap-1">
          <div class="relative">
            <Button
              v-tooltip.top="'Settings'"
              icon="pi pi-cog"
              text
              rounded
              severity="secondary"
              aria-label="Open settings"
              @click="openSettings"
            />
            <span
              v-if="!providerReady"
              class="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-red-500 border border-white"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </div>

    <template v-if="uiScreen === 'main'">
      <div class="fpc-surface rounded-lg p-4">
        <div class="text-xs fpc-subtle">Universal parser mode is enabled.</div>
        <div class="text-xs mt-2" :class="providerReady ? 'text-emerald-700' : 'text-amber-700'">
          Provider profile: {{ providerReady ? 'Complete' : 'Incomplete' }}
        </div>
        <div v-if="!providerReady" class="text-xs text-amber-700 mt-1">
          Open Settings to fill required clinician and organization fields.
        </div>
      </div>

      <div v-if="phase === 'idle'" class="fpc-surface rounded-lg p-4">
        <Button label="Parse Data" icon="pi pi-download" class="w-full" @click="doParse" />
      </div>

      <div
        v-if="phase === 'parsing' || phase === 'sending'"
        class="fpc-surface rounded-lg p-4"
      >
        <div class="flex items-center gap-2 fpc-title">
          <i class="pi pi-spin pi-spinner" />
          <span>{{ phase === 'parsing' ? 'Reading data from page...' : 'Sending referral...' }}</span>
        </div>
      </div>

      <Message v-if="phase === 'parse-error'" severity="error">
        {{ parseError }}
      </Message>
      <Message v-if="patientWarningMessage" severity="warn">
        {{ patientWarningMessage }}
      </Message>
      <Message v-if="providerWarningMessage" severity="warn">
        {{ providerWarningMessage }}
      </Message>

      <div v-if="isParsedPhase" class="fpc-surface rounded-lg p-4">
        <PatientCard
          :data="parsedData"
          :invalidFields="patientIssues.invalid"
          @update:data="handleParsedDataUpdate"
          @pick:field="pickFieldFromPage"
        />
        <div class="flex flex-col gap-2 mt-3">
          <Button
            label="Send referral"
            icon="pi pi-send"
            class="w-full"
            :disabled="!canSend"
            @click="doSend"
          />
          <Button
            label="Parse Again"
            icon="pi pi-refresh"
            severity="secondary"
            class="w-full"
            @click="doParse"
          />
        </div>
      </div>

      <div
        v-if="isParsedPhase && (debugLastRequest || debugLastResponse || sendError)"
        class="fpc-surface rounded-lg p-4"
      >
        <h4 class="text-sm font-semibold fpc-title mb-2">Debug send result</h4>
        <div v-if="sendError" class="text-xs text-red-700 mb-2">{{ sendError }}</div>
        <div v-if="debugLastRequest" class="mb-2">
          <div class="text-xs font-semibold fpc-title mb-1">Request payload</div>
          <pre class="text-[11px] p-2 rounded bg-slate-100 overflow-auto max-h-32">{{ debugLastRequest }}</pre>
        </div>
        <div v-if="debugLastResponse">
          <div class="text-xs font-semibold fpc-title mb-1">Response</div>
          <pre class="text-[11px] p-2 rounded bg-slate-100 overflow-auto max-h-32">{{ debugLastResponse }}</pre>
        </div>
        <div class="mt-3 rounded border border-amber-300 bg-amber-50 p-2 text-[11px] text-amber-800">
          <div class="font-semibold mb-1">Integration hints</div>
          <div>- Ask backend to allow your extension origin (`chrome-extension://&lt;id&gt;`) or provide an API-key flow.</div>
          <div>- Proxy-server approach: your backend accepts extension requests and forwards server-to-server to NOCD API.</div>
        </div>
      </div>

      <div ref="sendResultAnchor" />

      <div v-if="false">
        <LogView :logs="sendLogs" @clear="clearLogsClick" />
      </div>
    </template>

    <template v-else>
      <div class="fpc-surface rounded-lg p-4">
        <div class="flex items-center gap-2 mb-2">
          <Button
            icon="pi pi-arrow-left"
            text
            rounded
            severity="secondary"
            aria-label="Back"
            @click="closeSettingsWithoutSave"
          />
          <h3 class="text-sm font-semibold fpc-title">Send Settings</h3>
        </div>
        <div class="flex flex-col gap-2">
          <InputText v-model="settingsDraft.referralEndpoint" placeholder="Referral endpoint URL" />
          <Divider />
          <h4 class="text-sm font-semibold fpc-title">Clinician & Organization</h4>
          <div class="flex flex-col gap-1">
            <label for="clinician-first-name" class="text-xs font-medium fpc-subtle">
              Clinician first name <span class="text-red-600">*</span>
            </label>
            <InputText
              inputId="clinician-first-name"
              v-model="settingsDraft.clinicianFirstName"
              placeholder="Clinician first name"
              :invalid="isProviderFieldMissing('clinicianFirstName')"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label for="clinician-last-name" class="text-xs font-medium fpc-subtle">
              Clinician last name <span class="text-red-600">*</span>
            </label>
            <InputText
              inputId="clinician-last-name"
              v-model="settingsDraft.clinicianLastName"
              placeholder="Clinician last name"
              :invalid="isProviderFieldMissing('clinicianLastName')"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label for="clinician-email" class="text-xs font-medium fpc-subtle">
              Clinician email <span class="text-red-600">*</span>
            </label>
            <InputText
              inputId="clinician-email"
              v-model="settingsDraft.clinicianEmail"
              placeholder="Clinician email"
              :invalid="isProviderFieldMissing('clinicianEmail') || providerDraftIssues.invalidClinician.includes('clinicianEmail')"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label for="npi-number" class="text-xs font-medium fpc-subtle">
              NPI number <span class="text-red-600">*</span>
            </label>
            <InputText
              inputId="npi-number"
              v-model="settingsDraft.npiNumber"
              placeholder="NPI number"
              :invalid="isProviderFieldMissing('npiNumber')"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label for="organization-name" class="text-xs font-medium fpc-subtle">
              Organization name <span class="text-red-600">*</span>
            </label>
            <InputText
              inputId="organization-name"
              v-model="settingsDraft.organizationName"
              placeholder="Organization name"
              :invalid="isProviderFieldMissing('organizationName')"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label for="organization-state" class="text-xs font-medium fpc-subtle">
              Organization state <span class="text-red-600">*</span>
            </label>
            <Select
              inputId="organization-state"
              v-model="settingsDraft.organizationState"
              :options="stateOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select an option"
              :invalid="isProviderFieldMissing('organizationState') || providerDraftIssues.invalidOrganization.includes('organizationState')"
            />
          </div>
          <small v-if="providerIssuesMessage" class="text-amber-700">{{ providerIssuesMessage }}</small>
        </div>
        <div class="flex gap-2 mt-3">
          <Button label="Save Settings" icon="pi pi-save" size="small" @click="saveSettingsClick" />
          <Button label="Back" icon="pi pi-arrow-left" severity="secondary" size="small" @click="closeSettingsWithoutSave" />
        </div>
      </div>
    </template>

  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'

import Button from 'primevue/button'
import Divider from 'primevue/divider'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Select from 'primevue/select'
import Toast from 'primevue/toast'

import { PATIENT_FIELDS, US_STATE_OPTIONS } from '../../referral/schema.js'
import { buildMissingFieldLabels, canSendReferral, collectPatientIssues, collectProviderIssues } from '../../referral/validator.js'
import { appendSendLog, clearSendLogs, getSendLogs, getSettings, saveSettings } from '../../utils/storage.js'
import PatientCard from '../components/PatientCard.vue'
import LogView from './LogView.vue'


// phase: idle | parsing | parse-error | parsed | parsed-partial | sending | send-error | sent
const phase = ref('idle')
const parsedData = ref(null)
const parseError = ref('')
const sendError = ref('')
const pickError = ref('')
const sendLogs = ref([])
const uiScreen = ref('main')
const sendResultAnchor = ref(null)
const debugLastRequest = ref('')
const debugLastResponse = ref('')
const settings = ref({
  referralEndpoint: 'https://api.treatmyocd.com/v1/external_provider_referrals'
})
const settingsDraft = ref({ ...settings.value })
const brandIconUrl = chrome.runtime.getURL('icons/icon32.png')
const stateOptions = US_STATE_OPTIONS.map((state) => ({ label: state, value: state }))

const isParsedPhase = computed(() =>
  ['parsed', 'parsed-partial', 'sent', 'send-error'].includes(phase.value)
)
const patientIssues = computed(() => collectPatientIssues(parsedData.value || {}))
const providerIssues = computed(() => collectProviderIssues(settings.value))
const providerDraftIssues = computed(() => collectProviderIssues(settingsDraft.value))
const canSend = computed(() => canSendReferral(parsedData.value || {}, settings.value).ok)
const providerReady = computed(() => {
  const issues = providerIssues.value
  return issues.missingClinician.length === 0 &&
    issues.missingOrganization.length === 0 &&
    issues.invalidClinician.length === 0 &&
    issues.invalidOrganization.length === 0
})
const patientWarningMessage = computed(() => {
  if (!parsedData.value) return ''
  const missing = buildMissingFieldLabels(patientIssues.value.missing)
  const invalid = buildMissingFieldLabels(patientIssues.value.invalid)
  const parts = []
  if (missing.length > 0) {
    parts.push(`Missing patient fields: ${missing.join(', ')}`)
  }
  if (invalid.length > 0) {
    parts.push(`Invalid patient fields: ${invalid.join(', ')}`)
  }
  if (pickError.value) {
    parts.push(pickError.value)
  }
  return parts.join('. ')
})
const providerWarningMessage = computed(() => {
  if (!isParsedPhase.value) return ''
  const issues = providerIssues.value
  const missing = buildMissingFieldLabels([...issues.missingClinician, ...issues.missingOrganization])
  const invalid = buildMissingFieldLabels([...issues.invalidClinician, ...issues.invalidOrganization])
  const parts = []
  if (missing.length > 0) {
    parts.push(`Missing provider fields: ${missing.join(', ')}`)
  }
  if (invalid.length > 0) {
    parts.push(`Invalid provider fields: ${invalid.join(', ')}`)
  }
  return parts.join('. ')
})
const providerIssuesMessage = computed(() => {
  if (uiScreen.value !== 'settings') return ''
  const issues = providerDraftIssues.value
  const missing = buildMissingFieldLabels([...issues.missingClinician, ...issues.missingOrganization])
  const invalid = buildMissingFieldLabels([...issues.invalidClinician, ...issues.invalidOrganization])
  if (missing.length === 0 && invalid.length === 0) return ''
  const chunks = []
  if (missing.length) chunks.push(`Missing: ${missing.join(', ')}`)
  if (invalid.length) chunks.push(`Invalid: ${invalid.join(', ')}`)
  return chunks.join('. ')
})

async function collectFromTab(systemId) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) {
    throw new Error('Active tab was not found')
  }

  const payload = {
    type: 'COLLECT_DATA',
    payload: { systemId }
  }

  let response
  try {
    response = await chrome.tabs.sendMessage(tab.id, payload)
  } catch (error) {
    const rawMessage = String(error?.message || '')
    if (rawMessage.includes('Receiving end does not exist')) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['src/content/index.js']
        })
        response = await chrome.tabs.sendMessage(tab.id, payload)
      } catch {
        throw new Error(
          'Failed to attach content script. Open a supported page (localhost / systemA/systemB/systemC) and refresh the tab.'
        )
      }
    } else {
      throw error
    }
  }

  if (!response?.ok) {
    throw new Error(response?.error ?? 'Failed to collect data')
  }

  return response.data
}

async function doParse() {
  parseError.value = ''
  sendError.value = ''
  pickError.value = ''

  const systemId = 'universal'
  phase.value = 'parsing'

  try {
    parsedData.value = await collectFromTab(systemId)
    if (parsedData.value?._missingFields?.length > 0) {
      phase.value = 'parsed-partial'
    } else {
      phase.value = 'parsed'
    }
  } catch (err) {
    parseError.value = err?.message ?? 'Parsing error'
    phase.value = 'parse-error'
  }
}

function handleParsedDataUpdate(nextData) {
  pickError.value = ''
  const nextMissingFields = PATIENT_FIELDS.filter((key) => !String(nextData?.[key] || '').trim())
  parsedData.value = {
    ...nextData,
    _missingFields: nextMissingFields
  }
  if (parsedData.value?._missingFields?.length > 0) {
    phase.value = 'parsed-partial'
  } else {
    phase.value = 'parsed'
  }
}

function normalizeStateForPayload(value) {
  const raw = String(value || '').trim()
  if (!raw) return null
  if (/^[a-z]{2}$/i.test(raw)) {
    return raw.toUpperCase()
  }
  return raw
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function buildReferralPayload() {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  return {
    additional_notes: null,
    email: settings.value.clinicianEmail || null,
    first_name: settings.value.clinicianFirstName || null,
    is_iop_referral_raw: null,
    last_name: settings.value.clinicianLastName || null,
    npi_number: settings.value.npiNumber || null,
    organization_name: settings.value.organizationName || null,
    patient_email: parsedData.value.patient_email || null,
    patient_first_name: parsedData.value.patient_first_name || null,
    patient_last_name: parsedData.value.patient_last_name || null,
    patient_phone: parsedData.value.patient_phone || null,
    patient_state: normalizeStateForPayload(parsedData.value.patient_state),
    primary_carer_email: null,
    primary_carer_first_name: null,
    primary_carer_last_name: null,
    primary_carer_phone: null,
    primary_carer_relation: null,
    relation_to_patient: null,
    source: 'website_referral_page',
    state: normalizeStateForPayload(settings.value.organizationState),
    time_zone: timeZone,
    who_to_contact: 'Patient'
  }
}

async function doSend() {
  if (!parsedData.value) return
  const sendCheck = canSendReferral(parsedData.value, settings.value)
  if (!sendCheck.ok) {
    phase.value = 'parsed-partial'
    sendError.value = 'Fill all required patient/provider fields before sending.'
    await nextTick()
    sendResultAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    return
  }

  phase.value = 'sending'
  sendError.value = ''

  try {
    const referralPayload = buildReferralPayload()
    debugLastRequest.value = JSON.stringify(referralPayload, null, 2)
    const endpoint = settings.value.referralEndpoint

    const response = await chrome.runtime.sendMessage({
      type: 'SEND_REFERRAL',
      payload: { referralPayload, endpoint }
    })

    if (!response?.ok) {
      throw new Error(response?.error ?? 'Send failed')
    }
    debugLastResponse.value = JSON.stringify(response.result ?? { ok: true }, null, 2)

    sendLogs.value = await appendSendLog({
      at: new Date().toISOString(),
      system: parsedData.value._system,
      endpoint,
      resultId: response.result?.id ?? 'ok'
    })

    phase.value = 'sent'
    const responsePreview = typeof response.result === 'string'
      ? response.result.slice(0, 48)
      : response.result?.id || response.result?.status || 'ok'
    await nextTick()
    sendResultAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  } catch (err) {
    sendError.value = err?.message ?? 'Send error'
    debugLastResponse.value = JSON.stringify(
      { ok: false, error: sendError.value },
      null,
      2
    )
    phase.value = 'send-error'
    await nextTick()
    sendResultAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }
}

async function saveSettingsClick() {
  settings.value = await saveSettings(settingsDraft.value)
  settingsDraft.value = { ...settings.value }
  uiScreen.value = 'main'
}

async function clearLogsClick() {
  await clearSendLogs()
  sendLogs.value = []
}

function openSettings() {
  settingsDraft.value = { ...settings.value }
  uiScreen.value = 'settings'
}

function closeSettingsWithoutSave() {
  settingsDraft.value = { ...settings.value }
  uiScreen.value = 'main'
}

function isProviderFieldMissing(key) {
  const issues = providerDraftIssues.value
  return issues.missingClinician.includes(key) || issues.missingOrganization.includes(key)
}

async function pickFieldFromPage(fieldKey) {
  pickError.value = ''
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) {
    pickError.value = 'Active tab was not found.'
    return
  }
  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'PICK_FIELD_START',
      payload: { fieldKey }
    })
    if (!response?.ok) {
      throw new Error(response?.error || 'Field picker failed')
    }
    handleParsedDataUpdate({
      ...parsedData.value,
      [fieldKey]: String(response.value || '').trim()
    })
  } catch (error) {
    pickError.value = error?.message || 'Field picker failed'
  }
}

onMounted(async () => {
  settings.value = await getSettings()
  settingsDraft.value = { ...settings.value }
  sendLogs.value = await getSendLogs()
})
</script>
