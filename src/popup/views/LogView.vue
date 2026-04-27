<template>
  <div class="fpc-surface rounded-lg p-4">
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-sm font-semibold fpc-title">Recent Sends</h3>
      <Button
        label="Clear"
        text
        severity="secondary"
        size="small"
        :disabled="!logs.length"
        @click="$emit('clear')"
      />
    </div>

    <p v-if="!logs.length" class="text-xs fpc-subtle">
      No send logs yet.
    </p>

    <div v-else class="space-y-2">
      <div
        v-for="(log, idx) in logs"
        :key="`${log.at}-${idx}`"
        class="rounded border border-[#d6e4ff] p-2 text-xs text-[#1565C0]"
      >
        <div><span class="font-medium">Date:</span> {{ formatDate(log.at) }}</div>
        <div><span class="font-medium">System:</span> {{ log.system }}</div>
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
