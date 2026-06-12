import { nextId, readDb, updateDb } from "../data/db.js";

export async function listEvents(req, res) {
  const { communityId } = req.query;
  const db = await readDb();
  const events = communityId ? db.events.filter((entry) => entry.communityId === communityId) : db.events;

  return res.json(events);
}

export async function createEvent(req, res) {
  const { communityId, title, description, date, venue } = req.body;

  if (!communityId || !title || !description || !date || !venue) {
    return res.status(400).json({ message: "communityId, title, description, date, and venue are required" });
  }

  const result = await updateDb(async (db) => {
    const community = db.communities.find((entry) => entry.id === communityId);

    if (!community) {
      return { error: { status: 404, message: "Community not found" } };
    }

    if (!community.members.includes(req.user.id)) {
      return { error: { status: 403, message: "Only community members can create events" } };
    }

    const event = {
      id: nextId("e", db.events),
      communityId,
      title,
      description,
      date,
      venue,
      organizerId: req.user.id,
      attendees: [req.user.id]
    };

    db.events.push(event);
    return { event };
  });

  if (result.error) {
    return res.status(result.error.status).json({ message: result.error.message });
  }

  return res.status(201).json({ message: "Event created successfully", event: result.event });
}

export async function updateEvent(req, res) {
  const { eventId } = req.params;
  const { title, description, date, venue } = req.body;

  const result = await updateDb(async (db) => {
    const event = db.events.find((entry) => entry.id === eventId);

    if (!event) {
      return { error: { status: 404, message: "Event not found" } };
    }

    if (event.organizerId !== req.user.id) {
      return { error: { status: 403, message: "You can only edit your own events" } };
    }

    event.title = title ?? event.title;
    event.description = description ?? event.description;
    event.date = date ?? event.date;
    event.venue = venue ?? event.venue;
    event.updatedAt = new Date().toISOString();

    return { event };
  });

  if (result.error) {
    return res.status(result.error.status).json({ message: result.error.message });
  }

  return res.json({ message: "Event updated successfully", event: result.event });
}

export async function deleteEvent(req, res) {
  const { eventId } = req.params;

  const result = await updateDb(async (db) => {
    const eventIndex = db.events.findIndex((entry) => entry.id === eventId);

    if (eventIndex === -1) {
      return { error: { status: 404, message: "Event not found" } };
    }

    const event = db.events[eventIndex];

    if (event.organizerId !== req.user.id) {
      return { error: { status: 403, message: "You can only delete your own events" } };
    }

    db.events.splice(eventIndex, 1);
    return { success: true };
  });

  if (result.error) {
    return res.status(result.error.status).json({ message: result.error.message });
  }

  return res.json({ message: "Event deleted successfully" });
}

export async function rsvpEvent(req, res) {
  const { eventId } = req.params;

  const result = await updateDb(async (db) => {
    const event = db.events.find((entry) => entry.id === eventId);

    if (!event) {
      return { error: { status: 404, message: "Event not found" } };
    }

    const community = db.communities.find((entry) => entry.id === event.communityId);

    if (!community?.members.includes(req.user.id)) {
      return { error: { status: 403, message: "Only community members can RSVP" } };
    }

    if (!event.attendees.includes(req.user.id)) {
      event.attendees.push(req.user.id);
    }

    return { event };
  });

  if (result.error) {
    return res.status(result.error.status).json({ message: result.error.message });
  }

  return res.json({ message: "RSVP confirmed", event: result.event });
}
