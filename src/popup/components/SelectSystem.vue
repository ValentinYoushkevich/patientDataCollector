<template>
  <div class="flex flex-col gap-1">
    <label
      for="system-select"
      class="text-xs font-medium fpc-subtle uppercase tracking-wide"
    >
      System
    </label>
    <Select
      inputId="system-select"
      v-model="selected"
      :options="systems"
      optionLabel="label"
      optionValue="value"
      placeholder="Select system"
      class="w-full"
      @change="save"
    />
  </div>
</template>

<script setup>
import Select from 'primevue/select'
import { onMounted, ref } from 'vue'

const systems = [
  { value: 'systemA', label: 'System A - Compliance Portal' },
  { value: 'systemB', label: 'System B - InsuranceTrack' },
  { value: 'systemC', label: 'System C - MedVerify' }
]

const selected = ref('systemA')

onMounted(async () => {
  const { systemId } = await chrome.storage.local.get('systemId')
  selected.value = systemId ?? 'systemA'
  await chrome.storage.local.set({ systemId: selected.value })
})

async function save() {
  await chrome.storage.local.set({ systemId: selected.value })
}
</script>
