# System Specification Document (SSD)

## 1. Призначення документа

Цей документ описує технічну специфікацію системи `SearchTalent`: архітектуру, основні модулі, структуру даних, API-поведінку, безпеку, інтеграції та обмеження.

## 2. Огляд системи

`SearchTalent` — це веб-застосунок на `Next.js App Router`, який об'єднує:

- публічні профілі IT-талантів;
- портфоліо проєктів;
- технічні статті;
- глобальний пошук;
- модерацію контенту;
- соціальні механіки взаємодії.

## 3. Технологічний стек

| Компонент | Технологія | Призначення |
|---|---|---|
| Frontend / Web server | Next.js 16 + React 19 | UI, SSR, routing, API routes |
| Мова | TypeScript | Типізація логіки й контрактів |
| Стилі | Tailwind CSS 4 | Оформлення інтерфейсу |
| Backend-as-a-Service | Supabase | PostgreSQL, Auth, Storage |
| Валідація | Zod | Перевірка payload у route handlers |
| Email | Resend | Надсилання листів, якщо налаштовано |

## 4. Архітектурний стиль

Система побудована за моделлю `Next.js full-stack application`:

- UI-сторінки реалізовані у `src/app`;
- серверна логіка API реалізована у `src/app/api`;
- робота з даними винесена в `src/lib/db`, `src/lib/supabase`, `src/lib/validation`;
- дані зберігаються в PostgreSQL через Supabase;
- авторизація й контроль доступу частково виконуються в коді, частково — на рівні RLS у БД.

## 5. Високорівнева схема компонентів

### 5.1 Клієнтський шар

- сторінки каталогу талантів;
- сторінки проєктів і статей;
- dashboard користувача;
- форми редагування профілю, проєктів і статей;
- UI-компоненти, локалізація, перемикач теми.

### 5.2 Прикладний шар

- API routes для CRUD-операцій;
- серверні утиліти для отримання Supabase session;
- логіка пошуку, голосування, модерації, email-повідомлень;
- валідація запитів через Zod.

### 5.3 Шар даних

- PostgreSQL schema у папці `supabase/`;
- RLS policies для таблиць і storage bucket;
- довідники: країни, категорії профілів, навички, мови;
- операційні сутності: профілі, проєкти, статті, голоси, скарги, feedback.

## 6. Основні модулі системи

### 6.1 Authentication Module

Відповідає за:

- реєстрацію та вхід користувача;
- OAuth callback;
- logout;
- email verification;
- захист приватних маршрутів.

Ключові файли:

- `src/app/api/auth/*`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/middleware.ts`

### 6.2 Profile Module

Відповідає за:

- створення та редагування профілю користувача;
- збереження навичок, мов, освіти, сертифікатів і досвіду;
- налаштування видимості та презентації профілю.

Ключові файли:

- `src/app/api/profile/route.ts`
- `src/lib/validation/profile.ts`
- `supabase/01_core_schema.sql`

### 6.3 Projects Module

Відповідає за:

- створення, редагування й видалення проєктів;
- генерацію slug;
- зберігання стеку, статусу, опису, медіа та голосів;
- відображення проєктів у профілі й пошуку.

Ключові файли:

- `src/app/api/projects/route.ts`
- `src/app/api/projects/[id]/route.ts`
- `src/lib/projects.ts`
- `src/lib/validation/project.ts`

### 6.4 Articles Module

Відповідає за:

- публікацію статей;
- чернетки й публічний статус;
- перегляди, лайки, коментарі;
- категоризацію контенту.

Ключові файли:

- `src/app/api/articles/*`
- `supabase/03_articles_schema.sql`

### 6.5 Search Module

Відповідає за:

- глобальний пошук профілів і проєктів;
- фільтрацію за параметрами;
- сортування за релевантністю, рейтингом і датою;
- агрегування пов'язаних даних (skills, countries, categories, media).

Ключові файли:

- `src/app/api/search/route.ts`

### 6.6 Moderation Module

Відповідає за:

- роботу зі скаргами;
- зміну статусів модерації;
- адміністративне керування контентом.

Ключові файли:

- `supabase/02_moderation_schema.sql`
- `src/app/api/admin/*`
- `src/lib/moderation.ts`

## 7. Маршрутизація та локалізація

Система підтримує локалі `uk` та `en`.

- Локалізовані сторінки мають префікс `/{locale}/...`
- Усі `API` маршрути розміщені під `/api/...`
- Middleware (`src/proxy.ts`) виконує:
  - редирект на локалізований маршрут;
  - оновлення Supabase session;
  - додавання security headers.

## 8. Модель даних

### 8.1 Основні сутності

| Сутність | Призначення |
|---|---|
| `profiles` | публічні профілі талантів |
| `projects` | портфоліо-проєкти користувачів |
| `project_media` | медіа проєктів |
| `project_skills` | зв'язок проєктів з навичками |
| `profile_skills` | зв'язок профілів з навичками |
| `profile_languages` | знання мов |
| `profile_education` | освіта |
| `profile_certificates` | сертифікати |
| `profile_qas` | блок Q&A |
| `profile_work_experience` | досвід роботи |
| `votes` | голоси за проєкти |
| `profile_votes` | голоси за профілі |
| `articles` | технічні статті |
| `article_comments` | коментарі до статей |
| `article_likes` | лайки статей |
| `content_reports` | скарги на контент |
| `moderation_actions` | дії модераторів |
| `feedback` | зворотний зв'язок користувачів |

### 8.2 Довідники

- `countries`
- `profile_categories`
- `skills`
- `languages`
- `article_categories`

### 8.3 Зв'язки

- один користувач має один профіль `profiles.user_id`;
- один користувач може мати багато проєктів;
- один проєкт може мати багато навичок і медіафайлів;
- один профіль може мати багато навичок, мов, записів освіти й досвіду;
- статті належать автору та можуть мати лайки й коментарі;
- скарги можуть бути прив'язані до профілю, проєкту або статті.

## 9. API-специфікація

### 9.1 Загальні принципи

- формат обміну — `application/json`;
- сервер повертає `NextResponse.json(...)`;
- помилки валідації повертають `400`;
- неавторизований доступ повертає `401`;
- конфлікти унікальності можуть повертати `409`.

### 9.2 Приклад наявних ендпоінтів

- `GET /api/search`
- `POST /api/projects`
- `PATCH /api/projects/{id}`
- `PUT /api/profile`
- `POST /api/articles`
- `POST /api/reports`

Повний приклад формального опису двох ендпоінтів винесено в `docs/api/openapi.yaml`.

## 10. Правила валідації

### 10.1 Projects

Для створення проєкту діють такі ключові правила:

- `title` — обов'язкове поле, максимум 120 символів;
- `slug` генерується автоматично з назви або береться з payload;
- `projectStatus` допускає `planning`, `in_progress`, `completed`, `on_hold`;
- `teamSize` має бути додатним цілим числом;
- URL поля мають бути валідними `http/https`;
- `completedOn` не може бути раніше за `startedOn`;
- `skillIds` нормалізуються до унікального списку чисел.

### 10.2 Search

Пошук підтримує query params:

- `q`
- `scope`
- `sort`
- `countryId`
- `categoryId`
- `skillIds`
- `languageIds`
- `experienceLevel`
- `employmentTypes`
- `workFormats`
- `projectStatus`
- `hasMedia`
- `hasAvatar`
- `minScore`
- `maxScore`

## 11. Безпека

### 11.1 Аутентифікація

- використовується `Supabase Auth`;
- route handlers отримують користувача через `supabase.auth.getUser()`;
- приватні операції доступні лише за наявності активної сесії.

### 11.2 Авторизація

- таблиці в Supabase працюють з `Row Level Security`;
- політики обмежують зміни власником запису або адміністратором;
- публічне читання дозволене лише для затвердженого контенту або довідників.

### 11.3 HTTP Security Headers

Через `src/lib/security/headers.ts` система додає:

- `Content-Security-Policy`
- `Strict-Transport-Security` у production
- `Referrer-Policy`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Permissions-Policy`
- `Cross-Origin-Opener-Policy`

### 11.4 Валідація та санітизація

- усі JSON payload проходять через `parseJsonRequest(...)`;
- схеми описані через `Zod`;
- невалідні запити зупиняються до виконання SQL-операцій.

## 12. Інтеграції

### Supabase

- база даних PostgreSQL;
- auth/session management;
- storage для аватарів, сертифікатів і медіа;
- RLS-політики та SQL-міграції.

### Resend

- опціональна email-інтеграція;
- використовується для відправки листів, якщо задано `RESEND_API_KEY`.

## 13. Середовище виконання

### Необхідні змінні середовища

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `NEXT_PUBLIC_APP_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

## 14. Обмеження реалізації

- частина функцій залежить від зовнішньої конфігурації Supabase і Resend;
- пошук зараз виконує агрегування в межах вибірок до 200 записів по профілях і проєктах;
- авторизація орієнтована на веб-сесію Supabase, а не окремий API-token flow;
- продуктивність пошуку залежить від наповнення довідників та індексів у БД.

## 15. Критерії приймання SSD

- описана архітектура системи;
- зафіксовані основні модулі та сутності;
- описані безпека, інтеграції та API-принципи;
- документ узгоджується з наявною кодовою базою та SQL-схемою.

