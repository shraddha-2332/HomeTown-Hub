import { Router } from "express";
import {
  approveCommunityRequest,
  getDashboardSummary,
  listCommunityRequests,
  listMembershipRequests,
  listReports,
  resolveReport,
  rejectCommunityRequest
} from "../controllers/adminController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/summary", requireAuth, getDashboardSummary);
router.get("/community-requests", requireAuth, requireRole("admin"), listCommunityRequests);
router.get("/membership-requests", requireAuth, requireRole("admin", "moderator"), listMembershipRequests);
router.get("/reports", requireAuth, requireRole("admin", "moderator"), listReports);
router.patch("/community-requests/:requestId/approve", requireAuth, requireRole("admin"), approveCommunityRequest);
router.patch("/community-requests/:requestId/reject", requireAuth, requireRole("admin"), rejectCommunityRequest);
router.patch("/reports/:reportId", requireAuth, requireRole("admin", "moderator"), resolveReport);

export default router;
