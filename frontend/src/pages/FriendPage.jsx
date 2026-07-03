import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { api, extractApiError, getWebSocketUrl } from "../lib/api";
import {
  formatBirthday,
  formatDateTime,
  formatDaysUntilBirthday,
  formatFullDate,
  formatMoney
} from "../lib/format";

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
  const [feedback, setFeedback] = useState("");
  const socketRef = useRef(null);

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

  const handleIncomingMessage = useEffectEvent((event) => {
    const nextMessage = JSON.parse(event.data);
    setMessages((current) => {
      if (current.some((item) => item.id === nextMessage.id)) {
        return current;
      }

      return [...current, nextMessage];
    });
  });

  useEffect(() => {
    if (isOwnCard || !token) {
      return undefined;
    }

    const socket = new WebSocket(getWebSocketUrl(id, token));
    socketRef.current = socket;
    setChatState("connecting");
    setChatError("");

    socket.onopen = () => setChatState("open");
    socket.onmessage = handleIncomingMessage;
    socket.onerror = () => setChatError("Не удалось подключиться к WebSocket-чату.");
    socket.onclose = (event) => {
      setChatState("closed");
      if (event.reason) {
        setChatError(event.reason);
      }
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [handleIncomingMessage, id, isOwnCard, token]);

  const toggleUserSubscription = async () => {
    try {
      if (userSubscription) {
        await api.delete(`/subscriptions/${userSubscription.id}`);
        setSubscriptions((current) =>
          current.filter((item) => item.id !== userSubscription.id)
        );
        setFeedback("Подписка на друга снята.");
      } else {
        const response = await api.post("/subscriptions", {
          targetType: "USER",
          targetId: Number(id)
        });
        setSubscriptions((current) => [...current, response.data]);
        setFeedback("Подписка на друга включена.");
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

  return (
    <div className="page-stack">
      <PageHeader
        title={loading ? "Карточка" : card?.name || "Карточка друга"}
        description="Профиль друга, список подарков, группы и приватный чат обсуждения подарка."
        actions={
          <div className="cluster">
            <Link className="button button-ghost" to="/people">
              Ко всем людям
            </Link>
            {isOwnCard ? (
              <Link className="button button-primary" to="/wishlist">
                Открыть мой вишлист
              </Link>
            ) : (
              <button type="button" className="button button-primary" onClick={toggleUserSubscription}>
                {userSubscription ? "Выключить подписку" : "Подписаться"}
              </button>
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
                <span>Групп</span>
                <strong>{card.groups.length}</strong>
              </div>
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
                  <span className="day-pill">{formatFullDate(card.birthDate)}</span>
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
                  <p className="microcopy">
                    {isOwnCard
                      ? "Для именинника чат по правилам проекта скрыт."
                      : "История хранится на сервере, новые сообщения приходят через WebSocket."}
                  </p>
                </div>
                {!isOwnCard ? (
                  <span className={`socket-pill socket-${chatState}`}>{chatState}</span>
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
                      disabled={!chatText.trim()}
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
