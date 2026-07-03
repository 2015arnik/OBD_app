import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import { api, extractApiError } from "../lib/api";
import { formatDateTime } from "../lib/format";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { refreshUnreadCount } = useOutletContext();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await api.get("/notifications");
        setNotifications(response.data);
      } catch (requestError) {
        setFeedback(extractApiError(requestError));
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      const response = await api.post(`/notifications/${notificationId}/read`);
      setNotifications((current) =>
        current.map((item) => (item.id === notificationId ? response.data : item))
      );
      refreshUnreadCount();
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    }
  };

  const openLink = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.link?.startsWith("/")) {
      navigate(notification.link);
    }
  };

  const deleteNotification = async (notification) => {
    setDeletingId(notification.id);
    setFeedback("");

    try {
      await api.delete(`/notifications/${notification.id}`);
      setNotifications((current) => current.filter((item) => item.id !== notification.id));
      await refreshUnreadCount();
    } catch (requestError) {
      setFeedback(extractApiError(requestError));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        title="Уведомления"
        description="Здесь собираются напоминания о днях рождения друзей и участников групп, на которые вы подписаны."
        actions={
          <span className="day-pill">
            {notifications.filter((item) => !item.read).length} непрочитанных
          </span>
        }
      />

      {feedback ? <div className="feedback feedback-error">{feedback}</div> : null}

      <section className="panel notification-list">
        {loading ? <p className="microcopy">Загружаем уведомления...</p> : null}

        {!loading && notifications.length === 0 ? (
          <EmptyState
            title="Уведомлений пока нет"
            description="Здесь появятся напоминания о ближайших днях рождения ваших друзей и участников выбранных групп."
          />
        ) : null}

        {notifications.map((notification) => (
          <article
            key={notification.id}
            className={notification.read ? "notification-row" : "notification-row notification-row-unread"}
          >
            <div>
              <p>{notification.message}</p>
              <span className="microcopy">{formatDateTime(notification.createdAt)}</span>
            </div>
            <div className="card-actions">
              {!notification.read ? (
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => markAsRead(notification.id)}
                >
                  Прочитано
                </button>
              ) : null}
              {notification.link ? (
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => openLink(notification)}
                >
                  Открыть
                </button>
              ) : null}
              <button
                type="button"
                className="button button-danger"
                aria-label="Удалить уведомление"
                disabled={deletingId === notification.id}
                onClick={() => deleteNotification(notification)}
              >
                <span className="button-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" focusable="false">
                    <path
                      d="M9 3.75h6a1.5 1.5 0 0 1 1.5 1.5V6h3a.75.75 0 0 1 0 1.5h-.56l-.77 10.01A2.25 2.25 0 0 1 15.93 19.5H8.07a2.25 2.25 0 0 1-2.24-1.99L5.06 7.5H4.5a.75.75 0 0 1 0-1.5h3v-.75A1.5 1.5 0 0 1 9 3.75Zm1.5 0a.75.75 0 0 0-.75.75V6h4.5v-1.5a.75.75 0 0 0-.75-.75h-3Zm-3.17 3.75.74 9.9a.75.75 0 0 0 .75.6h7.86a.75.75 0 0 0 .75-.6l.74-9.9H7.33Zm2.42 2.25a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5a.75.75 0 0 1 .75-.75Zm4.5 0a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5a.75.75 0 0 1 .75-.75Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
