import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

const navItems = [
  { to: "/communities", label: "Communities" },
  { to: "/events", label: "Events" },
  { to: "/notifications", label: "Notifications" },
  { to: "/profile", label: "Profile" },
  { to: "/admin", label: "Moderation" }
];

export default function Layout() {
  const { token, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function loadUnreadCount() {
      if (!token) {
        setUnreadCount(0);
        return;
      }

      try {
        const notifications = await api.getNotifications(token);
        setUnreadCount(notifications.filter((notification) => !notification.read).length);
      } catch {
        setUnreadCount(0);
      }
    }

    loadUnreadCount();
  }, [token]);

  return (
    <div className="shell">
      <header className="site-header">
        <NavLink to="/" className="brand-mark">
          <span className="brand-icon">H</span>
          <span>Hometown Hub</span>
        </NavLink>

        <div className="header-actions">
          <nav className="nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              >
                {item.label}
                {item.to === "/notifications" && unreadCount > 0 ? (
                  <span className="notification-count">{unreadCount}</span>
                ) : null}
              </NavLink>
            ))}
          </nav>

          <div className="auth-links">
            <NavLink to="/auth" className="nav-pill muted">
              {user ? "Account" : "Log in"}
            </NavLink>
            <NavLink to="/auth" className="nav-pill strong">
              {user ? "Open Hub" : "Sign up"}
            </NavLink>
          </div>
        </div>
      </header>

      {user ? <p className="user-badge">Signed in as {user.name}</p> : null}

      <main>
        <Outlet />
      </main>
    </div>
  );
}
