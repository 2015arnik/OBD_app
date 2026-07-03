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

  return (
    <div className="page-stack">
      <PageHeader
        title="Люди"
        description="Список всех пользователей с ближайшими днями рождения. Отсюда удобно перейти в карточку друга, посмотреть вишлист и открыть обсуждение подарка."
        actions={
          <label className="search-box">
            <span>Поиск</span>
            <input
              placeholder="Имя или дата"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        }
      />

      {loading ? <div className="panel">Загружаем людей...</div> : null}
      {error ? <div className="feedback feedback-error">{error}</div> : null}

      {!loading && !error && filteredPeople.length === 0 ? (
        <EmptyState
          title="Ничего не найдено"
          description="Попробуйте убрать часть запроса или проверить, что в базе уже есть пользователи."
        />
      ) : null}

      <div className="cards-grid">
        {filteredPeople.map((person) => (
          <article key={person.id} className="panel person-card">
            <div className="person-card-top">
              <div>
                <p className="eyebrow">
                  {person.id === user.id ? "Ваш профиль" : "Карточка друга"}
                </p>
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
              {person.id === user.id ? (
                <Link className="button button-ghost" to="/wishlist">
                  Редактировать подарки
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
