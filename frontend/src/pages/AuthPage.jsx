import { useState } from "react";
import PasswordField from "../components/PasswordField";
import { useAuth } from "../context/AuthContext";

const loginInitialState = {
  email: "",
  password: ""
};

const registerInitialState = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
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
    setError("");

    if (mode === "register" && registerForm.password !== registerForm.confirmPassword) {
      setError("Пароли не совпадают.");
      return;
    }

    setPending(true);

    const action = mode === "login" ? login : register;
    const payload =
      mode === "login"
        ? loginForm
        : {
            name: registerForm.name,
            email: registerForm.email,
            password: registerForm.password,
            birthDate: registerForm.birthDate
          };
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
        <h1>Следите за днями рождения, готовьте подарки и обсуждайте их в одном месте.</h1>
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
            <p className="eyebrow">{mode === "login" ? "С возвращением" : "создать аккаунт"}</p>
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

          <PasswordField
            label="Пароль"
            required
            value={mode === "login" ? loginForm.password : registerForm.password}
            onChange={(event) =>
              mode === "login"
                ? setLoginForm((current) => ({ ...current, password: event.target.value }))
                : setRegisterForm((current) => ({ ...current, password: event.target.value }))
            }
          />

          {mode === "register" ? (
            <PasswordField
              label="Подтвердите пароль"
              required
              value={registerForm.confirmPassword}
              onChange={(event) =>
                setRegisterForm((current) => ({
                  ...current,
                  confirmPassword: event.target.value
                }))
              }
            />
          ) : null}

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
