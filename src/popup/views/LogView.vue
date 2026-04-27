<template>
  <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-sm font-semibold text-slate-800">Последние отправки</h3>
      <Button
        label="Очистить"
        text
        severity="secondary"
        size="small"
        :disabled="!logs.length"
        @click="$emit('clear')"
      />
    </div>

    <p v-if="!logs.length" class="text-xs text-slate-500">
      Логи отправок пока отсутствуют.
    </p>

    <div v-else class="space-y-2">
      <div
        v-for="(log, idx) in logs"
        :key="`${log.at}-${idx}`"
        class="rounded border border-slate-200 p-2 text-xs text-slate-600"
      >
        <div><span class="font-medium">Дата:</span> {{ formatDate(log.at) }}</div>
        <div><span class="font-medium">Система:</span> {{ log.system }}</div>
        <div><span class="font-medium">Endpoint:</span> {{ log.endpoint }}</div>
        <div><span class="font-medium">ID:</span> {{ log.resultId }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Button from 'primevue/button'

defineProps({
  logs: {
    type: Array,
    default: () => []
  }
})

defineEmits(['clear'])

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}
</script>
