# Stage 03 — Content Script and Parsing

## Scope
**Входит:**
- Реализация content script и обработчика COLLECT_DATA.
- Роутер парсеров src/parsers/index.js.
- Парсеры per-system (systemA/systemB/systemC) с единым форматом raw-объекта.
- Тестирование парсинга на mock-страницах.

**Не входит:**
- Отправка в FHIR endpoint.
- Полная UX-машина parse/review/send.

## Implementation tasks
- [ ] Реализовать chrome.runtime.onMessage в src/content/index.js.
- [ ] Подключить parsePatient(systemId, document).
- [ ] Реализовать src/parsers/index.js с PARSERS и выбросом ошибки на неизвестной системе.
- [ ] Реализовать src/parsers/systemA.js (эталонный парсер).
- [ ] Добавить заготовки systemB.js, systemC.js с тем же контрактом данных.
- [ ] В popup реализовать вызов chrome.tabs.query + chrome.tabs.sendMessage и обработку ответа.
- [ ] Добавить проверку обязательных полей (mrn, family, birthDate) и информативные ошибки.

## Deliverables
- src/content/index.js
- src/parsers/index.js
- src/parsers/systemA.js, src/parsers/systemB.js, src/parsers/systemC.js
- src/popup/views/HomeView.vue (метод collect/parse, базовая обработка ошибок)

## Acceptance criteria
- По нажатию «Собрать/Спарсить данные» popup получает raw-объект из активной вкладки.
- При неизвестной системе или отсутствии обязательных полей показывается понятная ошибка.
- Формат raw-данных стабилен и пригоден для маппинга в FHIR.

## Test checklist
- [ ] Проверка успешного парсинга на валидной mock-странице.
- [ ] Проверка ошибки при удалении обязательного поля в DOM.
- [ ] Проверка поведения при неподдерживаемом systemId.

## Risks and dependencies
- Нестабильный DOM реальных систем может ломать селекторы.
- Отсутствие content script на вкладке приведет к ошибке Could not establish connection.
