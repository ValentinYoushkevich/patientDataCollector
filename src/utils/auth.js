export async function login(username, password) {
  // Stub login. Replace with real auth later.
  await new Promise((resolve) => setTimeout(resolve, 800))

  if (username === 'demo' && password === 'demo123') {
    const fakeToken = btoa(`${username}:${Date.now()}`)

    await chrome.storage.local.set({
      authToken: fakeToken,
      authUser: username,
      authExpiry: Date.now() + 3600_000
    })

    await chrome.cookies.set({
      url: 'http://localhost',
      name: 'fhir_session',
      value: fakeToken
    })

    return { ok: true, token: fakeToken }
  }

  return { ok: false, error: 'Invalid credentials' }
}

export async function isAuthenticated() {
  const { authToken, authExpiry } = await chrome.storage.local.get([
    'authToken',
    'authExpiry'
  ])

  return Boolean(authToken) && Date.now() < Number(authExpiry ?? 0)
}

export async function logout() {
  await chrome.storage.local.remove(['authToken', 'authUser', 'authExpiry'])
}
