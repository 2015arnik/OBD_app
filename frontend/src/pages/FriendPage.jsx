import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { AUTH_INVALID_EVENT, api, extractApiError, getWebSocketUrl } from "../lib/api";
import {
  formatAge,
  formatBirthday,
  formatDateTime,
  formatDaysUntilBirthday,
  formatIsoDate,
  formatMoney
} from "../lib/format";

const CHAT_STATUS_LABELS = {
  closed: "Отключён",
  connecting: "Подключаемся",
  open: "Подключён",
  reconnecting: "Переподключаемся"
};

function updateGiftStatusLocally(card, updatedGift) {
  if (!card) {
    return card;
  }

  return {
    ...card,
    gifts: card.gifts.map((gift) => (gift.id === updatedGift.id ? updatedGift : gift))
  };
}

export default function FriendPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [card, setCard] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [chatError, setChatError] = useState("");
  const [chatState, setChatState] = useState("closed");
  const [chatConnectionNonce, setChatConnectionNonce] = useState(0);
  const [feedback, setFeedback] = useState("");
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const isOwnCard = Number(id) === user.id;
  const userSubscription = subscriptions.find(
    (item) => item.targetType === "USER" && Number(item.targetId) === Number(id)
  );

  useEffect(() => {
    const loadCard = async () => {
      setLoading(true);
      setPageError("");

      try {
        const [cardResponse, subscriptionsResponse] = await Promise.all([
          api.get(`/users/${id}`),
          api.get("/subscriptions")
        ]);

        setCard(cardResponse.data);
        setSubscriptions(subscriptionsResponse.data);
      } catch (requestError) {
        setPageError(extractApiError(requestError));
      } finally {
        setLoading(false);
      }
    };

    loadCard();
  }, [id]);

  useEffect(() => {
    const loadHistory = async () => {
      if (isOwnCard) {
        setMessages([]);
        setChatLoading(false);
        return;
      }

      setChatLoading(true);

      try {
        const response = await api.get(`/users/${id}/chat`);
        setMessages(response.data);
      } catch (requestError) {
        setChatError(extractApiError(requestError));
      } finally {
        setChatLoading(false);
      }
    };

    loadHistory();
  }, [id, isOwnCard]);

  useEffect(() => {
    if (isOwnCard || !token) {
      return undefined;
    }

    const socket = new WebSocket(getWebSocketUrl(id, token));
    let ignoreSocketEvents = false;

    socketRef.current = socket;
    setChatState(chatConnectionNonce > 0 ? "reconnecting" : "connecting");
    if (chatConnectionNonce === 0) {
      setChatError("");
    }

    const scheduleReconnect = (message) => {
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }

      setChatState("reconnecting");
      setChatError(message);
      reconnectTimeoutRef.current = window.setTimeout(() => {
        reconnectTimeoutRef.current = null;
        setChatConnectionNonce((current) => current + 1);
      }, 2000);
    };

    socket.onopen = () => {
      if (ignoreSocketEvents || socketRef.current !== socket) {
        return;
      }

      setChatState("open");
      setChatError("");
    };
    socket.onmessage = (event) => {
      const nextMessage = JSON.parse(event.data);
      setMessages((current) => {
        if (current.some((item) => item.id === nextMessage.id)) {
          return current;
        }

        return [...current, nextMessage];
      });
    };
    socket.onerror = () => {
      if (ignoreSocketEvents || socketRef.current !== socket || socket.readyState === WebSocket.OPEN) {
        return;
      }

      setChatError("Не удалось подключиться к WebSocket-чату. Пробуем ещё раз...");
    };
    socket.onclose = (event) => {
      if (ignoreSocketEvents || socketRef.current !== socket) {
        return;
      }

      socketRef.current = null;
      if (event.reason === "User not found" || event.reason === "Invalid token") {
        setChatState("closed");
        setChatError("Сессия устарела после перезапуска сервера. Войдите заново.");
        window.dispatchEvent(new CustomEvent(AUTH_INVALID_EVENT));
      } else if (event.reason) {
        setChatState("closed");
        setChatError(event.reason);
      } else if (event.code !== 1000) {
        scheduleReconnect("Соединение с чатом потеряно. Пробуем переподключиться...");
      } else {
        setChatState("closed");
      }
    };

    return () => {
      ignoreSocketEvents = true;
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      socket.close();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [chatConnectionNonce, id, isOwnCard, token]);

  const retryChatConnection = () => {
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setChatError("");
    setChatConnectionNonce((current) => current + 1);
  };

  const toggleUserSubscription = async () => {
    try {
      if (userSubscription) {
        await api.delete(`/subscriptions/${userSubscription.id}`);
        setSubscriptions((current) =>
          current.filter((item) => item.id !== userSubscription.id)
        );
        setFeedback("Пользователь убран из друзей.");
      } else {
        const response = await api.post("/subscriptions", {
          targetType: "USER",
          targetId: Number(id)
        });
        setSubscriptions((current) => [...current, response.data]);
        setFeedback("Пользователь добавлен в друзья.");
      }
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  const changeGiftStatus = async (giftId, status) => {
    try {
      const response = await api.patch(`/gifts/${giftId}`, { status });
      setCard((current) => updateGiftStatusLocally(current, response.data));
      setFeedback("Статус подарка обновлён.");
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  const sendMessage = (event) => {
    event.preventDefault();

    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setChatError("Соединение с чатом ещё не готово.");
      return;
    }

    socketRef.current.send(JSON.stringify({ text: chatText }));
    setChatText("");
  };

  const openGoogleCalendar = async () => {
    try {
      const response = await api.get(`/users/${id}/calendar/google`);
      window.open(response.data.url, "_blank", "noopener,noreferrer");
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  const deleteUserAsAdmin = async () => {
    if (!window.confirm("Удалить этого пользователя как администратор?")) {
      return;
    }

    try {
      await api.delete(`/admin/users/${id}`);
      navigate("/people");
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  const deleteGiftAsAdmin = async (giftId) => {
    if (!window.confirm("Удалить подарок как администратор?")) {
      return;
    }

    try {
      await api.delete(`/admin/gifts/${giftId}`);
      setCard((current) =>
        current
          ? {
              ...current,
              gifts: current.gifts.filter((gift) => gift.id !== giftId)
            }
          : current
      );
      setFeedback("Подарок удалён администратором.");
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        title={loading ? "Карточка" : card?.name || "Карточка друга"}
        description="Профиль друга, список подарков, группы и приватный чат обсуждения подарка."
        actions={
          <div className="cluster">
            <Link className="button button-ghost" to="/people">
              Ко всем друзьям
            </Link>
            {isOwnCard ? (
              <Link className="button button-primary" to="/wishlist">
                Открыть мой вишлист
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  className={userSubscription ? "button button-danger" : "button button-primary"}
                  onClick={toggleUserSubscription}
                >
                  {userSubscription ? "Удалить из друзей" : "Добавить в друзья"}
                </button>
                {user.admin ? (
                  <>
                    <Link className="button button-ghost" to={`/admin?tab=users&focus=${id}`}>
                      В админке
                    </Link>
                    <button type="button" className="button button-danger" onClick={deleteUserAsAdmin}>
                      Удалить пользователя
                    </button>
                  </>
                ) : null}
              </>
            )}
          </div>
        }
      />

      {feedback ? <div className="feedback feedback-info">{feedback}</div> : null}
      {pageError ? <div className="feedback feedback-error">{pageError}</div> : null}

      {loading ? (
        <div className="panel">Собираем карточку пользователя...</div>
      ) : card ? (
        <>
          <section className="hero-card">
            <div>
              <p className="eyebrow">{isOwnCard ? "Ваш профиль" : "Карточка друга"}</p>
              <h3>{card.name}</h3>
              <p className="hero-copy">
                День рождения: {formatBirthday(card.birthDate)}. {formatDaysUntilBirthday(card.daysUntilBirthday)}.
              </p>
            </div>
            <div className="hero-stats">
              <div className="stat-card">
                <span>Подарков</span>
                <strong>{card.gifts.length}</strong>
              </div>
            </div>
          </section>

          <section className="two-column-layout">
            <div className="column-stack">
              <article className="panel">
                <div className="section-title">
                  <h3>О человеке</h3>
                </div>
                <div className="facts-grid">
                  <div>
                    <dt>Дата рождения</dt>
                    <dd>{card.birthDate ? new Date(card.birthDate).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    }) : "Дата не указана"}</dd>
                  </div>
                  <div>
                    <dt>До дня рождения</dt>
                    <dd>{formatDaysUntilBirthday(card.daysUntilBirthday)}</dd>
                  </div>
                  <div>
                    <dt>Возраст</dt>
                    <dd>{formatAge(card.birthDate)}</dd>
                  </div>
                </div>
                <div className="card-actions">
                  <a className="button button-ghost" href={`${api.defaults.baseURL}/users/${id}/calendar.ics`} target="_blank" rel="noreferrer">
                    Скачать .ics
                  </a>
                  <button type="button" className="button button-ghost" onClick={openGoogleCalendar}>
                    Google Calendar
                  </button>
                </div>
                <div className="group-list">
                  {card.groups.length > 0 ? (
                    card.groups.map((group) => (
                      <div key={group.id} className="group-row">
                        <div>
                          <strong>{group.name}</strong>
                          <p>{group.description || "Описание пока не добавлено."}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title="Пока без групп"
                      description="Пользователь ещё не вступил ни в одну группу."
                    />
                  )}
                </div>
              </article>

              <article className="panel">
                <div className="section-title">
                  <h3>Желаемые подарки</h3>
                  {!isOwnCard ? (
                    <span className="eyebrow">Можно резервировать прямо отсюда</span>
                  ) : null}
                </div>

                {card.gifts.length === 0 ? (
                  <EmptyState
                    title="Список подарков пуст"
                    description="Добавьте подарки в разделе «Мой вишлист», чтобы друзья увидели пожелания."
                  />
                ) : (
                  <div className="gift-list">
                    {card.gifts.map((gift) => (
                      <article key={gift.id} className="gift-card">
                        <div className="gift-card-top">
                          <div>
                            <h4>{gift.title}</h4>
                            <p>{gift.description || "Описание пока не добавлено."}</p>
                          </div>
                          <StatusBadge status={gift.status} />
                        </div>

                        <div className="gift-meta">
                          <span>{formatMoney(gift.price)}</span>
                          {gift.url ? (
                            <a href={gift.url} target="_blank" rel="noreferrer">
                              Ссылка на подарок
                            </a>
                          ) : (
                            <span>Ссылка не указана</span>
                          )}
                        </div>

                        {!isOwnCard ? (
                          <>
                            {gift.status === "WANTED" ? (
                              <div className="card-actions">
                                <Link
                                  className="button button-ghost"
                                  to="/fundraisers"
                                  state={{
                                    prefillFundraiser: {
                                      targetUserId: String(card.id),
                                      giftId: String(gift.id),
                                      giftTitle: gift.title || "",
                                      giftPrice: gift.price ?? ""
                                    }
                                  }}
                                >
                                  Организовать сбор
                                </Link>
                                {user.admin ? (
                                  <>
                                    <Link className="button button-ghost" to={`/admin?tab=gifts&focus=${gift.id}`}>
                                      В админке
                                    </Link>
                                    <button
                                      type="button"
                                      className="button button-danger"
                                      onClick={() => deleteGiftAsAdmin(gift.id)}
                                    >
                                      Удалить подарок
                                    </button>
                                  </>
                                ) : null}
                              </div>
                            ) : null}
                            {gift.status !== "WANTED" && user.admin ? (
                              <div className="card-actions">
                                <Link className="button button-ghost" to={`/admin?tab=gifts&focus=${gift.id}`}>
                                  В админке
                                </Link>
                                <button
                                  type="button"
                                  className="button button-danger"
                                  onClick={() => deleteGiftAsAdmin(gift.id)}
                                >
                                  Удалить подарок
                                </button>
                              </div>
                            ) : null}
                            <div className="status-actions">
                              {["WANTED", "RESERVED", "BOUGHT"].map((status) => (
                                <button
                                  key={status}
                                  type="button"
                                  className={
                                    gift.status === status
                                      ? "button button-primary"
                                      : "button button-ghost"
                                  }
                                  onClick={() => changeGiftStatus(gift.id, status)}
                                >
                                  {status === "WANTED"
                                    ? "Свободен"
                                    : status === "RESERVED"
                                      ? "Резерв"
                                      : "Куплен"}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : null}
                      </article>
                    ))}
                  </div>
                )}
              </article>
            </div>

            <article className="panel chat-panel">
              <div className="section-title">
                <div>
                  <h3>Чат обсуждения подарка</h3>
                  {isOwnCard ? (
                    <p className="microcopy">Для именинника чат по правилам проекта скрыт.</p>
                  ) : null}
                </div>
                {!isOwnCard ? (
                  <span className={`socket-pill socket-${chatState}`}>
                    {CHAT_STATUS_LABELS[chatState] ?? chatState}
                  </span>
                ) : null}
              </div>

              {isOwnCard ? (
                <EmptyState
                  title="Чат скрыт"
                  description="По ТЗ именинник не должен видеть обсуждение своего подарка, поэтому сервер вернёт 403 и интерфейс это уважает."
                />
              ) : (
                <>
                  {chatError ? <div className="feedback feedback-error">{chatError}</div> : null}
                  {chatState !== "open" ? (
                    <div className="card-actions">
                      <button type="button" className="button button-ghost" onClick={retryChatConnection}>
                        Повторить подключение
                      </button>
                    </div>
                  ) : null}

                  <div className="chat-feed">
                    {chatLoading ? (
                      <p className="microcopy">Загружаем историю чата...</p>
                    ) : messages.length === 0 ? (
                      <EmptyState
                        title="Сообщений пока нет"
                        description="Начните обсуждение, чтобы договориться о подарке и распределить роли."
                      />
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={
                            message.authorId === user.id
                              ? "chat-message chat-message-own"
                              : "chat-message"
                          }
                        >
                          <div className="chat-message-top">
                            <strong>{message.authorName}</strong>
                            <span>{formatDateTime(message.createdAt)}</span>
                          </div>
                          <p>{message.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <form className="chat-form" onSubmit={sendMessage}>
                    <textarea
                      rows="4"
                      placeholder="Напишите идею подарка, бюджет или план поздравления..."
                      value={chatText}
                      onChange={(event) => setChatText(event.target.value)}
                    />
                    <button
                      type="submit"
                      className="button button-primary"
                      disabled={!chatText.trim() || chatState !== "open"}
                    >
                      Отправить сообщение
                    </button>
                  </form>
                </>
              )}
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
}
