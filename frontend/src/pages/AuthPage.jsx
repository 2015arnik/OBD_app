import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const loginInitialState = {
  email: "",
  password: ""
};

const registerInitialState = {
  name: "",
  email: "",
  password: "",
  birthDate: ""
};

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState(loginInitialState);
  const [registerForm, setRegisterForm] = useState(registerInitialState);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setPending(true);
    setError("");

    const action = mode === "login" ? login : register;
    const payload = mode === "login" ? loginForm : registerForm;
    const result = await action(payload);

    setPending(false);

    if (!result.ok) {
      setError(result.error);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-hero">
        <div className="auth-brand">
          <img className="brand-mark brand-mark-large" src="/icon.svg" alt="OBD Birthday Planner logo" />
          <div>
            <p className="eyebrow">Birthday Planner</p>
            <strong>OBD</strong>
          </div>
        </div>
        <p className="eyebrow">Веб-платформа для хакатона</p>
        <h1>Следите за днями рождения, готовьте подарки и обсуждайте их в одном месте.</h1>
        <p>
          Интерфейс собран под реальное API проекта: списки друзей, группы, вишлисты,
          уведомления и приватный чат без именинника.
        </p>
        <div className="auth-metrics">
          <div className="metric-card">
            <strong>7 сценариев</strong>
            <span>закрываются из браузера</span>
          </div>
          <div className="metric-card">
            <strong>Realtime chat</strong>
            <span>через WebSocket</span>
          </div>
          <div className="metric-card">
            <strong>PWA-ready</strong>
            <span>можно ставить на телефон</span>
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-toggle">
          <button
            type="button"
            className={mode === "login" ? "toggle-active" : ""}
            onClick={() => setMode("login")}
          >
            Вход
          </button>
          <button
            type="button"
            className={mode === "register" ? "toggle-active" : ""}
            onClick={() => setMode("register")}
          >
            Регистрация
          </button>
        </div>

        <form className="panel auth-form" onSubmit={submit}>
          <div>
            <p className="eyebrow">{mode === "login" ? "С возвращением" : "Создаём аккаунт"}</p>
            <h2>{mode === "login" ? "Войти в OBD" : "Подключиться к системе"}</h2>
          </div>

          {mode === "register" ? (
            <label>
              Имя
              <input
                required
                value={registerForm.name}
                onChange={(event) =>
                  setRegisterForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>
          ) : null}

          <label>
            Email
            <input
              required
              type="email"
              value={mode === "login" ? loginForm.email : registerForm.email}
              onChange={(event) =>
                mode === "login"
                  ? setLoginForm((current) => ({ ...current, email: event.target.value }))
                  : setRegisterForm((current) => ({ ...current, email: event.target.value }))
              }
            />
          </label>

          <label>
            Пароль
            <input
              required
              type="password"
              value={mode === "login" ? loginForm.password : registerForm.password}
              onChange={(event) =>
                mode === "login"
                  ? setLoginForm((current) => ({ ...current, password: event.target.value }))
                  : setRegisterForm((current) => ({ ...current, password: event.target.value }))
              }
            />
          </label>

          {mode === "register" ? (
            <label>
              Дата рождения
              <input
                type="date"
                value={registerForm.birthDate}
                onChange={(event) =>
                  setRegisterForm((current) => ({
                    ...current,
                    birthDate: event.target.value
                  }))
                }
              />
            </label>
          ) : null}

          {error ? <div className="feedback feedback-error">{error}</div> : null}

          <button type="submit" className="button button-primary" disabled={pending}>
            {pending ? "Отправляем..." : mode === "login" ? "Войти" : "Создать аккаунт"}
          </button>
        </form>
      </div>
    </div>
  );
}
