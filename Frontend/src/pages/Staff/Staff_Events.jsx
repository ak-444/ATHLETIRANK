import React, { useState, useEffect } from "react";
import "../../style/Staff_Events.css";

const StaffEvents = ({ sidebarOpen }) => {
  const [activeTab, setActiveTab] = useState("view");
  const [events, setEvents] = useState([]);
  const [brackets, setBrackets] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedBracket, setSelectedBracket] = useState(null);
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

  // Fetch brackets for a specific event
  const fetchBrackets = async (eventId) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/events/${eventId}/brackets`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setBrackets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch matches for a specific bracket
  const fetchMatches = async (bracketId) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/brackets/${bracketId}/matches`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setMatches(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleEventSelect = async (event) => {
    setSelectedEvent(event);
    await fetchBrackets(event.id);
    setActiveTab("brackets");
  };

  const handleBracketSelect = async (bracket) => {
    setSelectedBracket(bracket);
    await fetchMatches(bracket.id);
    setActiveTab("matches");
  };

  const getMatchStatusBadge = (status) => {
    const statusClasses = {
      scheduled: "status-scheduled",
      ongoing: "status-ongoing", 
      completed: "status-completed"
    };
    return <span className={`match-status ${statusClasses[status] || ""}`}>{status}</span>;
  };

  const formatMatchTeams = (match) => {
    if (!match.team1_name && !match.team2_name) {
      return "TBD vs TBD";
    }
    return `${match.team1_name || "TBD"} vs ${match.team2_name || "TBD"}`;
  };

  return (
    <div className="admin-dashboard">
      <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="dashboard-header">
          <h1>Staff Events</h1>
          <p>View events, brackets, and matches</p>
        </div>

        <div className="dashboard-main">
          <div className="bracket-content">
            {/* Tabs */}
            <div className="bracket-tabs">
              <button
                className={`bracket-tab-button ${activeTab === "view" ? "bracket-tab-active" : ""}`}
                onClick={() => setActiveTab("view")}
              >
                View Events ({events.length})
              </button>
              {selectedEvent && (
                <button
                  className={`bracket-tab-button ${activeTab === "brackets" ? "bracket-tab-active" : ""}`}
                  onClick={() => setActiveTab("brackets")}
                >
                  {selectedEvent.name} Brackets ({brackets.length})
                </button>
              )}
              {selectedBracket && (
                <button
                  className={`bracket-tab-button ${activeTab === "matches" ? "bracket-tab-active" : ""}`}
                  onClick={() => setActiveTab("matches")}
                >
                  {selectedBracket.name} Matches ({matches.length})
                </button>
              )}
            </div>

            {/* View Events */}
            {activeTab === "view" && (
              <div className="bracket-view-section">
                <h2>All Events</h2>
                {loading ? (
                  <p>Loading events...</p>
                ) : error ? (
                  <p className="bracket-error">Error: {error}</p>
                ) : events.length === 0 ? (
                  <div className="bracket-no-brackets">
                    <p>No events available.</p>
                  </div>
                ) : (
                  <div className="bracket-grid">
                    {events.map((event) => (
                      <div className="bracket-card" key={event.id}>
                        <div className="bracket-card-header">
                          <h3>{event.name}</h3>
                          <span className={`bracket-sport-badge ${event.status === "ongoing" ? "bracket-sport-basketball" : "bracket-sport-volleyball"}`}>
                            {event.status}
                          </span>
                        </div>
                        <div className="bracket-card-info">
                          <div><strong>Start:</strong> {new Date(event.start_date).toLocaleDateString()}</div>
                          <div><strong>End:</strong> {new Date(event.end_date).toLocaleDateString()}</div>
                          <div><strong>Status:</strong> 
                            <span className={event.status === "ongoing" ? "status-ongoing" : "status-completed"}>
                              {event.status}
                            </span>
                          </div>
                        </div>
                        <div className="bracket-card-actions">
                          <button className="bracket-view-btn" onClick={() => handleEventSelect(event)}>
                            View Brackets
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* View Brackets */}
            {activeTab === "brackets" && selectedEvent && (
              <div className="bracket-view-section">
                <div className="event-details-header">
                  <h2>Brackets for {selectedEvent.name}</h2>
                  <div className="event-details-info">
                    <span><strong>Start:</strong> {new Date(selectedEvent.start_date).toLocaleDateString()}</span>
                    <span><strong>End:</strong> {new Date(selectedEvent.end_date).toLocaleDateString()}</span>
                    <span><strong>Status:</strong> {selectedEvent.status}</span>
                  </div>
                </div>
                
                {loading ? (
                  <p>Loading brackets...</p>
                ) : brackets.length === 0 ? (
                  <div className="bracket-no-brackets">
                    <p>No brackets created yet for this event.</p>
                  </div>
                ) : (
                  <div className="bracket-grid">
                    {brackets.map((bracket) => (
                      <div className="bracket-card" key={bracket.id}>
                        <div className="bracket-card-header">
                          <h3>{bracket.name}</h3>
                          <span className={`bracket-sport-badge bracket-sport-${bracket.sport_type}`}>
                            {bracket.sport_type.charAt(0).toUpperCase() + bracket.sport_type.slice(1)}
                          </span>
                        </div>
                        <div className="bracket-card-info">
                          <div><strong>Type:</strong> {bracket.elimination_type === "single" ? "Single" : "Double"} Elimination</div>
                          <div><strong>Teams:</strong> {bracket.team_count || 0}</div>
                          <div><strong>Created:</strong> {new Date(bracket.created_at).toLocaleDateString()}</div>
                        </div>
                        <div className="bracket-card-actions">
                          <button className="bracket-view-btn" onClick={() => handleBracketSelect(bracket)}>
                            View Matches
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* View Matches */}
            {activeTab === "matches" && selectedBracket && (
              <div className="bracket-view-section">
                <div className="event-details-header">
                  <h2>Matches for {selectedBracket.name}</h2>
                  <div className="event-details-info">
                    <span><strong>Sport:</strong> {selectedBracket.sport_type.charAt(0).toUpperCase() + selectedBracket.sport_type.slice(1)}</span>
                    <span><strong>Type:</strong> {selectedBracket.elimination_type === "single" ? "Single" : "Double"} Elimination</span>
                    <span><strong>Teams:</strong> {selectedBracket.team_count || 0}</span>
                  </div>
                </div>
                
                {loading ? (
                  <p>Loading matches...</p>
                ) : matches.length === 0 ? (
                  <div className="bracket-no-brackets">
                    <p>No matches scheduled for this bracket yet.</p>
                  </div>
                ) : (
                  <div className="matches-grid">
                    {matches.map((match) => (
                      <div key={match.id} className="match-card">
                        <div className="match-header">
                          <div className="match-teams">
                            <h4>{formatMatchTeams(match)}</h4>
                            {match.status === "completed" && (
                              <div className="match-score">
                                {match.score_team1} - {match.score_team2}
                              </div>
                            )}
                          </div>
                          {getMatchStatusBadge(match.status)}
                        </div>
                        <div className="match-info">
                          <p><strong>Round:</strong> {match.round_number}</p>
                          {match.scheduled_at && (
                            <p><strong>Scheduled:</strong> {new Date(match.scheduled_at).toLocaleString()}</p>
                          )}
                          {match.winner_name && (
                            <p><strong>Winner:</strong> {match.winner_name}</p>
                          )}
                          {match.mvp_name && (
                            <p><strong>MVP:</strong> {match.mvp_name}</p>
                          )}
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
    </div>
  );
};

export default StaffEvents;