import { useEffect, useState } from "react";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { api, extractApiError } from "../lib/api";
import { formatBirthday, formatDaysUntilBirthday } from "../lib/format";

const newGroupInitialState = {
  name: "",
  description: ""
};

export default function GroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [membersByGroup, setMembersByGroup] = useState({});
  const [subscriptions, setSubscriptions] = useState([]);
  const [groupForm, setGroupForm] = useState(newGroupInitialState);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const [groupsResponse, subscriptionsResponse] = await Promise.all([
          api.get("/groups"),
          api.get("/subscriptions")
        ]);
        setGroups(groupsResponse.data);
        setSubscriptions(subscriptionsResponse.data);
      } catch (requestError) {
        setFeedback(extractApiError(requestError));
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, []);

  const loadMembers = async (groupId) => {
    if (membersByGroup[groupId]) {
      return;
    }

    try {
      const response = await api.get(`/groups/${groupId}/members`);
      setMembersByGroup((current) => ({ ...current, [groupId]: response.data }));
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  const createGroup = async (event) => {
    event.preventDefault();

    try {
      const response = await api.post("/groups", groupForm);
      setGroups((current) => [response.data, ...current]);
      setGroupForm(newGroupInitialState);
      setFeedback("Группа создана. Вы автоматически стали участником.");
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  const joinGroup = async (groupId) => {
    try {
      await api.post(`/groups/${groupId}/join`);
      const response = await api.get(`/groups/${groupId}/members`);
      setMembersByGroup((current) => ({ ...current, [groupId]: response.data }));
      setFeedback("Вы в группе. Состав участников обновлён.");
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  const toggleGroupSubscription = async (groupId) => {
    const existing = subscriptions.find(
      (item) => item.targetType === "GROUP" && Number(item.targetId) === Number(groupId)
    );

    try {
      if (existing) {
        await api.delete(`/subscriptions/${existing.id}`);
        setSubscriptions((current) => current.filter((item) => item.id !== existing.id));
        setFeedback("Подписка на группу снята.");
      } else {
        const response = await api.post("/subscriptions", {
          targetType: "GROUP",
          targetId: groupId
        });
        setSubscriptions((current) => [...current, response.data]);
        setFeedback("Подписка на группу включена.");
      }
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        title="Группы"
        description="Общий каталог групп, вступление в сообщества и подписки на уведомления сразу по нескольким людям."
      />

      {feedback ? <div className="feedback feedback-info">{feedback}</div> : null}

      <section className="two-column-layout">
        <form className="panel form-stack" onSubmit={createGroup}>
          <div className="section-title">
            <h3>Создать новую группу</h3>
            <span className="microcopy">POST /groups</span>
          </div>

          <label>
            Название
            <input
              required
              value={groupForm.name}
              onChange={(event) =>
                setGroupForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </label>

          <label>
            Описание
            <textarea
              rows="4"
              value={groupForm.description}
              onChange={(event) =>
                setGroupForm((current) => ({
                  ...current,
                  description: event.target.value
                }))
              }
            />
          </label>

          <button type="submit" className="button button-primary">
            Создать группу
          </button>
        </form>

        <div className="panel spotlight-card">
          <p className="eyebrow">Как использовать</p>
          <h3>Групповые подписки экономят время.</h3>
          <p>
            Если вы подписываетесь на группу, система позже сможет присылать уведомления сразу
            по всем её участникам. Это закрывает одно из ключевых требований ТЗ.
          </p>
        </div>
      </section>

      <section className="cards-grid">
        {loading ? <div className="panel">Загружаем список групп...</div> : null}

        {!loading && groups.length === 0 ? (
          <EmptyState
            title="Групп пока нет"
            description="Создайте первую группу, чтобы объединять друзей по командам, потокам и хобби."
          />
        ) : null}

        {groups.map((group) => {
          const members = membersByGroup[group.id];
          const subscription = subscriptions.find(
            (item) => item.targetType === "GROUP" && Number(item.targetId) === Number(group.id)
          );
          const includesMe = members?.some((member) => member.id === user.id);

          return (
            <article key={group.id} className="panel person-card">
              <div className="person-card-top">
                <div>
                  <p className="eyebrow">
                    {group.creatorId === user.id ? "Вы создали" : "Открытая группа"}
                  </p>
                  <h3>{group.name}</h3>
                </div>
                <span className="day-pill">
                  {members ? `${members.length} участников` : "Состав по запросу"}
                </span>
              </div>

              <p>{group.description || "Описание пока не добавлено."}</p>

              <div className="card-actions">
                <button type="button" className="button button-primary" onClick={() => joinGroup(group.id)}>
                  {includesMe ? "Состав обновить" : "Вступить"}
                </button>
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => toggleGroupSubscription(group.id)}
                >
                  {subscription ? "Отключить подписку" : "Подписаться"}
                </button>
                <button type="button" className="button button-ghost" onClick={() => loadMembers(group.id)}>
                  Показать участников
                </button>
              </div>

              {members ? (
                <div className="member-list">
                  {members.map((member) => (
                    <div key={member.id} className="member-row">
                      <div>
                        <strong>{member.name}</strong>
                        <p>{formatBirthday(member.birthDate)}</p>
                      </div>
                      <span className="day-pill">
                        {formatDaysUntilBirthday(member.daysUntilBirthday)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}
      </section>
    </div>
  );
}
