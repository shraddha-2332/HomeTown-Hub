import { nextId, readDb, updateDb } from "../data/db.js";

export async function listPosts(req, res) {
  const { communityId } = req.query;
  const db = await readDb();
  const posts = communityId ? db.posts.filter((entry) => entry.communityId === communityId) : db.posts;

  return res.json(posts);
}

export async function createPost(req, res) {
  const { communityId, title, content, type = "discussion" } = req.body;

  if (!communityId || !title || !content) {
    return res.status(400).json({ message: "communityId, title, and content are required" });
  }

  const result = await updateDb(async (db) => {
    const community = db.communities.find((entry) => entry.id === communityId);

    if (!community) {
      return { error: { status: 404, message: "Community not found" } };
    }

    if (!community.members.includes(req.user.id)) {
      return { error: { status: 403, message: "Only community members can create posts" } };
    }

    const post = {
      id: nextId("p", db.posts),
      communityId,
      authorId: req.user.id,
      title,
      content,
      type,
      likes: 0,
      likedBy: [],
      commentsCount: 0,
      createdAt: new Date().toISOString(),
      pinned: false
    };

    db.posts.unshift(post);
    return { post };
  });

  if (result.error) {
    return res.status(result.error.status).json({ message: result.error.message });
  }

  return res.status(201).json({
    message: "Post created successfully",
    post: result.post
  });
}

export async function updatePost(req, res) {
  const { postId } = req.params;
  const { title, content, type } = req.body;

  const result = await updateDb(async (db) => {
    const post = db.posts.find((entry) => entry.id === postId);

    if (!post) {
      return { error: { status: 404, message: "Post not found" } };
    }

    if (post.authorId !== req.user.id) {
      return { error: { status: 403, message: "You can only edit your own posts" } };
    }

    post.title = title ?? post.title;
    post.content = content ?? post.content;
    post.type = type ?? post.type;
    post.updatedAt = new Date().toISOString();

    return { post };
  });

  if (result.error) {
    return res.status(result.error.status).json({ message: result.error.message });
  }

  return res.json({ message: "Post updated successfully", post: result.post });
}

export async function deletePost(req, res) {
  const { postId } = req.params;

  const result = await updateDb(async (db) => {
    const postIndex = db.posts.findIndex((entry) => entry.id === postId);

    if (postIndex === -1) {
      return { error: { status: 404, message: "Post not found" } };
    }

    const post = db.posts[postIndex];

    if (post.authorId !== req.user.id) {
      return { error: { status: 403, message: "You can only delete your own posts" } };
    }

    db.posts.splice(postIndex, 1);
    db.comments = db.comments.filter((entry) => entry.postId !== postId);

    return { success: true };
  });

  if (result.error) {
    return res.status(result.error.status).json({ message: result.error.message });
  }

  return res.json({ message: "Post deleted successfully" });
}

export async function addComment(req, res) {
  const { postId } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: "Comment content is required" });
  }

  const result = await updateDb(async (db) => {
    const post = db.posts.find((entry) => entry.id === postId);

    if (!post) {
      return { error: { status: 404, message: "Post not found" } };
    }

    const community = db.communities.find((entry) => entry.id === post.communityId);

    if (!community?.members.includes(req.user.id)) {
      return { error: { status: 403, message: "Only community members can comment" } };
    }

    const comment = {
      id: nextId("cm", db.comments),
      postId,
      authorId: req.user.id,
      content,
      createdAt: new Date().toISOString()
    };

    db.comments.push(comment);
    post.commentsCount += 1;

    return { comment };
  });

  if (result.error) {
    return res.status(result.error.status).json({ message: result.error.message });
  }

  return res.status(201).json({ message: "Comment added successfully", comment: result.comment });
}

export async function togglePostLike(req, res) {
  const { postId } = req.params;

  const result = await updateDb(async (db) => {
    const post = db.posts.find((entry) => entry.id === postId);

    if (!post) {
      return { error: { status: 404, message: "Post not found" } };
    }

    const community = db.communities.find((entry) => entry.id === post.communityId);

    if (!community?.members.includes(req.user.id)) {
      return { error: { status: 403, message: "Only community members can like posts" } };
    }

    post.likedBy = Array.isArray(post.likedBy) ? post.likedBy : [];

    if (post.likedBy.includes(req.user.id)) {
      post.likedBy = post.likedBy.filter((userId) => userId !== req.user.id);
    } else {
      post.likedBy.push(req.user.id);
    }

    post.likes = post.likedBy.length;
    return { post };
  });

  if (result.error) {
    return res.status(result.error.status).json({ message: result.error.message });
  }

  return res.json({ message: "Post reaction updated", post: result.post });
}

export async function reportPost(req, res) {
  const { postId } = req.params;
  const { reason } = req.body;

  if (!reason?.trim()) {
    return res.status(400).json({ message: "A report reason is required" });
  }

  const result = await updateDb(async (db) => {
    const post = db.posts.find((entry) => entry.id === postId);

    if (!post) {
      return { error: { status: 404, message: "Post not found" } };
    }

    const report = {
      id: nextId("r", db.reports),
      postId,
      communityId: post.communityId,
      reportedBy: req.user.id,
      reason: reason.trim(),
      status: "open",
      createdAt: new Date().toISOString()
    };

    db.reports.push(report);
    return { report };
  });

  if (result.error) {
    return res.status(result.error.status).json({ message: result.error.message });
  }

  return res.status(201).json({ message: "Report submitted for moderator review", report: result.report });
}
