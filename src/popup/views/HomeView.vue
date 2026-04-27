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

    <Button label="Выйти" icon="pi pi-sign-out" severity="secondary" @click="$emit('logout')" />
  </div>
</template>

<script setup>
import { useToast } from 'primevue/usetoast'
import { computed, ref } from 'vue'

import Button from 'primevue/button'
import Message from 'primevue/message'
import Toast from 'primevue/toast'

import { buildBundle } from '../../fhir/bundle.js'
import { toFHIRPatient } from '../../fhir/mapper.js'
import { validatePatientSoft } from '../../fhir/validator.js'
import PatientCard from '../components/PatientCard.vue'
import SelectSystem from '../components/SelectSystem.vue'

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

async function doParse() {
  phase.value = 'parsing'
  parseError.value = ''
  fhirErrors.value = []

  try {
    const { systemId } = await chrome.storage.local.get('systemId')
    parsedData.value = await collectFromTab(systemId ?? 'systemA')

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
    const { fhirEndpoint, authToken, sendLogs } = await chrome.storage.local.get([
      'fhirEndpoint',
      'authToken',
      'sendLogs'
    ])

    const endpoint = fhirEndpoint || 'https://hapi.fhir.org/baseR4'

    const response = await chrome.runtime.sendMessage({
      type: 'SEND_BUNDLE',
      payload: { bundle, endpoint, token: authToken }
    })

    if (!response?.ok) {
      throw new Error(response?.error ?? 'Ошибка отправки')
    }

    const nextLogs = [
      {
        at: new Date().toISOString(),
        system: parsedData.value._system,
        endpoint,
        resultId: response.result?.id ?? 'ok'
      },
      ...(Array.isArray(sendLogs) ? sendLogs : [])
    ].slice(0, 20)

    await chrome.storage.local.set({ sendLogs: nextLogs })

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
</script>
