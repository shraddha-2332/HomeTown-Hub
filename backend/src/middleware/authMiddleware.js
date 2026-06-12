import { readDb } from "../data/db.js";
import { verifyToken } from "../utils/auth.js";
import { hasRole } from "../utils/roles.js";
import { sanitizeUser } from "../utils/sanitize.js";

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.replace("Bearer ", "");
    const payload = verifyToken(token);
    const db = await readDb();
    const user = db.users.find((entry) => entry.id === payload.userId);

    if (!user) {
      return res.status(401).json({ message: "Invalid user" });
    }

    req.user = sanitizeUser(user);
    return next();
  } catch (error) {
    return res.status(401).json({ message: error.message || "Invalid token" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!hasRole(req.user, roles)) {
      return res.status(403).json({ message: "You do not have permission to perform this action" });
    }

    return next();
  };
}
