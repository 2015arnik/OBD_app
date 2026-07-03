import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL, api, extractApiError } from "../lib/api";
import { formatBirthday, formatDaysUntilBirthday } from "../lib/format";

function matchesQuery(person, query) {
  const haystack = `${person.name} ${person.birthDate}`.toLowerCase();
  return haystack.includes(query);
}

export default function PeoplePage() {
  const { user } = useAuth();
  const [people, setPeople] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busyUserId, setBusyUserId] = useState(null);

  useEffect(() => {
    const loadPeople = async () => {
      try {
        const [usersResponse, subscriptionsResponse] = await Promise.all([
          api.get("/users"),
          api.get("/subscriptions")
        ]);
        setPeople(usersResponse.data);
        setSubscriptions(subscriptionsResponse.data);
      } catch (requestError) {
        setError(extractApiError(requestError));
      } finally {
        setLoading(false);
      }
    };

    loadPeople();
  }, []);

  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const userSubscriptions = useMemo(
    () =>
      subscriptions.filter(
        (item) => item.targetType === "USER" && Number(item.targetId) !== Number(user.id)
      ),
    [subscriptions, user.id]
  );

  const friendSubscriptionByUserId = useMemo(
    () => Object.fromEntries(userSubscriptions.map((item) => [Number(item.targetId), item])),
    [userSubscriptions]
  );

  const peopleWithoutMe = useMemo(
    () => people.filter((person) => Number(person.id) !== Number(user.id)),
    [people, user.id]
  );

  const friends = useMemo(
    () => peopleWithoutMe.filter((person) => friendSubscriptionByUserId[person.id]),
    [friendSubscriptionByUserId, peopleWithoutMe]
  );

  const filteredFriends = useMemo(() => {
    if (!deferredQuery) {
      return friends;
    }

    return friends.filter((person) => matchesQuery(person, deferredQuery));
  }, [deferredQuery, friends]);

  const searchablePeople = useMemo(() => {
    const candidates = peopleWithoutMe.filter((person) => !friendSubscriptionByUserId[person.id]);

    if (!deferredQuery) {
      return candidates;
    }

    return candidates.filter((person) => matchesQuery(person, deferredQuery));
  }, [deferredQuery, friendSubscriptionByUserId, peopleWithoutMe]);

  const addFriend = async (person) => {
    setBusyUserId(person.id);
    setFeedback("");

    try {
      const response = await api.post("/subscriptions", {
        targetType: "USER",
        targetId: Number(person.id)
      });
      setSubscriptions((current) => {
        const next = current.filter(
          (item) =>
            !(item.targetType === "USER" && Number(item.targetId) === Number(person.id))
        );
        return [...next, response.data];
      });
      setFeedback(`Пользователь ${person.name} добавлен в друзья.`);
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    } finally {
      setBusyUserId(null);
    }
  };

  const removeFriend = async (person) => {
    const subscription = friendSubscriptionByUserId[person.id];

    if (!subscription) {
      return;
    }

    setBusyUserId(person.id);
    setFeedback("");

    try {
      await api.delete(`/subscriptions/${subscription.id}`);
      setSubscriptions((current) => current.filter((item) => item.id !== subscription.id));
      setFeedback(`Пользователь ${person.name} убран из друзей.`);
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        className="people-page-header"
        title="Друзья"
        actions={
          <div className="page-actions-stack">
            <label className="search-box">
              <span>Поиск</span>
              <input
                placeholder="Найти пользователя"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <a
              className="button button-ghost"
              href={`${API_BASE_URL}/calendar/birthdays.ics`}
              target="_blank"
              rel="noreferrer"
            >
              <span className="button-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path
                    d="M7 2.75a.75.75 0 0 1 .75.75V5h8.5V3.5a.75.75 0 0 1 1.5 0V5H19a2.25 2.25 0 0 1 2.25 2.25v10.5A2.25 2.25 0 0 1 19 20H5a2.25 2.25 0 0 1-2.25-2.25V7.25A2.25 2.25 0 0 1 5 5h1.25V3.5A.75.75 0 0 1 7 2.75ZM4.25 9.5v8.25c0 .41.34.75.75.75h14c.41 0 .75-.34.75-.75V9.5h-15.5Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              Экспорт всех ДР
            </a>
          </div>
        }
      />

      {loading ? <div className="panel">Загружаем людей...</div> : null}
      {error ? <div className="feedback feedback-error">{error}</div> : null}
      {feedback ? <div className="feedback feedback-info">{feedback}</div> : null}

      <section className="panel section-stack">
        <div className="section-title">
          <h3>Мои друзья</h3>
          <span className="day-pill">{filteredFriends.length}</span>
        </div>

        {filteredFriends.length > 0 ? (
          <div className="cards-grid">
            {filteredFriends.map((person) => (
              <article key={person.id} className="person-card person-card-soft">
                <div className="person-card-top">
                  <div>
                    <p className="eyebrow">Уже в друзьях</p>
                    <h3>{person.name}</h3>
                  </div>
                  <span className="day-pill">
                    {formatDaysUntilBirthday(person.daysUntilBirthday)}
                  </span>
                </div>

                <dl className="facts-grid">
                  <div>
                    <dt>Дата рождения</dt>
                    <dd>{formatBirthday(person.birthDate)}</dd>
                  </div>
                  <div>
                    <dt>Карточка</dt>
                    <dd>Друг #{people.findIndex((item) => item.id === person.id) + 1}</dd>
                  </div>
                </dl>

                <div className="card-actions">
                  <Link className="button button-primary" to={`/friends/${person.id}`}>
                    Открыть карточку
                  </Link>
                  <button
                    type="button"
                    className="button button-danger"
                    disabled={busyUserId === person.id}
                    onClick={() => removeFriend(person)}
                  >
                    Удалить из друзей
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <section className="panel section-stack">
        {searchablePeople.length > 0 ? (
          <div className="cards-grid">
            {searchablePeople.map((person) => (
              <article key={person.id} className="person-card person-card-soft">
                <div className="person-card-top">
                  <div>
                    <h3>{person.name}</h3>
                  </div>
                  <span className="day-pill">
                    {formatDaysUntilBirthday(person.daysUntilBirthday)}
                  </span>
                </div>

                <dl className="facts-grid">
                  <div>
                    <dt>Дата рождения</dt>
                    <dd>{formatBirthday(person.birthDate)}</dd>
                  </div>
                </dl>

                <div className="card-actions">
                  <button
                    type="button"
                    className="button button-primary"
                    disabled={busyUserId === person.id}
                    onClick={() => addFriend(person)}
                  >
                    Добавить в друзья
                  </button>
                  <Link className="button button-ghost" to={`/friends/${person.id}`}>
                    Открыть карточку
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
