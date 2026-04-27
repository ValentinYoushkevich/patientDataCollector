# Stage 05 — Polish, Auto-Detect, Release

## Scope
**Входит:**
- Auto-detect системы по URL (detectSystem) вместо ручного выбора.
- Экран настроек endpoint/token/timeout.
- Журнал последних N отправок с просмотром в popup.
- Подготовка сборки к публикации (Web Store/enterprise CRX).

**Не входит:**
- Полноценный OAuth 2.0 PKCE (следующий этап развития).
- Шифрование секретов enterprise-уровня (как отдельный трек hardening).

## Implementation tasks
- [ ] Реализовать и интегрировать detectSystem(url) в поток парсинга.
- [ ] Обновить HomeView: автоподбор системы с fallback на ручной выбор.
- [ ] Добавить SettingsView/блок настроек: fhirEndpoint, authToken, 
equestTimeoutMs.
- [ ] Реализовать в storage хранение и валидацию настроек.
- [ ] Реализовать LogView.vue для последних N отправок (дата, система, статус, response id).
- [ ] Добавить очистку логов и ограничение размера массива логов.
- [ ] Подготовить release-процедуру: 
pm run build, упаковка zip/crx, проверка manifest.
- [ ] Подготовить release-checklist для публикации.

## Deliverables
- src/parsers/index.js (detectSystem)
- src/popup/views/HomeView.vue (auto-detect flow)
- src/popup/views/LogView.vue
- src/popup/views/SettingsView.vue или секция настроек в Home
- src/utils/storage.js (helpers для settings и send logs)
- Релизный артефакт и инструкция упаковки

## Acceptance criteria
- Система определяется автоматически для поддерживаемых URL.
- Пользователь может изменить endpoint/token/timeout и изменения сохраняются.
- В popup отображается история последних N отправок; новые записи добавляются, старые обрезаются.
- Сборка проходит и готова к публикации в Web Store/enterprise-канал.

## Test checklist
- [ ] Проверить auto-detect на systemA/systemB/systemC URL.
- [ ] Проверить fallback, если URL не распознан.
- [ ] Проверить сохранение/чтение настроек после перезапуска браузера.
- [ ] Проверить, что журнал ограничен N записями и корректно отображается.
- [ ] Проверить, что финальная сборка загружается как unpacked без ошибок.

## Risks and dependencies
- Смена URL-паттернов целевых систем ломает автоопределение.
- Хранение токена в chrome.storage.local требует отдельного security-hardening трека.
- Релиз в Chrome Web Store может потребовать доп. объяснений разрешений.
