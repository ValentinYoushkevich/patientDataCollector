<template>
  <div class="rounded-lg border border-[#d6e4ff] bg-[#f2fbfd] p-3 text-sm">
    <div class="flex items-center gap-2 mb-2">
      <i class="pi pi-check-circle text-[#00838F]" />
      <span class="font-medium text-[#0D47A1]">Data parsed successfully</span>
    </div>

    <div class="flex flex-col gap-2 text-[#1565C0]">
      <div
        v-for="field in editableFields"
        :key="field.key"
        class="grid grid-cols-[110px,minmax(0,1fr)] gap-2 items-start"
      >
        <span class="font-medium leading-8">
          {{ field.label }}<span v-if="field.required">*</span>:
        </span>

        <div class="min-w-0">
          <template v-if="editingKey === field.key">
            <Select
              v-if="field.type === 'select'"
              v-model="draftValue"
              :options="field.options"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
            <InputText
              v-else
              v-model="draftValue"
              :placeholder="field.placeholder || ''"
              class="w-full"
            />
            <div class="flex gap-2 mt-2">
              <Button label="Save" size="small" @click="saveEdit(field.key)" />
              <Button label="Cancel" size="small" severity="secondary" @click="cancelEdit" />
            </div>
            <small v-if="editError" class="text-red-600 block mt-1">{{ editError }}</small>
          </template>
          <template v-else>
            <div class="flex items-center gap-2 min-w-0">
              <span class="block truncate leading-8 min-w-0 flex-1" :title="display(data[field.key])">
                {{ display(data[field.key]) }}
              </span>
              <Button
                icon="pi pi-pencil"
                text
                rounded
                severity="secondary"
                aria-label="Edit field"
                size="small"
                class="w-7! h-7! min-w-7! p-0! shrink-0"
                @click="startEdit(field)"
              />
            </div>
          </template>
        </div>
      </div>

      <div class="grid grid-cols-[110px,minmax(0,1fr)] gap-2 items-center">
        <span class="font-medium">System:</span>
        <span class="truncate" :title="display(data._system)">{{ display(data._system) }}</span>
      </div>
    </div>
    <div class="text-[11px] text-[#5f6b8a] mt-2">* Required (US Core)</div>

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
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { computed, ref } from 'vue'

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  fhirErrors: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:data'])
const editingKey = ref('')
const draftValue = ref('')
const editError = ref('')

const editableFields = computed(() => [
  { key: 'mrn', label: 'MRN', required: true, type: 'text' },
  { key: 'given', label: 'First Name', required: true, type: 'text' },
  { key: 'family', label: 'Last Name', required: true, type: 'text' },
  { key: 'birthDate', label: 'DOB', required: true, type: 'text', placeholder: 'YYYY-MM-DD' },
  {
    key: 'gender',
    label: 'Gender',
    required: true,
    type: 'select',
    options: [
      { label: 'male', value: 'male' },
      { label: 'female', value: 'female' },
      { label: 'other', value: 'other' },
      { label: 'unknown', value: 'unknown' }
    ]
  },
  { key: 'phone', label: 'Phone', required: false, type: 'text' },
  { key: 'email', label: 'Email', required: false, type: 'text' },
  { key: 'addressLine', label: 'Address', required: false, type: 'text' },
  { key: 'city', label: 'City', required: false, type: 'text' },
  { key: 'state', label: 'State', required: false, type: 'text' },
  { key: 'postalCode', label: 'ZIP', required: false, type: 'text' },
  { key: 'language', label: 'Language', required: false, type: 'text', placeholder: 'en-US' }
])

function display(value) {
  return value ? String(value) : '—'
}

function startEdit(field) {
  editingKey.value = field.key
  draftValue.value = props.data?.[field.key] ? String(props.data[field.key]) : ''
  editError.value = ''
}

function cancelEdit() {
  editingKey.value = ''
  draftValue.value = ''
  editError.value = ''
}

function saveEdit(key) {
  const nextValue = typeof draftValue.value === 'string'
    ? draftValue.value.trim()
    : draftValue.value
  const validationError = validateField(key, nextValue)
  if (validationError) {
    editError.value = validationError
    return
  }
  editError.value = ''

  emit('update:data', {
    ...props.data,
    [key]: nextValue
  })

  cancelEdit()
}

function validateField(key, value) {
  const requiredKeys = ['mrn', 'given', 'family', 'birthDate', 'gender']
  if (requiredKeys.includes(key) && !String(value || '').trim()) {
    return 'This field is required.'
  }

  if (key === 'birthDate' && value && !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    return 'Use YYYY-MM-DD format.'
  }

  if (key === 'gender' && value && !['male', 'female', 'other', 'unknown'].includes(String(value))) {
    return 'Invalid gender value.'
  }

  if (key === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
    return 'Enter a valid email address.'
  }

  if (key === 'language' && value && !/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(String(value))) {
    return 'Use a valid BCP-47 code (e.g., en-US).'
  }

  return ''
}

</script>
