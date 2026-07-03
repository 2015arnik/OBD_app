import { useEffect, useState } from "react";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { api, extractApiError } from "../lib/api";
import { formatIsoDate } from "../lib/format";

const importExample = [
  {
    name: "Новый пользователь",
    email: "new@obd.app",
    birthDate: "2000-08-15",
    password: "password"
  }
];

export default function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [importText, setImportText] = useState(JSON.stringify(importExample, null, 2));
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user.admin) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const [statsResponse, usersResponse, groupsResponse] = await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/users"),
          api.get("/admin/groups")
        ]);
        setStats(statsResponse.data);
        setUsers(usersResponse.data);
        setGroups(groupsResponse.data);
      } catch (requestError) {
        setFeedback(extractApiError(requestError));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user.admin]);

  const toggleAdmin = async (targetUser) => {
    try {
      const response = await api.patch(`/admin/users/${targetUser.id}`, {
        admin: !targetUser.admin
      });
      setUsers((current) =>
        current.map((item) => (item.id === targetUser.id ? response.data : item))
      );
      setFeedback("Роль пользователя обновлена.");
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  const deleteUser = async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((current) => current.filter((item) => item.id !== userId));
      setFeedback("Пользователь удалён.");
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  const deleteGroup = async (groupId) => {
    try {
      await api.delete(`/admin/groups/${groupId}`);
      setGroups((current) => current.filter((item) => item.id !== groupId));
      setFeedback("Группа удалена.");
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  const importUsers = async (event) => {
    event.preventDefault();

    try {
      const payload = JSON.parse(importText);
      const response = await api.post("/admin/import", payload);
      setFeedback(`Импорт завершён: создано ${response.data.created}, пропущено ${response.data.skipped}.`);
    } catch (requestError) {
      if (requestError instanceof SyntaxError) {
        setFeedback("JSON в блоке импорта содержит ошибку.");
        return;
      }
      setFeedback(extractApiError(requestError));
    }
  };

  if (!user.admin) {
    return (
      <div className="page-stack">
        <PageHeader
          title="Админка"
          description="Этот раздел доступен только администраторам."
        />
        <EmptyState
          title="Доступ закрыт"
          description="Зайдите под администратором, например admin@obd.app / password, чтобы увидеть новый backend-функционал."
        />
      </div>
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Админка"
        description="Новый backend уже поддерживает статистику, управление пользователями и группами, а также импорт из JSON."
      />

      {feedback ? <div className="feedback feedback-info">{feedback}</div> : null}
      {loading ? <div className="panel">Загружаем административные данные...</div> : null}

      {stats ? (
        <section className="cards-grid">
          <article className="panel spotlight-card">
            <p className="eyebrow">Пользователи</p>
            <h3>{stats.users}</h3>
          </article>
          <article className="panel spotlight-card">
            <p className="eyebrow">Группы</p>
            <h3>{stats.groups}</h3>
          </article>
          <article className="panel spotlight-card">
            <p className="eyebrow">Подарки</p>
            <h3>{stats.gifts}</h3>
          </article>
          <article className="panel spotlight-card">
            <p className="eyebrow">Сборы</p>
            <h3>{stats.fundraisers}</h3>
          </article>
        </section>
      ) : null}

      <section className="two-column-layout">
        <section className="panel section-stack">
          <div className="section-title">
            <div>
              <h3>Пользователи</h3>
              <p className="microcopy">GET /admin/users, PATCH /admin/users/{`{id}`}, DELETE /admin/users/{`{id}`}</p>
            </div>
          </div>
          <div className="member-list">
            {users.map((item) => (
              <div key={item.id} className="member-row">
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.email} • {formatIsoDate(item.birthDate)}</p>
                </div>
                <div className="card-actions">
                  <button type="button" className="button button-ghost" onClick={() => toggleAdmin(item)}>
                    {item.admin ? "Снять admin" : "Сделать admin"}
                  </button>
                  {item.id !== user.id ? (
                    <button type="button" className="button button-ghost" onClick={() => deleteUser(item.id)}>
                      Удалить
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel section-stack">
          <div className="section-title">
            <div>
              <h3>Группы</h3>
              <p className="microcopy">GET /admin/groups и DELETE /admin/groups/{`{id}`}</p>
            </div>
          </div>
          <div className="member-list">
            {groups.map((item) => (
              <div key={item.id} className="member-row">
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.description || "Без описания"}</p>
                </div>
                <button type="button" className="button button-ghost" onClick={() => deleteGroup(item.id)}>
                  Удалить
                </button>
              </div>
            ))}
          </div>
        </section>
      </section>

      <form className="panel form-stack" onSubmit={importUsers}>
        <div className="section-title">
          <div>
            <h3>Импорт пользователей</h3>
            <p className="microcopy">POST /admin/import</p>
          </div>
        </div>
        <label>
          JSON-массив
          <textarea
            rows="10"
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
          />
        </label>
        <button type="submit" className="button button-primary">
          Запустить импорт
        </button>
      </form>
    </div>
  );
}
