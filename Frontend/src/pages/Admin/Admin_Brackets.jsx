import React, { useState, useEffect } from "react";
import "../../style/Admin_BracketPage.css";

const BracketsPage = ({ sidebarOpen }) => {
  const [activeTab, setActiveTab] = useState("create");
  const [brackets, setBrackets] = useState([]);
  const [selectedBracket, setSelectedBracket] = useState(null);

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
  useEffect(() => {
    const fetchBrackets = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/brackets");
        const data = await res.json();
        // Ensure teams are included
        const bracketsWithTeams = await Promise.all(
          data.map(async (b) => {
            const resTeams = await fetch(`http://localhost:5000/api/brackets/${b.id}`);
            const bracketData = await resTeams.json();
            return { ...b, teams: bracketData.teams || [] };
          })
        );
        setBrackets(bracketsWithTeams);
      } catch (err) {
        console.error("Error fetching brackets:", err);
      }
    };
    fetchBrackets();
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTeamSelection = (e) => {
    const id = parseInt(e.target.value);
    if (!selectedTeamIds.includes(id)) {
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
      return alert("Select an event, a sport, and at least 2 teams.");
    }

    try {
      // 1️⃣ Create bracket
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
      const newBracket = await bracketRes.json();

      // 2️⃣ Assign selected teams to bracket
      for (let team_id of selectedTeamIds) {
        await fetch("http://localhost:5000/api/bracketTeams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bracket_id: newBracket.id,
            team_id
          })
        });
      }

      // 3️⃣ Update frontend with assigned teams
      const assignedTeams = teams.filter(t => selectedTeamIds.includes(t.id));
      setBrackets(prev => [...prev, { ...newBracket, teams: assignedTeams }]);

      // 4️⃣ Reset form
      setFormData({ bracketName: "", bracketType: "single", sport: "", description: "" });
      setSelectedEventId("");
      setSelectedTeamIds([]);
      setActiveTab("view");

    } catch (err) {
      console.error("Error generating bracket:", err);
      alert("Failed to generate bracket.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    generateBracket();
  };

  const deleteBracket = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/brackets/${id}`, { method: "DELETE" });
      setBrackets(prev => prev.filter(b => b.id !== id));
      if (selectedBracket && selectedBracket.id === id) setSelectedBracket(null);
      setActiveTab("view");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="dashboard-header">
          <h1>Brackets Management</h1>
          <p>Create and manage tournament brackets</p>
        </div>

        <div className="bracket-content">
          {/* Tabs */}
          <div className="bracket-tabs">
            <button className={`bracket-tab-button ${activeTab === "create" ? "bracket-tab-active" : ""}`} onClick={() => setActiveTab("create")}>
              Create Bracket
            </button>
            <button className={`bracket-tab-button ${activeTab === "view" ? "bracket-tab-active" : ""}`} onClick={() => setActiveTab("view")}>
              View Brackets ({brackets.length})
            </button>
            {selectedBracket && (
              <button className={`bracket-tab-button ${activeTab === "bracket" ? "bracket-tab-active" : ""}`} onClick={() => setActiveTab("bracket")}>
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
                  {/* Event */}
                  <div className="bracket-form-group">
                    <label htmlFor="event">Select Event *</label>
                    <select id="event" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)} required>
                      <option value="">Choose an event</option>
                      {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                    </select>
                  </div>

                  {/* Sport */}
                  <div className="bracket-form-group">
                    <label htmlFor="sport">Sport *</label>
                    <select id="sport" name="sport" value={formData.sport} onChange={handleInputChange} required>
                      <option value="">Select sport</option>
                      <option value="basketball">Basketball</option>
                      <option value="volleyball">Volleyball</option>
                    </select>
                  </div>

                  {/* Bracket type */}
                  <div className="bracket-form-group">
                    <label htmlFor="bracketType">Bracket Type *</label>
                    <select id="bracketType" name="bracketType" value={formData.bracketType} onChange={handleInputChange} required>
                      <option value="single">Single Elimination</option>
                      <option value="double">Double Elimination</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div className="bracket-form-group">
                    <label htmlFor="description">Bracket Description</label>
                    <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Enter bracket description" rows="4"/>
                  </div>

                  {/* Teams Dropdown */}
                  <div className="bracket-form-group">
                    <label>Select Teams *</label>
                    <select onChange={handleTeamSelection} value="">
                      <option value="">-- Pick a team --</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>{team.name} ({capitalize(team.sport)})</option>
                      ))}
                    </select>

                    <div className="bracket-teams-list">
                      {selectedTeamIds.map(tid => {
                        const team = teams.find(t => t.id === tid);
                        return (
                          <div key={tid} className="bracket-team-tag">
                            {team.name} 
                            <button type="button" onClick={() => removeSelectedTeam(tid)} className="bracket-remove-team-btn">×</button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bracket-form-actions">
                    <button type="submit" className="bracket-submit-btn">Generate Bracket</button>
                    <button type="button" className="bracket-cancel-btn" onClick={() => {
                      setFormData({ bracketName: "", bracketType: "single", sport: "", description: "" });
                      setSelectedEventId("");
                      setSelectedTeamIds([]);
                    }}>Clear Form</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* View Brackets */}
          {activeTab === "view" && (
            <div className="bracket-view-section">
              <h2>All Brackets</h2>
              {brackets.length === 0 ? (
                <p>No brackets yet. Create one!</p>
              ) : (
                <div className="bracket-grid">
                  {brackets.map(b => (
                    <div key={b.id} className="bracket-card">
                      <div className="bracket-card-header">
                        <h3>{b.name}</h3>
                        <span className={`bracket-sport-badge bracket-sport-${b.sport_type}`}>
                          {capitalize(b.sport_type)}
                        </span>
                      </div>
                      <div className="bracket-card-info">
                        <div><strong>Event:</strong> {b.event_id}</div>
                        <div><strong>Type:</strong> {b.elimination_type === "single" ? "Single" : "Double"}</div>
                        <div><strong>Teams:</strong> {b.teams?.length || 0}</div>
                      </div>
                      <div className="bracket-card-actions">
                        <button className="bracket-view-btn" onClick={() => { setSelectedBracket(b); setActiveTab("bracket"); }}>View Bracket</button>
                        <button className="bracket-delete-btn" onClick={() => deleteBracket(b.id)}>Delete</button>
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

export default BracketsPage;
