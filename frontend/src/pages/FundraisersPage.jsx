import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { api, extractApiError } from "../lib/api";
import { formatIsoDate, formatMoney } from "../lib/format";

const createInitialState = {
  targetUserId: "",
  title: "",
  goalAmount: "",
  deadline: ""
};

const contributeInitialState = {};

export default function FundraisersPage() {
  const { user } = useAuth();
  const [fundraisers, setFundraisers] = useState([]);
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [contributions, setContributions] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [createForm, setCreateForm] = useState(createInitialState);
  const [contributeForm, setContributeForm] = useState(contributeInitialState);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [fundraisersResponse, usersResponse, subscriptionsResponse] = await Promise.all([
          api.get("/fundraisers"),
          api.get("/users"),
          api.get("/subscriptions")
        ]);
        setFundraisers(fundraisersResponse.data);
        setUsers(usersResponse.data);
        setSubscriptions(subscriptionsResponse.data);
      } catch (requestError) {
        setFeedback(extractApiError(requestError));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const usersById = useMemo(
    () => Object.fromEntries(users.map((item) => [item.id, item])),
    [users]
  );

  const friendIds = useMemo(
    () =>
      new Set(
        subscriptions
          .filter((item) => item.targetType === "USER")
          .map((item) => Number(item.targetId))
      ),
    [subscriptions]
  );

  const friendUsers = useMemo(
    () => users.filter((item) => friendIds.has(Number(item.id))),
    [friendIds, users]
  );

  const visibleFundraisers = useMemo(
    () => fundraisers.filter((item) => friendIds.has(Number(item.targetUserId))),
    [friendIds, fundraisers]
  );

  const loadContributions = async (fundraiserId) => {
    if (contributions[fundraiserId]) {
      setExpandedId((current) => (current === fundraiserId ? null : fundraiserId));
      return;
    }

    try {
      const response = await api.get(`/fundraisers/${fundraiserId}/contributions`);
      setContributions((current) => ({ ...current, [fundraiserId]: response.data }));
      setExpandedId(fundraiserId);
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  const createFundraiser = async (event) => {
    event.preventDefault();

    try {
      const response = await api.post("/fundraisers", {
        targetUserId: Number(createForm.targetUserId),
        title: createForm.title || null,
        goalAmount: Number(createForm.goalAmount),
        deadline: createForm.deadline || null
      });
      setFundraisers((current) => [response.data, ...current]);
      setCreateForm(createInitialState);
      setFeedback("Сбор создан.");
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  const contribute = async (fundraiserId) => {
    try {
      const amount = Number(contributeForm[fundraiserId]);
      const response = await api.post(`/fundraisers/${fundraiserId}/contribute`, { amount });
      setFundraisers((current) =>
        current.map((item) => (item.id === fundraiserId ? response.data : item))
      );
      setContributeForm((current) => ({ ...current, [fundraiserId]: "" }));
      setContributions((current) => ({
        ...current,
        [fundraiserId]: undefined
      }));
      setExpandedId(null);
      setFeedback("Взнос проведён через мок-банк.");
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  const progressFor = (fundraiser) => {
    if (!fundraiser.goalAmount || fundraiser.goalAmount <= 0) {
      return 0;
    }

    return Math.min(100, Math.round((fundraiser.collectedAmount / fundraiser.goalAmount) * 100));
  };

  return (
    <div className="page-stack">
      <PageHeader
        title="Сборы"
        description="В этом разделе показываются только сборы ваших друзей: можно открыть новый сбор, посмотреть прогресс и внести вклад через мок-банк."
      />

      {feedback ? <div className="feedback feedback-info">{feedback}</div> : null}

      <section className="two-column-layout">
        <form className="panel form-stack" onSubmit={createFundraiser}>
          <div className="section-title">
            <div>
              <h3>Открыть новый сбор</h3>
              <p className="microcopy">POST /fundraisers</p>
            </div>
          </div>

          <label>
            Для кого сбор
            <select
              required
              value={createForm.targetUserId}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, targetUserId: event.target.value }))
              }
              disabled={friendUsers.length === 0}
            >
              <option value="">{friendUsers.length === 0 ? "Сначала добавьте друзей" : "Выберите друга"}</option>
              {friendUsers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Название
            <input
              placeholder="Например, Сбор на подарок для Бориса"
              value={createForm.title}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, title: event.target.value }))
              }
            />
          </label>

          <label>
            Цель, ₽
            <input
              required
              type="number"
              min="1"
              value={createForm.goalAmount}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, goalAmount: event.target.value }))
              }
            />
          </label>

          <label>
            Дедлайн
            <input
              type="date"
              value={createForm.deadline}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, deadline: event.target.value }))
              }
            />
          </label>

          <button type="submit" className="button button-primary">
            Создать сбор
          </button>

          {friendUsers.length === 0 ? (
            <p className="microcopy">
              Пока у вас нет друзей в системе, поэтому открыть сбор пока не для кого.
            </p>
          ) : (
            <p className="microcopy">
              Создавать новые сборы можно только для пользователей из вашего списка друзей.
            </p>
          )}
        </form>

        <div className="panel spotlight-card">
          <p className="eyebrow">Кому видны сборы</p>
          <h3>Сейчас здесь только друзья из вашего списка.</h3>
          <p>
            Если пользователь ещё не добавлен в друзья, его сбор не показывается в этой ленте и
            не попадает в форму создания.
          </p>
        </div>
      </section>

      <section className="panel section-stack">
        <div className="section-title">
          <div>
            <h3>Активные и завершённые сборы</h3>
            <p className="microcopy">GET /fundraisers и GET /subscriptions с фильтрацией по друзьям</p>
          </div>
          <span className="day-pill">{visibleFundraisers.length} сборов</span>
        </div>

        {loading ? <p className="microcopy">Загружаем сборы...</p> : null}

        {!loading && visibleFundraisers.length === 0 ? (
          <EmptyState
            title="Для друзей пока нет сборов"
            description="Добавьте друзей или откройте первый сбор для одного из них вручную."
          />
        ) : null}

        <div className="cards-grid">
          {visibleFundraisers.map((fundraiser) => {
            const targetUser = usersById[fundraiser.targetUserId];
            const progress = progressFor(fundraiser);
            const isOpen = fundraiser.status === "OPEN";

            return (
              <article key={fundraiser.id} className="person-card person-card-soft">
                <div className="person-card-top">
                  <div>
                    <p className="eyebrow">{isOpen ? "Открытый сбор" : "Сбор закрыт"}</p>
                    <h3>{fundraiser.title || `Сбор для ${targetUser?.name || "пользователя"}`}</h3>
                  </div>
                  <span className="day-pill">{fundraiser.status}</span>
                </div>

                <dl className="facts-grid">
                  <div>
                    <dt>Для кого</dt>
                    <dd>{targetUser?.name || `#${fundraiser.targetUserId}`}</dd>
                  </div>
                  <div>
                    <dt>Дедлайн</dt>
                    <dd>{formatIsoDate(fundraiser.deadline)}</dd>
                  </div>
                </dl>

                <div className="progress-stack">
                  <div className="progress-meta">
                    <strong>{formatMoney(fundraiser.collectedAmount)}</strong>
                    <span>из {formatMoney(fundraiser.goalAmount)}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="card-actions">
                  {isOpen ? (
                    <>
                      <input
                        type="number"
                        min="1"
                        placeholder="Сумма взноса"
                        value={contributeForm[fundraiser.id] || ""}
                        onChange={(event) =>
                          setContributeForm((current) => ({
                            ...current,
                            [fundraiser.id]: event.target.value
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="button button-primary"
                        disabled={!contributeForm[fundraiser.id]}
                        onClick={() => contribute(fundraiser.id)}
                      >
                        Внести вклад
                      </button>
                    </>
                  ) : null}
                  <button
                    type="button"
                    className="button button-ghost"
                    onClick={() => loadContributions(fundraiser.id)}
                  >
                    {expandedId === fundraiser.id ? "Скрыть взносы" : "Показать взносы"}
                  </button>
                  <Link className="button button-ghost" to={`/fundraisers/${fundraiser.id}`}>
                    Детали сбора
                  </Link>
                </div>

                {expandedId === fundraiser.id && contributions[fundraiser.id] ? (
                  <div className="member-list">
                    {contributions[fundraiser.id].length === 0 ? (
                      <EmptyState
                        title="Взносов пока нет"
                        description="Этот сбор уже открыт, но ещё никто не успел поучаствовать."
                      />
                    ) : (
                      contributions[fundraiser.id].map((item) => (
                        <div key={item.id} className="member-row">
                          <div>
                            <strong>
                              {Number(item.contributorId) === Number(user.id)
                                ? "Вы"
                                : usersById[item.contributorId]?.name || `Пользователь #${item.contributorId}`}
                            </strong>
                            <p>{item.mockTxnId || "MOCK-TXN"}</p>
                          </div>
                          <span className="day-pill">{formatMoney(item.amount)}</span>
                        </div>
                      ))
                    )}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
