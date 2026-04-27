<template>
  <div class="p-4 flex flex-col gap-4">
    <Toast />

    <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 class="text-base font-semibold text-slate-800">FHIR Collector</h2>
      <p class="text-sm text-slate-600 mt-1">
        Вы вошли как <span class="font-medium">{{ username }}</span>
      </p>
    </div>

    <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <SelectSystem />
      <p class="text-xs text-slate-500 mt-2">
        {{ detectedSystem ? `Auto-detect: ${detectedSystem}` : 'Auto-detect не сработал, используется выбор вручную.' }}
      </p>
    </div>

    <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 class="text-sm font-semibold text-slate-800 mb-2">Настройки отправки</h3>
      <div class="flex flex-col gap-2">
        <InputText v-model="settings.fhirEndpoint" placeholder="FHIR endpoint URL" />
        <InputText v-model="settings.authToken" placeholder="Bearer token (optional)" />
        <InputNumber
          v-model="settings.requestTimeoutMs"
          inputId="timeout-ms"
          :min="1000"
          :max="120000"
          :step="1000"
          suffix=" ms"
          fluid
        />
      </div>
      <div class="flex gap-2 mt-3">
        <Button label="Сохранить настройки" icon="pi pi-save" size="small" @click="saveSettingsClick" />
      </div>
    </div>

    <div v-if="phase === 'idle'" class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <Button label="Спарсить данные" icon="pi pi-download" class="w-full" @click="doParse" />
    </div>

    <div
      v-if="phase === 'parsing' || phase === 'sending'"
      class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div class="flex items-center gap-2 text-slate-700">
        <i class="pi pi-spin pi-spinner" />
        <span>{{ phase === 'parsing' ? 'Считываю данные со страницы...' : 'Отправляю на FHIR endpoint...' }}</span>
      </div>
    </div>

    <Message v-if="phase === 'parse-error'" severity="error">
      {{ parseError }}
    </Message>

    <div v-if="isParsedPhase" class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <PatientCard :data="parsedData" :fhirErrors="fhirErrors" />
      <div class="flex gap-2 mt-3">
        <Button
          label="Отправить на FHIR endpoint"
          icon="pi pi-send"
          :disabled="phase === 'fhir-invalid'"
          @click="doSend"
        />
        <Button
          label="Спарсить снова"
          icon="pi pi-refresh"
          severity="secondary"
          @click="doParse"
        />
      </div>
    </div>

    <Message v-if="phase === 'send-error'" severity="error">
      {{ sendError }}
    </Message>

    <LogView :logs="sendLogs" @clear="clearLogsClick" />

    <Button label="Выйти" icon="pi pi-sign-out" severity="secondary" @click="$emit('logout')" />
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
const settings = ref({
  fhirEndpoint: 'https://hapi.fhir.org/baseR4',
  authToken: '',
  requestTimeoutMs: 15000
})

const isParsedPhase = computed(() =>
  ['parsed', 'parsed-partial', 'fhir-invalid', 'sent', 'send-error'].includes(phase.value)
)

async function collectFromTab(systemId) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) {
    throw new Error('Активная вкладка не найдена')
  }

  const response = await chrome.tabs.sendMessage(tab.id, {
    type: 'COLLECT_DATA',
    payload: { systemId }
  })

  if (!response?.ok) {
    throw new Error(response?.error ?? 'Не удалось получить данные')
  }

  return response.data
}

async function detectAndStoreSystem() {
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
    parseError.value = err?.message ?? 'Ошибка парсинга'
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
      throw new Error(response?.error ?? 'Ошибка отправки')
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
      summary: 'Отправлено',
      detail: `ID: ${response.result?.id ?? 'ok'}`,
      life: 5000
    })
  } catch (err) {
    sendError.value = err?.message ?? 'Ошибка отправки'
    phase.value = 'send-error'
  }
}

async function saveSettingsClick() {
  settings.value = await saveSettings(settings.value)
  toast.add({
    severity: 'success',
    summary: 'Сохранено',
    detail: 'Настройки обновлены',
    life: 2500
  })
}

async function clearLogsClick() {
  await clearSendLogs()
  sendLogs.value = []
}

onMounted(async () => {
  settings.value = await getSettings()
  sendLogs.value = await getSendLogs()
  await detectAndStoreSystem()
})
</script>
