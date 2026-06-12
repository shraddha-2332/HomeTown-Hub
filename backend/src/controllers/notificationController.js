import { readDb, updateDb } from "../data/db.js";

export async function listNotifications(req, res) {
  const { userId } = req.query;
  const db = await readDb();
  const effectiveUserId = userId || req.user?.id;
  const notifications = effectiveUserId
    ? db.notifications.filter((entry) => entry.userId === effectiveUserId)
    : db.notifications;

  return res.json(notifications);
}

export async function markNotificationRead(req, res) {
  const { notificationId } = req.params;

  const result = await updateDb(async (db) => {
    const notification = db.notifications.find(
      (entry) => entry.id === notificationId && entry.userId === req.user.id
    );

    if (!notification) {
      return { error: { status: 404, message: "Notification not found" } };
    }

    notification.read = true;
    notification.readAt = new Date().toISOString();
    return { notification };
  });

  if (result.error) {
    return res.status(result.error.status).json({ message: result.error.message });
  }

  return res.json({ message: "Notification marked as read", notification: result.notification });
}
