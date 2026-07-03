# OBD_app — Organization of Birthday Celebration

Система для организации поздравлений друзей с днём рождения: карточки друзей,
списки желаемых подарков, напоминания, группы, реалтайм-чат для обсуждения
подарка (без именинника), автосбор средств через мок-банк и календарь.

## Стек
- Бэкенд: Java 17 + Spring Boot 3 (Spring Web, Spring Data JPA + H2, Spring WebSocket, `@Scheduled`, JWT + BCrypt, springdoc/Swagger). Без Lombok, геттеры/сеттеры явные.
- Веб: React + Vite + PWA (скоро)
- Мобильное (iOS/Android): React Native + Expo (скоро)

## Как запустить бэкенд
Требуется JDK 17+.
```
cd backend
mvn spring-boot:run
```
- API: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui.html`
- Консоль БД H2: `http://localhost:8080/h2-console` (JDBC URL `jdbc:h2:mem:obd`, user `sa`)

## Как запустить веб-фронтенд
Требуется Node.js 20+.
```
cd frontend
npm install
cp .env.example .env
npm run dev
```
- Веб-приложение: `http://localhost:5173`
- По умолчанию фронтенд ходит в API `http://localhost:8080`
- Для production-сборки: `npm run build`

## Проверка в Swagger
1. `POST /auth/register` → скопируйте `token`.
2. Кнопка Authorize сверху → вставьте токен.
3. Дальше доступны защищённые эндпоинты.

## API
```
АВТОРИЗАЦИЯ
  POST   /auth/register     {name,email,password,birthDate} -> {token, user}
  POST   /auth/login        {email,password}                -> {token, user}
  GET    /auth/me
  GET    /health

ПОЛЬЗОВАТЕЛИ
  GET    /users                 все + сортировка по ближайшему ДР
  GET    /users/{id}            карточка: профиль + группы + вишлист
  PATCH  /users/{id}            редактировать свой профиль

ГРУППЫ
  GET    /groups
  POST   /groups                создать (создатель сразу вступает)
  POST   /groups/{id}/join
  GET    /groups/{id}/members

ПОДАРКИ
  GET    /users/{id}/gifts
  POST   /gifts                 опубликовать свой подарок
  PATCH  /gifts/{id}            статус (резерв/куплено); текст — только владелец
  DELETE /gifts/{id}            только владелец

ПОДПИСКИ / УВЕДОМЛЕНИЯ
  GET    /subscriptions
  POST   /subscriptions         {targetType: USER|GROUP, targetId}
  DELETE /subscriptions/{id}
  GET    /notifications
  POST   /notifications/{id}/read

ЧАТ (реалтайм, WebSocket)
  WS     /ws/chat/{userId}?token=<jwt>   комната обсуждения подарка именинника {userId}
  GET    /users/{id}/chat               история сообщений
```
Именинник не может ни подключиться к своему чату по WebSocket, ни получить его историю.

## Как проверить чат (без фронта)
Залогиньтесь двумя разными пользователями (id которых НЕ равен имениннику).
В консоли браузера (две вкладки):
```
const token = "<токен из /auth/login>";
const ws = new WebSocket(`ws://localhost:8080/ws/chat/2?token=${token}`);
ws.onmessage = e => console.log(JSON.parse(e.data));
ws.onopen = () => ws.send(JSON.stringify({ text: "Привет!" }));
```
Сообщение из одной вкладки мгновенно появляется в другой. `2` — id именинника, чей подарок обсуждают.

## Статус
- [x] Каркас Spring Boot + модель данных
- [x] Авторизация (JWT + BCrypt)
- [x] API ядра (users, groups, gifts, subscriptions, notifications)
- [x] Реалтайм-чат (WebSocket) + приватность именинника
- [x] Веб-фронтенд (React + Vite + PWA) для ядра: auth, люди, карточка друга, мой вишлист, группы, уведомления
- [ ] Усложнения: сбор средств (мок-банк), планировщик, календарь, админка
- [ ] Seed-данные
- [ ] Мобильное приложение

Стратегия и план — `docs/СТРАТЕГИЯ.md`. Как продолжить с другого аккаунта — `HANDOFF.md`.
