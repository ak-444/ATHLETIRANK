import React, { useState, useEffect } from "react";
import "../../style/Staff_Events.css"; // staff-specific css (same theme as admin)

const StaffEvents = ({ sidebarOpen }) => {
  const [activeTab, setActiveTab] = useState("select");
  const [events, setEvents] = useState([]);
  const [games, setGames] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch events from backend
  const fetchEvents = async () => {
    try {
      setLoading(true);
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

  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    setActiveTab("games");
    // You may fetch games here from API later
    setGames([
      { id: 1, team1: "Team A", team2: "Team B", sport: "Basketball", status: "upcoming" },
      { id: 2, team1: "Team C", team2: "Team D", sport: "Volleyball", status: "completed" }
    ]);
  };

  const handleGameSelect = (game) => {
    setSelectedGame(game);
    setActiveTab("statistics");
  };

  return (
    <div className="admin-dashboard">
      <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="dashboard-header">
          <h1>Staff Events</h1>
          <p>View events, manage games, and record statistics</p>
        </div>

        <div className="events-content">
          {/* Tabs */}
          <div className="events-tabs">
            <button
              className={`events-tab-button ${activeTab === "select" ? "events-tab-active" : ""}`}
              onClick={() => setActiveTab("select")}
            >
              Select Event
            </button>
            {selectedEvent && (
              <button
                className={`events-tab-button ${activeTab === "games" ? "events-tab-active" : ""}`}
                onClick={() => setActiveTab("games")}
              >
                Manage Games ({games.length})
              </button>
            )}
            {selectedGame && (
              <button
                className={`events-tab-button ${activeTab === "statistics" ? "events-tab-active" : ""}`}
                onClick={() => setActiveTab("statistics")}
              >
                Record Statistics
              </button>
            )}
          </div>

          {/* Select Event */}
          {activeTab === "select" && (
            <div className="events-view-section">
              {loading ? (
                <p>Loading events...</p>
              ) : error ? (
                <p style={{ color: "red" }}>Error: {error}</p>
              ) : events.length === 0 ? (
                <div className="events-no-events">
                  <p>No events available.</p>
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
                      </div>
                      <div className="events-card-actions">
                        <button className="events-submit-btn" onClick={() => handleEventSelect(event)}>
                          View / Manage Games
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Manage Games */}
          {activeTab === "games" && selectedEvent && (
            <div className="events-view-section">
              <h2>Games for {selectedEvent.name}</h2>
              {games.length === 0 ? (
                <p>No games created yet for this event.</p>
              ) : (
                <div className="events-grid">
                  {games.map((game) => (
                    <div className="events-card" key={game.id}>
                      <div className="events-card-header">
                        <h3>{game.team1} vs {game.team2}</h3>
                      </div>
                      <div className="events-info">
                        <p><strong>Sport:</strong> {game.sport}</p>
                        <p><strong>Status:</strong> {game.status}</p>
                      </div>
                      <div className="events-card-actions">
                        <button className="events-submit-btn" onClick={() => handleGameSelect(game)}>
                          Record Statistics
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Record Statistics */}
          {activeTab === "statistics" && selectedGame && (
            <div className="events-view-section">
              <h2>
                Recording Statistics: {selectedGame.team1} vs {selectedGame.team2} ({selectedGame.sport})
              </h2>
              <div className="events-card">
                <p>Here you can record player stats (UI can be expanded later).</p>
                <button className="events-cancel-btn" onClick={() => setActiveTab("games")}>
                  Back to Games
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffEvents;
