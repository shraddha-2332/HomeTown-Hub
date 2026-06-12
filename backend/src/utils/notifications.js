import { nextId } from "../data/db.js";

export function createNotification(db, { userId, title, body }) {
  const notification = {
    id: nextId("n", db.notifications),
    userId,
    title,
    body,
    read: false,
    createdAt: new Date().toISOString()
  };

  db.notifications.push(notification);
  return notification;
}
