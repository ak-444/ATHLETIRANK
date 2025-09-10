import React, { useState, useEffect } from "react";
import "../../style/Admin_SchedulePage.css";

const SchedulesPage = ({ sidebarOpen }) => {
  const [activeTab, setActiveTab] = useState("create");
  const [schedules, setSchedules] = useState([]);
  const [events, setEvents] = useState([]);
  const [brackets, setBrackets] = useState([]);
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    eventId: "",
    bracketId: "",
    matchId: "",
    date: "",
    time: "",
    venue: "",
    description: ""
  });

  // Fetch Events, Brackets, Matches, and Teams
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [eventsRes, bracketsRes, matchesRes, teamsRes] = await Promise.all([
          fetch("http://localhost:5000/api/events"),
          fetch("http://localhost:5000/api/brackets"),
          fetch("http://localhost:5000/api/matches"),
          fetch("http://localhost:5000/api/teams")
        ]);

        const eventsData = await eventsRes.json();
        const bracketsData = await bracketsRes.json();
        const matchesData = await matchesRes.json();
        const teamsData = await teamsRes.json();

        setEvents(eventsData);
        setBrackets(bracketsData);
        setMatches(matchesData);
        setTeams(teamsData);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const res = await fetch("http://localhost:5000/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const newSchedule = await res.json();
        setSchedules(prev => [...prev, newSchedule]);
        
        // Reset form
        setFormData({
          eventId: "",
          bracketId: "",
          matchId: "",
          date: "",
          time: "",
          venue: "",
          description: ""
        });
        
        setActiveTab("view");
        alert("Schedule created successfully!");
      } else {
        alert("Error creating schedule");
      }
    } catch (err) {
      console.error("Error creating schedule:", err);
      alert("Error creating schedule");
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/schedules/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setSchedules(prev => prev.filter(sch => sch.id !== id));
        alert("Schedule deleted successfully!");
      } else {
        alert("Error deleting schedule");
      }
    } catch (err) {
      console.error("Error deleting schedule:", err);
      alert("Error deleting schedule");
    }
  };

  // Get filtered matches based on selected bracket
  const filteredMatches = formData.bracketId 
    ? matches.filter(match => match.bracket_id === parseInt(formData.bracketId))
    : [];

  // Get team names for a match
  const getTeamNames = (match) => {
    const team1 = teams.find(t => t.id === match.team1_id);
    const team2 = teams.find(t => t.id === match.team2_id);
    return `${team1?.name || "TBD"} vs ${team2?.name || "TBD"}`;
  };

  // Capitalize first letter
  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

  return (
    <div className="admin-dashboard">
      <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="dashboard-header">
          <h1>Schedules Management</h1>
          <p>Create and manage tournament schedules</p>
        </div>

        <div className="dashboard-main">
          <div className="bracket-content">
            {/* Tabs */}
            <div className="bracket-tabs">
              <button 
                className={`bracket-tab-button ${activeTab === "create" ? "bracket-tab-active" : ""}`}
                onClick={() => setActiveTab("create")}
              >
                Create Schedule
              </button>
              <button 
                className={`bracket-tab-button ${activeTab === "view" ? "bracket-tab-active" : ""}`}
                onClick={() => setActiveTab("view")}
              >
                View Schedules ({schedules.length})
              </button>
            </div>

            {/* Create Schedule */}
            {activeTab === "create" && (
              <div className="bracket-create-section">
                <div className="bracket-form-container">
                  <h2>Create New Schedule</h2>
                  <form className="bracket-form" onSubmit={handleSubmit}>
                    {/* Event Selection */}
                    <div className="bracket-form-group">
                      <label htmlFor="eventId">Select Event *</label>
                      <select
                        id="eventId"
                        name="eventId"
                        value={formData.eventId}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Choose an event</option>
                        {events.map(ev => (
                          <option key={ev.id} value={ev.id}>{ev.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Bracket Selection */}
                    <div className="bracket-form-group">
                      <label htmlFor="bracketId">Select Bracket *</label>
                      <select
                        id="bracketId"
                        name="bracketId"
                        value={formData.bracketId}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Choose a bracket</option>
                        {brackets
                          .filter(b => b.event_id === parseInt(formData.eventId))
                          .map(b => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({capitalize(b.sport_type)})
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Match Selection */}
                    {formData.bracketId && (
                      <div className="bracket-form-group">
                        <label htmlFor="matchId">Select Match *</label>
                        <select
                          id="matchId"
                          name="matchId"
                          value={formData.matchId}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Choose a match</option>
                          {filteredMatches.map(match => (
                            <option key={match.id} value={match.id}>
                              Round {match.round_number}: {getTeamNames(match)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Date and Time */}
                    <div className="bracket-form-row">
                      <div className="bracket-form-group">
                        <label htmlFor="date">Date *</label>
                        <input 
                          type="date" 
                          id="date"
                          name="date" 
                          value={formData.date} 
                          onChange={handleInputChange} 
                          required 
                        />
                      </div>

                      <div className="bracket-form-group">
                        <label htmlFor="time">Time *</label>
                        <input 
                          type="time" 
                          id="time"
                          name="time" 
                          value={formData.time} 
                          onChange={handleInputChange} 
                          required 
                        />
                      </div>
                    </div>

                    {/* Venue */}
                    <div className="bracket-form-group">
                      <label htmlFor="venue">Venue *</label>
                      <input 
                        type="text" 
                        id="venue"
                        name="venue" 
                        placeholder="Enter venue" 
                        value={formData.venue} 
                        onChange={handleInputChange} 
                        required 
                      />
                    </div>

                    {/* Description */}
                    <div className="bracket-form-group">
                      <label htmlFor="description">Description</label>
                      <textarea 
                        id="description"
                        name="description" 
                        value={formData.description} 
                        onChange={handleInputChange} 
                        placeholder="Optional details" 
                        rows="3" 
                      />
                    </div>

                    {/* Actions */}
                    <div className="bracket-form-actions">
                      <button type="submit" className="bracket-submit-btn">
                        Save Schedule
                      </button>
                      <button 
                        type="button" 
                        className="bracket-cancel-btn"
                        onClick={() => setFormData({
                          eventId: "",
                          bracketId: "",
                          matchId: "",
                          date: "",
                          time: "",
                          venue: "",
                          description: ""
                        })}
                      >
                        Clear Form
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* View Schedules */}
            {activeTab === "view" && (
              <div className="bracket-view-section">
                <h2>All Schedules</h2>
                {loading ? (
                  <p>Loading schedules...</p>
                ) : schedules.length === 0 ? (
                  <div className="bracket-no-brackets">
                    <p>No schedules yet. Create one!</p>
                    <button 
                      className="bracket-submit-btn" 
                      onClick={() => setActiveTab("create")}
                    >
                      Create Schedule
                    </button>
                  </div>
                ) : (
                  <div className="bracket-grid">
                    {schedules.map((schedule) => {
                      const relatedMatch = matches.find(m => m.id === schedule.match_id);
                      const relatedBracket = brackets.find(b => b.id === schedule.bracket_id);
                      const event = events.find(e => e.id === schedule.event_id);
                      
                      return (
                        <div key={schedule.id} className="bracket-card">
                          <div className="bracket-card-header">
                            <h3>
                              {relatedMatch ? getTeamNames(relatedMatch) : "Match TBD"}
                            </h3>
                            <span className={`bracket-sport-badge bracket-sport-${relatedBracket?.sport_type || "default"}`}>
                              {relatedBracket ? capitalize(relatedBracket.sport_type) : "Unknown"}
                            </span>
                          </div>
                          <div className="bracket-card-info">
                            <div><strong>Event:</strong> {event?.name || "Unknown"}</div>
                            <div><strong>Bracket:</strong> {relatedBracket?.name || "Unknown"}</div>
                            <div><strong>Date & Time:</strong> {schedule.date} {schedule.time}</div>
                            <div><strong>Venue:</strong> {schedule.venue}</div>
                            {schedule.description && (
                              <div><strong>Description:</strong> {schedule.description}</div>
                            )}
                            {relatedMatch && (
                              <div><strong>Round:</strong> {relatedMatch.round_number}</div>
                            )}
                          </div>
                          <div className="bracket-card-actions">
                            <button 
                              className="bracket-delete-btn"
                              onClick={() => handleDeleteSchedule(schedule.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
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

export default SchedulesPage;