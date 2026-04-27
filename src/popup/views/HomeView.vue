<template>
  <div class="p-4 flex flex-col gap-4">
    <Toast />

    <div class="fpc-surface rounded-lg p-4">
      <div class="flex items-start justify-between gap-2">
        <div>
          <h2 class="text-base font-semibold fpc-title">FHIR Collector</h2>
          <p class="text-sm fpc-subtle mt-1">
            Logged in as <span class="font-medium">{{ username }}</span>
          </p>
        </div>
        <div v-if="uiScreen === 'main'" class="flex items-center gap-1">
          <!-- <Button
            v-tooltip.top="'Settings'"
            icon="pi pi-cog"
            text
            rounded
            severity="secondary"
            aria-label="Open settings"
            @click="openSettings"
          /> -->
          <Button
            v-tooltip.top="'Logout'"
            icon="pi pi-sign-out"
            text
            rounded
            severity="secondary"
            aria-label="Logout"
            @click="$emit('logout')"
          />
        </div>
      </div>
    </div>

    <template v-if="uiScreen === 'main'">
      <div class="fpc-surface rounded-lg p-4">
        <SelectSystem />
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
          <span>{{ phase === 'parsing' ? 'Reading data from page...' : 'Sending to FHIR endpoint...' }}</span>
        </div>
      </div>

      <Message v-if="phase === 'parse-error'" severity="error">
        {{ parseError }}
      </Message>

      <div v-if="isParsedPhase" class="fpc-surface rounded-lg p-4">
        <PatientCard :data="parsedData" :fhirErrors="fhirErrors" />
        <div class="flex flex-col gap-2 mt-3">
          <Button
            label="Send to FHIR endpoint"
            icon="pi pi-send"
            :disabled="phase === 'fhir-invalid'"
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
          <InputText v-model="settingsDraft.fhirEndpoint" placeholder="FHIR endpoint URL" />
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
        </div>
        <div class="flex gap-2 mt-3">
          <Button label="Save Settings" icon="pi pi-save" size="small" @click="saveSettingsClick" />
          <Button label="Back" icon="pi pi-arrow-left" severity="secondary" size="small" @click="closeSettingsWithoutSave" />
        </div>
      </div>
    </template>

    <Button
      v-if="uiScreen !== 'main'"
      label="Logout"
      icon="pi pi-sign-out"
      severity="secondary"
      @click="$emit('logout')"
    />
  </div>
</template>

<script setup>
import { useToast } from 'primevue/usetoast'
import { computed, onMounted, ref } from 'vue'

import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Toast from 'primevue/toast'

import { buildBundle } from '../../fhir/bundle.js'
import { toFHIRPatient } from '../../fhir/mapper.js'
import { validatePatientSoft } from '../../fhir/validator.js'
import { detectSystem } from '../../parsers/index.js'
import { appendSendLog, clearSendLogs, getSendLogs, getSettings, saveSettings } from '../../utils/storage.js'
import PatientCard from '../components/PatientCard.vue'
import SelectSystem from '../components/SelectSystem.vue'
import LogView from './LogView.vue'

const AUTO_DETECT_SYSTEM = false

defineProps({
  username: {
    type: String,
    default: 'User'
  }
})

defineEmits(['logout'])

const toast = useToast()

// phase: idle | parsing | parse-error | parsed | parsed-partial | fhir-invalid | sending | send-error | sent
const phase = ref('idle')
const parsedData = ref(null)
const parseError = ref('')
const sendError = ref('')
const fhirErrors = ref([])
const detectedSystem = ref('')
const sendLogs = ref([])
const uiScreen = ref('main')
const settings = ref({
  fhirEndpoint: 'https://hapi.fhir.org/baseR4',
  authToken: '',
  requestTimeoutMs: 15000
})
const settingsDraft = ref({ ...settings.value })

const isParsedPhase = computed(() =>
  ['parsed', 'parsed-partial', 'fhir-invalid', 'sent', 'send-error'].includes(phase.value)
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
    return systemId || 'systemA'
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  const autoSystem = detectSystem(tab?.url)
  detectedSystem.value = autoSystem || ''
  if (autoSystem) {
    await chrome.storage.local.set({ systemId: autoSystem })
  }
  const { systemId } = await chrome.storage.local.get('systemId')
  return autoSystem || systemId || 'systemA'
}

async function doParse() {
  phase.value = 'parsing'
  parseError.value = ''
  fhirErrors.value = []

  try {
    const systemId = await detectAndStoreSystem()
    parsedData.value = await collectFromTab(systemId)

    const patientResource = toFHIRPatient(parsedData.value)
    const validation = validatePatientSoft(patientResource)
    fhirErrors.value = validation.errors

    if (validation.errors.length > 0) {
      phase.value = 'fhir-invalid'
    } else if (parsedData.value?._missingFields?.length > 0) {
      phase.value = 'parsed-partial'
    } else {
      phase.value = 'parsed'
    }
  } catch (err) {
    parseError.value = err?.message ?? 'Parsing error'
    phase.value = 'parse-error'
  }
}

async function doSend() {
  if (!parsedData.value) return

  phase.value = 'sending'
  sendError.value = ''

  try {
    const patient = toFHIRPatient(parsedData.value)
    const bundle = buildBundle([patient])
    const endpoint = settings.value.fhirEndpoint
    const authToken = settings.value.authToken
    const timeoutMs = Number(settings.value.requestTimeoutMs) || 15000

    const response = await chrome.runtime.sendMessage({
      type: 'SEND_BUNDLE',
      payload: { bundle, endpoint, token: authToken, timeoutMs }
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
