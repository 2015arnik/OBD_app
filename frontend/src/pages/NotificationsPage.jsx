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
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
