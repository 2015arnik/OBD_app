import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { api, extractApiError } from "../lib/api";

export default function ProfilePage() {
  const { logout, updateUser, user } = useAuth();
  const [profileForm, setProfileForm] = useState({
    name: user.name || "",
    birthDate: user.birthDate || ""
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [profileFeedback, setProfileFeedback] = useState("");
  const [passwordFeedback, setPasswordFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    setProfileForm({
      name: user.name || "",
      birthDate: user.birthDate || ""
    });
  }, [user.birthDate, user.name]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setProfileFeedback("");

    try {
      const response = await api.patch(`/users/${user.id}`, {
        ...profileForm,
        birthDate: profileForm.birthDate ? profileForm.birthDate : null
      });
      updateUser(response.data);
      setProfileFeedback("Профиль обновлён.");
    } catch (requestError) {
      setProfileFeedback(extractApiError(requestError));
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordFeedback("Новые пароли не совпадают.");
      return;
    }

    setPasswordSaving(true);
    setPasswordFeedback("");

    try {
      const response = await api.patch(`/users/${user.id}/password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordFeedback(response.data.message || "Пароль обновлён.");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (requestError) {
      setPasswordFeedback(extractApiError(requestError));
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        title="Мой профиль"
        description="Здесь редактируются ваши личные данные. Вишлист теперь отвечает только за подарки."
        actions={
          <div className="cluster">
            <Link className="button button-ghost" to={`/friends/${user.id}`}>
              Моя карточка
            </Link>
            <Link className="button button-primary" to="/wishlist">
              Мой вишлист
            </Link>
          </div>
        }
      />

      {profileFeedback ? <div className="feedback feedback-info">{profileFeedback}</div> : null}

      <section className="two-column-layout">
        <form className="panel form-stack" onSubmit={saveProfile}>
          <div className="section-title">
            <h3>Основная информация</h3>
          </div>

          <label>
            Имя
            <input
              required
              value={profileForm.name}
              onChange={(event) =>
                setProfileForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </label>

          <label>
            Email
            <input value={user.email || ""} disabled />
          </label>

          <label>
            Дата рождения
            <input
              type="date"
              value={profileForm.birthDate || ""}
              onChange={(event) =>
                setProfileForm((current) => ({
                  ...current,
                  birthDate: event.target.value
                }))
              }
            />
          </label>

          <button type="submit" className="button button-primary" disabled={saving}>
            {saving ? "Сохраняем..." : "Сохранить профиль"}
          </button>
        </form>

        <form className="panel form-stack" onSubmit={savePassword}>
          <div className="section-title">
            <h3>Сменить пароль</h3>
          </div>

          <label>
            Текущий пароль
            <input
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(event) =>
                setPasswordForm((current) => ({
                  ...current,
                  currentPassword: event.target.value
                }))
              }
            />
          </label>

          <label>
            Новый пароль
            <input
              type="password"
              required
              minLength={6}
              value={passwordForm.newPassword}
              onChange={(event) =>
                setPasswordForm((current) => ({
                  ...current,
                  newPassword: event.target.value
                }))
              }
            />
          </label>

          <label>
            Повторите новый пароль
            <input
              type="password"
              required
              minLength={6}
              value={passwordForm.confirmPassword}
              onChange={(event) =>
                setPasswordForm((current) => ({
                  ...current,
                  confirmPassword: event.target.value
                }))
              }
            />
          </label>

          {passwordFeedback ? <div className="feedback feedback-info">{passwordFeedback}</div> : null}

          <button type="submit" className="button button-primary" disabled={passwordSaving}>
            {passwordSaving ? "Обновляем..." : "Сменить пароль"}
          </button>
        </form>
      </section>

      <section className="panel form-stack">
        <div className="section-title">
          <h3>Выход из аккаунта</h3>
        </div>
        <p className="microcopy">
          Завершает текущую сессию на этом устройстве и возвращает на экран входа.
        </p>
        <button type="button" className="button button-danger profile-logout-button" onClick={logout}>
          Выйти из аккаунта
        </button>
      </section>
    </div>
  );
}
