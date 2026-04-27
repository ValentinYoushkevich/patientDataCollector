<template>
  <div class="min-h-[460px] bg-slate-50 flex items-center justify-center p-4">
    <Card class="login-card w-full shadow-md border border-slate-200">
      <template #header>
        <div class="px-6 pt-6">
          <h2 class="text-xl font-semibold text-slate-800">FHIR Collector</h2>
          <p class="text-sm text-slate-500 mt-1">Войдите в систему</p>
        </div>
      </template>

      <template #content>
        <div class="flex flex-col gap-4 px-0 pb-6">
          <div class="flex flex-col gap-1">
            <label for="login-username" class="text-sm font-medium text-slate-700">Логин</label>
            <InputText
              inputId="login-username"
              v-model="username"
              placeholder="demo"
              class="w-full"
              inputClass="!text-slate-900 !bg-white placeholder:!text-slate-400"
            />
            <small v-if="usernameError" class="text-red-600">{{ usernameError }}</small>
          </div>

          <div class="flex flex-col gap-1">
            <label for="login-password" class="text-sm font-medium text-slate-700">Пароль</label>
            <Password
              inputId="login-password"
              v-model="password"
              :feedback="false"
              toggleMask
              fluid
              class="w-full"
              inputClass="!text-slate-900 !bg-white placeholder:!text-slate-400"
            />
            <small v-if="passwordError" class="text-red-600">{{ passwordError }}</small>
          </div>

          <Message v-if="error" severity="error">{{ error }}</Message>

          <Button
            :loading="loading"
            label="Войти"
            class="w-full"
            @click="doLogin"
          />
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref } from 'vue'

import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Password from 'primevue/password'

import { login } from '../../utils/auth.js'

const emit = defineEmits(['loggedIn'])

const username = ref('demo')
const password = ref('demo123')
const loading = ref(false)
const error = ref('')
const usernameError = ref('')
const passwordError = ref('')

async function doLogin() {
  usernameError.value = ''
  passwordError.value = ''
  loading.value = true
  error.value = ''

  const hasUsername = Boolean(username.value?.trim())
  const hasPassword = Boolean(password.value?.trim())
  if (!hasUsername || !hasPassword) {
    if (!hasUsername) usernameError.value = 'Field is required'
    if (!hasPassword) passwordError.value = 'Field is required'
    loading.value = false
    return
  }

  try {
    const result = await login(username.value, password.value)
    if (result.ok) {
      emit('loggedIn')
    } else {
      error.value = result.error ?? 'Login failed'
    }
  } catch (e) {
    error.value = e?.message ?? 'Unexpected login error'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
:deep(.login-card.p-card) {
  background: #ffffff !important;
  color: #0f172a !important;
}

:deep(.login-card .p-card-body),
:deep(.login-card .p-card-content),
:deep(.login-card .p-card-header) {
  background: #ffffff !important;
}

:deep(.login-card .p-inputtext),
:deep(.login-card .p-password-input) {
  background: #ffffff !important;
  color: #0f172a !important;
  border-color: #cbd5e1 !important;
}

:deep(.login-card .p-password) {
  width: 100% !important;
}

:deep(.login-card .p-password .p-password-input) {
  width: 100% !important;
  padding-right: 2.5rem !important;
}
</style>
