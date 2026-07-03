import { useEffect, useEffectEvent, useState } from "react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation
} from "react-router-dom";
import AppShell from "./components/AppShell";
import { useAuth } from "./context/AuthContext";
import { api } from "./lib/api";
import AuthPage from "./pages/AuthPage";
import AdminPage from "./pages/AdminPage";
import FriendPage from "./pages/FriendPage";
import FundraiserDetailPage from "./pages/FundraiserDetailPage";
import FundraisersPage from "./pages/FundraisersPage";
import GroupsPage from "./pages/GroupsPage";
import NotificationsPage from "./pages/NotificationsPage";
import PeoplePage from "./pages/PeoplePage";
import ProfilePage from "./pages/ProfilePage";
import WishlistPage from "./pages/WishlistPage";

function SplashScreen() {
  return (
    <div className="splash-screen">
      <div className="splash-card">
        <div className="splash-brand">
          <img className="brand-mark brand-mark-large" src="/icon.svg" alt="OBD Birthday Planner logo" />
        </div>
        <p className="eyebrow">OBD Birthday Planner</p>
        <h1>Поднимаем ваш день рождения в цифровой формат.</h1>
        <p>Проверяем сессию и готовим рабочее пространство.</p>
      </div>
    </div>
  );
}

function PublicOnlyRoute() {
  const { token, bootstrapping } = useAuth();

  if (bootstrapping) {
    return <SplashScreen />;
  }

  return token ? <Navigate to="/people" replace /> : <AuthPage />;
}

function ProtectedLayout() {
  const { token, user, logout, bootstrapping } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  const refreshUnreadCount = useEffectEvent(async () => {
    if (!token) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await api.get("/notifications");
      setUnreadCount(response.data.filter((item) => !item.read).length);
    } catch {
      setUnreadCount(0);
    }
  });

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    refreshUnreadCount();
    const timerId = window.setInterval(() => {
      refreshUnreadCount();
    }, 30000);

    return () => window.clearInterval(timerId);
  }, [location.pathname, token, refreshUnreadCount]);

  if (bootstrapping) {
    return <SplashScreen />;
  }

  if (!token || !user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <AppShell
      user={user}
      unreadCount={unreadCount}
      onLogout={logout}
      refreshUnreadCount={refreshUnreadCount}
    >
      <Outlet context={{ refreshUnreadCount }} />
    </AppShell>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<PublicOnlyRoute />} />
      <Route element={<ProtectedLayout />}>
        <Route index element={<Navigate to="/people" replace />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/people" element={<PeoplePage />} />
        <Route path="/friends/:id" element={<FriendPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/fundraisers" element={<FundraisersPage />} />
        <Route path="/fundraisers/:id" element={<FundraiserDetailPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
