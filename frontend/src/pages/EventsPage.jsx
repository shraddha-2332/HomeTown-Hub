import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { formatDateTime, getCommunityName } from "../lib/formatters";

export default function EventsPage() {
  const { token, user } = useAuth();
  const [events, setEvents] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [communityFilter, setCommunityFilter] = useState("all");
  const [eventForm, setEventForm] = useState({
    communityId: "c1",
    title: "",
    description: "",
    date: "",
    venue: ""
  });
  const [editingEventId, setEditingEventId] = useState("");
  const [eventDraft, setEventDraft] = useState({
    title: "",
    description: "",
    date: "",
    venue: ""
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const filteredEvents = events.filter((event) => {
    const communityName = getCommunityName(communities, event.communityId);
    const matchesSearch =
      event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      communityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.venue?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCommunity = communityFilter === "all" ? true : event.communityId === communityFilter;
    return matchesSearch && matchesCommunity;
  });

  async function loadEvents() {
    try {
      setLoading(true);
      const [eventData, communityData] = await Promise.all([api.getEvents(), api.getCommunities()]);
      setEvents(eventData);
      setCommunities(communityData);
      setEventForm((current) => ({ ...current, communityId: communityData[0]?.id || "c1" }));
    } catch (requestError) {
      console.error("Failed to load events", requestError);
      setError("We couldn't load events right now.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  function startEditEvent(event) {
    setEditingEventId(event.id);
    setEventDraft({
      title: event.title,
      description: event.description,
      date: event.date?.slice(0, 16) || "",
      venue: event.venue
    });
  }

  function cancelEditEvent() {
    setEditingEventId("");
    setEventDraft({
      title: "",
      description: "",
      date: "",
      venue: ""
    });
  }

  async function handleCreateEvent(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (
      !eventForm.communityId ||
      !eventForm.title.trim() ||
      !eventForm.description.trim() ||
      !eventForm.date ||
      !eventForm.venue.trim()
    ) {
      setError("Please complete all event fields before creating the event.");
      return;
    }

    try {
      await api.createEvent(
        {
          ...eventForm,
          title: eventForm.title.trim(),
          description: eventForm.description.trim(),
          venue: eventForm.venue.trim()
        },
        token
      );
      setMessage("Event created successfully.");
      setEventForm((current) => ({
        ...current,
        title: "",
        description: "",
        date: "",
        venue: ""
      }));
      await loadEvents();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleRsvp(eventId) {
    setMessage("");
    setError("");

    if (!eventId) {
      setError("This event is missing an identifier. Refresh and try again.");
      return;
    }

    try {
      await api.rsvpEvent(eventId, token);
      setMessage("RSVP confirmed.");
      await loadEvents();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleUpdateEvent(eventId) {
    try {
      setMessage("");
      setError("");
      await api.updateEvent(
        eventId,
        {
          title: eventDraft.title.trim(),
          description: eventDraft.description.trim(),
          date: eventDraft.date,
          venue: eventDraft.venue.trim()
        },
        token
      );
      cancelEditEvent();
      setMessage("Event updated successfully.");
      await loadEvents();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleDeleteEvent(eventId) {
    try {
      setMessage("");
      setError("");
      await api.deleteEvent(eventId, token);
      if (editingEventId === eventId) {
        cancelEditEvent();
      }
      setMessage("Event deleted successfully.");
      await loadEvents();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="page">
      <section className="subpage-hero subpage-hero-events">
        <div className="subpage-copy">
          <p className="eyebrow">Events</p>
          <h1>Bring hometown people together through shared moments.</h1>
          <p>
            Plan reunions, local drives, cultural celebrations, alumni meetups, and support gatherings
            that keep your hometown network active.
          </p>
        </div>
        <div className="subpage-aside">
          <article className="metric-tile">
            <strong>{events.length}</strong>
            <span>listed events</span>
          </article>
          <article className="metric-tile">
            <strong>
              {events.reduce(
                (sum, event) => sum + (Array.isArray(event.attendees) ? event.attendees.length : event.attendees || 0),
                0
              )}
            </strong>
            <span>total RSVPs</span>
          </article>
        </div>
      </section>

      {message ? <p className="message success">{message}</p> : null}
      {error ? <p className="message error">{error}</p> : null}

      <section className="section-grid product-grid">
        <div className="card elevated-card form-card">
          <div className="section-heading">
            <h3>Create an Event</h3>
          </div>
          <p className="section-copy">
            Start a hometown gathering and invite the community to participate, volunteer, celebrate, or
            reconnect.
          </p>
          <form className="stack" onSubmit={handleCreateEvent}>
            <select
              className="input"
              value={eventForm.communityId}
              onChange={(event) => setEventForm({ ...eventForm, communityId: event.target.value })}
            >
              {communities.map((community) => (
                <option key={community.id} value={community.id}>
                  {community.name}
                </option>
              ))}
            </select>
            <input
              className="input"
              placeholder="Event title"
              value={eventForm.title}
              onChange={(event) => setEventForm({ ...eventForm, title: event.target.value })}
            />
            <textarea
              className="input textarea"
              placeholder="Event description"
              value={eventForm.description}
              onChange={(event) => setEventForm({ ...eventForm, description: event.target.value })}
            />
            <input
              className="input"
              type="datetime-local"
              value={eventForm.date}
              onChange={(event) => setEventForm({ ...eventForm, date: event.target.value })}
            />
            <input
              className="input"
              placeholder="Venue"
              value={eventForm.venue}
              onChange={(event) => setEventForm({ ...eventForm, venue: event.target.value })}
            />
            <button className="primary-button" type="submit" disabled={!user}>
              {user ? "Create event" : "Login to create"}
            </button>
          </form>
        </div>

        <div className="card elevated-card info-card">
          <div className="section-heading">
            <h3>High-impact event ideas</h3>
          </div>
          <div className="stack">
            <article className="pill-row">Festival celebrations and hometown holiday meetups</article>
            <article className="pill-row">Blood donation and volunteer drives</article>
            <article className="pill-row">Career guidance sessions for current students</article>
            <article className="pill-row">Neighborhood cleanups and civic collaboration</article>
          </div>
        </div>
      </section>

      <section className="card elevated-card filter-toolbar">
        <div className="section-heading">
          <h3>Search and Filter</h3>
        </div>
        <div className="filter-row">
          <input
            className="input"
            placeholder="Search by event, venue, or community"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <select className="input" value={communityFilter} onChange={(event) => setCommunityFilter(event.target.value)}>
            <option value="all">All communities</option>
            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="event-board">
        {loading ? <p className="state-card">Loading events...</p> : null}
        {!loading && events.length === 0 ? (
          <p className="state-card">No events have been scheduled yet.</p>
        ) : null}
        {!loading && events.length > 0 && filteredEvents.length === 0 ? (
          <p className="state-card">No events match your current search.</p>
        ) : null}
        {!loading &&
          filteredEvents.map((event) => (
            <article key={event.id} className="event-showcase-card">
              <div className="event-showcase-copy">
                <span className="badge">{getCommunityName(communities, event.communityId)}</span>
                {editingEventId === event.id ? (
                  <div className="stack">
                    <input
                      className="input"
                      value={eventDraft.title}
                      onChange={(eventInput) => setEventDraft({ ...eventDraft, title: eventInput.target.value })}
                    />
                    <textarea
                      className="input textarea"
                      value={eventDraft.description}
                      onChange={(eventInput) => setEventDraft({ ...eventDraft, description: eventInput.target.value })}
                    />
                    <input
                      className="input"
                      type="datetime-local"
                      value={eventDraft.date}
                      onChange={(eventInput) => setEventDraft({ ...eventDraft, date: eventInput.target.value })}
                    />
                    <input
                      className="input"
                      value={eventDraft.venue}
                      onChange={(eventInput) => setEventDraft({ ...eventDraft, venue: eventInput.target.value })}
                    />
                    <div className="request-actions">
                      <button className="primary-button" onClick={() => handleUpdateEvent(event.id)}>
                        Save Event
                      </button>
                      <button className="secondary-button" onClick={cancelEditEvent}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3>{event.title}</h3>
                    <p>{event.description || "A shared moment for hometown members to come together."}</p>
                    <div className="event-meta-grid">
                      <div>
                        <small>Date</small>
                        <strong>{formatDateTime(event.date)}</strong>
                      </div>
                      <div>
                        <small>Venue</small>
                        <strong>{event.venue}</strong>
                      </div>
                      <div>
                        <small>Attending</small>
                        <strong>{Array.isArray(event.attendees) ? event.attendees.length : event.attendees}</strong>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="event-showcase-actions">
                {user?.id === event.organizerId ? (
                  <div className="stack full-width-stack">
                    {editingEventId !== event.id ? (
                      <>
                        <button className="secondary-button full-width-button" onClick={() => startEditEvent(event)}>
                          Edit Event
                        </button>
                        <button className="secondary-button full-width-button" onClick={() => handleDeleteEvent(event.id)}>
                          Delete Event
                        </button>
                      </>
                    ) : null}
                  </div>
                ) : (
                  <button className="primary-button full-width-button" onClick={() => handleRsvp(event.id)} disabled={!user}>
                    {user ? "RSVP to Event" : "Login to RSVP"}
                  </button>
                )}
              </div>
            </article>
          ))}
      </section>
    </div>
  );
}
