import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../components/EmptyState";
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
        title="Друзья"
        description="Ваш список друзей хранится через пользовательские подписки на бэкенде: сверху ваши люди, ниже поиск и добавление новых."
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
          <div>
            <h3>Мои друзья</h3>
            <p className="microcopy">
              Это пользователи, на которых вы подписались. Для текущего этапа проекта это и есть
              рабочая модель друзей.
            </p>
          </div>
          <span className="day-pill">{filteredFriends.length}</span>
        </div>

        {filteredFriends.length === 0 ? (
          <EmptyState
            title={friends.length === 0 ? "Друзей пока нет" : "По запросу ничего не найдено"}
            description={
              friends.length === 0
                ? "Добавьте первого человека из общего списка ниже, и он сразу появится в этом блоке."
                : "Попробуйте изменить строку поиска, чтобы снова увидеть друзей."
            }
          />
        ) : (
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
                    className="button button-ghost"
                    disabled={busyUserId === person.id}
                    onClick={() => removeFriend(person)}
                  >
                    Убрать из друзей
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel section-stack">
        <div className="section-title">
          <div>
            <h3>Найти друзей среди всех пользователей</h3>
            <p className="microcopy">
              Здесь остаются только те пользователи, которых ещё нет в вашем списке друзей.
            </p>
          </div>
          <span className="day-pill">{searchablePeople.length} кандидатов</span>
        </div>

        {searchablePeople.length === 0 ? (
          <EmptyState
            title="Свободных кандидатов не осталось"
            description={
              peopleWithoutMe.length === friends.length
                ? "Сейчас у вас в друзьях уже все пользователи системы."
                : "Поиск не нашёл новых людей. Попробуйте изменить запрос."
            }
          />
        ) : (
          <div className="cards-grid">
            {searchablePeople.map((person) => (
              <article key={person.id} className="person-card person-card-soft">
                <div className="person-card-top">
                  <div>
                    <p className="eyebrow">Пользователь системы</p>
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
                    <dt>Позиция в списке</dt>
                    <dd>#{people.findIndex((item) => item.id === person.id) + 1}</dd>
                  </div>
                </dl>

                <div className="card-actions">
                  <Link className="button button-primary" to={`/friends/${person.id}`}>
                    Открыть карточку
                  </Link>
                  <button
                    type="button"
                    className="button button-ghost"
                    disabled={busyUserId === person.id}
                    onClick={() => addFriend(person)}
                  >
                    Добавить в друзья
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
