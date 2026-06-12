import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { formatDateTime, getCommunityName } from "../lib/formatters";

const featureCards = [
  {
    title: "Verified hometown spaces",
    copy: "Communities are built around real hometown ties, trusted moderators, and neighborhood-friendly rules."
  },
  {
    title: "Local updates that matter",
    copy: "Follow announcements, festivals, volunteer drives, meetups, and everyday hometown news in one place."
  },
  {
    title: "Culture, memory, and support",
    copy: "Reconnect with people, preserve traditions, and organize community help even while living in another city."
  }
];

export default function HomePage() {
  const { token, user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingPostId, setEditingPostId] = useState("");
  const [postDraft, setPostDraft] = useState({
    title: "",
    content: "",
    type: "discussion"
  });

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [communityData, postData, eventData] = await Promise.all([
        api.getCommunities(),
        api.getPosts(),
        api.getEvents()
      ]);

      setCommunities(communityData);
      setPosts(postData);
      setEvents(eventData);
    } catch (error) {
      console.error("Failed to load homepage data", error);
      setError("We couldn't load the latest hometown activity right now.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function startEditPost(post) {
    setEditingPostId(post.id);
    setPostDraft({
      title: post.title,
      content: post.content,
      type: post.type
    });
  }

  function cancelEditPost() {
    setEditingPostId("");
    setPostDraft({
      title: "",
      content: "",
      type: "discussion"
    });
  }

  async function handleUpdatePost(postId) {
    try {
      setError("");
      await api.updatePost(
        postId,
        {
          title: postDraft.title.trim(),
          content: postDraft.content.trim(),
          type: postDraft.type
        },
        token
      );
      cancelEditPost();
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleDeletePost(postId) {
    try {
      setError("");
      await api.deletePost(postId, token);
      if (editingPostId === postId) {
        cancelEditPost();
      }
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="marketing-page">
      <section className="marketing-hero">
        <div className="hero-backdrop">
          <div className="hero-overlay-card">
            <p className="eyebrow">Digital hometown communities</p>
            <h1>Reconnect with the place that still feels like home.</h1>
            <p className="hero-lead">
              Join hometown-based communities to share updates, plan events, support local initiatives,
              and keep your roots close no matter where life takes you.
            </p>

            <div className="hero-cta-row">
              <Link to="/auth" className="primary-button button-link">
                Join Hometown Hub
              </Link>
              <Link to="/communities" className="secondary-button button-link">
                Explore Communities
              </Link>
            </div>

            <div className="hero-metrics">
              <article>
                <strong>{communities.length}</strong>
                <span>live communities</span>
              </article>
              <article>
                <strong>{posts.length}</strong>
                <span>shared updates</span>
              </article>
              <article>
                <strong>{events.length}</strong>
                <span>community events</span>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="invite-strip">
        <p>Have an invite code or community link? Use it to join your hometown circle faster.</p>
      </section>

      <section className="feature-gallery">
        {featureCards.map((card, index) => (
          <article key={card.title} className={`feature-panel feature-panel-${index + 1}`}>
            <div className="feature-panel-inner">
              <h3>{card.title}</h3>
              <p>{card.copy}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="content-showcase">
        <div className="showcase-block">
          <div className="section-heading">
            <h2>Popular hometown communities</h2>
          </div>
          <div className="stack">
            {loading ? <p className="state-card">Loading communities...</p> : null}
            {!loading && error ? <p className="state-card error-state">{error}</p> : null}
            {!loading && !error && communities.length === 0 ? (
              <p className="state-card">No communities are live yet. Be the first to request one.</p>
            ) : null}
            {!loading &&
              !error &&
              communities.slice(0, 3).map((community) => (
                <article key={community.id} className="list-item">
                  <div>
                    <h4>{community.name}</h4>
                    <p>{community.location}</p>
                    <p>{community.description}</p>
                  </div>
                  <Link to={`/communities/${community.id}`} className="secondary-button button-link">
                    View
                  </Link>
                </article>
              ))}
          </div>
        </div>

        <div className="showcase-block">
          <div className="section-heading">
            <h2>Fresh from the feed</h2>
          </div>
          <div className="stack">
            {loading ? <p className="state-card">Loading feed activity...</p> : null}
            {!loading && posts.length === 0 ? <p className="state-card">No posts yet. Start the first update.</p> : null}
            {!loading &&
              posts.slice(0, 3).map((post) => (
                <article key={post.id} className="feed-card">
                  <div className="feed-meta">
                    <span>{post.type}</span>
                    <span>{getCommunityName(communities, post.communityId)}</span>
                  </div>
                  {editingPostId === post.id ? (
                    <div className="stack">
                      <input
                        className="input"
                        value={postDraft.title}
                        onChange={(event) => setPostDraft({ ...postDraft, title: event.target.value })}
                      />
                      <textarea
                        className="input textarea"
                        value={postDraft.content}
                        onChange={(event) => setPostDraft({ ...postDraft, content: event.target.value })}
                      />
                      <select
                        className="input"
                        value={postDraft.type}
                        onChange={(event) => setPostDraft({ ...postDraft, type: event.target.value })}
                      >
                        <option value="discussion">Discussion</option>
                        <option value="announcement">Announcement</option>
                      </select>
                      <div className="request-actions">
                        <button className="primary-button" onClick={() => handleUpdatePost(post.id)}>
                          Save Post
                        </button>
                        <button className="secondary-button" onClick={cancelEditPost}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4>{post.title}</h4>
                      <p>{post.content}</p>
                      <small>
                        Posted in {formatDateTime(post.createdAt)} - {post.likes} likes - {post.commentsCount} comments
                      </small>
                    </>
                  )}
                  {user?.id === post.authorId && editingPostId !== post.id ? (
                    <div className="request-actions post-actions">
                      <button className="secondary-button" onClick={() => startEditPost(post)}>
                        Edit
                      </button>
                      <button className="secondary-button" onClick={() => handleDeletePost(post.id)}>
                        Delete
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
          </div>
        </div>
      </section>

      <section className="join-banner">
        <h2>Connect with your hometown people again</h2>
        <Link to="/auth" className="primary-button button-link">
          Start Your Community Journey
        </Link>
      </section>

      <section className="marketing-footer">
        <div className="footer-copy">
          <h2>Create a community page to connect hometown residents, alumni, and local organizers.</h2>
        </div>

        <div className="footer-grid">
          <div>
            <h4>Platform</h4>
            <p>About</p>
            <p>Communities</p>
            <p>Events</p>
            <p>Guidelines</p>
          </div>
          <div>
            <h4>Neighbors</h4>
            <p>Join a community</p>
            <p>Create a request</p>
            <p>Volunteer drives</p>
            <p>Culture circles</p>
          </div>
          <div>
            <h4>Moderation</h4>
            <p>Admin dashboard</p>
            <p>Member approvals</p>
            <p>Community setup</p>
            <p>Safe participation</p>
          </div>
          <div>
            <h4>Legal</h4>
            <p>Privacy</p>
            <p>Terms</p>
            <p>Cookies</p>
            <p>Support</p>
          </div>
        </div>
      </section>
    </div>
  );
}
