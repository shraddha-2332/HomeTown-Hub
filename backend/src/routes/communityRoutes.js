import { Router } from "express";
import {
  approveCommunityJoin,
  createCommunityRequest,
  getCommunity,
  joinCommunityByInviteCode,
  listCommunities,
  rejectCommunityJoin,
  requestCommunityJoin
} from "../controllers/communityController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", listCommunities);
router.get("/:communityId", getCommunity);
router.post("/requests", requireAuth, createCommunityRequest);
router.post("/join-by-code", requireAuth, joinCommunityByInviteCode);
router.post("/:communityId/join", requireAuth, requestCommunityJoin);
router.patch("/membership-requests/:requestId/approve", requireAuth, approveCommunityJoin);
router.patch("/membership-requests/:requestId/reject", requireAuth, rejectCommunityJoin);

export default router;
