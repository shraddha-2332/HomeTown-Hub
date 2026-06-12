import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { formatDateTime } from "../lib/formatters";

function RequestCard({ title, subtitle, details, onApprove, onReject, approveLabel, rejectLabel }) {
  return (
    <article className="request-card moderation-card">
      <div className="request-copy">
        <h4>{title}</h4>
        <p>{subtitle}</p>
        {details.map((detail) => (
          <small key={detail}>{detail}</small>
        ))}
      </div>
      <div className="request-actions">
        {onApprove ? (
          <button className="primary-button" onClick={onApprove}>
            {approveLabel}
          </button>
        ) : null}
        {onReject ? (
          <button className="secondary-button" onClick={onReject}>
            {rejectLabel}
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default function AdminPage() {
  const { token, user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [communityRequests, setCommunityRequests] = useState([]);
  const [membershipRequests, setMembershipRequests] = useState([]);
  const [reports, setReports] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadAdminData() {
    if (!token) {
      return;
    }

    setError("");

    try {
      setLoading(true);
      const [summaryData, communityRequestData, membershipRequestData, reportData] = await Promise.all([
        api.getAdminSummaryAuthed(token),
        user?.role === "admin" ? api.getCommunityRequests(token) : Promise.resolve([]),
        user?.role === "admin" || user?.role === "moderator"
          ? api.getMembershipRequests(token)
          : Promise.resolve([]),
        user?.role === "admin" || user?.role === "moderator"
          ? api.getReports(token)
          : Promise.resolve([])
      ]);

      setSummary(summaryData);
      setCommunityRequests(communityRequestData);
      setMembershipRequests(
        membershipRequestData.filter((request) =>
          user?.role === "admin" ? true : request.community?.moderators?.includes(user?.id)
        )
      );
      setReports(
        reportData.filter((report) =>
          user?.role === "admin" ? true : report.community?.moderators?.includes(user?.id)
        )
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, [token, user?.id, user?.role]);

  async function handleAction(action) {
    setMessage("");
    setError("");

    try {
      await action();
      setMessage("Moderation action completed successfully.");
      await loadAdminData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const cards = [
    { label: "Pending community requests", value: summary?.pendingCommunityRequests ?? "--" },
    { label: "Pending join requests", value: summary?.pendingMembershipRequests ?? "--" },
    { label: "Open reports", value: summary?.openReports ?? "--" },
    { label: "Total communities", value: summary?.communities ?? "--" },
    { label: "Total users", value: summary?.users ?? "--" }
  ];

  return (
    <div className="page">
      <section className="subpage-hero subpage-hero-admin">
        <div className="subpage-copy">
          <p className="eyebrow">Moderation Hub</p>
          <h1>Review requests, protect the community, and guide healthy participation.</h1>
          <p>
            This space helps platform admins and community moderators approve growth carefully while
            keeping hometown discussions trustworthy.
          </p>
        </div>
        <div className="subpage-aside admin-summary-panel">
          {cards.map((card) => (
            <article key={card.label} className="metric-tile">
              <strong>{card.value}</strong>
              <span>{card.label}</span>
            </article>
          ))}
        </div>
      </section>

      {!user ? <p className="message error">Login first to access protected admin and moderation data.</p> : null}
      {message ? <p className="message success">{message}</p> : null}
      {error ? <p className="message error">{error}</p> : null}

      <section className="section-grid moderation-grid">
        <div className="card elevated-card">
          <div className="section-heading">
            <h3>Community Requests</h3>
          </div>
          <p className="section-copy">Platform admins decide which new hometown communities should be opened.</p>
          {loading ? <p className="state-card">Loading moderation queues...</p> : null}
          {user?.role !== "admin" ? (
            <p className="message error">Only the platform admin can approve new community creation requests.</p>
          ) : communityRequests.filter((request) => request.status === "pending").length === 0 ? (
            <p className="pill-row">No pending community requests right now.</p>
          ) : (
            <div className="stack">
              {communityRequests
                .filter((request) => request.status === "pending")
                .map((request) => (
                  <RequestCard
                    key={request.id}
                    title={request.name}
                    subtitle={`${request.location} - ${request.description}`}
                    details={[
                      `Requested by: ${request.requestedByUser?.name || request.requestedBy}`,
                      `Requested at: ${formatDateTime(request.requestedAt)}`
                    ]}
                    approveLabel="Approve Community"
                    rejectLabel="Reject"
                    onApprove={() => handleAction(() => api.approveCommunityRequest(request.id, token))}
                    onReject={() => handleAction(() => api.rejectCommunityRequest(request.id, token))}
                  />
                ))}
            </div>
          )}
        </div>

        <div className="card elevated-card">
          <div className="section-heading">
            <h3>Join Requests</h3>
          </div>
          <p className="section-copy">Moderators and admins can review who joins each hometown space.</p>
          {loading ? <p className="state-card">Loading membership queue...</p> : null}
          {!user || (user.role !== "admin" && user.role !== "moderator") ? (
            <p className="message error">Moderator or admin access is required to review membership requests.</p>
          ) : membershipRequests.filter((request) => request.status === "pending").length === 0 ? (
            <p className="pill-row">No pending join requests right now.</p>
          ) : (
            <div className="stack">
              {membershipRequests
                .filter((request) => request.status === "pending")
                .map((request) => (
                  <RequestCard
                    key={request.id}
                    title={`${request.user?.name || request.userId} wants to join`}
                    subtitle={request.community?.name || request.communityId}
                    details={[
                      `User hometown: ${request.user?.hometown || "Unknown"}`,
                      `Requested at: ${formatDateTime(request.requestedAt)}`
                    ]}
                    approveLabel="Approve Join"
                    rejectLabel="Reject"
                    onApprove={() => handleAction(() => api.approveMembershipRequest(request.id, token))}
                    onReject={() => handleAction(() => api.rejectMembershipRequest(request.id, token))}
                  />
                ))}
            </div>
          )}
        </div>
      </section>

      <section className="card elevated-card">
        <div className="section-heading">
          <h3>Reported Content</h3>
        </div>
        <p className="section-copy">Review posts that members flagged for moderator attention.</p>
        {!user || (user.role !== "admin" && user.role !== "moderator") ? (
          <p className="message error">Moderator or admin access is required to review reports.</p>
        ) : reports.filter((report) => report.status === "open").length === 0 ? (
          <p className="pill-row">No open reports right now.</p>
        ) : (
          <div className="stack">
            {reports
              .filter((report) => report.status === "open")
              .map((report) => (
                <RequestCard
                  key={report.id}
                  title={report.post?.title || "Reported post"}
                  subtitle={report.reason}
                  details={[
                    `Community: ${report.community?.name || report.communityId}`,
                    `Reported by: ${report.reportedByUser?.name || report.reportedBy}`,
                    `Created at: ${formatDateTime(report.createdAt)}`
                  ]}
                  approveLabel="Resolve"
                  rejectLabel="Dismiss"
                  onApprove={() => handleAction(() => api.reviewReport(report.id, "resolved", token))}
                  onReject={() => handleAction(() => api.reviewReport(report.id, "dismissed", token))}
                />
              ))}
          </div>
        )}
      </section>

      <section className="section-grid moderation-grid">
        <div className="card elevated-card">
          <div className="section-heading">
            <h3>Moderation Principles</h3>
          </div>
          <div className="stack">
            <article className="pill-row">Prioritize real local connection over anonymous spam.</article>
            <article className="pill-row">Approve communities with clear purpose and strong local relevance.</article>
            <article className="pill-row">Support civic, cultural, and volunteer collaboration.</article>
            <article className="pill-row">Keep the environment welcoming, practical, and respectful.</article>
          </div>
        </div>

        <div className="card elevated-card">
          <div className="section-heading">
            <h3>Demo Credentials</h3>
          </div>
          <div className="stack">
            <article className="pill-row">Admin: admin@hometownhub.com / password123</article>
            <article className="pill-row">Moderator: priya@example.com / password123</article>
            <article className="pill-row">Member: aarav@example.com / password123</article>
          </div>
        </div>
      </section>
    </div>
  );
}
