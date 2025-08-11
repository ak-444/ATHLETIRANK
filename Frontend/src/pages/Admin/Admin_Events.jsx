import { useState, useEffect } from "react";
import "../../style/Admin_Events.css";

const AdminEvents = ({ sidebarOpen }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [name, setName] = useState("");
  const [sportType, setSportType] = useState("basketball");
  const [eliminationType, setEliminationType] = useState("single");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch events from backend
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching events from: http://localhost:5000/api/events");
      
      const res = await fetch("http://localhost:5000/api/events");
      console.log("Response status:", res.status);
      console.log("Response ok:", res.ok);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("Fetched events data:", data);
      
      setEvents(data);
    } catch (err) {
      console.error("Error loading events:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Create a new event
  const handleCreateEvent = async (e) => {
    e.preventDefault();

    if (!name.trim() || !startDate || !endDate) {
      alert("Please fill in all required fields.");
      return;
    }

    const newEvent = {
        name,
        sport_type: sportType,
        elimination_type: eliminationType,
        start_date: new Date(startDate).toISOString().split('T')[0], // Format to YYYY-MM-DD
        end_date: new Date(endDate).toISOString().split('T')[0]
    };

    console.log("Creating event with data:", newEvent);

    try {
      const res = await fetch("http://localhost:5000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent)
      });

      console.log("Create response status:", res.status);
      const data = await res.json();
      console.log("Create response data:", data);

      if (res.ok) {
        alert(data.message);
        fetchEvents(); // Refresh list
        // Reset form
        setName("");
        setSportType("basketball");
        setEliminationType("single");
        setStartDate("");
        setEndDate("");
      } else {
        alert(`Error: ${data.message}`);
      }

    } catch (err) {
      console.error("Error creating event:", err);
      alert("Error creating event.");
    }
  };

  const handleViewEvent = (event) => {
    alert(`Viewing event: ${event.name}`);
  };

  const handleEditEvent = (event) => {
    alert(`Editing event: ${event.name}`);
  };

  return (
    <div className="admin-events">
      <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        
        {/* Header */}
        <div className="dashboard-header">
          <h1>Manage Events</h1>
          <p>Create and manage sports events</p>
        </div>


        {/* Create Event Form */}
        <form className="event-form" onSubmit={handleCreateEvent}>
          <div className="form-group">
            <label>Event Name:</label>
            <input
              type="text"
              placeholder="Enter event name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Sport Type:</label>
            <select
              value={sportType}
              onChange={(e) => setSportType(e.target.value)}
            >
              <option value="basketball">Basketball</option>
              <option value="volleyball">Volleyball</option>
            </select>
          </div>

          <div className="form-group">
            <label>Elimination Type:</label>
            <select
              value={eliminationType}
              onChange={(e) => setEliminationType(e.target.value)}
            >
              <option value="single">Single Elimination</option>
              <option value="double">Double Elimination</option>
            </select>
          </div>

          <div className="form-group">
            <label>Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>End Date:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="create-event-btn">
            Create Event
          </button>
        </form>

        {/* Events Grid */}
        <div className="events-grid">
          {loading ? (
            <p>Loading events...</p>
          ) : error ? (
            <p style={{ color: "red" }}>Error: {error}</p>
          ) : events.length === 0 ? (
            <p>No events created yet.</p>
          ) : (
            events.map((event) => (
              <div className="event-card" key={event.id}>
                <h3>{event.name}</h3>
                <p><strong>Sport:</strong> {event.sport_type}</p>
                <p><strong>Elimination:</strong> {event.elimination_type}</p>
                <p><strong>Start:</strong> {event.start_date}</p>
                <p><strong>End:</strong> {event.end_date}</p>
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
                <div className="event-card-actions">
                  <button onClick={() => handleViewEvent(event)}>View</button>
                  <button onClick={() => handleEditEvent(event)}>Edit</button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminEvents;