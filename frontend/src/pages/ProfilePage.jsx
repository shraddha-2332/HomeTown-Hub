import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { formatCompactDate, formatDateTime } from "../lib/formatters";

export default function ProfilePage() {
  const { token, user, refreshUser, updateProfile } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [profileForm, setProfileForm] = useState({
    name: "",
    hometown: "",
    bio: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      if (!token || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        await refreshUser();
        const [communityData, notificationData] = await Promise.all([
          api.getCommunities(),
          api.getNotifications(token)
        ]);
        setCommunities(communityData);
        setNotifications(notificationData);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [token, user?.id]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        hometown: user.hometown || "",
        bio: user.bio || ""
      });
    }
  }, [user]);

  const joinedCommunities = useMemo(() => {
    if (!user) {
      return [];
    }

    return communities.filter((community) => community.members?.includes(user.id));
  }, [communities, user]);

  async function handleProfileUpdate(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      await updateProfile({
        name: profileForm.name.trim(),
        hometown: profileForm.hometown.trim(),
        bio: profileForm.bio.trim()
      });
      setMessage("Profile updated.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="page">
      <section className="subpage-hero subpage-hero-communities">
        <div className="subpage-copy">
          <p className="eyebrow">Profile</p>
          <h1>Your hometown identity, communities, and updates in one place.</h1>
          <p>
            Review your joined spaces, track notifications, and keep your hometown presence active across
            the platform.
          </p>
        </div>
        {user ? (
          <div className="subpage-aside">
            <article className="metric-tile">
              <strong>{user.name}</strong>
              <span>{user.hometown}</span>
            </article>
            <article className="metric-tile">
              <strong>{joinedCommunities.length}</strong>
              <span>joined communities</span>
            </article>
          </div>
        ) : null}
      </section>

      {!user ? <p className="message error">Login first to view your profile.</p> : null}
      {message ? <p className="message success">{message}</p> : null}
      {error ? <p className="message error">{error}</p> : null}
      {loading ? <p className="state-card">Loading profile...</p> : null}

      {user ? (
        <>
          <section className="section-grid profile-grid">
            <div className="card elevated-card">
              <div className="section-heading">
                <h3>Account Summary</h3>
              </div>
              <div className="stack">
                <article className="pill-row">Name: {user.name}</article>
                <article className="pill-row">Email: {user.email}</article>
                <article className="pill-row">Hometown: {user.hometown}</article>
                <article className="pill-row">Role: {user.role}</article>
              </div>
            </div>

            <div className="card elevated-card">
              <div className="section-heading">
                <h3>Edit Profile</h3>
              </div>
              <form className="stack" onSubmit={handleProfileUpdate}>
                <input
                  className="input"
                  placeholder="Name"
                  value={profileForm.name}
                  onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })}
                />
                <input
                  className="input"
                  placeholder="Hometown"
                  value={profileForm.hometown}
                  onChange={(event) => setProfileForm({ ...profileForm, hometown: event.target.value })}
                />
                <textarea
                  className="input textarea"
                  placeholder="Short bio"
                  value={profileForm.bio}
                  onChange={(event) => setProfileForm({ ...profileForm, bio: event.target.value })}
                />
                <button className="primary-button" type="submit">
                  Save Profile
                </button>
              </form>
            </div>
          </section>

          <section className="card elevated-card">
            <div className="section-heading">
              <h3>Quick Actions</h3>
            </div>
            <div className="quick-actions-grid">
              <Link to="/communities" className="secondary-button button-link full-width-button">
                Explore Communities
              </Link>
              <Link to="/events" className="secondary-button button-link full-width-button">
                View Events
              </Link>
              <Link to="/notifications" className="secondary-button button-link full-width-button">
                Open Notifications
              </Link>
            </div>
          </section>

          <section className="section-grid profile-grid">
            <div className="card elevated-card">
              <div className="section-heading">
                <h3>Joined Communities</h3>
              </div>
              {joinedCommunities.length === 0 ? (
                <p className="state-card">You have not joined any communities yet.</p>
              ) : (
                <div className="stack">
                  {joinedCommunities.map((community) => (
                    <article key={community.id} className="list-item">
                      <div>
                        <h4>{community.name}</h4>
                        <p>{community.location}</p>
                        <p>{community.description}</p>
                      </div>
                      <small className="soft-meta">Created {formatCompactDate(community.createdAt)}</small>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="card elevated-card">
              <div className="section-heading">
                <h3>Latest Notifications</h3>
              </div>
              {notifications.length === 0 ? (
                <p className="state-card">No notifications yet.</p>
              ) : (
                <div className="stack">
                  {notifications.slice(0, 5).map((notification) => (
                    <article key={notification.id} className="pill-row">
                      <strong>{notification.title}</strong>
                      <br />
                      {notification.body}
                      <br />
                      <small className="soft-meta">{formatDateTime(notification.createdAt)}</small>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
