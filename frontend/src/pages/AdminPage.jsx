import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { api, extractApiError } from "../lib/api";
import { formatDateTime, formatIsoDate, formatMoney } from "../lib/format";

const importExample = [
  {
    name: "Новый пользователь",
    email: "new@obd.app",
    birthDate: "2000-08-15",
    password: "password"
  }
];

const tabs = [
  { id: "users", label: "Пользователи" },
  { id: "groups", label: "Группы" },
  { id: "fundraisers", label: "Сборы" },
  { id: "gifts", label: "Вишлисты" },
  { id: "chats", label: "Чаты" }
];

function filterBySearch(items, query, fields) {
  if (!query.trim()) {
    return items;
  }

  const normalizedQuery = query.trim().toLowerCase();
  return items.filter((item) =>
    fields.some((field) => String(field(item) || "").toLowerCase().includes(normalizedQuery))
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "users";
  const focusId = searchParams.get("focus") || "";

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [fundraisers, setFundraisers] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [search, setSearch] = useState("");
  const [importText, setImportText] = useState(JSON.stringify(importExample, null, 2));
  const [userDrafts, setUserDrafts] = useState({});
  const [groupDrafts, setGroupDrafts] = useState({});
  const [fundraiserDrafts, setFundraiserDrafts] = useState({});
  const [giftDrafts, setGiftDrafts] = useState({});
  const [messageDrafts, setMessageDrafts] = useState({});
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatAdminAvailable, setChatAdminAvailable] = useState(true);

  useEffect(() => {
    if (!user.admin) {
      setLoading(false);
      return;
    }

    const load = async () => {
      const [
        statsResult,
        usersResult,
        groupsResult,
        fundraisersResult,
        giftsResult,
        chatsResult
      ] = await Promise.allSettled([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/admin/groups"),
        api.get("/admin/fundraisers"),
        api.get("/admin/gifts"),
        api.get("/admin/chats")
      ]);

      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value.data);
      }
      if (usersResult.status === "fulfilled") {
        setUsers(usersResult.value.data);
      }
      if (groupsResult.status === "fulfilled") {
        setGroups(groupsResult.value.data);
      }
      if (fundraisersResult.status === "fulfilled") {
        setFundraisers(fundraisersResult.value.data);
      }
      if (giftsResult.status === "fulfilled") {
        setGifts(giftsResult.value.data);
      }
      if (chatsResult.status === "fulfilled") {
        setChatRooms(chatsResult.value.data);
        setChatAdminAvailable(true);
      } else {
        setChatRooms([]);
        setChatAdminAvailable(false);
      }

      const firstFailure = [statsResult, usersResult, groupsResult, fundraisersResult, giftsResult].find(
        (result) => result.status === "rejected"
      );

      if (firstFailure?.status === "rejected") {
        setFeedback(extractApiError(firstFailure.reason));
      } else if (chatsResult.status === "rejected") {
        setFeedback("Чат-модерация пока недоступна на этом бэкенде. Остальные разделы админки работают.");
      }

      setLoading(false);
    };

    load();
  }, [user.admin]);

  useEffect(() => {
    if (activeTab !== "chats") {
      return;
    }

    if (focusId) {
      setSelectedChatId(Number(focusId));
    }
  }, [activeTab, focusId]);

  useEffect(() => {
    if (activeTab !== "chats" || !selectedChatId) {
      return;
    }

    const loadMessages = async () => {
      setChatLoading(true);

      try {
        const response = await api.get(`/admin/chats/${selectedChatId}/messages`);
        setChatMessages(response.data);
      } catch (requestError) {
        setChatAdminAvailable(false);
        setChatMessages([]);
        setFeedback("Чат-модерация пока недоступна на этом бэкенде. Нужен свежий backend-деплой.");
      } finally {
        setChatLoading(false);
      }
    };

    loadMessages();
  }, [activeTab, selectedChatId]);

  const usersById = useMemo(
    () => Object.fromEntries(users.map((item) => [item.id, item])),
    [users]
  );

  const filteredUsers = useMemo(
    () => filterBySearch(users, search, [(item) => item.name, (item) => item.email]),
    [search, users]
  );
  const filteredGroups = useMemo(
    () => filterBySearch(groups, search, [(item) => item.name, (item) => item.description]),
    [groups, search]
  );
  const filteredFundraisers = useMemo(
    () =>
      filterBySearch(fundraisers, search, [
        (item) => item.title,
        (item) => usersById[item.targetUserId]?.name,
        (item) => item.status
      ]),
    [fundraisers, search, usersById]
  );
  const filteredGifts = useMemo(
    () =>
      filterBySearch(gifts, search, [
        (item) => item.title,
        (item) => item.description,
        (item) => usersById[item.ownerId]?.name
      ]),
    [gifts, search, usersById]
  );
  const filteredChats = useMemo(
    () =>
      filterBySearch(chatRooms, search, [
        (item) => item.targetUserName,
        (item) => item.lastMessagePreview
      ]),
    [chatRooms, search]
  );

  const updateTab = (tabId, nextFocus = "") => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tabId);
    if (nextFocus) {
      next.set("focus", String(nextFocus));
    } else {
      next.delete("focus");
    }
    setSearchParams(next);
  };

  const getUserDraft = (item) =>
    userDrafts[item.id] || {
      name: item.name || "",
      birthDate: item.birthDate || "",
      admin: Boolean(item.admin)
    };
  const getGroupDraft = (item) =>
    groupDrafts[item.id] || {
      name: item.name || "",
      description: item.description || ""
    };
  const getFundraiserDraft = (item) =>
    fundraiserDrafts[item.id] || {
      title: item.title || "",
      goalAmount: item.goalAmount || "",
      collectedAmount: item.collectedAmount || "",
      deadline: item.deadline || "",
      status: item.status || "OPEN"
    };
  const getGiftDraft = (item) =>
    giftDrafts[item.id] || {
      title: item.title || "",
      description: item.description || "",
      url: item.url || "",
      price: item.price || "",
      status: item.status || "WANTED"
    };
  const getMessageDraft = (item) =>
    messageDrafts[item.id] || {
      text: item.text || ""
    };

  const saveUser = async (item) => {
    const draft = getUserDraft(item);
    try {
      const response = await api.patch(`/admin/users/${item.id}`, {
        name: draft.name,
        birthDate: draft.birthDate || null,
        admin: draft.admin
      });
      setUsers((current) => current.map((entry) => (entry.id === item.id ? response.data : entry)));
      setFeedback("Пользователь обновлён.");
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Удалить пользователя? Это действие затронет связанные подарки, сборы и чат.")) {
      return;
    }

    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((current) => current.filter((entry) => entry.id !== userId));
      setGifts((current) => current.filter((entry) => Number(entry.ownerId) !== Number(userId)));
      setFundraisers((current) =>
        current.filter((entry) => Number(entry.targetUserId) !== Number(userId))
      );
      setChatRooms((current) =>
        current.filter((entry) => Number(entry.targetUserId) !== Number(userId))
      );
      if (Number(selectedChatId) === Number(userId)) {
        setSelectedChatId(null);
        setChatMessages([]);
      }
      setFeedback("Пользователь удалён.");
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  const saveGroup = async (item) => {
    const draft = getGroupDraft(item);
    try {
      const response = await api.patch(`/admin/groups/${item.id}`, draft);
      setGroups((current) => current.map((entry) => (entry.id === item.id ? response.data : entry)));
      setFeedback("Группа обновлена.");
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  const deleteGroup = async (groupId) => {
    if (!window.confirm("Удалить группу?")) {
      return;
    }

    try {
      await api.delete(`/admin/groups/${groupId}`);
      setGroups((current) => current.filter((entry) => entry.id !== groupId));
      setFeedback("Группа удалена.");
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  const saveFundraiser = async (item) => {
    const draft = getFundraiserDraft(item);
    try {
      const response = await api.patch(`/admin/fundraisers/${item.id}`, {
        title: draft.title,
        goalAmount: Number(draft.goalAmount),
        collectedAmount: Number(draft.collectedAmount),
        deadline: draft.deadline || null,
        status: draft.status
      });
      setFundraisers((current) => current.map((entry) => (entry.id === item.id ? response.data : entry)));
      setFeedback("Сбор обновлён.");
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  const deleteFundraiser = async (fundraiserId) => {
    if (!window.confirm("Удалить сбор?")) {
      return;
    }

    try {
      await api.delete(`/admin/fundraisers/${fundraiserId}`);
      setFundraisers((current) => current.filter((entry) => entry.id !== fundraiserId));
      setFeedback("Сбор удалён.");
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  const saveGift = async (item) => {
    const draft = getGiftDraft(item);
    try {
      const response = await api.patch(`/admin/gifts/${item.id}`, {
        title: draft.title,
        description: draft.description,
        url: draft.url,
        price: draft.price ? Number(draft.price) : null,
        status: draft.status
      });
      setGifts((current) => current.map((entry) => (entry.id === item.id ? response.data : entry)));
      setFeedback("Подарок обновлён.");
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  const deleteGift = async (giftId) => {
    if (!window.confirm("Удалить подарок?")) {
      return;
    }

    try {
      await api.delete(`/admin/gifts/${giftId}`);
      setGifts((current) => current.filter((entry) => entry.id !== giftId));
      setFeedback("Подарок удалён.");
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  const saveMessage = async (item) => {
    const draft = getMessageDraft(item);
    try {
      const response = await api.patch(`/admin/messages/${item.id}`, { text: draft.text });
      setChatMessages((current) =>
        current.map((entry) => (entry.id === item.id ? response.data : entry))
      );
      setChatRooms((current) =>
        current.map((entry) =>
          Number(entry.targetUserId) === Number(response.data.targetUserId)
            ? { ...entry, lastMessagePreview: response.data.text }
            : entry
        )
      );
      setFeedback("Сообщение обновлено.");
    } catch (requestError) {
      setChatAdminAvailable(false);
      setFeedback("Редактирование сообщений недоступно на текущем backend. Нужен свежий деплой admin API.");
    }
  };

  const deleteMessage = async (messageId) => {
    if (!window.confirm("Удалить сообщение?")) {
      return;
    }

    try {
      await api.delete(`/admin/messages/${messageId}`);
      setChatMessages((current) => current.filter((entry) => entry.id !== messageId));
      setFeedback("Сообщение удалено.");
    } catch (requestError) {
      setChatAdminAvailable(false);
      setFeedback("Удаление сообщений недоступно на текущем backend. Нужен свежий деплой admin API.");
    }
  };

  const importUsers = async (event) => {
    event.preventDefault();

    try {
      const payload = JSON.parse(importText);
      const response = await api.post("/admin/import", payload);
      setFeedback(`Импорт завершён: создано ${response.data.created}, пропущено ${response.data.skipped}.`);
    } catch (requestError) {
      if (requestError instanceof SyntaxError) {
        setFeedback("JSON в блоке импорта содержит ошибку.");
        return;
      }
      setFeedback(extractApiError(requestError));
    }
  };

  if (!user.admin) {
    return (
      <div className="page-stack">
        <PageHeader
          title="Админка"
          description="Этот раздел доступен только администраторам."
        />
        <EmptyState
          title="Доступ закрыт"
          description="Войдите под администратором, чтобы открыть режим управления."
        />
      </div>
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Режим администратора"
        description="Здесь собраны массовые операции и модерация. Для быстрых сценариев на обычных страницах доступны точечные admin-действия."
        actions={
          <div className="page-actions-stack admin-page-actions">
            <input
              className="search-box"
              placeholder="Поиск по активной вкладке"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Link className="button button-ghost" to="/profile">
              Назад в аккаунт
            </Link>
          </div>
        }
      />

      {feedback ? <div className="feedback feedback-info">{feedback}</div> : null}
      {loading ? <div className="panel">Загружаем административные данные...</div> : null}

      {stats ? (
        <section className="cards-grid">
          <article className="panel spotlight-card">
            <p className="eyebrow">Пользователи</p>
            <h3>{stats.users}</h3>
          </article>
          <article className="panel spotlight-card">
            <p className="eyebrow">Группы</p>
            <h3>{stats.groups}</h3>
          </article>
          <article className="panel spotlight-card">
            <p className="eyebrow">Подарки</p>
            <h3>{stats.gifts}</h3>
          </article>
          <article className="panel spotlight-card">
            <p className="eyebrow">Сборы</p>
            <h3>{stats.fundraisers}</h3>
          </article>
        </section>
      ) : null}

      <section className="panel section-stack">
        <div className="admin-tabs" role="tablist" aria-label="Разделы админки">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? "admin-tab admin-tab-active" : "admin-tab"}
              onClick={() => updateTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "users" ? (
          <div className="admin-collection">
            {filteredUsers.map((item) => {
              const draft = getUserDraft(item);
              const isFocused = String(item.id) === focusId;

              return (
                <article
                  key={item.id}
                  className={isFocused ? "panel section-stack admin-focus-card" : "panel section-stack"}
                >
                  <div className="section-title">
                    <div>
                      <h3>{item.name}</h3>
                      <p className="microcopy">{item.email}</p>
                    </div>
                    <span className="day-pill">{item.admin ? "admin" : "user"}</span>
                  </div>

                  <div className="gift-form-grid">
                    <label>
                      Имя
                      <input
                        value={draft.name}
                        onChange={(event) =>
                          setUserDrafts((current) => ({
                            ...current,
                            [item.id]: { ...draft, name: event.target.value }
                          }))
                        }
                      />
                    </label>
                    <label>
                      Дата рождения
                      <input
                        type="date"
                        value={draft.birthDate || ""}
                        onChange={(event) =>
                          setUserDrafts((current) => ({
                            ...current,
                            [item.id]: { ...draft, birthDate: event.target.value }
                          }))
                        }
                      />
                    </label>
                    <label>
                      Роль
                      <select
                        value={draft.admin ? "admin" : "user"}
                        onChange={(event) =>
                          setUserDrafts((current) => ({
                            ...current,
                            [item.id]: { ...draft, admin: event.target.value === "admin" }
                          }))
                        }
                      >
                        <option value="user">Пользователь</option>
                        <option value="admin">Администратор</option>
                      </select>
                    </label>
                  </div>

                  <div className="card-actions">
                    <button type="button" className="button button-primary" onClick={() => saveUser(item)}>
                      Сохранить
                    </button>
                    <Link className="button button-ghost" to={`/friends/${item.id}`}>
                      Открыть карточку
                    </Link>
                    {item.id !== user.id ? (
                      <button type="button" className="button button-danger" onClick={() => deleteUser(item.id)}>
                        Удалить
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}

        {activeTab === "groups" ? (
          <div className="admin-collection">
            {filteredGroups.map((item) => {
              const draft = getGroupDraft(item);
              const isFocused = String(item.id) === focusId;

              return (
                <article
                  key={item.id}
                  className={isFocused ? "panel section-stack admin-focus-card" : "panel section-stack"}
                >
                  <div className="section-title">
                    <div>
                      <h3>{item.name}</h3>
                      <p className="microcopy">Создатель: {usersById[item.creatorId]?.name || `#${item.creatorId}`}</p>
                    </div>
                  </div>

                  <div className="gift-form-grid">
                    <label>
                      Название
                      <input
                        value={draft.name}
                        onChange={(event) =>
                          setGroupDrafts((current) => ({
                            ...current,
                            [item.id]: { ...draft, name: event.target.value }
                          }))
                        }
                      />
                    </label>
                    <label className="admin-full-width">
                      Описание
                      <textarea
                        rows="3"
                        value={draft.description}
                        onChange={(event) =>
                          setGroupDrafts((current) => ({
                            ...current,
                            [item.id]: { ...draft, description: event.target.value }
                          }))
                        }
                      />
                    </label>
                  </div>

                  <div className="card-actions">
                    <button type="button" className="button button-primary" onClick={() => saveGroup(item)}>
                      Сохранить
                    </button>
                    <button type="button" className="button button-danger" onClick={() => deleteGroup(item.id)}>
                      Удалить группу
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}

        {activeTab === "fundraisers" ? (
          <div className="admin-collection">
            {filteredFundraisers.map((item) => {
              const draft = getFundraiserDraft(item);
              const isFocused = String(item.id) === focusId;

              return (
                <article
                  key={item.id}
                  className={isFocused ? "panel section-stack admin-focus-card" : "panel section-stack"}
                >
                  <div className="section-title">
                    <div>
                      <h3>{item.title || `Сбор #${item.id}`}</h3>
                      <p className="microcopy">
                        Для: {usersById[item.targetUserId]?.name || `#${item.targetUserId}`}
                      </p>
                    </div>
                    <span className="day-pill">{item.status}</span>
                  </div>

                  <div className="gift-form-grid">
                    <label>
                      Название
                      <input
                        value={draft.title}
                        onChange={(event) =>
                          setFundraiserDrafts((current) => ({
                            ...current,
                            [item.id]: { ...draft, title: event.target.value }
                          }))
                        }
                      />
                    </label>
                    <label>
                      Цель
                      <input
                        type="number"
                        min="0"
                        value={draft.goalAmount}
                        onChange={(event) =>
                          setFundraiserDrafts((current) => ({
                            ...current,
                            [item.id]: { ...draft, goalAmount: event.target.value }
                          }))
                        }
                      />
                    </label>
                    <label>
                      Собрано
                      <input
                        type="number"
                        min="0"
                        value={draft.collectedAmount}
                        onChange={(event) =>
                          setFundraiserDrafts((current) => ({
                            ...current,
                            [item.id]: { ...draft, collectedAmount: event.target.value }
                          }))
                        }
                      />
                    </label>
                    <label>
                      Дедлайн
                      <input
                        type="date"
                        value={draft.deadline || ""}
                        onChange={(event) =>
                          setFundraiserDrafts((current) => ({
                            ...current,
                            [item.id]: { ...draft, deadline: event.target.value }
                          }))
                        }
                      />
                    </label>
                    <label>
                      Статус
                      <select
                        value={draft.status}
                        onChange={(event) =>
                          setFundraiserDrafts((current) => ({
                            ...current,
                            [item.id]: { ...draft, status: event.target.value }
                          }))
                        }
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </label>
                  </div>

                  <div className="admin-inline-meta">
                    <span className="day-pill">{formatMoney(item.collectedAmount)} из {formatMoney(item.goalAmount)}</span>
                    <Link className="button button-ghost" to={`/fundraisers/${item.id}`}>
                      Открыть сбор
                    </Link>
                  </div>

                  <div className="card-actions">
                    <button type="button" className="button button-primary" onClick={() => saveFundraiser(item)}>
                      Сохранить
                    </button>
                    <button type="button" className="button button-danger" onClick={() => deleteFundraiser(item.id)}>
                      Удалить сбор
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}

        {activeTab === "gifts" ? (
          <div className="admin-collection">
            {filteredGifts.map((item) => {
              const draft = getGiftDraft(item);
              const isFocused = String(item.id) === focusId;

              return (
                <article
                  key={item.id}
                  className={isFocused ? "panel section-stack admin-focus-card" : "panel section-stack"}
                >
                  <div className="section-title">
                    <div>
                      <h3>{item.title}</h3>
                      <p className="microcopy">
                        Владелец: {usersById[item.ownerId]?.name || `#${item.ownerId}`}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  <div className="gift-form-grid">
                    <label>
                      Название
                      <input
                        value={draft.title}
                        onChange={(event) =>
                          setGiftDrafts((current) => ({
                            ...current,
                            [item.id]: { ...draft, title: event.target.value }
                          }))
                        }
                      />
                    </label>
                    <label>
                      Цена
                      <input
                        type="number"
                        min="0"
                        value={draft.price}
                        onChange={(event) =>
                          setGiftDrafts((current) => ({
                            ...current,
                            [item.id]: { ...draft, price: event.target.value }
                          }))
                        }
                      />
                    </label>
                    <label>
                      Статус
                      <select
                        value={draft.status}
                        onChange={(event) =>
                          setGiftDrafts((current) => ({
                            ...current,
                            [item.id]: { ...draft, status: event.target.value }
                          }))
                        }
                      >
                        <option value="WANTED">WANTED</option>
                        <option value="RESERVED">RESERVED</option>
                        <option value="BOUGHT">BOUGHT</option>
                      </select>
                    </label>
                    <label>
                      Ссылка
                      <input
                        value={draft.url}
                        onChange={(event) =>
                          setGiftDrafts((current) => ({
                            ...current,
                            [item.id]: { ...draft, url: event.target.value }
                          }))
                        }
                      />
                    </label>
                    <label className="admin-full-width">
                      Описание
                      <textarea
                        rows="3"
                        value={draft.description}
                        onChange={(event) =>
                          setGiftDrafts((current) => ({
                            ...current,
                            [item.id]: { ...draft, description: event.target.value }
                          }))
                        }
                      />
                    </label>
                  </div>

                  <div className="card-actions">
                    <button type="button" className="button button-primary" onClick={() => saveGift(item)}>
                      Сохранить
                    </button>
                    <Link className="button button-ghost" to={`/friends/${item.ownerId}`}>
                      К карточке владельца
                    </Link>
                    <button type="button" className="button button-danger" onClick={() => deleteGift(item.id)}>
                      Удалить подарок
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}

        {activeTab === "chats" ? (
          <div className="two-column-layout admin-chat-layout">
            <section className="panel section-stack">
              <div className="section-title">
                <div>
                  <h3>Комнаты чатов</h3>
                  <p className="microcopy">Выберите карточку, чтобы модерировать сообщения.</p>
                </div>
              </div>
              <div className="member-list">
                {chatAdminAvailable ? (
                  filteredChats.map((item) => (
                    <button
                      key={item.targetUserId}
                      type="button"
                      className={
                        Number(selectedChatId) === Number(item.targetUserId)
                          ? "admin-room-button admin-room-button-active"
                          : "admin-room-button"
                      }
                      onClick={() => {
                        setSelectedChatId(item.targetUserId);
                        updateTab("chats", item.targetUserId);
                      }}
                    >
                      <div>
                        <strong>{item.targetUserName}</strong>
                        <p>{item.lastMessagePreview || "Без текста"}</p>
                      </div>
                      <span className="day-pill">{item.messagesCount}</span>
                    </button>
                  ))
                ) : (
                  <EmptyState
                    title="Чат-модерация пока недоступна"
                    description="На сервере ещё нет новых admin-маршрутов для чатов и сообщений."
                  />
                )}
              </div>
            </section>

            <section className="panel section-stack">
              <div className="section-title">
                <div>
                  <h3>Сообщения</h3>
                  <p className="microcopy">
                    {selectedChatId
                      ? `Чат про пользователя #${selectedChatId}`
                      : "Сначала выберите комнату слева."}
                  </p>
                </div>
                {selectedChatId ? (
                  <Link className="button button-ghost" to={`/friends/${selectedChatId}`}>
                    Открыть карточку
                  </Link>
                ) : null}
              </div>

              {chatLoading ? <div className="panel">Загружаем сообщения...</div> : null}

              {!chatLoading && !selectedChatId ? (
                <EmptyState
                  title="Комната не выбрана"
                  description="Выберите диалог из списка слева."
                />
              ) : null}

              {!chatLoading && selectedChatId ? (
                <div className="member-list">
                  {chatMessages.map((item) => {
                    const draft = getMessageDraft(item);

                    return (
                      <article key={item.id} className="gift-card">
                        <div className="chat-message-top">
                          <div>
                            <strong>{item.authorName}</strong>
                            <p>{formatDateTime(item.createdAt)}</p>
                          </div>
                          <span className="day-pill">#{item.id}</span>
                        </div>
                        <textarea
                          rows="3"
                          value={draft.text}
                          onChange={(event) =>
                            setMessageDrafts((current) => ({
                              ...current,
                              [item.id]: { text: event.target.value }
                            }))
                          }
                        />
                        <div className="card-actions">
                          <button type="button" className="button button-primary" onClick={() => saveMessage(item)}>
                            Сохранить
                          </button>
                          <button type="button" className="button button-danger" onClick={() => deleteMessage(item.id)}>
                            Удалить сообщение
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : null}
            </section>
          </div>
        ) : null}
      </section>

      <form className="panel form-stack" onSubmit={importUsers}>
        <div className="section-title">
          <div>
            <h3>Импорт пользователей</h3>
            <p className="microcopy">Быстрый массовый импорт для демо-аккаунтов и тестовых сценариев.</p>
          </div>
        </div>
        <label>
          JSON-массив
          <textarea
            rows="10"
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
          />
        </label>
        <button type="submit" className="button button-primary">
          Запустить импорт
        </button>
      </form>
    </div>
  );
}
