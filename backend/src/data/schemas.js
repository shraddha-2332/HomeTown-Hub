import mongoose from "mongoose";

const { Schema } = mongoose;

const baseOptions = {
  strict: true,
  versionKey: false
};

const userSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["member", "moderator", "admin"], default: "member" },
    hometown: { type: String, required: true, trim: true },
    bio: { type: String, default: "New community member" }
  },
  baseOptions
);

const communitySchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, default: "Community" },
    memberCount: { type: Number, default: 0 },
    status: { type: String, enum: ["approved", "pending", "archived"], default: "approved" },
    rules: { type: [String], default: [] },
    moderators: { type: [String], default: [] },
    members: { type: [String], default: [] },
    inviteCode: { type: String, trim: true },
    pinnedPostId: { type: String, default: null },
    createdBy: { type: String, required: true },
    createdAt: { type: String, required: true }
  },
  baseOptions
);

const postSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    communityId: { type: String, required: true },
    authorId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    type: { type: String, enum: ["discussion", "announcement"], default: "discussion" },
    likes: { type: Number, default: 0 },
    likedBy: { type: [String], default: [] },
    commentsCount: { type: Number, default: 0 },
    createdAt: { type: String, required: true },
    updatedAt: { type: String },
    pinned: { type: Boolean, default: false }
  },
  baseOptions
);

const commentSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    postId: { type: String, required: true },
    authorId: { type: String, required: true },
    content: { type: String, required: true, trim: true },
    createdAt: { type: String, required: true }
  },
  baseOptions
);

const eventSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    communityId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    venue: { type: String, required: true, trim: true },
    organizerId: { type: String, required: true },
    attendees: { type: [String], default: [] },
    updatedAt: { type: String }
  },
  baseOptions
);

const notificationSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: String, required: true },
    readAt: { type: String }
  },
  baseOptions
);

const communityRequestSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    requestedBy: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    requestedAt: { type: String, required: true },
    reviewedAt: { type: String },
    reviewedBy: { type: String }
  },
  baseOptions
);

const membershipRequestSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    communityId: { type: String, required: true },
    userId: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    requestedAt: { type: String, required: true },
    reviewedAt: { type: String },
    reviewedBy: { type: String }
  },
  baseOptions
);

const reportSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    postId: { type: String },
    communityId: { type: String },
    reportedBy: { type: String, required: true },
    reason: { type: String, required: true, trim: true },
    status: { type: String, enum: ["open", "resolved", "dismissed"], default: "open" },
    createdAt: { type: String, required: true },
    reviewedAt: { type: String },
    reviewedBy: { type: String }
  },
  baseOptions
);

export const UserModel = mongoose.models.User || mongoose.model("User", userSchema, "users");
export const CommunityModel =
  mongoose.models.Community || mongoose.model("Community", communitySchema, "communities");
export const PostModel = mongoose.models.Post || mongoose.model("Post", postSchema, "posts");
export const CommentModel = mongoose.models.Comment || mongoose.model("Comment", commentSchema, "comments");
export const EventModel = mongoose.models.Event || mongoose.model("Event", eventSchema, "events");
export const NotificationModel =
  mongoose.models.Notification || mongoose.model("Notification", notificationSchema, "notifications");
export const CommunityRequestModel =
  mongoose.models.CommunityRequest ||
  mongoose.model("CommunityRequest", communityRequestSchema, "communityRequests");
export const MembershipRequestModel =
  mongoose.models.MembershipRequest ||
  mongoose.model("MembershipRequest", membershipRequestSchema, "membershipRequests");
export const ReportModel = mongoose.models.Report || mongoose.model("Report", reportSchema, "reports");
