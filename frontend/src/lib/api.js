const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function normalizeEntity(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeEntity);
  }

  if (value && typeof value === "object") {
    const normalized = Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, normalizeEntity(entry)])
    );

    if (!normalized.id && normalized._id) {
      normalized.id = String(normalized._id);
    }

    return normalized;
  }

  return value;
}

async function request(path, options = {}) {
  const { headers: customHeaders = {}, ...restOptions } = options;
  let response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...restOptions,
      headers: {
        "Content-Type": "application/json",
        ...customHeaders
      }
    });
  } catch (error) {
    throw new Error("The server is restarting or unavailable. Please wait a moment and try again.");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }

  const data = await response.json();
  return normalizeEntity(data);
}

function withAuth(token) {
  return token
    ? {
        Authorization: `Bearer ${token}`
      }
    : {};
}

export const api = {
  register(payload) {
    return request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  login(payload) {
    return request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  getMe(token) {
    return request("/api/auth/me", {
      headers: withAuth(token)
    });
  },
  updateMe(payload, token) {
    return request("/api/auth/me", {
      method: "PATCH",
      headers: withAuth(token),
      body: JSON.stringify(payload)
    });
  },
  getCommunities() {
    return request("/api/communities");
  },
  getCommunity(communityId) {
    return request(`/api/communities/${communityId}`);
  },
  createCommunityRequest(payload, token) {
    return request("/api/communities/requests", {
      method: "POST",
      headers: withAuth(token),
      body: JSON.stringify(payload)
    });
  },
  joinCommunity(communityId, token) {
    return request(`/api/communities/${communityId}/join`, {
      method: "POST",
      headers: withAuth(token)
    });
  },
  joinCommunityByInviteCode(inviteCode, token) {
    return request("/api/communities/join-by-code", {
      method: "POST",
      headers: withAuth(token),
      body: JSON.stringify({ inviteCode })
    });
  },
  getEvents() {
    return request("/api/events");
  },
  createEvent(payload, token) {
    return request("/api/events", {
      method: "POST",
      headers: withAuth(token),
      body: JSON.stringify(payload)
    });
  },
  updateEvent(eventId, payload, token) {
    return request(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: withAuth(token),
      body: JSON.stringify(payload)
    });
  },
  deleteEvent(eventId, token) {
    return request(`/api/events/${eventId}`, {
      method: "DELETE",
      headers: withAuth(token)
    });
  },
  rsvpEvent(eventId, token) {
    return request(`/api/events/${eventId}/rsvp`, {
      method: "POST",
      headers: withAuth(token)
    });
  },
  getPosts(communityId) {
    const query = communityId ? `?communityId=${communityId}` : "";
    return request(`/api/posts${query}`);
  },
  createPost(payload, token) {
    return request("/api/posts", {
      method: "POST",
      headers: withAuth(token),
      body: JSON.stringify(payload)
    });
  },
  updatePost(postId, payload, token) {
    return request(`/api/posts/${postId}`, {
      method: "PATCH",
      headers: withAuth(token),
      body: JSON.stringify(payload)
    });
  },
  deletePost(postId, token) {
    return request(`/api/posts/${postId}`, {
      method: "DELETE",
      headers: withAuth(token)
    });
  },
  createComment(postId, payload, token) {
    return request(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: withAuth(token),
      body: JSON.stringify(payload)
    });
  },
  togglePostLike(postId, token) {
    return request(`/api/posts/${postId}/like`, {
      method: "POST",
      headers: withAuth(token)
    });
  },
  reportPost(postId, payload, token) {
    return request(`/api/posts/${postId}/report`, {
      method: "POST",
      headers: withAuth(token),
      body: JSON.stringify(payload)
    });
  },
  getAdminSummary() {
    return request("/api/admin/summary");
  },
  getAdminSummaryAuthed(token) {
    return request("/api/admin/summary", {
      headers: withAuth(token)
    });
  },
  getCommunityRequests(token) {
    return request("/api/admin/community-requests", {
      headers: withAuth(token)
    });
  },
  approveCommunityRequest(requestId, token) {
    return request(`/api/admin/community-requests/${requestId}/approve`, {
      method: "PATCH",
      headers: withAuth(token)
    });
  },
  rejectCommunityRequest(requestId, token) {
    return request(`/api/admin/community-requests/${requestId}/reject`, {
      method: "PATCH",
      headers: withAuth(token)
    });
  },
  getMembershipRequests(token) {
    return request("/api/admin/membership-requests", {
      headers: withAuth(token)
    });
  },
  getReports(token) {
    return request("/api/admin/reports", {
      headers: withAuth(token)
    });
  },
  reviewReport(reportId, status, token) {
    return request(`/api/admin/reports/${reportId}`, {
      method: "PATCH",
      headers: withAuth(token),
      body: JSON.stringify({ status })
    });
  },
  approveMembershipRequest(requestId, token) {
    return request(`/api/communities/membership-requests/${requestId}/approve`, {
      method: "PATCH",
      headers: withAuth(token)
    });
  },
  rejectMembershipRequest(requestId, token) {
    return request(`/api/communities/membership-requests/${requestId}/reject`, {
      method: "PATCH",
      headers: withAuth(token)
    });
  },
  getNotifications(token) {
    return request("/api/notifications", {
      headers: withAuth(token)
    });
  },
  markNotificationRead(notificationId, token) {
    return request(`/api/notifications/${notificationId}/read`, {
      method: "PATCH",
      headers: withAuth(token)
    });
  }
};
