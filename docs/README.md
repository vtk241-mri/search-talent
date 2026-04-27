# Project Documentation

Ця папка містить комплект документації для практичної роботи `DOCS` по проєкту `SearchTalent`.

## Вміст

- `business-requirements-document.md` — Business Requirements Document (BRD)
- `system-specification-document.md` — System Specification Document (SSD)
- `api/openapi.yaml` — Swagger / OpenAPI 3.1 опис двох API-ендпоінтів
- `api/search-talent.postman_collection.json` — Postman collection для тих самих ендпоінтів

## Обрані API-ендпоінти

1. `GET /api/search` — глобальний пошук талантів і проєктів з фільтрами
2. `POST /api/projects` — створення нового проєкту авторизованим користувачем

## Примітка

Опис API прив'язаний до поточної реалізації у:

- `src/app/api/search/route.ts`
- `src/app/api/projects/route.ts`
- `src/lib/validation/project.ts`
