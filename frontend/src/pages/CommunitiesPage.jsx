import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { formatCompactDate } from "../lib/formatters";

export default function CommunitiesPage() {
  const { token, user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [requestForm, setRequestForm] = useState({
    name: "",
    location: "",
    description: ""
  });
  const [inviteCode, setInviteCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const filteredCommunities = communities.filter((community) => {
    const matchesSearch =
      community.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      community.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      community.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" ? true : community.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function loadCommunities() {
    try {
      setLoading(true);
      const data = await api.getCommunities();
      setCommunities(data);
    } catch (requestError) {
      console.error("Failed to load communities", requestError);
      setError("We couldn't load communities right now.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCommunities();
  }, []);

  async function handleCommunityRequest(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!requestForm.name.trim() || !requestForm.location.trim() || !requestForm.description.trim()) {
      setError("Please complete all community request fields before submitting.");
      return;
    }

    try {
      await api.createCommunityRequest(
        {
          name: requestForm.name.trim(),
          location: requestForm.location.trim(),
          description: requestForm.description.trim()
        },
        token
      );
      setMessage("Community request submitted.");
      setRequestForm({ name: "", location: "", description: "" });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleJoin(communityId) {
    setMessage("");
    setError("");

    if (!communityId) {
      setError("This community is missing an identifier. Refresh and try again.");
      return;
    }

    try {
      await api.joinCommunity(communityId, token);
      setMessage("Join request submitted.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleInviteJoin(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!inviteCode.trim()) {
      setError("Enter an invite code before joining.");
      return;
    }

    try {
      const result = await api.joinCommunityByInviteCode(inviteCode.trim(), token);
      setInviteCode("");
      setMessage(`You joined ${result.community.name}.`);
      await loadCommunities();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="page">
      <section className="subpage-hero subpage-hero-communities">
        <div className="subpage-copy">
          <p className="eyebrow">Community Directory</p>
          <h1>Find your city, village, or hometown circle.</h1>
          <p>
            Browse hometown groups, discover where people are already gathering, and request new spaces
            when your community deserves its own digital home.
          </p>
        </div>
        <div className="subpage-aside">
          <article className="metric-tile">
            <strong>{communities.length}</strong>
            <span>communities available</span>
          </article>
          <article className="metric-tile">
            <strong>{communities.reduce((sum, community) => sum + community.memberCount, 0)}</strong>
            <span>combined members</span>
          </article>
        </div>
      </section>

      {message ? <p className="message success">{message}</p> : null}
      {error ? <p className="message error">{error}</p> : null}

      <section className="section-grid product-grid">
        <div className="card elevated-card form-card">
          <div className="section-heading">
            <h3>Request a New Community</h3>
          </div>
          <p className="section-copy">
            If your hometown is missing, propose a new space for residents, alumni, students, and local
            organizers.
          </p>
          <form className="stack" onSubmit={handleCommunityRequest}>
            <input
              className="input"
              placeholder="Community name"
              value={requestForm.name}
              onChange={(event) => setRequestForm({ ...requestForm, name: event.target.value })}
            />
            <input
              className="input"
              placeholder="City or village"
              value={requestForm.location}
              onChange={(event) => setRequestForm({ ...requestForm, location: event.target.value })}
            />
            <textarea
              className="input textarea"
              placeholder="Why should this community be created?"
              value={requestForm.description}
              onChange={(event) => setRequestForm({ ...requestForm, description: event.target.value })}
            />
            <button className="primary-button" type="submit" disabled={!user}>
              {user ? "Submit request" : "Login to request"}
            </button>
          </form>
        </div>

        <div className="card elevated-card info-card">
          <div className="section-heading">
            <h3>Join With Invite Code</h3>
          </div>
          <p className="section-copy">
            If a moderator shared a community invite code, use it to join immediately.
          </p>
          <form className="stack" onSubmit={handleInviteJoin}>
            <input
              className="input"
              placeholder="Example: JAIPURRO-1234"
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value)}
            />
            <button className="primary-button" type="submit" disabled={!user}>
              {user ? "Join by invite" : "Login to use invite"}
            </button>
          </form>
        </div>
      </section>

      <section className="card elevated-card">
        <div className="section-heading">
          <h3>What makes a strong hometown space?</h3>
        </div>
        <div className="community-tips-grid">
          <article className="pill-row">Clear purpose and respectful local culture</article>
          <article className="pill-row">Active moderators from the community</article>
          <article className="pill-row">Useful updates like events, drives, alerts, and support</article>
          <article className="pill-row">A mix of current residents and people living away from home</article>
        </div>
      </section>

      <section className="card elevated-card filter-toolbar">
        <div className="section-heading">
          <h3>Search and Filter</h3>
        </div>
        <div className="filter-row">
          <input
            className="input"
            placeholder="Search by community, location, or description"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <select className="input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </section>

      <section className="directory-grid">
        {loading ? <p className="state-card">Loading hometown communities...</p> : null}
        {!loading && communities.length === 0 ? (
          <p className="state-card">No communities have been approved yet.</p>
        ) : null}
        {!loading && communities.length > 0 && filteredCommunities.length === 0 ? (
          <p className="state-card">No communities match your current search.</p>
        ) : null}
        {!loading &&
          filteredCommunities.map((community) => (
            <article key={community.id} className="community-directory-card">
              <div className="directory-card-top">
                <span className="badge">{community.location}</span>
                <span className="mini-count">{community.memberCount} members</span>
              </div>
              <h3>{community.name}</h3>
              <p>{community.description}</p>
              <div className="tag-row">
                {[community.category, community.status].filter(Boolean).map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
              <small className="soft-meta">Created {formatCompactDate(community.createdAt)}</small>
              <Link to={`/communities/${community.id}`} className="secondary-button button-link full-width-button">
                Open Community
              </Link>
              <button
                className="secondary-button full-width-button"
                onClick={() => handleJoin(community.id)}
                disabled={!user}
              >
                {user ? "Request to Join" : "Login to join"}
              </button>
            </article>
          ))}
      </section>
    </div>
  );
}
