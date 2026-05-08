<template>
  <div class="p-4 flex flex-col gap-4">
    <Toast />

    <div class="fpc-surface rounded-lg p-4">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <img :src="brandIconUrl" alt="FHIR Collector icon" class="h-10 w-10 rounded-sm mt-0.5" />
          <div>
            <h2 class="text-base font-semibold fpc-title">Referral Data Collector</h2>
          </div>
        </div>
        <div v-if="uiScreen === 'main'" class="flex items-center gap-1">
          <Button
            v-tooltip.top="'Settings'"
            icon="pi pi-cog"
            text
            rounded
            severity="secondary"
            aria-label="Open settings"
            @click="openSettings"
          />
        </div>
      </div>
    </div>

    <template v-if="uiScreen === 'main'">
      <div class="fpc-surface rounded-lg p-4">
        <SelectSystem @change="handleSystemChange" />
        <Message v-if="systemValidationError" severity="error" class="mt-2">
          {{ systemValidationError }}
        </Message>
        <p v-if="AUTO_DETECT_SYSTEM" class="text-xs fpc-subtle mt-2">
          {{ detectedSystem ? `Auto-detect: ${detectedSystem}` : 'Auto-detect failed, using manual selection.' }}
        </p>
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
      <Message v-if="phase === 'parsed-partial'" severity="warn">
        Some required patient fields are missing. Please fill them before sending.
      </Message>

      <div v-if="isParsedPhase" class="fpc-surface rounded-lg p-4">
        <PatientCard :data="parsedData" @update:data="handleParsedDataUpdate" />
        <div class="flex flex-col gap-2 mt-3">
          <Button
            label="Send referral"
            icon="pi pi-send"
            class="w-full"
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

      <Message v-if="phase === 'send-error'" severity="error">
        {{ sendError }}
      </Message>

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
          <InputText v-model="settingsDraft.fhirEndpoint" placeholder="Referral endpoint URL" />
          <InputText v-model="settingsDraft.authToken" placeholder="Bearer token (optional)" />
          <InputNumber
            v-model="settingsDraft.requestTimeoutMs"
            inputId="timeout-ms"
            :min="1000"
            :max="120000"
            :step="1000"
            suffix=" ms"
            fluid
          />
          <Divider />
          <h4 class="text-sm font-semibold fpc-title">Clinician & Organization</h4>
          <InputText v-model="settingsDraft.clinicianFirstName" placeholder="Clinician first name" />
          <InputText v-model="settingsDraft.clinicianLastName" placeholder="Clinician last name" />
          <InputText v-model="settingsDraft.clinicianEmail" placeholder="Clinician email" />
          <InputText v-model="settingsDraft.npiNumber" placeholder="NPI number" />
          <InputText v-model="settingsDraft.organizationName" placeholder="Organization name" />
          <InputText v-model="settingsDraft.organizationState" placeholder="Organization state" />
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
import { useToast } from 'primevue/usetoast'
import { computed, onMounted, ref } from 'vue'

import Button from 'primevue/button'
import Divider from 'primevue/divider'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Toast from 'primevue/toast'

import { detectSystem } from '../../parsers/index.js'
import { appendSendLog, clearSendLogs, getSendLogs, getSettings, saveSettings } from '../../utils/storage.js'
import PatientCard from '../components/PatientCard.vue'
import SelectSystem from '../components/SelectSystem.vue'
import LogView from './LogView.vue'

const AUTO_DETECT_SYSTEM = false

const toast = useToast()

// phase: idle | parsing | parse-error | parsed | parsed-partial | sending | send-error | sent
const phase = ref('idle')
const parsedData = ref(null)
const parseError = ref('')
const sendError = ref('')
const detectedSystem = ref('')
const systemValidationError = ref('')
const sendLogs = ref([])
const uiScreen = ref('main')
const settings = ref({
  fhirEndpoint: 'https://hapi.fhir.org/baseR4',
  authToken: '',
  requestTimeoutMs: 15000
})
const settingsDraft = ref({ ...settings.value })
const brandIconUrl = chrome.runtime.getURL('icons/icon32.png')

const isParsedPhase = computed(() =>
  ['parsed', 'parsed-partial', 'sent', 'send-error'].includes(phase.value)
)

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

async function detectAndStoreSystem() {
  if (!AUTO_DETECT_SYSTEM) {
    detectedSystem.value = ''
    const { systemId } = await chrome.storage.local.get('systemId')
    return systemId || ''
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  const autoSystem = detectSystem(tab?.url)
  detectedSystem.value = autoSystem || ''
  if (autoSystem) {
    await chrome.storage.local.set({ systemId: autoSystem })
  }
  const { systemId } = await chrome.storage.local.get('systemId')
  return autoSystem || systemId || ''
}

async function doParse() {
  parseError.value = ''
  sendError.value = ''

  const systemId = await detectAndStoreSystem()
  if (!systemId) {
    systemValidationError.value = 'Please select a system before parsing data.'
    phase.value = 'idle'
    return
  }

  systemValidationError.value = ''
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

function handleSystemChange(systemId) {
  if (systemId) {
    systemValidationError.value = ''
  }
}

function handleParsedDataUpdate(nextData) {
  const tracked = ['patient_first_name', 'patient_last_name', 'patient_state', 'patient_phone', 'patient_email']
  const nextMissingFields = tracked.filter((key) => !String(nextData?.[key] || '').trim())
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

function buildReferralPayload() {
  return {
    first_name: settings.value.clinicianFirstName || null,
    last_name: settings.value.clinicianLastName || null,
    email: settings.value.clinicianEmail || null,
    npi_number: settings.value.npiNumber || null,
    organization_name: settings.value.organizationName || null,
    state: settings.value.organizationState || null,
    patient_first_name: parsedData.value.patient_first_name || null,
    patient_last_name: parsedData.value.patient_last_name || null,
    patient_state: parsedData.value.patient_state || null,
    patient_phone: parsedData.value.patient_phone || null,
    patient_email: parsedData.value.patient_email || null,
    source: 'extension_referral_widget'
  }
}

async function doSend() {
  if (!parsedData.value) return

  phase.value = 'sending'
  sendError.value = ''

  try {
    const referralPayload = buildReferralPayload()
    const endpoint = settings.value.fhirEndpoint
    const authToken = settings.value.authToken
    const timeoutMs = Number(settings.value.requestTimeoutMs) || 15000

    const response = await chrome.runtime.sendMessage({
      type: 'SEND_REFERRAL',
      payload: { referralPayload, endpoint, token: authToken, timeoutMs }
    })

    if (!response?.ok) {
      throw new Error(response?.error ?? 'Send failed')
    }

    sendLogs.value = await appendSendLog({
      at: new Date().toISOString(),
      system: parsedData.value._system,
      endpoint,
      resultId: response.result?.id ?? 'ok'
    })

    phase.value = 'sent'
    toast.add({
      severity: 'success',
      summary: 'Sent',
      detail: `ID: ${response.result?.id ?? 'ok'}`,
      life: 5000
    })
  } catch (err) {
    sendError.value = err?.message ?? 'Send error'
    phase.value = 'send-error'
  }
}

async function saveSettingsClick() {
  settings.value = await saveSettings(settingsDraft.value)
  settingsDraft.value = { ...settings.value }
  uiScreen.value = 'main'
  toast.add({
    severity: 'success',
    summary: 'Saved',
    detail: 'Settings updated',
    life: 2500
  })
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

onMounted(async () => {
  settings.value = await getSettings()
  settingsDraft.value = { ...settings.value }
  sendLogs.value = await getSendLogs()
  await detectAndStoreSystem()
})
</script>
