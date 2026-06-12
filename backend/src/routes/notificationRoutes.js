import { Router } from "express";
import { listNotifications, markNotificationRead } from "../controllers/notificationController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", requireAuth, listNotifications);
router.patch("/:notificationId/read", requireAuth, markNotificationRead);

export default router;
