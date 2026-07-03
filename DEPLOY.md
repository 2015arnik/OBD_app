# Deploy OBD

Ниже основной сценарий для проекта:

- `frontend` публикуем на `Vercel`
- `backend` поднимаем как `Render Web Service`
- `PostgreSQL` создаём в `Render Postgres`

Эта связка подходит нам лучше всего:

- фронт уже статический и собирается через `Vite`
- Vercel нативно поддерживает `Vite`
- для SPA нужен только rewrite на `index.html`
- бэк на `Spring Boot 3 + Java 17` нормально деплоится в Render
- чат использует обычный `WebSocket`, а фронт уже строит `wss` от `VITE_API_BASE_URL`

## 1. Что уже подготовлено в репозитории

- `frontend/vite.config.js` читает `VITE_BASE_PATH`
- `frontend/src/main.jsx` по умолчанию работает через `BrowserRouter`
- все логотипы во фронте используют `import.meta.env.BASE_URL`
- `frontend/vercel.json` добавляет SPA rewrite для deep links
- `backend/src/main/resources/application.properties` слушает `PORT`
- `backend` читает `CORS_ALLOWED_ORIGIN_PATTERNS` и применяет его и к HTTP, и к WebSocket

## 2. Деплой фронта на Vercel

### 2.1. Импорт проекта

В Vercel:

1. `Add New -> Project`
2. подключите GitHub-репозиторий `2015arnik/OBD_app`
3. в настройках проекта задайте:

- `Root Directory`: `frontend`
- `Framework Preset`: `Vite`

Обычно Vercel сам подставляет правильные команды, но если нужно указать явно:

- `Build Command`: `npm run build`
- `Output Directory`: `dist`

### 2.2. Переменные окружения для фронта

В `Project -> Settings -> Environment Variables` добавьте:

- `VITE_API_BASE_URL=https://your-backend.onrender.com`
- `VITE_BASE_PATH=/`

`VITE_ROUTER_MODE` для Vercel не нужен.

### 2.3. Почему роуты будут работать

По официальной документации Vercel для SPA на Vite нужен rewrite всех путей на `index.html`. Это уже сделано в [frontend/vercel.json](/Users/2015arnik/Desktop/OBD_app/frontend/vercel.json). Источник: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)

## 3. Деплой бэка на Render

### 3.1. Создать Postgres

В Render:

1. `New +`
2. `PostgreSQL`
3. имя, например `obd-db`

### 3.2. Создать Web Service

В Render:

1. `New +`
2. `Web Service`
3. подключите этот GitHub-репозиторий
4. задайте:

- `Root Directory`: `backend`
- если Render показывает `Language = Java`, можно использовать обычный Java-сервис:
  - `Build Command`: `mvn clean package -DskipTests`
  - `Start Command`: `java -jar target/obd-backend-0.0.1-SNAPSHOT.jar`
- если `Java` в списке не появляется, используйте Docker:
  - `Environment`: `Docker`
  - `Dockerfile Path`: `./backend/Dockerfile`

Для нашего репозитория второй вариант особенно надёжен, потому что проект монорепозиторий и `pom.xml` лежит в `backend/`, а не в корне.

### 3.3. Переменные окружения для Render

Добавьте:

- `JWT_SECRET=<длинный случайный секрет минимум 32 символа>`
- `POSTGRES_URL=<URL из Render Postgres>`
- `POSTGRES_USER=<username из Render Postgres>`
- `POSTGRES_PASSWORD=<password из Render Postgres>`
- `JPA_DDL_AUTO=update`
- `CORS_ALLOWED_ORIGIN_PATTERNS=https://<ваш-проект>.vercel.app`

Если захотите, чтобы работали ещё и preview-деплои Vercel, можно расширить origin-паттерн. Это уже вывод из нашей реализации `allowedOriginPatterns`, а не требование Render:

- `CORS_ALLOWED_ORIGIN_PATTERNS=https://<ваш-проект>.vercel.app,https://*.vercel.app,http://localhost:5173`

Для более строгой настройки лучше оставить только боевой домен.

## 4. Что важно для нашего проекта

### WebSocket чат

Чат идёт на тот же домен, что и API:

- API: `https://your-backend.onrender.com`
- WebSocket: `wss://your-backend.onrender.com/ws/chat/...`

Отдельно URL для WebSocket задавать не нужно.

### Календарные `.ics` ссылки

Скачивание `.ics` идёт напрямую с бэка, поэтому оно тоже будет работать, если `VITE_API_BASE_URL` указывает на живой Render backend.

## 5. Локальная проверка перед деплоем

### Frontend

```bash
cd frontend
VITE_API_BASE_URL=https://your-backend.onrender.com \
VITE_BASE_PATH=/ \
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

### Docker backend

```bash
docker build -t obd-backend ./backend
docker run --rm -p 8080:8080 \
  -e POSTGRES_URL=jdbc:postgresql://host.docker.internal:5432/obd \
  -e POSTGRES_USER=obd \
  -e POSTGRES_PASSWORD=obd \
  -e JWT_SECRET=replace-with-a-long-secret-value \
  obd-backend
```

## 6. Минимальный чек-лист запуска

1. Запушить проект в GitHub
2. Создать `Render Postgres`
3. Создать `Render Web Service` из папки `backend`
4. Вписать env vars в Render
5. Создать проект в Vercel из папки `frontend`
6. Вписать `VITE_API_BASE_URL` в Vercel
7. Дождаться первого деплоя
8. Открыть фронт на `vercel.app`, зарегистрироваться и проверить чат

## 7. Что можно оставить как есть

- `.github/workflows/deploy-frontend.yml` можно пока не трогать
- GitHub Pages больше не нужен для основного сценария

Если захотите, следующим сообщением я могу сразу дать вам:

1. точный список полей для Vercel по шагам
2. точный список полей для Render по шагам
3. короткий чек-лист, как проверить после первого прод-деплоя логин, чат и сборы
