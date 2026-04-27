<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 class="text-base font-semibold text-slate-800">FHIR Collector</h2>
      <p class="text-sm text-slate-600 mt-1">
        Вы вошли как <span class="font-medium">{{ username }}</span>
      </p>
    </div>

    <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <SelectSystem />
      <p class="text-xs text-slate-500 mt-2">
        Выбор сохраняется в chrome.storage.local (`systemId`).
      </p>
    </div>

    <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <Button
        :loading="collecting"
        label="Собрать данные"
        icon="pi pi-download"
        class="w-full"
        @click="collectData"
      />
      <p class="text-xs text-slate-500 mt-2">
        Отправляется сообщение `COLLECT_DATA` в активную вкладку и возвращается raw-объект.
      </p>
    </div>

    <Message v-if="collectError" severity="error">{{ collectError }}</Message>

    <div v-if="rawData" class="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
      <p class="text-sm font-medium text-emerald-700 mb-2">Парсинг выполнен успешно</p>
      <pre class="text-xs text-slate-700 whitespace-pre-wrap break-all">{{ prettyRaw }}</pre>
    </div>

    <Button
      label="Выйти"
      icon="pi pi-sign-out"
      severity="secondary"
      @click="$emit('logout')"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

import Button from 'primevue/button'
import Message from 'primevue/message'
import SelectSystem from '../components/SelectSystem.vue'

defineProps({
  username: {
    type: String,
    default: 'User'
  }
})

defineEmits(['logout'])

const collecting = ref(false)
const collectError = ref('')
const rawData = ref(null)

const prettyRaw = computed(() => JSON.stringify(rawData.value, null, 2))

async function collectData() {
  collecting.value = true
  collectError.value = ''

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) {
      throw new Error('Активная вкладка не найдена')
    }

    const { systemId } = await chrome.storage.local.get('systemId')
    const selectedSystem = systemId ?? 'systemA'

    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'COLLECT_DATA',
      payload: { systemId: selectedSystem }
    })

    if (!response?.ok) {
      throw new Error(response?.error ?? 'Не удалось получить данные')
    }

    rawData.value = response.data
  } catch (err) {
    rawData.value = null
    collectError.value = err?.message ?? 'Ошибка при сборе данных'
  } finally {
    collecting.value = false
  }
}
</script>
