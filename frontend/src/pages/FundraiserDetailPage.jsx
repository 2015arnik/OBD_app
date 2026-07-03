import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { api, extractApiError } from "../lib/api";
import { formatDateTime, formatIsoDate, formatMoney } from "../lib/format";

function getLatestContribution(items) {
  if (!items.length) {
    return null;
  }

  return [...items].sort((left, right) => {
    const leftTime = left.createdAt ? Date.parse(left.createdAt) : 0;
    const rightTime = right.createdAt ? Date.parse(right.createdAt) : 0;

    if (leftTime !== rightTime) {
      return rightTime - leftTime;
    }

    return (right.id || 0) - (left.id || 0);
  })[0];
}

function getLatestContributionByUser(items, userId) {
  return getLatestContribution(
    items.filter((item) => Number(item.contributorId) === Number(userId))
  );
}

export default function FundraiserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fundraiser, setFundraiser] = useState(null);
  const [users, setUsers] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [lastMockPayment, setLastMockPayment] = useState(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [fundraiserResponse, contributionsResponse, usersResponse] = await Promise.all([
          api.get(`/fundraisers/${id}`),
          api.get(`/fundraisers/${id}/contributions`),
          api.get("/users")
        ]);
        setFundraiser(fundraiserResponse.data);
        setContributions(contributionsResponse.data);
        setLastMockPayment(getLatestContribution(contributionsResponse.data));
        setUsers(usersResponse.data);
      } catch (requestError) {
        setFeedback(extractApiError(requestError));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const usersById = useMemo(
    () => Object.fromEntries(users.map((item) => [item.id, item])),
    [users]
  );

  const contribute = async () => {
    try {
      const response = await api.post(`/fundraisers/${id}/contribute`, {
        amount: Number(amount)
      });
      setFundraiser(response.data);
      const contributionsResponse = await api.get(`/fundraisers/${id}/contributions`);
      setContributions(contributionsResponse.data);
      setLastMockPayment(
        getLatestContributionByUser(contributionsResponse.data, user.id) ||
          getLatestContribution(contributionsResponse.data)
      );
      setAmount("");
      setFeedback("Платёж через мок-банк проведён.");
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  const deleteFundraiserAsAdmin = async () => {
    if (!window.confirm("Удалить сбор как администратор?")) {
      return;
    }

    try {
      await api.delete(`/admin/fundraisers/${id}`);
      navigate("/fundraisers");
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  const progress = useMemo(() => {
    if (!fundraiser?.goalAmount) {
      return 0;
    }

    return Math.min(
      100,
      Math.round((fundraiser.collectedAmount / fundraiser.goalAmount) * 100)
    );
  }, [fundraiser]);

  const targetUser = fundraiser ? usersById[fundraiser.targetUserId] : null;
  const isOpen = fundraiser?.status === "OPEN";
  const lastPaymentAuthor = lastMockPayment
    ? usersById[lastMockPayment.contributorId]?.name || `Пользователь #${lastMockPayment.contributorId}`
    : null;
  const isOwnLastPayment = lastMockPayment?.contributorId === user.id;

  return (
    <div className="page-stack">
      <PageHeader
        title={loading ? "Сбор" : fundraiser?.title || "Детали сбора"}
        description="Подробная страница конкретного сбора: статус, цель, взносы и возможность поучаствовать."
        actions={
          <div className="cluster">
            <Link className="button button-ghost" to="/fundraisers">
              Ко всем сборам
            </Link>
            {targetUser ? (
              <Link className="button button-ghost" to={`/friends/${targetUser.id}`}>
                К карточке друга
              </Link>
            ) : null}
            {user.admin ? (
              <>
                <Link className="button button-ghost" to={`/admin?tab=fundraisers&focus=${id}`}>
                  В админке
                </Link>
                <button type="button" className="button button-danger" onClick={deleteFundraiserAsAdmin}>
                  Удалить сбор
                </button>
              </>
            ) : null}
          </div>
        }
      />

      {feedback ? <div className="feedback feedback-info">{feedback}</div> : null}

      {loading ? <div className="panel">Загружаем детали сбора...</div> : null}

      {!loading && !fundraiser ? (
        <EmptyState
          title="Сбор не найден"
          description="Проверьте ссылку или вернитесь к общему списку сборов."
        />
      ) : null}

      {fundraiser ? (
        <>
          <section className="hero-card">
            <div>
              <p className="eyebrow">{isOpen ? "Открытый сбор" : "Завершённый сбор"}</p>
              <h3>{fundraiser.title || `Сбор для ${targetUser?.name || "пользователя"}`}</h3>
              <p className="hero-copy">
                Для: {targetUser?.name || `#${fundraiser.targetUserId}`}. Дедлайн: {formatIsoDate(fundraiser.deadline)}.
              </p>
            </div>
            <div className="hero-stats">
              <div className="stat-card">
                <span>Собрано</span>
                <strong>{formatMoney(fundraiser.collectedAmount)}</strong>
              </div>
              <div className="stat-card">
                <span>Цель</span>
                <strong>{formatMoney(fundraiser.goalAmount)}</strong>
              </div>
            </div>
          </section>

          <section className="two-column-layout">
            <div className="column-stack">
              <article className="panel section-stack">
                <div className="section-title">
                  <div>
                    <h3>Прогресс сбора</h3>
                    <p className="microcopy">GET /fundraisers/{id}</p>
                  </div>
                  <span className="day-pill">{fundraiser.status}</span>
                </div>
                <div className="progress-stack">
                  <div className="progress-meta">
                    <strong>{formatMoney(fundraiser.collectedAmount)}</strong>
                    <span>из {formatMoney(fundraiser.goalAmount)}</span>
                  </div>
                  <div className="progress-bar progress-bar-large">
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="microcopy">{progress}% от цели уже собрано.</p>
                </div>
              </article>

              <article className="panel section-stack">
                <div className="section-title">
                  <div>
                    <h3>История взносов</h3>
                  </div>
                  <span className="day-pill">{contributions.length} взносов</span>
                </div>
                {contributions.length === 0 ? (
                  <EmptyState
                    title="Пока пусто"
                    description="Вы можете стать первым участником этого сбора."
                  />
                ) : (
                  <div className="member-list">
                    {contributions.map((item) => (
                      <div key={item.id} className="member-row">
                        <div>
                          <strong>
                            {Number(item.contributorId) === Number(user.id)
                              ? "Вы"
                              : usersById[item.contributorId]?.name || `Пользователь #${item.contributorId}`}
                          </strong>
                          <p>{formatDateTime(item.createdAt)} • {item.mockTxnId}</p>
                        </div>
                        <span className="day-pill">{formatMoney(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </div>

            <div className="column-stack">
              <article className="panel section-stack">
                <div className="section-title">
                  <div>
                    <h3>Участвовать в сборе</h3>
                  </div>
                </div>
                {isOpen ? (
                  <>
                    <label>
                      Сумма взноса
                      <input
                        type="number"
                        min="1"
                        placeholder="Например, 1000"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                      />
                    </label>
                    <button
                      type="button"
                      className="button button-primary"
                      disabled={!amount}
                      onClick={contribute}
                    >
                      Внести вклад
                    </button>
                    <p className="microcopy">
                      Взнос уходит на бэк, там проходит через <code>POST /mock-bank/charge</code>,
                      после чего <code>MOCK</code>-транзакция сохраняется в истории сбора.
                    </p>
                  </>
                ) : (
                  <EmptyState
                    title="Сбор закрыт"
                    description="Цель уже достигнута или сбор вручную завершён на бэке."
                  />
                )}
              </article>

              <article className="panel section-stack mock-bank-panel">
                <div className="section-title">
                  <div>
                    <h3>Мок-банк</h3>
                    <p className="microcopy">Текущий платёжный провайдер для сборов</p>
                  </div>
                  <span className="day-pill">SUCCESS</span>
                </div>

                <p className="microcopy">
                  Сейчас платежи не уходят во внешний сервис: бэк генерирует тестовую транзакцию и
                  привязывает её к взносу.
                </p>

                {lastMockPayment ? (
                  <div className="mock-bank-card">
                    <div className="mock-bank-row">
                      <strong>{isOwnLastPayment ? "Ваш последний платёж" : "Последний платёж в сборе"}</strong>
                      <span className="day-pill">{formatMoney(lastMockPayment.amount)}</span>
                    </div>
                    <div className="mock-bank-meta">
                      <span>
                        <strong>Статус:</strong> SUCCESS
                      </span>
                      <span>
                        <strong>Транзакция:</strong> {lastMockPayment.mockTxnId}
                      </span>
                      <span>
                        <strong>Плательщик:</strong> {lastPaymentAuthor}
                      </span>
                      <span>
                        <strong>Время:</strong> {formatDateTime(lastMockPayment.createdAt)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    title="Платежей пока нет"
                    description="После первого взноса здесь появится тестовая банковская транзакция."
                  />
                )}
              </article>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
