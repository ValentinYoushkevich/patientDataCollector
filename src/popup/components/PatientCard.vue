<template>
  <div class="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
    <div class="flex items-center gap-2 mb-2">
      <i class="pi pi-check-circle text-green-500" />
      <span class="font-medium text-green-700">Данные считаны успешно</span>
    </div>

    <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-600">
      <span class="font-medium">MRN:</span><span>{{ data.mrn }}</span>
      <span class="font-medium">Имя:</span><span>{{ data.given }} {{ data.family }}</span>
      <span class="font-medium">Дата рожд.:</span><span>{{ data.birthDate }}</span>
      <span class="font-medium">Пол:</span><span>{{ data.gender }}</span>
      <span class="font-medium">Телефон:</span><span>{{ data.phone || '—' }}</span>
      <span class="font-medium">Система:</span><span>{{ data._system }}</span>
    </div>

    <div
      v-if="data._missingFields?.length"
      class="mt-2 rounded bg-amber-50 border border-amber-200 p-2"
    >
      <div class="flex items-center gap-1 text-amber-700 text-xs font-medium">
        <i class="pi pi-exclamation-triangle" />
        Пропущены необязательные поля:
      </div>
      <div class="text-amber-600 text-xs mt-1">{{ data._missingFields.join(', ') }}</div>
    </div>

    <div
      v-if="fhirErrors?.length"
      class="mt-2 rounded bg-red-50 border border-red-300 p-2"
    >
      <div class="flex items-center gap-1 text-red-700 text-xs font-semibold mb-1">
        <i class="pi pi-times-circle" />
        FHIR валидация не пройдена — отправка заблокирована
      </div>
      <ul class="text-red-600 text-xs list-disc list-inside space-y-0.5">
        <li v-for="err in fhirErrors" :key="err">{{ err }}</li>
      </ul>
      <div class="text-red-500 text-xs mt-1">
        Исправьте данные в исходной системе и повторите парсинг.
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
