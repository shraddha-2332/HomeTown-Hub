import { nextId, readDb, updateDb } from "../data/db.js";
import { createNotification } from "../utils/notifications.js";

export async function listCommunities(_req, res) {
  const db = await readDb();
  return res.json(db.communities);
}

export async function getCommunity(req, res) {
  const db = await readDb();
  const community = db.communities.find((entry) => entry.id === req.params.communityId);

  if (!community) {
    return res.status(404).json({ message: "Community not found" });
  }

  const posts = db.posts.filter((entry) => entry.communityId === community.id);
  const events = db.events.filter((entry) => entry.communityId === community.id);
  const membershipRequests = db.membershipRequests.filter((entry) => entry.communityId === community.id);
  const comments = db.comments.filter((comment) => posts.some((post) => post.id === comment.postId));
  const users = db.users.map(({ passwordHash, ...user }) => user);

  return res.json({
    ...community,
    posts,
    events,
    membershipRequests,
    comments,
    users
  });
}

export async function createCommunityRequest(req, res) {
  const { name, location, description } = req.body;

  if (!name || !location || !description) {
    return res.status(400).json({ message: "name, location, and description are required" });
  }

  const request = await updateDb(async (db) => {
    const createdRequest = {
      id: nextId("cr", db.communityRequests),
      name,
      location,
      description,
      requestedBy: req.user.id,
      status: "pending",
      requestedAt: new Date().toISOString()
    };

    db.communityRequests.push(createdRequest);
    return createdRequest;
  });

  return res.status(201).json({
    message: "Community creation request submitted",
    request
  });
}

export async function requestCommunityJoin(req, res) {
  const { communityId } = req.params;

  const result = await updateDb(async (db) => {
    const community = db.communities.find((entry) => entry.id === communityId);

    if (!community) {
      return { error: { status: 404, message: "Community not found" } };
    }

    if (community.members.includes(req.user.id)) {
      return { error: { status: 409, message: "You are already a member of this community" } };
    }

    const existingRequest = db.membershipRequests.find(
      (entry) => entry.communityId === communityId && entry.userId === req.user.id && entry.status === "pending"
    );

    if (existingRequest) {
      return { error: { status: 409, message: "Join request already pending" } };
    }

    const membershipRequest = {
      id: nextId("mr", db.membershipRequests),
      communityId,
      userId: req.user.id,
      status: "pending",
      requestedAt: new Date().toISOString()
    };

    db.membershipRequests.push(membershipRequest);
    return { membershipRequest };
  });

  if (result.error) {
    return res.status(result.error.status).json({ message: result.error.message });
  }

  return res.status(201).json({
    message: "Community join request submitted",
    request: result.membershipRequest
  });
}

export async function joinCommunityByInviteCode(req, res) {
  const { inviteCode } = req.body;

  if (!inviteCode?.trim()) {
    return res.status(400).json({ message: "inviteCode is required" });
  }

  const result = await updateDb(async (db) => {
    const community = db.communities.find(
      (entry) => entry.inviteCode?.toLowerCase() === inviteCode.trim().toLowerCase()
    );

    if (!community) {
      return { error: { status: 404, message: "Invite code not found" } };
    }

    if (community.members.includes(req.user.id)) {
      return { error: { status: 409, message: "You are already a member of this community" } };
    }

    community.members.push(req.user.id);
    community.memberCount = community.members.length;

    db.membershipRequests.push({
      id: nextId("mr", db.membershipRequests),
      communityId: community.id,
      userId: req.user.id,
      status: "approved",
      requestedAt: new Date().toISOString(),
      reviewedAt: new Date().toISOString(),
      reviewedBy: "invite-code"
    });

    createNotification(db, {
      userId: req.user.id,
      title: "Community joined",
      body: `You joined ${community.name} using an invite code.`
    });

    return { community };
  });

  if (result.error) {
    return res.status(result.error.status).json({ message: result.error.message });
  }

  return res.json({
    message: "Community joined successfully",
    community: result.community
  });
}

export async function approveCommunityJoin(req, res) {
  const { requestId } = req.params;

  const result = await updateDb(async (db) => {
    const membershipRequest = db.membershipRequests.find((entry) => entry.id === requestId);

    if (!membershipRequest) {
      return { error: { status: 404, message: "Membership request not found" } };
    }

    const community = db.communities.find((entry) => entry.id === membershipRequest.communityId);

    if (!community) {
      return { error: { status: 404, message: "Community not found" } };
    }

    if (!community.moderators.includes(req.user.id) && req.user.role !== "admin") {
      return { error: { status: 403, message: "Only community moderators can approve join requests" } };
    }

    membershipRequest.status = "approved";
    membershipRequest.reviewedAt = new Date().toISOString();
    membershipRequest.reviewedBy = req.user.id;

    if (!community.members.includes(membershipRequest.userId)) {
      community.members.push(membershipRequest.userId);
      community.memberCount = community.members.length;
    }

    createNotification(db, {
      userId: membershipRequest.userId,
      title: "Join request approved",
      body: `Your request to join ${community.name} was approved.`
    });

    return { membershipRequest, community };
  });

  if (result.error) {
    return res.status(result.error.status).json({ message: result.error.message });
  }

  return res.json({
    message: "Membership request approved",
    request: result.membershipRequest
  });
}

export async function rejectCommunityJoin(req, res) {
  const { requestId } = req.params;

  const result = await updateDb(async (db) => {
    const membershipRequest = db.membershipRequests.find((entry) => entry.id === requestId);

    if (!membershipRequest) {
      return { error: { status: 404, message: "Membership request not found" } };
    }

    const community = db.communities.find((entry) => entry.id === membershipRequest.communityId);

    if (!community) {
      return { error: { status: 404, message: "Community not found" } };
    }

    if (!community.moderators.includes(req.user.id) && req.user.role !== "admin") {
      return { error: { status: 403, message: "Only community moderators can reject join requests" } };
    }

    membershipRequest.status = "rejected";
    membershipRequest.reviewedAt = new Date().toISOString();
    membershipRequest.reviewedBy = req.user.id;

    createNotification(db, {
      userId: membershipRequest.userId,
      title: "Join request rejected",
      body: `Your request to join ${community.name} was rejected.`
    });

    return { membershipRequest };
  });

  if (result.error) {
    return res.status(result.error.status).json({ message: result.error.message });
  }

  return res.json({
    message: "Membership request rejected",
    request: result.membershipRequest
  });
}
