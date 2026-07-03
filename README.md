# OBD_app — Organization of Birthday Celebration

Система для организации поздравлений друзей с днём рождения: карточки друзей,
списки желаемых подарков, напоминания, группы, реалтайм-чат для обсуждения
подарка (без именинника), автосбор средств через мок-банк и календарь.

## Стек
- **Бэкенд:** Java 17 + Spring Boot 3 (Spring Web, Spring Data JPA + H2, Spring WebSocket, `@Scheduled`, JWT + BCrypt, springdoc/Swagger)
- **Веб:** React + Vite + PWA _(скоро)_
- **Мобильное (iOS/Android):** React Native + Expo _(скоро)_

## Структура репозитория
```
backend/    Spring Boot API
web/        React + Vite + PWA        (в разработке)
mobile/     React Native + Expo       (в разработке)
```

## Как запустить бэкенд
Требуется **JDK 17+** (проверить: `java -version`).

```bash
cd backend
mvn spring-boot:run
```
В **IntelliJ IDEA**: File → Open → папка `backend`; нужен плагин **Lombok** и
включённое «Enable annotation processing» (по умолчанию так и есть).

После запуска:
- API: `http://localhost:8080`
- Проверка живости: `http://localhost:8080/health` → `{"status":"ok"}`
- Swagger (документация API): `http://localhost:8080/swagger-ui.html`
- Консоль БД H2: `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:obd`, user: `sa`)

## API (готово на сейчас)
```
POST /auth/register   {name,email,password,birthDate}  -> {token, user}
POST /auth/login      {email,password}                 -> {token, user}
GET  /auth/me         (заголовок Authorization: Bearer <token>) -> user
GET  /health
```
Токен из ответа кладём в заголовок `Authorization: Bearer <token>` для защищённых запросов.

## Статус
- [x] Каркас Spring Boot + модель данных (9 сущностей + репозитории)
- [x] Авторизация (JWT + BCrypt)
- [ ] API ядра (users, groups, gifts, subscriptions, notifications)
- [ ] Реалтайм-чат (WebSocket)
- [ ] Усложнения: сбор средств (мок-банк), планировщик, календарь, админка
- [ ] Seed-данные
- [ ] Веб и мобильное приложения

Подробная стратегия и план — в документе команды («СТРАТЕГИЯ»).
