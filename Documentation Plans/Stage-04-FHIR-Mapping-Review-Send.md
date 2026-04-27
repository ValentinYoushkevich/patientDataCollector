# Stage 04 — FHIR Mapping, Review, Send

## Scope
**Входит:**
- Двухфазный UX: Parse → Review → Send в HomeView.
- State machine (idle, parsing, parse-error, parsed, parsed-partial, fhir-invalid, sending, send-error, sent).
- Маппинг raw → FHIR Patient.
- Сборка FHIR transaction Bundle.
- Валидация FHIR (fhir-tool) до отправки.
- Отправка Bundle и отображение результата/ошибки.
- Сохранение записи об успешной отправке в storage (основа для этапа 5).

**Не входит:**
- Финальный экран полной истории и релизная упаковка.

## Implementation tasks
- [ ] Реализовать state machine в src/popup/views/HomeView.vue.
- [ ] Добавить PatientCard.vue для предпросмотра данных.
- [ ] Добавить отображение _missingFields и блок FHIR-ошибок.
- [ ] Реализовать src/fhir/mapper.js (включая normalizeGender).
- [ ] Реализовать src/fhir/bundle.js.
- [ ] Установить и подключить fhir-tool, создать src/fhir/validator.js.
- [ ] Реализовать validatePatient (strict) и validatePatientSoft (UX-проверка до send).
- [ ] Реализовать src/fhir/sender.js с fetch, заголовками и обработкой HTTP-ошибок.
- [ ] Интегрировать отправку через background service worker/или модуль отправки согласно архитектуре проекта.
- [ ] На успехе отправки показывать Toast и сохранять лог отправки в chrome.storage.local.

## Deliverables
- src/popup/views/HomeView.vue
- src/popup/components/PatientCard.vue
- src/fhir/mapper.js, src/fhir/bundle.js, src/fhir/validator.js, src/fhir/sender.js
- src/background/service-worker.js (маршрутизация отправки)
- Обновленный package.json (dependency fhir-tool)

## Acceptance criteria
- Пользователь всегда видит, что именно собрано, до отправки.
- Для patient-full состояние parsed и отправка доступна.
- Для patient-partial состояние parsed-partial, отправка доступна с предупреждением.
- Для patient-invalid состояние fhir-invalid, отправка блокируется.
- При HTTP-ошибке endpoint отображается send-error с кодом и деталями.
- При успехе показывается Toast с ID ресурса/ответа.

## Test checklist
- [ ] patient-full.html → parsed → успешная отправка.
- [ ] patient-partial.html → parsed-partial с предупреждением.
- [ ] patient-invalid.html → fhir-invalid, кнопка Send disabled.
- [ ] Искусственно недоступный endpoint → корректный send-error.

## Risks and dependencies
- Разночтения серверов FHIR по валидации и OperationOutcome.
- Требуется аккуратно синхронизировать UX-состояния и бизнес-ошибки.
- Нужен стабильный контракт raw-полей от всех парсеров.
