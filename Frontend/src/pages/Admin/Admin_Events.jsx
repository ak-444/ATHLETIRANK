import { useState, useEffect } from "react";
import "../../style/Admin_Events.css";

const AdminEvents = ({ sidebarOpen }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("create");
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("http://localhost:5000/api/events");
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Create event
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) {
      return alert("Please fill in all required fields.");
    }

    const newEvent = { name, start_date: startDate, end_date: endDate };

    try {
      const res = await fetch("http://localhost:5000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchEvents();
        setName("");
        setStartDate("");
        setEndDate("");
        setActiveTab("view");
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (err) {
      console.error("Error creating event:", err);
      alert("Error creating event.");
    }
  };

  const handleViewEvent = (event) => alert(`Viewing event: ${event.name}`);
  const handleEditEvent = (event) => alert(`Editing event: ${event.name}`);
  const handleDeleteEvent = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/events/${id}`, { method: "DELETE" });
      setEvents(prev => prev.filter(event => event.id !== id));
    } catch (err) {
      console.error("Error deleting event:", err);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="dashboard-header">
          <h1>Manage Events</h1>
          <p>Create and manage sports events</p>
        </div>

        <div className="events-content">
          {/* Tabs */}
          <div className="events-tabs">
            <button
              className={`events-tab-button ${activeTab === "create" ? "events-tab-active" : ""}`}
              onClick={() => setActiveTab("create")}
            >
              Create Event
            </button>
            <button
              className={`events-tab-button ${activeTab === "view" ? "events-tab-active" : ""}`}
              onClick={() => setActiveTab("view")}
            >
              View Events ({events.length})
            </button>
          </div>

          {/* Create Event */}
          {activeTab === "create" && (
            <div className="events-form-container">
              <form onSubmit={handleCreateEvent} className="events-form">
                <div className="events-form-group">
                  <label>Event Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter event name"
                    required
                  />
                </div>

                <div className="events-form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="events-form-group">
                  <label>End Date *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>

                <div className="events-form-actions">
                  <button type="submit" className="events-submit-btn">Create Event</button>
                  <button
                    type="button"
                    className="events-cancel-btn"
                    onClick={() => {
                      setName("");
                      setStartDate("");
                      setEndDate("");
                    }}
                  >
                    Clear Form
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* View Events */}
          {activeTab === "view" && (
            <div className="events-view-section">
              {loading ? (
                <p>Loading events...</p>
              ) : error ? (
                <p style={{ color: "red" }}>Error: {error}</p>
              ) : events.length === 0 ? (
                <div className="events-no-events">
                  <p>No events created yet.</p>
                  <button className="events-submit-btn" onClick={() => setActiveTab("create")}>
                    Create Event
                  </button>
                </div>
              ) : (
                <div className="events-grid">
                  {events.map((event) => (
                    <div className="events-card" key={event.id}>
                      <div className="events-card-header">
                        <h3>{event.name}</h3>
                      </div>
                      <div className="events-info">
                        <p><strong>Start:</strong> {new Date(event.start_date).toLocaleDateString()}</p>
                        <p><strong>End:</strong> {new Date(event.end_date).toLocaleDateString()}</p>
                        <p><strong>Status:</strong> 
                          <span className={event.status === "ongoing" ? "status-ongoing" : "status-completed"}>
                            {event.status}
                          </span>
                        </p>
                        <p><strong>Archived:</strong> 
                          <span className={event.archived === "no" ? "archived-no" : "archived-yes"}>
                            {event.archived}
                          </span>
                        </p>
                      </div>
                      <div className="events-card-actions">
                        <button className="events-submit-btn" onClick={() => handleViewEvent(event)}>View</button>
                        <button className="events-cancel-btn" onClick={() => handleEditEvent(event)}>Edit</button>
                        <button className="events-delete-btn" onClick={() => handleDeleteEvent(event.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminEvents;
