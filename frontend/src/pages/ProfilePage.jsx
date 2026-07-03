import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { api, extractApiError } from "../lib/api";

export default function ProfilePage() {
  const { updateUser, user } = useAuth();
  const [profileForm, setProfileForm] = useState({
    name: user.name || "",
    birthDate: user.birthDate || ""
  });
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setProfileForm({
      name: user.name || "",
      birthDate: user.birthDate || ""
    });
  }, [user.birthDate, user.name]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await api.patch(`/users/${user.id}`, {
        ...profileForm,
        birthDate: profileForm.birthDate ? profileForm.birthDate : null
      });
      updateUser(response.data);
      setFeedback("Профиль обновлён.");
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    } finally {
      setSaving(false);
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

      {feedback ? <div className="feedback feedback-info">{feedback}</div> : null}

      <section className="two-column-layout">
        <form className="panel form-stack" onSubmit={saveProfile}>
          <div className="section-title">
            <div>
              <h3>Основная информация</h3>
              <p className="microcopy">{`PATCH /users/${user.id}`}</p>
            </div>
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

        <article className="panel spotlight-card">
          <p className="eyebrow">Ваш аккаунт</p>
          <h3>{user.name}</h3>
          <p>
            Здесь удобно менять имя и дату рождения, а список желаемых подарков теперь живёт
            отдельно в разделе вишлиста.
          </p>
          <div className="group-list">
            <div className="group-row">
              <div>
                <strong>Email для входа</strong>
                <p>{user.email}</p>
              </div>
            </div>
            <div className="group-row">
              <div>
                <strong>Роль</strong>
                <p>{user.admin ? "Администратор" : "Пользователь"}</p>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
