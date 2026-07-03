import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { api, extractApiError } from "../lib/api";
import { formatIsoDate, formatMoney } from "../lib/format";

const createInitialState = {
  targetUserId: "",
  giftId: "",
  title: "",
  goalAmount: "",
  deadline: "",
  deadlineMode: "date",
  deadlineDays: ""
};

const contributeInitialState = {};

function formatGroupedNumber(value) {
  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return "";
  }

  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function buildDeadline(createForm) {
  if (createForm.deadlineMode === "days") {
    const days = Number(createForm.deadlineDays);
    if (!days) {
      return null;
    }

    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  return createForm.deadline || null;
}

function buildInitialCreateForm(prefill) {
  return {
    ...createInitialState,
    targetUserId: prefill?.targetUserId || "",
    giftId: prefill?.giftId || "",
    title: prefill?.giftTitle || "",
    goalAmount: prefill?.giftPrice ? formatGroupedNumber(String(prefill.giftPrice)) : ""
  };
}

export default function FundraisersPage() {
  const location = useLocation();
  const { user } = useAuth();
  const [fundraisers, setFundraisers] = useState([]);
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [giftsByUserId, setGiftsByUserId] = useState({});
  const [wishlistLoadingUserId, setWishlistLoadingUserId] = useState(null);
  const [contributions, setContributions] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [createForm, setCreateForm] = useState(() =>
    buildInitialCreateForm(location.state?.prefillFundraiser)
  );
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

  const visibleFundraisers = useMemo(() => fundraisers, [fundraisers]);

  const selectedFriendGifts = useMemo(
    () => giftsByUserId[createForm.targetUserId] || [],
    [createForm.targetUserId, giftsByUserId]
  );

  useEffect(() => {
    if (!createForm.targetUserId || giftsByUserId[createForm.targetUserId]) {
      return;
    }

    let ignore = false;
    setWishlistLoadingUserId(createForm.targetUserId);

    api
      .get(`/users/${createForm.targetUserId}/gifts`)
      .then((response) => {
        if (ignore) {
          return;
        }

        setGiftsByUserId((current) => ({
          ...current,
          [createForm.targetUserId]: response.data
        }));
      })
      .catch((requestError) => {
        if (!ignore) {
          setFeedback(extractApiError(requestError));
        }
      })
      .finally(() => {
        if (!ignore) {
          setWishlistLoadingUserId((current) =>
            current === createForm.targetUserId ? null : current
          );
        }
      });

    return () => {
      ignore = true;
    };
  }, [createForm.targetUserId, giftsByUserId]);

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
        giftId: createForm.giftId ? Number(createForm.giftId) : null,
        title: createForm.title || null,
        goalAmount: Number(createForm.goalAmount.replace(/\s+/g, "")),
        deadline: buildDeadline(createForm)
      });
      setFundraisers((current) => [response.data, ...current]);
      setCreateForm(createInitialState);
      setFeedback("Сбор создан.");
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  const contribute = async (fundraiserId, amountOverride = null) => {
    try {
      const amount = amountOverride ?? Number(contributeForm[fundraiserId]);
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

  const remainingAmountFor = (fundraiser) =>
    Math.max((fundraiser.goalAmount || 0) - (fundraiser.collectedAmount || 0), 0);

  return (
    <div className="page-stack">
      <PageHeader
        title="Сборы"
        description="В этом разделе можно открыть новый сбор, посмотреть прогресс и внести вклад через мок-банк."
      />

      {feedback ? <div className="feedback feedback-info">{feedback}</div> : null}

      <section>
        <form className="panel form-stack" onSubmit={createFundraiser}>
          <div className="section-title">
            <div>
              <h3>Открыть новый сбор</h3>
            </div>
          </div>

          <label>
            Для кого сбор
            <select
              required
              value={createForm.targetUserId}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  targetUserId: event.target.value,
                  giftId: "",
                  title: "",
                  goalAmount: ""
                }))
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

          {createForm.targetUserId ? (
            <label>
              Подарок из вишлиста
              <select
                value={createForm.giftId}
                onChange={(event) => {
                  const selectedGift = selectedFriendGifts.find(
                    (gift) => String(gift.id) === event.target.value
                  );

                  setCreateForm((current) => ({
                    ...current,
                    giftId: event.target.value,
                    title: selectedGift?.title || "",
                    goalAmount: selectedGift?.price
                      ? formatGroupedNumber(String(selectedGift.price))
                      : ""
                  }));
                }}
                disabled={wishlistLoadingUserId === createForm.targetUserId}
              >
                <option value="">
                  {wishlistLoadingUserId === createForm.targetUserId
                    ? "Загружаем вишлист..."
                    : "Выберите подарок"}
                </option>
                {selectedFriendGifts.map((gift) => (
                  <option key={gift.id} value={gift.id}>
                    {gift.title}
                    {gift.price ? ` • ${formatMoney(gift.price)}` : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

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

          {createForm.targetUserId && !wishlistLoadingUserId && selectedFriendGifts.length === 0 ? (
            <p className="microcopy">У этого друга пока нет подарков в вишлисте.</p>
          ) : null}

          <label>
            Цель, ₽
            <input
              required
              type="text"
              inputMode="numeric"
              placeholder="Например, 10 000"
              value={createForm.goalAmount}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  goalAmount: formatGroupedNumber(event.target.value)
                }))
              }
            />
          </label>

          <div className="form-stack">
            <label>Дедлайн</label>
            <div className="cluster">
              <button
                type="button"
                className={
                  createForm.deadlineMode === "date"
                    ? "button button-primary"
                    : "button button-ghost"
                }
                onClick={() =>
                  setCreateForm((current) => ({
                    ...current,
                    deadlineMode: "date",
                    deadlineDays: ""
                  }))
                }
              >
                Дата
              </button>
              <button
                type="button"
                className={
                  createForm.deadlineMode === "days"
                    ? "button button-primary"
                    : "button button-ghost"
                }
                onClick={() =>
                  setCreateForm((current) => ({
                    ...current,
                    deadlineMode: "days",
                    deadline: ""
                  }))
                }
              >
                Количество дней
              </button>
            </div>

            {createForm.deadlineMode === "date" ? (
              <input
                type="date"
                value={createForm.deadline}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, deadline: event.target.value }))
                }
              />
            ) : (
              <input
                type="number"
                min="1"
                inputMode="numeric"
                placeholder="Например, 14"
                value={createForm.deadlineDays}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    deadlineDays: event.target.value.replace(/\D/g, "")
                  }))
                }
              />
            )}
          </div>

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
      </section>

      <section className="panel section-stack">
        <div className="section-title">
          <div>
            <h3>Активные и завершённые сборы</h3>
          </div>
          <span className="day-pill">{visibleFundraisers.length} сборов</span>
        </div>

        {loading ? <p className="microcopy">Загружаем сборы...</p> : null}

        <div className="cards-grid">
          {visibleFundraisers.map((fundraiser) => {
            const targetUser = usersById[fundraiser.targetUserId];
            const progress = progressFor(fundraiser);
            const isOpen = fundraiser.status === "OPEN";
            const remainingAmount = remainingAmountFor(fundraiser);

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
                      <button
                        type="button"
                        className="button button-ghost"
                        disabled={remainingAmount <= 0}
                        onClick={() => contribute(fundraiser.id, remainingAmount)}
                      >
                        Полностью закрыть сбор
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
                    {contributions[fundraiser.id].length > 0 ? (
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
                    ) : null}
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
