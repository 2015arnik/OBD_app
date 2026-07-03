import { NavLink } from "react-router-dom";
import { initials } from "../lib/format";

const navigation = [
  { to: "/people", label: "Друзья" },
  { to: "/wishlist", label: "Мой вишлист" },
  { to: "/groups", label: "Группы" },
  { to: "/notifications", label: "Уведомления" }
];

export default function AppShell({ children, onLogout, unreadCount, user }) {
  return (
    <div className="app-shell">
      <div className="background-glow background-glow-left" />
      <div className="background-glow background-glow-right" />
      <aside className="sidebar">
        <div className="brand-block">
          <img className="brand-mark" src="/icon.svg" alt="OBD Birthday Planner logo" />
          <div>
            <p className="eyebrow">Birthday planner</p>
            <h1>Организация поздравлений без хаоса.</h1>
          </div>
        </div>

        <nav className="nav-list">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? "nav-item nav-item-active" : "nav-item"
              }
            >
              <span>{item.label}</span>
              {item.to === "/notifications" && unreadCount > 0 ? (
                <span className="nav-counter">{unreadCount}</span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="profile-pill">
            <div className="avatar">{initials(user.name)}</div>
            <div>
              <strong>{user.name}</strong>
              <p>{user.email}</p>
            </div>
          </div>

          <button type="button" className="button button-ghost" onClick={onLogout}>
            Выйти
          </button>
        </div>
      </aside>

      <main className="content">{children}</main>
    </div>
  );
}
