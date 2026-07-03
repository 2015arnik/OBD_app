# OBD_app — Organization of Birthday Celebration

Система для организации поздравлений друзей с днём рождения: карточки друзей,
списки желаемых подарков, напоминания, группы, реалтайм-чат для обсуждения
подарка (без именинника), автосбор средств через мок-банк и календарь.

## Стек
- **Бэкенд:** Java 17 + Spring Boot 3 (Spring Web, Spring Data JPA + H2, Spring WebSocket, `@Scheduled`, JWT + BCrypt, springdoc/Swagger) — **без Lombok**, геттеры/сеттеры явные.
- **Веб:** React + Vite + PWA _(скоро)_
- **Мобильное (iOS/Android):** React Native + Expo _(скоро)_

## Как запустить бэкенд
Требуется **JDK 17+**.
```
cd backend
mvn spring-boot:run
```
- API: `http://localhost:8080`
- Swagger (документация + ручной вызов): `http://localhost:8080/swagger-ui.html`
- Консоль БД H2: `http://localhost:8080/h2-console` (JDBC URL `jdbc:h2:mem:obd`, user `sa`)

## Как проверить в Swagger
1. `POST /auth/register` → скопируйте `token` из ответа.
2. Вверху Swagger нажмите **Authorize** и вставьте `Bearer <token>` (или просто токен).
3. Теперь работают защищённые эндпоинты: создать группу, добавить подарок, подписаться и т.д.

## API
```
АВТОРИЗАЦИЯ
  POST   /auth/register     {name,email,password,birthDate} -> {token, user}
  POST   /auth/login        {email,password}                -> {token, user}
  GET    /auth/me
  GET    /health

ПОЛЬЗОВАТЕЛИ
  GET    /users                     все + сортировка по ближайшему ДР
  GET    /users/{id}                карточка: профиль + группы + вишлист
  PATCH  /users/{id}                редактировать свой профиль

ГРУППЫ
  GET    /groups
  POST   /groups                    создать (создатель сразу вступает)
  POST   /groups/{id}/join
  GET    /groups/{id}/members

ПОДАРКИ (ВИШЛИСТ)
  GET    /users/{id}/gifts
  POST   /gifts                     опубликовать свой подарок
  PATCH  /gifts/{id}                статус (резерв/куплено); текст — только владелец
  DELETE /gifts/{id}                только владелец

ПОДПИСКИ / УВЕДОМЛЕНИЯ
  GET    /subscriptions             мои
  POST   /subscriptions             {targetType: USER|GROUP, targetId}
  DELETE /subscriptions/{id}
  GET    /notifications             мои
  POST   /notifications/{id}/read
```

## Статус
- [x] Каркас Spring Boot + модель данных (9 сущностей + репозитории)
- [x] Авторизация (JWT + BCrypt)
- [x] API ядра (users, groups, gifts, subscriptions, notifications)
- [ ] Реалтайм-чат (WebSocket)
- [ ] Усложнения: сбор средств (мок-банк), планировщик, календарь, админка
- [ ] Seed-данные
- [ ] Веб и мобильное приложения

Стратегия и план — `docs/СТРАТЕГИЯ.md`. Как продолжить с другого аккаунта — `HANDOFF.md`.
