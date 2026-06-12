import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { formatDateTime, getUserName } from "../lib/formatters";

const initialPostForm = {
  title: "",
  content: "",
  type: "discussion"
};

export default function CommunityDetailPage() {
  const { communityId } = useParams();
  const { token, user } = useAuth();
  const [community, setCommunity] = useState(null);
  const [postForm, setPostForm] = useState(initialPostForm);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [reportDrafts, setReportDrafts] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadCommunity() {
    try {
      setLoading(true);
      setError("");
      const data = await api.getCommunity(communityId);
      setCommunity(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCommunity();
  }, [communityId]);

  const isMember = Boolean(user && community?.members?.includes(user.id));
  const posts = useMemo(() => community?.posts || [], [community]);
  const commentsByPost = useMemo(() => {
    const comments = community?.comments || [];
    return comments.reduce((groups, comment) => {
      const current = groups[comment.postId] || [];
      return { ...groups, [comment.postId]: [...current, comment] };
    }, {});
  }, [community]);

  async function handleJoin() {
    try {
      setMessage("");
      setError("");
      await api.joinCommunity(community.id, token);
      setMessage("Join request submitted. A moderator will review it.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleCreatePost(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!postForm.title.trim() || !postForm.content.trim()) {
      setError("Please add a title and content before posting.");
      return;
    }

    try {
      await api.createPost(
        {
          communityId,
          title: postForm.title.trim(),
          content: postForm.content.trim(),
          type: postForm.type
        },
        token
      );
      setPostForm(initialPostForm);
      setMessage("Post shared with the community.");
      await loadCommunity();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleComment(postId) {
    const content = commentDrafts[postId]?.trim();

    if (!content) {
      setError("Write a comment before submitting.");
      return;
    }

    try {
      setMessage("");
      setError("");
      await api.createComment(postId, { content }, token);
      setCommentDrafts((current) => ({ ...current, [postId]: "" }));
      setMessage("Comment added.");
      await loadCommunity();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleLike(postId) {
    try {
      setMessage("");
      setError("");
      await api.togglePostLike(postId, token);
      await loadCommunity();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleReport(postId) {
    const reason = reportDrafts[postId]?.trim();

    if (!reason) {
      setError("Please add a reason for the report.");
      return;
    }

    try {
      setMessage("");
      setError("");
      await api.reportPost(postId, { reason }, token);
      setReportDrafts((current) => ({ ...current, [postId]: "" }));
      setMessage("Report submitted for moderator review.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  if (loading) {
    return <p className="state-card">Loading community...</p>;
  }

  if (!community) {
    return <p className="message error">{error || "Community not found."}</p>;
  }

  return (
    <div className="page">
      <section className="subpage-hero subpage-hero-communities">
        <div className="subpage-copy">
          <p className="eyebrow">Community Space</p>
          <h1>{community.name}</h1>
          <p>{community.description}</p>
        </div>
        <div className="subpage-aside admin-summary-panel">
          <article className="metric-tile">
            <strong>{community.memberCount}</strong>
            <span>members</span>
          </article>
          <article className="metric-tile">
            <strong>{posts.length}</strong>
            <span>posts</span>
          </article>
          <article className="metric-tile">
            <strong>{community.events?.length || 0}</strong>
            <span>events</span>
          </article>
          <article className="metric-tile">
            <strong>{community.location}</strong>
            <span>location</span>
          </article>
        </div>
      </section>

      {message ? <p className="message success">{message}</p> : null}
      {error ? <p className="message error">{error}</p> : null}

      <section className="section-grid community-detail-grid">
        <div className="card elevated-card form-card">
          <div className="section-heading">
            <h3>Share an Update</h3>
          </div>
          {isMember ? (
            <form className="stack" onSubmit={handleCreatePost}>
              <input
                className="input"
                placeholder="Post title"
                value={postForm.title}
                onChange={(event) => setPostForm({ ...postForm, title: event.target.value })}
              />
              <textarea
                className="input textarea"
                placeholder="Announcement, question, memory, or useful local update"
                value={postForm.content}
                onChange={(event) => setPostForm({ ...postForm, content: event.target.value })}
              />
              <select
                className="input"
                value={postForm.type}
                onChange={(event) => setPostForm({ ...postForm, type: event.target.value })}
              >
                <option value="discussion">Discussion</option>
                <option value="announcement">Announcement</option>
              </select>
              <button className="primary-button" type="submit">
                Publish Post
              </button>
            </form>
          ) : (
            <div className="stack">
              <p className="state-card">Join this community to post, comment, like, RSVP, and participate.</p>
              <button className="primary-button" onClick={handleJoin} disabled={!user}>
                {user ? "Request to Join" : "Login to Join"}
              </button>
            </div>
          )}
        </div>

        <div className="card elevated-card">
          <div className="section-heading">
            <h3>Rules and Members</h3>
          </div>
          <div className="stack">
            {(community.rules || []).map((rule) => (
              <article key={rule} className="pill-row">
                {rule}
              </article>
            ))}
            <article className="pill-row">
              Moderators: {(community.moderators || []).map((id) => getUserName(community.users || [], id)).join(", ")}
            </article>
            <article className="pill-row">
              Invite code: <strong>{community.inviteCode || "Moderator approval"}</strong>
            </article>
          </div>
        </div>
      </section>

      <section className="section-grid community-detail-grid">
        <div className="card elevated-card">
          <div className="section-heading">
            <h3>Community Feed</h3>
          </div>
          <div className="stack">
            {posts.length === 0 ? <p className="state-card">No posts yet.</p> : null}
            {posts.map((post) => {
              const postComments = commentsByPost[post.id] || [];
              const liked = post.likedBy?.includes(user?.id);

              return (
                <article key={post.id} className="feed-card detail-feed-card">
                  <div className="feed-meta">
                    <span>{post.type}</span>
                    <span>{getUserName(community.users || [], post.authorId)}</span>
                    <span>{formatDateTime(post.createdAt)}</span>
                  </div>
                  <h4>{post.title}</h4>
                  <p>{post.content}</p>
                  <div className="request-actions">
                    <button className="secondary-button" onClick={() => handleLike(post.id)} disabled={!isMember}>
                      {liked ? "Unlike" : "Like"} ({post.likes || 0})
                    </button>
                  </div>

                  <div className="comment-thread">
                    {postComments.map((comment) => (
                      <article key={comment.id} className="comment-card">
                        <strong>{getUserName(community.users || [], comment.authorId)}</strong>
                        <p>{comment.content}</p>
                        <small>{formatDateTime(comment.createdAt)}</small>
                      </article>
                    ))}
                  </div>

                  {isMember ? (
                    <div className="inline-form">
                      <textarea
                        className="input"
                        placeholder="Add a helpful comment"
                        value={commentDrafts[post.id] || ""}
                        onChange={(event) =>
                          setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))
                        }
                      />
                      <button className="secondary-button" onClick={() => handleComment(post.id)}>
                        Add Comment
                      </button>
                      <input
                        className="input"
                        placeholder="Report reason, if this post needs moderator review"
                        value={reportDrafts[post.id] || ""}
                        onChange={(event) =>
                          setReportDrafts((current) => ({ ...current, [post.id]: event.target.value }))
                        }
                      />
                      <button className="secondary-button" onClick={() => handleReport(post.id)}>
                        Report Post
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>

        <div className="card elevated-card">
          <div className="section-heading">
            <h3>Upcoming Events</h3>
          </div>
          <div className="stack">
            {(community.events || []).length === 0 ? <p className="state-card">No events yet.</p> : null}
            {(community.events || []).map((event) => (
              <article key={event.id} className="pill-row">
                <strong>{event.title}</strong>
                <br />
                {formatDateTime(event.date)} at {event.venue}
              </article>
            ))}
            <Link to="/events" className="secondary-button button-link full-width-button">
              Open Events
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
