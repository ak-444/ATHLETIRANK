import React, { useState, useEffect } from "react";
import "../../style/Admin_Events.css";

const AdminEvents = ({ sidebarOpen }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("create");
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // New state for event details view
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventBrackets, setEventBrackets] = useState([]);
  const [eventMatches, setEventMatches] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Pagination state for matches per bracket
  const [bracketPages, setBracketPages] = useState({});
  const matchesPerPage = 6;

  // Format round display based on bracket type and round number
  const formatRoundDisplay = (match) => {
    const roundNum = match.round_number;
    
    // Championship rounds
    if (match.bracket_type === 'championship') {
      if (roundNum === 200) return 'Grand Final';
      if (roundNum === 201) return 'Bracket Reset';
      return `Championship Round ${roundNum - 199}`;
    }
    
    // Loser's bracket rounds (101, 102, 103, etc.) - Display as LB Round 1, 2, 3
    if (match.bracket_type === 'loser') {
      return `LB Round ${roundNum - 100}`;
    }
    
    // Winner's bracket rounds (1, 2, 3, etc.)
    if (match.bracket_type === 'winner') {
      return `Round ${roundNum}`;
    }
    
    // Fallback for single elimination or other bracket types
    return `Round ${roundNum}`;
  };

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

  // Fetch event brackets and matches
  const fetchEventDetails = async (event) => {
    setLoadingDetails(true);
    setSelectedEvent(event);
    
    try {
      // Fetch brackets for this event
      const bracketsRes = await fetch(`http://localhost:5000/api/events/${event.id}/brackets`);
      const bracketsData = await bracketsRes.json();
      setEventBrackets(bracketsData);

      // Fetch all matches for brackets in this event
      if (bracketsData.length > 0) {
        const allMatches = [];
        for (const bracket of bracketsData) {
          const matchesRes = await fetch(`http://localhost:5000/api/brackets/${bracket.id}/matches`);
          const matchesData = await matchesRes.json();
          const matchesWithBracket = matchesData.map(match => ({
            ...match,
            bracket_id: bracket.id,
            bracket_name: bracket.name,
            sport_type: bracket.sport_type,
            // Add bracket_type if available, otherwise infer from elimination_type
            bracket_type: match.bracket_type || bracket.bracket_type || bracket.elimination_type
          }));
          allMatches.push(...matchesWithBracket);
        }
        setEventMatches(allMatches);
        
        // Initialize pagination for each bracket
        const initialPages = {};
        bracketsData.forEach(bracket => {
          initialPages[bracket.id] = 1;
        });
        setBracketPages(initialPages);
      } else {
        setEventMatches([]);
        setBracketPages({});
      }
    } catch (err) {
      console.error("Error fetching event details:", err);
      alert("Error fetching event details.");
    } finally {
      setLoadingDetails(false);
    }
    
    setActiveTab("details");
  };

  const handleViewEvent = (event) => {
    fetchEventDetails(event);
  };

  const handleEditEvent = (event) => alert(`Editing event: ${event.name}`);

  const handleDeleteEvent = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/events/${id}`, { method: "DELETE" });
      setEvents(prev => prev.filter(event => event.id !== id));
    } catch (err) {
      console.error("Error deleting event:", err);
    }
  };

  const getMatchStatusBadge = (status) => {
    const statusClasses = {
      scheduled: "event-match-status-scheduled",
      ongoing: "event-match-status-ongoing", 
      completed: "event-match-status-completed"
    };
    return <span className={`event-match-status ${statusClasses[status] || ""}`}>{status}</span>;
  };

  const formatMatchTeams = (match) => {
    if (!match.team1_name && !match.team2_name) {
      return "TBD vs TBD";
    }
    return `${match.team1_name || "TBD"} vs ${match.team2_name || "TBD"}`;
  };

  // Get matches for a specific bracket
  const getMatchesForBracket = (bracketId) => {
    return eventMatches.filter(match => match.bracket_id === bracketId);
  };

  // Handle page change for a specific bracket
  const handleBracketPageChange = (bracketId, pageNumber) => {
    setBracketPages(prev => ({
      ...prev,
      [bracketId]: pageNumber
    }));
  };

  // Render matches for a bracket with pagination
  const renderBracketMatches = (bracket) => {
    const matches = getMatchesForBracket(bracket.id);
    const currentPage = bracketPages[bracket.id] || 1;
    const indexOfLastMatch = currentPage * matchesPerPage;
    const indexOfFirstMatch = indexOfLastMatch - matchesPerPage;
    const currentMatches = matches.slice(indexOfFirstMatch, indexOfLastMatch);
    const totalPages = Math.ceil(matches.length / matchesPerPage);

    if (matches.length === 0) {
      return <p className="event-no-data">No matches scheduled for this bracket yet.</p>;
    }

    return (
      <>
        <div className="event-matches-grid">
          {currentMatches.map((match) => (
            <div key={match.id} className="event-match-card">
              <div className="event-match-header">
                <div className="event-match-teams">
                  <h4>{formatMatchTeams(match)}</h4>
                  {match.status === "completed" && (
                    <div className="event-match-score">
                      {match.score_team1} - {match.score_team2}
                    </div>
                  )}
                </div>
                {getMatchStatusBadge(match.status)}
              </div>
              <div className="event-match-info">
                <p><strong>Round:</strong> {formatRoundDisplay(match)}</p>
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
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="event-pagination-container">
            <button 
              className="event-pagination-btn"
              onClick={() => handleBracketPageChange(bracket.id, currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            
            <div className="event-pagination-numbers">
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  className={`event-pagination-number ${currentPage === index + 1 ? 'active' : ''}`}
                  onClick={() => handleBracketPageChange(bracket.id, index + 1)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            
            <button 
              className="event-pagination-btn"
              onClick={() => handleBracketPageChange(bracket.id, currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="admin-dashboard">
      <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="dashboard-header">
          <h1>Manage Events</h1>
          <p>Create and manage sports events</p>
        </div>

        <div className="dashboard-main">
          <div className="bracket-content">
            {/* Tabs */}
            <div className="bracket-tabs">
              <button
                className={`bracket-tab-button ${activeTab === "create" ? "bracket-tab-active" : ""}`}
                onClick={() => setActiveTab("create")}
              >
                Create Event
              </button>
              <button
                className={`bracket-tab-button ${activeTab === "view" ? "bracket-tab-active" : ""}`}
                onClick={() => setActiveTab("view")}
              >
                View Events ({events.length})
              </button>
              {selectedEvent && (
                <button
                  className={`bracket-tab-button ${activeTab === "details" ? "bracket-tab-active" : ""}`}
                  onClick={() => setActiveTab("details")}
                >
                  {selectedEvent.name} Details
                </button>
              )}
            </div>

            {/* Create Event */}
            {activeTab === "create" && (
              <div className="bracket-create-section">
                <div className="bracket-form-container">
                  <h2>Create New Event</h2>
                  <form className="bracket-form" onSubmit={handleCreateEvent}>
                    <div className="bracket-form-group">
                      <label htmlFor="eventName">Event Name *</label>
                      <input
                        type="text"
                        id="eventName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter event name"
                        required
                      />
                    </div>

                    <div className="bracket-form-group">
                      <label htmlFor="startDate">Start Date *</label>
                      <input
                        type="date"
                        id="startDate"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className="bracket-form-group">
                      <label htmlFor="endDate">End Date *</label>
                      <input
                        type="date"
                        id="endDate"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className="bracket-form-actions">
                      <button type="submit" className="bracket-submit-btn">Create Event</button>
                      <button
                        type="button"
                        className="bracket-cancel-btn"
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
              </div>
            )}

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
                    <p>No events created yet.</p>
                    <button className="bracket-submit-btn" onClick={() => setActiveTab("create")}>
                      Create Event
                    </button>
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
                          <div><strong>Archived:</strong> 
                            <span className={event.archived === "no" ? "archived-no" : "archived-yes"}>
                              {event.archived}
                            </span>
                          </div>
                        </div>
                        <div className="bracket-card-actions">
                          <button className="bracket-view-btn" onClick={() => handleViewEvent(event)}>View</button>
                          <button className="bracket-cancel-btn" onClick={() => handleEditEvent(event)}>Edit</button>
                          <button className="bracket-delete-btn" onClick={() => handleDeleteEvent(event.id)}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Event Details - Brackets and Matches */}
            {activeTab === "details" && selectedEvent && (
              <div className="bracket-visualization-section">
                <div className="event-details-header">
                  <h2>{selectedEvent.name} - Event Details</h2>
                  <div className="event-details-info">
                    <span><strong>Start:</strong> {new Date(selectedEvent.start_date).toLocaleDateString()}</span>
                    <span><strong>End:</strong> {new Date(selectedEvent.end_date).toLocaleDateString()}</span>
                    <span><strong>Status:</strong> {selectedEvent.status}</span>
                  </div>
                </div>

                {loadingDetails ? (
                  <p>Loading event details...</p>
                ) : (
                  <div className="event-details-content">
                    {eventBrackets.length === 0 ? (
                      <p className="event-no-data">No brackets created for this event yet.</p>
                    ) : (
                      eventBrackets.map((bracket) => (
                        <div key={bracket.id} className="event-bracket-section">
                          {/* Bracket Header */}
                          <div className="event-bracket-section-header">
                            <div className="event-bracket-section-title">
                              <h3>{bracket.name}</h3>
                              <span className={`bracket-sport-badge bracket-sport-${bracket.sport_type}`}>
                                {bracket.sport_type.charAt(0).toUpperCase() + bracket.sport_type.slice(1)}
                              </span>
                            </div>
                            <div className="event-bracket-section-info">
                              <span><strong>Type:</strong> {bracket.elimination_type === "single" ? "Single" : "Double"} Elimination</span>
                              <span><strong>Teams:</strong> {bracket.team_count || 0}</span>
                              <span><strong>Matches:</strong> {getMatchesForBracket(bracket.id).length}</span>
                            </div>
                          </div>

                          {/* Matches for this Bracket */}
                          <div className="event-bracket-matches-container">
                            {renderBracketMatches(bracket)}
                          </div>
                        </div>
                      ))
                    )}
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

export default AdminEvents;