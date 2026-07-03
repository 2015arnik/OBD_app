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
  const [myGroupIds, setMyGroupIds] = useState([]);
  const [membersByGroup, setMembersByGroup] = useState({});
  const [memberCountsByGroup, setMemberCountsByGroup] = useState({});
  const [subscriptions, setSubscriptions] = useState([]);
  const [groupForm, setGroupForm] = useState(newGroupInitialState);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const [groupsResponse, subscriptionsResponse, myProfileResponse] = await Promise.all([
          api.get("/groups"),
          api.get("/subscriptions"),
          api.get(`/users/${user.id}`)
        ]);
        const memberLists = await Promise.all(
          groupsResponse.data.map((group) => api.get(`/groups/${group.id}/members`))
        );
        setGroups(groupsResponse.data);
        setSubscriptions(subscriptionsResponse.data);
        setMyGroupIds(myProfileResponse.data.groups.map((group) => group.id));
        setMemberCountsByGroup(
          Object.fromEntries(
            groupsResponse.data.map((group, index) => [group.id, memberLists[index].data.length])
          )
        );
      } catch (requestError) {
        setFeedback(extractApiError(requestError));
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, [user.id]);

  const loadMembers = async (groupId) => {
    if (membersByGroup[groupId]) {
      return;
    }

    try {
      const response = await api.get(`/groups/${groupId}/members`);
      setMembersByGroup((current) => ({ ...current, [groupId]: response.data }));
      setMemberCountsByGroup((current) => ({ ...current, [groupId]: response.data.length }));
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  const toggleMembers = (groupId) => {
    if (membersByGroup[groupId]) {
      setMembersByGroup((current) => {
        const next = { ...current };
        delete next[groupId];
        return next;
      });
      return;
    }

    loadMembers(groupId);
  };

  const createGroup = async (event) => {
    event.preventDefault();

    try {
      const response = await api.post("/groups", groupForm);
      setGroups((current) => [response.data, ...current]);
      setMyGroupIds((current) => [...new Set([...current, response.data.id])]);
      setMemberCountsByGroup((current) => ({ ...current, [response.data.id]: 1 }));
      setGroupForm(newGroupInitialState);
      setFeedback("Группа создана. Вы автоматически стали участником.");
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  const joinGroup = async (groupId) => {
    try {
      await api.post(`/groups/${groupId}/join`);
      setMyGroupIds((current) => [...new Set([...current, groupId])]);
      const response = await api.get(`/groups/${groupId}/members`);
      setMembersByGroup((current) => ({ ...current, [groupId]: response.data }));
      setMemberCountsByGroup((current) => ({ ...current, [groupId]: response.data.length }));
      setFeedback("Вы в группе. Состав участников обновлён.");
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  const leaveGroup = async (groupId) => {
    try {
      await api.delete(`/groups/${groupId}/leave`);
      setMyGroupIds((current) => current.filter((id) => id !== groupId));
      setMembersByGroup((current) => {
        if (!current[groupId]) {
          return current;
        }

        return {
          ...current,
          [groupId]: current[groupId].filter((member) => member.id !== user.id)
        };
      });
      setMemberCountsByGroup((current) => ({
        ...current,
        [groupId]: Math.max((current[groupId] ?? 1) - 1, 0)
      }));
      setFeedback("Вы вышли из группы.");
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
      <PageHeader title="Группы" />

      {feedback ? <div className="feedback feedback-info">{feedback}</div> : null}

      <section>
        <form className="panel form-stack" onSubmit={createGroup}>
          <div className="section-title">
            <h3>Создать новую группу</h3>
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
          const includesMe = myGroupIds.includes(group.id);
          const isCreator = group.creatorId === user.id;

          return (
            <article key={group.id} className="panel person-card">
              <div className="person-card-top">
                <div>
                  <h3>{group.name}</h3>
                </div>
                <span className="day-pill">{memberCountsByGroup[group.id] ?? 0} участников</span>
              </div>

              <p>{group.description || "Описание пока не добавлено."}</p>

              <div className="card-actions">
                {includesMe ? (
                  <button
                    type="button"
                    className="button button-ghost"
                    onClick={() => leaveGroup(group.id)}
                    disabled={isCreator}
                  >
                    {isCreator ? "Вы создатель" : "Выйти"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={() => joinGroup(group.id)}
                  >
                    Вступить
                  </button>
                )}
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => toggleGroupSubscription(group.id)}
                >
                  {subscription ? "Отключить подписку" : "Подписаться"}
                </button>
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => toggleMembers(group.id)}
                >
                  {members ? "Скрыть участников" : "Показать участников"}
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
