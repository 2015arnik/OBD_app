# OBD_app — Organization of Birthday Celebration

Система для организации поздравлений друзей с днём рождения: карточки друзей,
списки желаемых подарков, напоминания, группы, реалтайм-чат для обсуждения
подарка (без именинника), автосбор средств через мок-банк и календарь.

## Стек
- Бэкенд: Java 17 + Spring Boot 3 (Spring Web, Spring Data JPA + H2/PostgreSQL, Spring WebSocket, `@Scheduled`, JWT + BCrypt, springdoc/Swagger). Без Lombok.
- Веб: React 19 + Vite + PWA (папка `frontend/`).
- Мобильное (iOS/Android): React Native + Expo (позже).

## Запуск бэкенда
Требуется JDK 17+. По умолчанию backend теперь работает через PostgreSQL, чтобы данные не стирались после перезапуска.

### Быстрый локальный запуск с PostgreSQL
Подними базу:
```bash
docker compose up -d postgres
```

Потом запусти backend:
```bash
cd backend
mvn spring-boot:run
```

- API: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui.html`
- PostgreSQL: `localhost:5432`, DB `obd`, user `obd`, password `obd`

`compose.yaml` создаёт named volume, поэтому пользователи, группы, сборы и остальные данные переживают рестарт backend и контейнера.

### Кастомные параметры PostgreSQL
Если база не локальная или у тебя другие креды, backend читает:
- `POSTGRES_URL`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

Пример:
```bash
cd backend
POSTGRES_URL=jdbc:postgresql://localhost:5432/obd \
POSTGRES_USER=obd \
POSTGRES_PASSWORD=obd \
mvn spring-boot:run
```

### Временный возврат на H2
Если нужен старый режим только для быстрого демо:
```bash
cd backend
SPRING_PROFILES_ACTIVE=h2 mvn spring-boot:run
```

В режиме `h2` база снова будет жить только в памяти процесса.

## Запуск фронтенда
```
cd frontend
npm install
npm run dev
```
Vite поднимется на `http://localhost:5173` и будет ходить в API по адресу из `frontend/.env`
(`VITE_API_BASE_URL=http://localhost:8080`).

## Демо-доступ (seed-данные)
При первом старте пустой базы backend наполняет её тестовыми данными. Пароль у всех — `password`.
- `anna@obd.app` — есть подписки, уведомления, участие в группах (удобно показывать демо)
- `boris@obd.app` — у него скоро ДР, есть вишлист и открытый сбор
- `admin@obd.app` — администратор

## API
```
АВТОРИЗАЦИЯ         POST /auth/register, POST /auth/login, GET /auth/me, GET /health
ПОЛЬЗОВАТЕЛИ        GET /users, GET /users/{id}, PATCH /users/{id}
ГРУППЫ              GET /groups, POST /groups, POST /groups/{id}/join, GET /groups/{id}/members
ПОДАРКИ             GET /users/{id}/gifts, POST /gifts, PATCH /gifts/{id}, DELETE /gifts/{id}
ПОДПИСКИ/УВЕДОМЛ.   GET/POST /subscriptions, DELETE /subscriptions/{id}, GET /notifications, POST /notifications/{id}/read
ЧАТ (WebSocket)     WS /ws/chat/{userId}?token=<jwt>, GET /users/{id}/chat
СБОР СРЕДСТВ        GET /fundraisers, GET /fundraisers/{id}, POST /fundraisers, POST /fundraisers/{id}/contribute, GET /fundraisers/{id}/contributions
МОК-БАНК            POST /mock-bank/charge
КАЛЕНДАРЬ           GET /users/{id}/calendar.ics, GET /calendar/birthdays.ics, GET /users/{id}/calendar/google
АДМИН (only admin)  GET /admin/stats, GET /admin/users, PATCH /admin/users/{id}, DELETE /admin/users/{id}, GET /admin/groups, DELETE /admin/groups/{id}, POST /admin/import
```

## Статус
- [x] Модель данных, авторизация (JWT + BCrypt)
- [x] API ядра (users, groups, gifts, subscriptions, notifications)
- [x] Реалтайм-чат (WebSocket) + приватность именинника
- [x] Сбор средств + мок-банк
- [x] Seed-данные (демо-наполнение)
- [x] Планировщик `@Scheduled` (авто-напоминания и авто-сбор) + живое уведомление при подписке
- [x] Календарь (.ics + ссылка Google) и админ-панель с импортом
- [x] Веб-фронтенд (React + Vite + PWA)
- [ ] Мобильное приложение

Стратегия — `docs/СТРАТЕГИЯ.md`. Продолжение с другого аккаунта — `HANDOFF.md`.
