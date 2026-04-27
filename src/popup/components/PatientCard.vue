<template>
  <div class="rounded-lg border border-[#d6e4ff] bg-[#f2fbfd] p-3 text-sm">
    <div class="flex items-center gap-2 mb-2">
      <i class="pi pi-check-circle text-[#00838F]" />
      <span class="font-medium text-[#0D47A1]">Data parsed successfully</span>
    </div>

    <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-[#1565C0]">
      <span class="font-medium">MRN:</span><span>{{ data.mrn }}</span>
      <span class="font-medium">Name:</span><span>{{ data.given }} {{ data.family }}</span>
      <span class="font-medium">DOB:</span><span>{{ data.birthDate }}</span>
      <span class="font-medium">Gender:</span><span>{{ data.gender }}</span>
      <span class="font-medium">Phone:</span><span>{{ data.phone || '—' }}</span>
      <span class="font-medium">System:</span><span>{{ data._system }}</span>
    </div>

    <div
      v-if="data._missingFields?.length"
      class="mt-2 rounded bg-amber-50 border border-amber-200 p-2"
    >
      <div class="flex items-center gap-1 text-amber-700 text-xs font-medium">
        <i class="pi pi-exclamation-triangle" />
        Missing optional fields:
      </div>
      <div class="text-amber-600 text-xs mt-1">{{ data._missingFields.join(', ') }}</div>
    </div>

    <div
      v-if="fhirErrors?.length"
      class="mt-2 rounded bg-red-50 border border-red-300 p-2"
    >
      <div class="flex items-center gap-1 text-red-700 text-xs font-semibold mb-1">
        <i class="pi pi-times-circle" />
        FHIR validation failed — sending is blocked
      </div>
      <ul class="text-red-600 text-xs list-disc list-inside space-y-0.5">
        <li v-for="err in fhirErrors" :key="err">{{ err }}</li>
      </ul>
      <div class="text-red-500 text-xs mt-1">
        Fix source data and parse again.
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  data: {
    type: Object,
    required: true
  },
  fhirErrors: {
    type: Array,
    default: () => []
  }
})
</script>
