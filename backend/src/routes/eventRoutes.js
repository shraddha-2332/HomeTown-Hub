import { Router } from "express";
import {
  createEvent,
  deleteEvent,
  listEvents,
  rsvpEvent,
  updateEvent
} from "../controllers/eventController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", listEvents);
router.post("/", requireAuth, createEvent);
router.patch("/:eventId", requireAuth, updateEvent);
router.delete("/:eventId", requireAuth, deleteEvent);
router.post("/:eventId/rsvp", requireAuth, rsvpEvent);

export default router;
