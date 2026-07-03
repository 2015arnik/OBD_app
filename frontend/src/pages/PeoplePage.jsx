import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { api, extractApiError } from "../lib/api";
import { formatBirthday, formatDaysUntilBirthday } from "../lib/format";

export default function PeoplePage() {
  const { user } = useAuth();
  const [people, setPeople] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stubMessage, setStubMessage] = useState("");

  useEffect(() => {
    const loadPeople = async () => {
      try {
        const response = await api.get("/users");
        setPeople(response.data);
      } catch (requestError) {
        setError(extractApiError(requestError));
      } finally {
        setLoading(false);
      }
    };

    loadPeople();
  }, []);

  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const filteredPeople = useMemo(() => {
    if (!deferredQuery) {
      return people;
    }

    return people.filter((person) => {
      const haystack = `${person.name} ${person.birthDate}`.toLowerCase();
      return haystack.includes(deferredQuery);
    });
  }, [deferredQuery, people]);

  const searchablePeople = filteredPeople.filter((person) => person.id !== user.id);

  const showFriendStub = (personName) => {
    setStubMessage(
      `Добавление ${personName} в друзья появится после того, как на бэкенде появится API для друзей.`
    );
  };

  return (
    <div className="page-stack">
      <PageHeader
        title="Друзья"
        description="Сначала здесь будут ваши друзья, а ниже можно найти новых людей среди всех пользователей системы и отправить запрос на добавление."
        actions={
          <label className="search-box">
            <span>Поиск</span>
            <input
              placeholder="Найти пользователя"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        }
      />

      {loading ? <div className="panel">Загружаем людей...</div> : null}
      {error ? <div className="feedback feedback-error">{error}</div> : null}
      {stubMessage ? <div className="feedback feedback-info">{stubMessage}</div> : null}

      {!loading && !error && searchablePeople.length === 0 ? (
        <EmptyState
          title="Ничего не найдено"
          description="Попробуйте убрать часть запроса или проверить, что в базе уже есть пользователи."
        />
      ) : null}

      <section className="panel section-stack">
        <div className="section-title">
          <div>
            <h3>Мои друзья</h3>
            <p className="microcopy">
              Этот раздел станет рабочим, когда на бэкенде появится отдельная сущность или API
              дружбы.
            </p>
          </div>
          <span className="day-pill">Скоро</span>
        </div>

        <EmptyState
          title="Список друзей ещё не подключён"
          description="Пока здесь заглушка. Позже в этом блоке будут показываться только ваши добавленные друзья."
        />
      </section>

      <section className="panel section-stack">
        <div className="section-title">
          <div>
            <h3>Найти друзей среди всех пользователей</h3>
            <p className="microcopy">
              Сейчас можно открыть карточку любого пользователя и подготовить UI под добавление в друзья.
            </p>
          </div>
          <span className="day-pill">{searchablePeople.length} кандидатов</span>
        </div>

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
                  onClick={() => showFriendStub(person.name)}
                >
                  Добавить в друзья
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
