<template>
  <div class="min-h-[460px] bg-slate-50 flex items-center justify-center p-4">
    <Card class="w-full shadow-md">
      <template #header>
        <div class="px-6 pt-6">
          <h2 class="text-xl font-semibold text-slate-800">FHIR Collector</h2>
          <p class="text-sm text-slate-500 mt-1">Войдите в систему</p>
        </div>
      </template>

      <template #content>
        <div class="flex flex-col gap-4 px-6 pb-6">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">Логин</label>
            <InputText v-model="username" placeholder="demo" />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-700">Пароль</label>
            <Password v-model="password" :feedback="false" toggleMask />
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

async function doLogin() {
  loading.value = true
  error.value = ''

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
