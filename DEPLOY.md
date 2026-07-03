# Deploy OBD

Ниже схема, которая лучше всего подходит для текущего проекта:

- `frontend` публикуем на `GitHub Pages`
- `backend` поднимаем как `Render Web Service`
- `PostgreSQL` создаём в `Render Postgres`

Такой вариант хорошо подходит нам сейчас, потому что:

- фронт уже статический и собирается через `Vite`
- бэк на `Spring Boot 3 + Java 17` без проблем деплоится как отдельный веб-сервис
- чат работает по обычному `WebSocket`, а бэк уже умеет строить `ws/wss` URL от `VITE_API_BASE_URL`

## 1. Что уже настроено в репозитории

Я подготовил проект к деплою:

- `frontend/vite.config.js` читает `VITE_BASE_PATH`
- `frontend/src/main.jsx` умеет работать через `HashRouter` по `VITE_ROUTER_MODE=hash`
- все логотипы во фронте теперь берутся через `import.meta.env.BASE_URL`
- `.github/workflows/deploy-frontend.yml` публикует фронт на GitHub Pages
- `backend/src/main/resources/application.properties` теперь слушает `PORT`
- `backend` читает `CORS_ALLOWED_ORIGIN_PATTERNS` и применяет его и к HTTP, и к WebSocket

## 2. Деплой фронта на GitHub Pages

### 2.1. Запушить проект в GitHub

Нужна ветка `main`.

### 2.2. Включить GitHub Pages

В репозитории откройте:

`Settings -> Pages -> Build and deployment -> Source -> GitHub Actions`

Workflow уже лежит в `.github/workflows/deploy-frontend.yml`.

По умолчанию он настроен под `project page`, то есть адрес вида:

`https://<ваш-логин>.github.io/<repo>/`

Если позже захотите публиковать фронт как `user site` (`https://<ваш-логин>.github.io/`) или через собственный домен, в workflow нужно будет поменять:

- `VITE_BASE_PATH` на `/`

### 2.3. Добавить переменную с URL бэка

Откройте:

`Settings -> Secrets and variables -> Actions -> Variables`

Создайте переменную:

- `VITE_API_BASE_URL=https://your-backend.onrender.com`

После следующего пуша GitHub сам соберёт и опубликует фронт.

## 3. Деплой бэка на Render

### 3.1. Создать Postgres

В Render:

1. `New +`
2. `PostgreSQL`
3. задайте имя, например `obd-db`

Потом Render покажет параметры подключения.

### 3.2. Создать Web Service

В Render:

1. `New +`
2. `Web Service`
3. подключите ваш GitHub-репозиторий
4. укажите:

- `Root Directory`: `backend`
- `Runtime`: `Java`
- `Build Command`: `mvn clean package -DskipTests`
- `Start Command`: `java -jar target/obd-backend-0.0.1-SNAPSHOT.jar`

### 3.3. Добавить переменные окружения

В сервисе Render задайте:

- `JWT_SECRET=<длинный случайный секрет минимум 32 символа>`
- `POSTGRES_URL=<External Database URL или Internal Database URL Render>`
- `POSTGRES_USER=<username из Render Postgres>`
- `POSTGRES_PASSWORD=<password из Render Postgres>`
- `JPA_DDL_AUTO=update`
- `CORS_ALLOWED_ORIGIN_PATTERNS=https://<ваш-логин>.github.io`

Если репозиторий публикуется как project page, обычно фронт будет жить по адресу:

`https://<ваш-логин>.github.io/<repo>/`

Тогда можно поставить:

- `CORS_ALLOWED_ORIGIN_PATTERNS=https://<ваш-логин>.github.io`

Если захотите несколько origin, перечисляйте через запятую:

`https://<ваш-логин>.github.io,http://localhost:5173`

## 4. Что важно для нашего проекта

### WebSocket чат

Чат идёт на тот же домен, что и API:

- API: `https://your-backend.onrender.com`
- WebSocket: `wss://your-backend.onrender.com/ws/chat/...`

Фронт строит этот адрес автоматически из `VITE_API_BASE_URL`, отдельно настраивать WS URL не нужно.

### GitHub Pages и роуты

Для Pages я включил `HashRouter`, поэтому адреса будут вида:

`https://<ваш-логин>.github.io/<repo>/#/wishlist`

Это самый надёжный вариант для GitHub Pages без 404 на внутренних страницах.

## 5. Локальная проверка перед деплоем

### Frontend

```bash
cd frontend
VITE_API_BASE_URL=https://your-backend.onrender.com \
VITE_ROUTER_MODE=hash \
VITE_BASE_PATH=/OBD_app/ \
npm run build
```

### Backend

```bash
cd backend
POSTGRES_URL=jdbc:postgresql://localhost:5432/obd \
POSTGRES_USER=obd \
POSTGRES_PASSWORD=obd \
JWT_SECRET=replace-with-a-long-secret-value \
mvn spring-boot:run
```

## 6. Минимальный чек-лист запуска

1. Запушить репозиторий в GitHub
2. Включить `GitHub Actions` для Pages
3. Создать `Render Postgres`
4. Создать `Render Web Service` из папки `backend`
5. Вписать env vars в Render
6. В GitHub добавить `VITE_API_BASE_URL`
7. Запушить в `main`
8. Открыть фронт на `github.io`, зарегистрироваться и проверить чат

## 7. Что я рекомендую дальше

После первого успешного деплоя стоит сделать ещё два небольших шага:

- вынести `JWT_SECRET` в менеджер секретов и не хранить его нигде в явном виде
- добавить отдельный production origin для `CORS_ALLOWED_ORIGIN_PATTERNS`, а не оставлять `*`

Если хотите, следующим сообщением я могу сразу подготовить ещё и:

1. `render.yaml` для автосоздания Render-сервиса и базы
2. готовый список точных полей, которые нужно заполнить в интерфейсе Render
3. команды `git add / commit / push`, чтобы вы сразу выкатили всё это в GitHub
