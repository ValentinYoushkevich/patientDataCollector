# Stage 02 — System Selection and Mock Site

## Scope
**Входит:**
- Компонент выбора системы SelectSystem.vue (PrimeVue Select + Tailwind).
- Хранение/чтение systemId из chrome.storage.local.
- Подготовка mock-сайта пациента для ручного тестирования.
- Обновление permissions и host_permissions в manifest.json.

**Не входит:**
- Полный парсинг всех систем.
- FHIR-мэппинг и отправка.

## Implementation tasks
- [ ] Создать src/popup/components/SelectSystem.vue согласно паттерну из документа.
- [ ] Подключить селектор в HomeView.vue и обработать дефолтное значение.
- [ ] Добавить/проверить systemA/systemB/systemC в options.
- [ ] Создать mock-site с тестовыми страницами пациента (index/patient-detail как минимум).
- [ ] Прописать соответствующие matches и host_permissions в manifest.json.
- [ ] Подготовить минимальную инструкцию запуска mock-сайта (
px serve mock-site -p 3001).

## Deliverables
- src/popup/components/SelectSystem.vue
- src/popup/views/HomeView.vue (интеграция селектора)
- manifest.json (permissions/host_permissions)
- mock-site/index.html, mock-site/patient-detail.html

## Acceptance criteria
- В popup можно выбрать систему и перезапустить popup без потери выбранного systemId.
- При первом запуске выставляется дефолт systemA.
- Mock-сайт доступен локально и содержит тестовые patient-поля для парсинга.
- Расширение имеет корректные права доступа к mock/целевым доменам.

## Test checklist
- [ ] Сменить систему, закрыть popup, открыть снова — значение сохранено.
- [ ] Проверить работу на localhost:3001.
- [ ] Проверить отсутствие ошибок permission в консоли расширения.

## Risks and dependencies
- Неполные host_permissions блокируют инжекцию content script.
- Разные доменные паттерны требуют явной синхронизации с detectSystem (этап 5).
