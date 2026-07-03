# OBD_app — Organization of Birthday Celebration

Система для организации поздравлений друзей с днём рождения: карточки друзей,
списки желаемых подарков, напоминания, группы, реалтайм-чат для обсуждения
подарка (без именинника), автосбор средств через мок-банк и календарь.

## Стек
- Бэкенд: Java 17 + Spring Boot 3 (Spring Web, Spring Data JPA + H2, Spring WebSocket, `@Scheduled`, JWT + BCrypt, springdoc/Swagger). Без Lombok.
- Веб: React 19 + Vite + PWA (папка `frontend/`).
- Мобильное (iOS/Android): React Native + Expo (позже).

## Запуск бэкенда
Требуется JDK 17+.
```
cd backend
mvn spring-boot:run
```
- API: `http://localhost:8080`, Swagger: `http://localhost:8080/swagger-ui.html`
- Консоль БД: `http://localhost:8080/h2-console` (JDBC URL `jdbc:h2:mem:obd`, user `sa`)

## Запуск фронтенда
```
cd frontend
npm install
npm run dev
```
Vite поднимется на `http://localhost:5173` и будет ходить в API по адресу из `frontend/.env`
(`VITE_API_BASE_URL=http://localhost:8080`).

## Демо-доступ (seed-данные)
При старте бэкенд наполняет базу тестовыми данными. Пароль у всех — `password`.
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
```

## Статус
- [x] Модель данных, авторизация (JWT + BCrypt)
- [x] API ядра (users, groups, gifts, subscriptions, notifications)
- [x] Реалтайм-чат (WebSocket) + приватность именинника
- [x] Сбор средств + мок-банк
- [x] Seed-данные (демо-наполнение)
- [ ] Планировщик `@Scheduled` (авто-напоминания и авто-сбор)
- [ ] Календарь (.ics), админ-панель
- [x] Веб-фронтенд (React + Vite + PWA)
- [ ] Мобильное приложение

Стратегия — `docs/СТРАТЕГИЯ.md`. Продолжение с другого аккаунта — `HANDOFF.md`.
