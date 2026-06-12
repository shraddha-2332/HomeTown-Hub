import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { formatDateTime } from "../lib/formatters";

export default function NotificationsPage() {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadNotifications() {
    if (!token) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await api.getNotifications(token);
      setNotifications(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, [token]);

  async function handleMarkRead(notificationId) {
    try {
      await api.markNotificationRead(notificationId, token);
      await loadNotifications();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="page">
      <section className="subpage-hero subpage-hero-events">
        <div className="subpage-copy">
          <p className="eyebrow">Notifications</p>
          <h1>Stay updated on approvals, requests, and community actions.</h1>
          <p>Your important hometown platform updates appear here so nothing gets lost.</p>
        </div>
      </section>

      {!user ? <p className="message error">Login first to view your notifications.</p> : null}
      {error ? <p className="message error">{error}</p> : null}
      {loading ? <p className="state-card">Loading notifications...</p> : null}
      {!loading && notifications.length === 0 ? (
        <p className="state-card">No notifications yet. Actions like approvals will appear here.</p>
      ) : null}

      <section className="stack">
        {notifications.map((notification) => (
          <article
            key={notification.id}
            className={notification.read ? "request-card moderation-card" : "request-card moderation-card unread-card"}
          >
            <div className="request-copy">
              <h4>{notification.title}</h4>
              <p>{notification.body}</p>
              <small>{formatDateTime(notification.createdAt)}</small>
            </div>
            {!notification.read ? (
              <div className="request-actions">
                <button className="secondary-button" onClick={() => handleMarkRead(notification.id)}>
                  Mark as read
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </section>
    </div>
  );
}
