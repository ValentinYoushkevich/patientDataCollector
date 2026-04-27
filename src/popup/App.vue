<template>
  <main class="min-h-[460px]">
    <LoginView v-if="!isLoggedIn" @loggedIn="handleLoggedIn" />
    <HomeView v-else :username="username" @logout="handleLogout" />
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'

import { isAuthenticated, logout } from '../utils/auth.js'
import HomeView from './views/HomeView.vue'
import LoginView from './views/LoginView.vue'

const isLoggedIn = ref(false)
const username = ref('')

onMounted(async () => {
  isLoggedIn.value = await isAuthenticated()
  if (isLoggedIn.value) {
    const { authUser } = await chrome.storage.local.get('authUser')
    username.value = authUser ?? 'User'
  }
})

async function handleLoggedIn() {
  isLoggedIn.value = true
  const { authUser } = await chrome.storage.local.get('authUser')
  username.value = authUser ?? 'User'
}

async function handleLogout() {
  await logout()
  isLoggedIn.value = false
  username.value = ''
}
</script>
