import { nextId, readDb, updateDb } from "../data/db.js";
import { createNotification } from "../utils/notifications.js";

export async function getDashboardSummary(_req, res) {
  const db = await readDb();
  return res.json({
    users: db.users.length,
    communities: db.communities.length,
    posts: db.posts.length,
    events: db.events.length,
    pendingCommunityRequests: db.communityRequests.filter((entry) => entry.status === "pending").length,
    pendingMembershipRequests: db.membershipRequests.filter((entry) => entry.status === "pending").length,
    openReports: db.reports.filter((entry) => entry.status === "open").length
  });
}

export async function listCommunityRequests(_req, res) {
  const db = await readDb();
  const requests = db.communityRequests.map((request) => ({
    ...request,
    requestedByUser: db.users.find((user) => user.id === request.requestedBy) || null
  }));
  return res.json(requests);
}

export async function listMembershipRequests(_req, res) {
  const db = await readDb();
  const requests = db.membershipRequests.map((request) => ({
    ...request,
    community: db.communities.find((community) => community.id === request.communityId) || null,
    user: db.users.find((user) => user.id === request.userId) || null
  }));
  return res.json(requests);
}

export async function approveCommunityRequest(req, res) {
  const { requestId } = req.params;

  const result = await updateDb(async (db) => {
    const request = db.communityRequests.find((entry) => entry.id === requestId);

    if (!request) {
      return { error: { status: 404, message: "Community request not found" } };
    }

    if (request.status !== "pending") {
      return { error: { status: 409, message: "Community request has already been reviewed" } };
    }

    request.status = "approved";
    request.reviewedAt = new Date().toISOString();
    request.reviewedBy = req.user.id;

    const community = {
      id: nextId("c", db.communities),
      name: request.name,
      location: request.location,
      description: request.description,
      category: "Community",
      memberCount: 1,
      status: "approved",
      rules: ["Respect community members", "Keep posts relevant", "Follow moderator guidance"],
      moderators: [request.requestedBy],
      members: [request.requestedBy],
      inviteCode: `${request.name.replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase()}-${Date.now()
        .toString()
        .slice(-4)}`,
      pinnedPostId: null,
      createdBy: request.requestedBy,
      createdAt: new Date().toISOString()
    };

    db.communities.push(community);
    createNotification(db, {
      userId: request.requestedBy,
      title: "Community approved",
      body: `${request.name} is now live on Hometown Hub.`
    });
    return { request, community };
  });

  if (result.error) {
    return res.status(result.error.status).json({ message: result.error.message });
  }

  return res.json({
    message: "Community request approved",
    community: result.community
  });
}

export async function rejectCommunityRequest(req, res) {
  const { requestId } = req.params;

  const result = await updateDb(async (db) => {
    const request = db.communityRequests.find((entry) => entry.id === requestId);

    if (!request) {
      return { error: { status: 404, message: "Community request not found" } };
    }

    if (request.status !== "pending") {
      return { error: { status: 409, message: "Community request has already been reviewed" } };
    }

    request.status = "rejected";
    request.reviewedAt = new Date().toISOString();
    request.reviewedBy = req.user.id;

    createNotification(db, {
      userId: request.requestedBy,
      title: "Community request rejected",
      body: `Your request for ${request.name} was reviewed but not approved.`
    });

    return { request };
  });

  if (result.error) {
    return res.status(result.error.status).json({ message: result.error.message });
  }

  return res.json({
    message: "Community request rejected",
    request: result.request
  });
}

export async function listReports(_req, res) {
  const db = await readDb();
  const reports = db.reports.map((report) => ({
    ...report,
    post: db.posts.find((post) => post.id === report.postId) || null,
    community: db.communities.find((community) => community.id === report.communityId) || null,
    reportedByUser: db.users.find((user) => user.id === report.reportedBy) || null
  }));

  return res.json(reports);
}

export async function resolveReport(req, res) {
  const { reportId } = req.params;
  const { status = "resolved" } = req.body;

  if (!["resolved", "dismissed"].includes(status)) {
    return res.status(400).json({ message: "status must be resolved or dismissed" });
  }

  const result = await updateDb(async (db) => {
    const report = db.reports.find((entry) => entry.id === reportId);

    if (!report) {
      return { error: { status: 404, message: "Report not found" } };
    }

    report.status = status;
    report.reviewedAt = new Date().toISOString();
    report.reviewedBy = req.user.id;

    return { report };
  });

  if (result.error) {
    return res.status(result.error.status).json({ message: result.error.message });
  }

  return res.json({ message: "Report reviewed", report: result.report });
}
