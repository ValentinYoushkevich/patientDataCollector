# Stage 01 — Scaffolding and Stub Auth

## Scope
**Входит:**
- Базовый каркас Chrome Extension (MV3): manifest.json, popup, background, content script.
- Сборка на Vite + vite-plugin-web-extension + Vue 3.
- Подключение PrimeVue 4 + Tailwind CSS v3 + тема Aura.
- Экран авторизации LoginView и заглушка логина с сохранением токена/куки.
- Переход после логина на HomeView.

**Не входит:**
- Реальный OAuth/SSO.
- Реальный парсинг данных пациента и отправка FHIR.

## Implementation tasks
- [ ] Инициализировать структуру проекта и директории src/popup, src/background, src/content, src/utils.
- [ ] Добавить manifest.json (MV3) с default_popup, background.service_worker, базовыми permission.
- [ ] Настроить vite.config.js с webExtension({ manifest, additionalInputs }).
- [ ] Настроить 	ailwind.config.js (preflight: false) и postcss.config.js.
- [ ] Зарегистрировать PrimeVue (тема Aura) и ToastService в src/popup/main.js.
- [ ] Реализовать src/utils/auth.js: login, isAuthenticated, logout (stub).
- [ ] Реализовать src/popup/views/LoginView.vue с обработкой loading/error.
- [ ] Организовать базовую развилку Login/Home в App.vue.

## Deliverables
- manifest.json
- vite.config.js, 	ailwind.config.js, postcss.config.js, package.json
- src/popup/main.js, src/popup/App.vue
- src/popup/views/LoginView.vue, src/popup/views/HomeView.vue (каркас)
- src/utils/auth.js
- src/background/service-worker.js (каркас)
- src/content/index.js (каркас)

## Acceptance criteria
- Расширение собирается командой 
pm run dev без ошибок.
- Расширение загружается через chrome://extensions в режиме unpacked.
- В popup открывается форма логина.
- При demo/demo123 логин успешен, в chrome.storage.local есть authToken, authUser, authExpiry.
- После успешного входа отображается HomeView.
- При неверных данных показывается сообщение об ошибке.

## Test checklist
- [ ] Проверить успешный логин demo/demo123.
- [ ] Проверить ошибку на невалидных кредах.
- [ ] Проверить сохранение и очистку auth-данных (logout).
- [ ] Проверить, что стили PrimeVue и Tailwind не конфликтуют (вид popup корректный).

## Risks and dependencies
- Конфликт CSS reset Tailwind и PrimeVue (закрывается preflight: false).
- Ограничения MV3 service worker на долгие фоновые операции.
- Stub-auth не отражает реальные edge-case токен-циклы.
