<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 class="text-base font-semibold text-slate-800">FHIR Collector</h2>
      <p class="text-sm text-slate-600 mt-1">
        Вы вошли как <span class="font-medium">{{ username }}</span>
      </p>
    </div>

    <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p class="text-sm text-slate-700">
        Stage-01 завершен: popup, авторизация-заглушка и базовый экран готовы.
      </p>
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
import Button from 'primevue/button';

defineProps({
  username: {
    type: String,
    default: 'User'
  }
})

defineEmits(['logout'])
</script>
