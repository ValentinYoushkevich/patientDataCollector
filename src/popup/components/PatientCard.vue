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
          {{ field.label }}:
        </span>

        <div class="min-w-0">
          <template v-if="editingKey === field.key">
            <Select
              v-if="field.type === 'select'"
              v-model="draftValue"
              :options="field.options || []"
              optionLabel="label"
              optionValue="value"
              class="w-full"
              :placeholder="field.placeholder || 'Select state'"
            />
            <InputText v-else v-model="draftValue" :placeholder="field.placeholder || ''" class="w-full" />
            <div class="flex gap-2 mt-2">
              <Button label="Save" size="small" @click="saveEdit(field.key)" />
              <Button label="Cancel" size="small" severity="secondary" @click="cancelEdit" />
            </div>
            <small v-if="editError" class="text-red-600 block mt-1">{{ editError }}</small>
          </template>
          <template v-else>
            <div class="flex items-center gap-2 min-w-0">
              <span
                class="block truncate leading-8 min-w-0 flex-1"
                :class="{ 'text-red-700': isMissing(field.key) || isInvalid(field.key) }"
                :title="display(data[field.key])"
              >
                {{ display(data[field.key]) }}
              </span>
              <Button
                icon="pi pi-search"
                text
                rounded
                severity="secondary"
                aria-label="Pick from page"
                size="small"
                class="w-7! h-7! min-w-7! p-0! shrink-0"
                @click="pickField(field.key)"
              />
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
    </div>
    <div v-if="data._missingFields?.length" class="mt-2 rounded bg-amber-50 border border-amber-200 p-2">
      <div class="flex items-center gap-1 text-amber-700 text-xs font-medium">
        <i class="pi pi-exclamation-triangle" />
        Missing required fields:
      </div>
      <div class="text-amber-600 text-xs mt-1">{{ data._missingFields.join(', ') }}</div>
    </div>

  </div>
</template>

<script setup>
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { computed, ref } from 'vue'
import { US_STATE_OPTIONS } from '../../referral/schema.js'

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  invalidFields: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:data', 'pick:field'])
const editingKey = ref('')
const draftValue = ref('')
const editError = ref('')

const editableFields = computed(() => [
  { key: 'patient_first_name', label: 'First Name', type: 'text' },
  { key: 'patient_last_name', label: 'Last Name', type: 'text' },
  {
    key: 'patient_state',
    label: 'State',
    type: 'select',
    options: US_STATE_OPTIONS.map((state) => ({ label: state, value: state }))
  },
  { key: 'patient_phone', label: 'Phone Number', type: 'text' },
  { key: 'patient_email', label: 'Email', type: 'text' }
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
  if (key === 'patient_email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
    return 'Enter a valid email address.'
  }

  return ''
}

function isMissing(key) {
  return Array.isArray(props.data?._missingFields) && props.data._missingFields.includes(key)
}

function isInvalid(key) {
  return Array.isArray(props.invalidFields) && props.invalidFields.includes(key)
}

function pickField(key) {
  emit('pick:field', key)
}

</script>
