import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { api, extractApiError } from "../lib/api";
import { ICON_URL } from "../lib/assets";

export default function AppShell({ children, refreshUnreadCount, unreadCount, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const showNotificationPopup = location.pathname !== "/notifications";
  const desktopNavigation = [
    { to: "/wishlist", label: "Мой вишлист", mobileLabel: "Вишлист" },
    { to: "/people", label: "Друзья", mobileLabel: "Друзья" },
    { to: "/groups", label: "Группы", mobileLabel: "Группы" },
    { to: "/fundraisers", label: "Сборы", mobileLabel: "Сборы" },
    { to: "/profile", label: "Аккаунт", mobileLabel: "Аккаунт" },
    { to: "/notifications", label: "Уведомления", mobileLabel: "Уведомл." }
  ];
  const mobileNavigation = [
    { to: "/wishlist", label: "Мой вишлист", mobileLabel: "Вишлист" },
    { to: "/people", label: "Друзья", mobileLabel: "Друзья" },
    { to: "/groups", label: "Группы", mobileLabel: "Группы" },
    { to: "/fundraisers", label: "Сборы", mobileLabel: "Сборы" },
    { to: "/profile", label: "Аккаунт", mobileLabel: "Аккаунт" }
  ];

  if (user.admin) {
    desktopNavigation.push({ to: "/admin", label: "Админка", mobileLabel: "Админ" });
  }

  useEffect(() => {
    if (!notificationOpen) {
      return;
    }

    const loadNotifications = async () => {
      setNotificationsLoading(true);
      setNotificationsError("");

      try {
        const response = await api.get("/notifications");
        setNotifications(response.data);
      } catch (error) {
        setNotificationsError(extractApiError(error));
      } finally {
        setNotificationsLoading(false);
      }
    };

    loadNotifications();
  }, [notificationOpen, unreadCount]);

  useEffect(() => {
    setNotificationOpen(false);
  }, [location.pathname]);

  const markNotificationAsRead = async (notificationId) => {
    const response = await api.post(`/notifications/${notificationId}/read`);
    setNotifications((current) =>
      current.map((item) => (item.id === notificationId ? response.data : item))
    );
    await refreshUnreadCount();
  };

  const openNotification = async (notification) => {
    try {
      if (!notification.read) {
        await markNotificationAsRead(notification.id);
      }

      setNotificationOpen(false);
      if (notification.link?.startsWith("/")) {
        navigate(notification.link);
      }
    } catch (error) {
      setNotificationsError(extractApiError(error));
    }
  };

  const renderNavigationItem = (item, mobile = false) => (
    <NavLink
      key={`${mobile ? "mobile" : "desktop"}-${item.to}`}
      to={item.to}
      className={({ isActive }) =>
        mobile
          ? isActive
            ? "mobile-nav-item mobile-nav-item-active"
            : "mobile-nav-item"
          : isActive
            ? "nav-item nav-item-active"
            : "nav-item"
      }
    >
      <span>{mobile ? item.mobileLabel || item.label : item.label}</span>
      {item.to === "/notifications" && unreadCount > 0 ? (
        <span className={mobile ? "mobile-nav-counter" : "nav-counter"}>{unreadCount}</span>
      ) : null}
    </NavLink>
  );

  return (
    <div className="app-shell">
      <div className="background-glow background-glow-left" />
      <div className="background-glow background-glow-right" />
      <aside className="sidebar">
        <div className="brand-block">
          <img className="brand-mark" src={ICON_URL} alt="OBD Birthday Planner logo" />
          <div className="brand-copy">
            <p className="eyebrow">Birthday planner</p>
            <h1>Организация поздравлений без хаоса.</h1>
          </div>
          {showNotificationPopup ? (
            <div className="mobile-notification-anchor">
              <button
                type="button"
                className={
                  notificationOpen
                    ? "mobile-notification-button mobile-notification-button-open"
                    : "mobile-notification-button"
                }
                aria-label="Уведомления"
                onClick={() => setNotificationOpen((current) => !current)}
              >
                <span className="mobile-notification-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" focusable="false">
                    <path
                      d="M12 3.75a4.5 4.5 0 0 0-4.5 4.5v1.42c0 .77-.2 1.52-.58 2.19l-1.1 1.92a2.25 2.25 0 0 0 1.96 3.37h8.44a2.25 2.25 0 0 0 1.96-3.37l-1.1-1.92a4.45 4.45 0 0 1-.58-2.19V8.25a4.5 4.5 0 0 0-4.5-4.5Zm0 16.5a2.6 2.6 0 0 1-2.3-1.38h4.6A2.6 2.6 0 0 1 12 20.25Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                {unreadCount > 0 ? (
                  <span className="mobile-notification-badge">{unreadCount}</span>
                ) : null}
              </button>

              {notificationOpen ? (
                <div className="mobile-notification-popup">
                  <div className="mobile-notification-popup-head">
                    <strong>Уведомления</strong>
                    <button
                      type="button"
                      className="button button-ghost"
                      onClick={() => {
                        setNotificationOpen(false);
                        navigate("/notifications");
                      }}
                    >
                      Все
                    </button>
                  </div>

                  {notificationsLoading ? <p className="microcopy">Загружаем уведомления...</p> : null}
                  {notificationsError ? <div className="feedback feedback-error">{notificationsError}</div> : null}
                  {!notificationsLoading && !notificationsError && notifications.length === 0 ? (
                    <p className="microcopy">Новых уведомлений пока нет.</p>
                  ) : null}

                  {!notificationsLoading && notifications.length > 0 ? (
                    <div className="mobile-notification-list">
                      {notifications.slice(0, 4).map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          className={
                            notification.read
                              ? "mobile-notification-item"
                              : "mobile-notification-item mobile-notification-item-unread"
                          }
                          onClick={() => openNotification(notification)}
                        >
                          <strong>{notification.message}</strong>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <nav className="nav-list">
          {desktopNavigation.map((item) => renderNavigationItem(item))}
        </nav>
      </aside>

      <main className="content">{children}</main>

      <nav className="mobile-toolbar">
        {mobileNavigation.map((item) => renderNavigationItem(item, true))}
      </nav>
    </div>
  );
}
