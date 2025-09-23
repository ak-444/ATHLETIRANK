import React, { useState, useEffect } from "react";
import CustomBracket from "../../components/CustomBracket";
import DoubleEliminationBracket from "../../components/DoubleEliminationBracket";
import "../../style/Admin_BracketPage.css";

const BracketsPage = ({ sidebarOpen }) => {
  const [activeTab, setActiveTab] = useState("create");
  const [brackets, setBrackets] = useState([]);
  const [selectedBracket, setSelectedBracket] = useState(null);
  const [bracketMatches, setBracketMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  const [events, setEvents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedTeamIds, setSelectedTeamIds] = useState([]);

  const [formData, setFormData] = useState({
    bracketName: "",
    bracketType: "single",
    sport: "",
    description: ""
  });

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/events");
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        console.error("Error fetching events:", err);
      }
    };
    fetchEvents();
  }, []);

  // Fetch brackets
  const fetchAllBrackets = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/brackets");
      const data = await res.json();
      setBrackets(data);
    } catch (err) {
      console.error("Error fetching brackets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBrackets();
  }, []);

  // Fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/teams");
        const data = await res.json();
        setTeams(data);
      } catch (err) {
        console.error("Error fetching teams:", err);
      }
    };
    fetchTeams();
  }, []);

  // Fetch matches for a bracket
  const fetchBracketMatches = async (bracketId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/brackets/${bracketId}/matches`);
      const data = await res.json();
      setBracketMatches(data);
    } catch (err) {
      console.error("Error fetching matches:", err);
      setBracketMatches([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTeamSelection = (e) => {
    const id = parseInt(e.target.value);
    if (id && !selectedTeamIds.includes(id)) {
      setSelectedTeamIds(prev => [...prev, id]);
    }
  };

  const removeSelectedTeam = (id) => {
    setSelectedTeamIds(prev => prev.filter(tid => tid !== id));
  };

  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

  // Generate bracket
  const generateBracket = async () => {
    const event = events.find(ev => ev.id === parseInt(selectedEventId));
    const sportChosen = formData.sport;

    if (!event || !sportChosen || !formData.bracketType || selectedTeamIds.length < 2) {
      alert("Please select an event, a sport, and at least 2 teams.");
      return;
    }

    setLoading(true);
    try {
      console.log("Creating bracket with teams:", selectedTeamIds);

      // 1. Create bracket
      const bracketRes = await fetch("http://localhost:5000/api/brackets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: event.id,
          name: formData.bracketName || `${event.name} - ${capitalize(sportChosen)} Bracket`,
          sport_type: sportChosen,
          elimination_type: formData.bracketType
        })
      });

      if (!bracketRes.ok) {
        const errorData = await bracketRes.json();
        throw new Error(errorData.error || "Failed to create bracket");
      }

      const newBracket = await bracketRes.json();
      console.log("Created bracket:", newBracket);

      // 2. Assign selected teams to bracket
      for (let team_id of selectedTeamIds) {
        const teamRes = await fetch("http://localhost:5000/api/bracketTeams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bracket_id: newBracket.id,
            team_id
          })
        });

        if (!teamRes.ok) {
          const errorData = await teamRes.json();
          console.error(`Failed to add team ${team_id} to bracket:`, errorData.error);
        }
      }

      // 3. Generate matches using Fisher-Yates shuffle
      const generateRes = await fetch(`http://localhost:5000/api/brackets/${newBracket.id}/generate`, {
        method: "POST"
      });

      if (!generateRes.ok) {
        const errorData = await generateRes.json();
        throw new Error(errorData.error || "Failed to generate matches");
      }

      const generateData = await generateRes.json();
      console.log("Generated matches:", generateData);

      // 4. Refresh brackets list to get updated data
      await fetchAllBrackets();

      // 5. Reset form
      setFormData({ bracketName: "", bracketType: "single", sport: "", description: "" });
      setSelectedEventId("");
      setSelectedTeamIds([]);
      
      // 6. Switch to view tab and show success message
      setActiveTab("view");
      alert(`Successfully created bracket with ${generateData.matches?.length || 0} matches!`);

    } catch (err) {
      console.error("Error generating bracket:", err);
      alert("Failed to generate bracket: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    generateBracket();
  };

  const deleteBracket = async (id) => {
    if (!confirm("Are you sure you want to delete this bracket?")) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/brackets/${id}`, { 
        method: "DELETE" 
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete bracket");
      }

      setBrackets(prev => prev.filter(b => b.id !== id));
      
      if (selectedBracket && selectedBracket.id === id) {
        setSelectedBracket(null);
        setBracketMatches([]);
      }
      
      setActiveTab("view");
      alert("Bracket deleted successfully");
    } catch (err) {
      console.error("Error deleting bracket:", err);
      alert("Failed to delete bracket: " + err.message);
    }
  };

  const handleViewBracket = async (bracket) => {
    setSelectedBracket(bracket);
    await fetchBracketMatches(bracket.id);
    setActiveTab("bracket");
  };

  return (
    <div className="admin-dashboard">
      <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="dashboard-header">
          <h1>Brackets Management</h1>
          <p>Create and manage tournament brackets</p>
        </div>

        <div className="dashboard-main">
          <div className="bracket-content">
            {/* Tabs */}
            <div className="bracket-tabs">
              <button 
                className={`bracket-tab-button ${activeTab === "create" ? "bracket-tab-active" : ""}`} 
                onClick={() => setActiveTab("create")}
              >
                Create Bracket
              </button>
              <button 
                className={`bracket-tab-button ${activeTab === "view" ? "bracket-tab-active" : ""}`} 
                onClick={() => setActiveTab("view")}
              >
                View Brackets ({brackets.length})
              </button>
              {selectedBracket && (
                <button 
                  className={`bracket-tab-button ${activeTab === "bracket" ? "bracket-tab-active" : ""}`} 
                  onClick={() => setActiveTab("bracket")}
                >
                  {selectedBracket.name}
                </button>
              )}
            </div>

            {/* Create Bracket */}
            {activeTab === "create" && (
              <div className="bracket-create-section">
                <div className="bracket-form-container">
                  <h2>Create New Bracket</h2>
                  <form className="bracket-form" onSubmit={handleSubmit}>
                    {/* Event Selection */}
                    <div className="bracket-form-group">
                      <label htmlFor="event">Select Event *</label>
                      <select 
                        id="event" 
                        value={selectedEventId} 
                        onChange={e => setSelectedEventId(e.target.value)} 
                        required
                      >
                        <option value="">Choose an event</option>
                        {events.map(ev => (
                          <option key={ev.id} value={ev.id}>{ev.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Bracket Name */}
                    <div className="bracket-form-group">
                      <label htmlFor="bracketName">Bracket Name</label>
                      <input
                        type="text"
                        id="bracketName"
                        name="bracketName"
                        value={formData.bracketName}
                        onChange={handleInputChange}
                        placeholder="Leave empty to auto-generate"
                      />
                    </div>

                    {/* Sport Selection */}
                    <div className="bracket-form-group">
                      <label htmlFor="sport">Sport *</label>
                      <select 
                        id="sport" 
                        name="sport" 
                        value={formData.sport} 
                        onChange={handleInputChange} 
                        required
                      >
                        <option value="">Select sport</option>
                        <option value="basketball">Basketball</option>
                        <option value="volleyball">Volleyball</option>
                      </select>
                    </div>

                    {/* Bracket Type */}
                    <div className="bracket-form-group">
                      <label htmlFor="bracketType">Bracket Type *</label>
                      <select 
                        id="bracketType" 
                        name="bracketType" 
                        value={formData.bracketType} 
                        onChange={handleInputChange} 
                        required
                      >
                        <option value="single">Single Elimination</option>
                        <option value="double">Double Elimination</option>
                      </select>
                    </div>

                    {/* Description */}
                    <div className="bracket-form-group">
                      <label htmlFor="description">Bracket Description</label>
                      <textarea 
                        id="description" 
                        name="description" 
                        value={formData.description} 
                        onChange={handleInputChange} 
                        placeholder="Enter bracket description" 
                        rows="3"
                      />
                    </div>

                    {/* Teams Selection */}
                    <div className="bracket-form-group">
                      <label>Select Teams * (Minimum 2 required)</label>
                      <select onChange={handleTeamSelection} value="">
                        <option value="">-- Pick a team --</option>
                        {teams
                          .filter(team => !selectedTeamIds.includes(team.id))
                          .map(team => (
                            <option key={team.id} value={team.id}>
                              {team.name} ({capitalize(team.sport)})
                            </option>
                          ))}
                      </select>

                      <div className="bracket-teams-list">
                        <p>Selected Teams ({selectedTeamIds.length}):</p>
                        {selectedTeamIds.map(tid => {
                          const team = teams.find(t => t.id === tid);
                          return team ? (
                            <div key={tid} className="bracket-team-tag">
                              {team.name} ({capitalize(team.sport)})
                              <button 
                                type="button" 
                                onClick={() => removeSelectedTeam(tid)} 
                                className="bracket-remove-team-btn"
                              >
                                ×
                              </button>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>

                    <div className="bracket-form-actions">
                      <button 
                        type="submit" 
                        className="bracket-submit-btn"
                        disabled={loading}
                      >
                        {loading ? "Creating..." : "Generate Bracket"}
                      </button>
                      <button 
                        type="button" 
                        className="bracket-cancel-btn" 
                        onClick={() => {
                          setFormData({ bracketName: "", bracketType: "single", sport: "", description: "" });
                          setSelectedEventId("");
                          setSelectedTeamIds([]);
                        }}
                      >
                        Clear Form
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* View Brackets */}
            {activeTab === "view" && (
              <div className="bracket-view-section">
                <h2>All Brackets</h2>
                {loading ? (
                  <p>Loading brackets...</p>
                ) : brackets.length === 0 ? (
                  <p>No brackets created yet. Create your first bracket!</p>
                ) : (
                  <div className="bracket-grid">
                    {brackets.map(b => {
                      const eventName = events.find(e => e.id === b.event_id)?.name || `Event ${b.event_id}`;
                      return (
                        <div key={b.id} className="bracket-card">
                          <div className="bracket-card-header">
                            <h3>{b.name}</h3>
                            <span className={`bracket-sport-badge bracket-sport-${b.sport_type}`}>
                              {capitalize(b.sport_type)}
                            </span>
                          </div>
                          <div className="bracket-card-info">
                            <div><strong>Event:</strong> {eventName}</div>
                            <div><strong>Type:</strong> {b.elimination_type === "single" ? "Single" : "Double"} Elimination</div>
                            <div><strong>Teams:</strong> {b.team_count || 0}</div>
                            <div><strong>Created:</strong> {new Date(b.created_at).toLocaleDateString()}</div>
                          </div>
                          <div className="bracket-card-actions">
                            <button 
                              className="bracket-view-btn" 
                              onClick={() => handleViewBracket(b)}
                            >
                              View Bracket
                            </button>
                            <button 
                              className="bracket-delete-btn" 
                              onClick={() => deleteBracket(b.id)}
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

           {/* Bracket Visualization - FIXED: Conditional rendering */}
          {activeTab === "bracket" && selectedBracket && (
            <div className="bracket-visualization-section">
              <h2>{selectedBracket.name} - Tournament Bracket</h2>
              <div className="bracket-info">
                <p><strong>Sport:</strong> {capitalize(selectedBracket.sport_type)}</p>
                <p><strong>Type:</strong> {selectedBracket.elimination_type === "single" ? "Single" : "Double"} Elimination</p>
                <p><strong>Teams:</strong> {selectedBracket.team_count || 0}</p>
              </div>
              
              {/* Conditional rendering based on elimination type */}
              {selectedBracket.elimination_type === "double" ? (
                <DoubleEliminationBracket matches={bracketMatches} />
              ) : (
                <CustomBracket 
                  matches={bracketMatches} 
                  eliminationType={selectedBracket.elimination_type} 
                />
              )}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BracketsPage;