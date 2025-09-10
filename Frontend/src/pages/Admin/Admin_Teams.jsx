import React, { useState, useEffect } from "react";
import "../../style/Admin_TeamPage.css";

const TeamsPage = ({ sidebarOpen }) => {
  const [activeTab, setActiveTab] = useState("create");
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    teamName: "",
    sport: "",
    players: [],
  });

  // Position options
  const positions = {
    Basketball: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"],
    Volleyball: ["Setter", "Outside Hitter", "Middle Blocker", "Opposite Hitter", "Libero", "Defensive Specialist"],
  };

  // Fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:5000/api/teams");
        const data = await res.json();
        setTeams(data);
      } catch (err) {
        console.error("Error fetching teams:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  // Handle form inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Reset players when sport changes
    if (name === "sport") {
      setFormData(prev => ({
        ...prev,
        players: value ? [{ name: "", position: "" }] : [],
      }));
    }
  };

  // Player functions
  const addPlayer = () => {
    if (formData.sport && formData.players.length < 15) {
      setFormData(prev => ({
        ...prev,
        players: [...prev.players, { name: "", position: "" }],
      }));
    }
  };

  const removePlayer = (index) => {
    setFormData(prev => ({
      ...prev,
      players: prev.players.filter((_, i) => i !== index),
    }));
  };

  const handlePlayerChange = (index, field, value) => {
    const newPlayers = [...formData.players];
    newPlayers[index][field] = value;
    setFormData(prev => ({ ...prev, players: newPlayers }));
  };

  // Submit team
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validPlayers = formData.players.filter(p => p.name.trim() && p.position);

    if (!formData.teamName || !formData.sport || validPlayers.length === 0) {
      return alert("Please fill in all required fields and add at least one player.");
    }

    try {
      const res = await fetch("http://localhost:5000/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.teamName,
          sport: formData.sport,
          players: validPlayers,
        }),
      });
      
      if (res.ok) {
        const newTeam = await res.json();
        setTeams(prev => [...prev, newTeam]);
        setFormData({ teamName: "", sport: "", players: [] });
        setActiveTab("view");
        alert("Team created successfully!");
      } else {
        alert("Error creating team");
      }
    } catch (err) {
      console.error("Error creating team:", err);
      alert("Error creating team");
    }
  };

  // Delete team
  const handleDeleteTeam = async (id) => {
    if (!confirm("Are you sure you want to delete this team?")) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/teams/${id}`, { method: "DELETE" });
      
      if (res.ok) {
        setTeams(prev => prev.filter(team => team.id !== id));
        alert("Team deleted successfully!");
      } else {
        alert("Error deleting team");
      }
    } catch (err) {
      console.error("Error deleting team:", err);
      alert("Error deleting team");
    }
  };

  // Capitalize first letter
  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

  return (
    <div className="admin-dashboard">
      <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="dashboard-header">
          <h1>Teams Management</h1>
          <p>Create and manage sports teams</p>
        </div>

        <div className="dashboard-main">
          <div className="bracket-content">
            {/* Tabs */}
            <div className="bracket-tabs">
              <button
                className={`bracket-tab-button ${activeTab === "create" ? "bracket-tab-active" : ""}`}
                onClick={() => setActiveTab("create")}
              >
                Create Team
              </button>
              <button
                className={`bracket-tab-button ${activeTab === "view" ? "bracket-tab-active" : ""}`}
                onClick={() => setActiveTab("view")}
              >
                View Teams ({teams.length})
              </button>
            </div>

            {/* Create Team */}
            {activeTab === "create" && (
              <div className="bracket-create-section">
                <div className="bracket-form-container">
                  <h2>Create New Team</h2>
                  <form className="bracket-form" onSubmit={handleSubmit}>
                    {/* Team Name */}
                    <div className="bracket-form-group">
                      <label htmlFor="teamName">Team Name *</label>
                      <input
                        type="text"
                        id="teamName"
                        name="teamName"
                        value={formData.teamName}
                        onChange={handleInputChange}
                        placeholder="Enter team name"
                        required
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
                        <option value="">Select a sport</option>
                        {Object.keys(positions).map((sport) => (
                          <option key={sport} value={sport}>{sport}</option>
                        ))}
                      </select>
                    </div>

                    {/* Players Section */}
                    {formData.sport && (
                      <div className="team-players-section">
                        <div className="players-header">
                          <h3>Players</h3>
                          <button
                            type="button"
                            className="bracket-submit-btn"
                            onClick={addPlayer}
                            disabled={formData.players.length >= 15}
                          >
                            Add Player
                          </button>
                        </div>

                        {formData.players.map((player, index) => (
                          <div key={index} className="player-card">
                            <input
                              type="text"
                              placeholder="Enter player name"
                              value={player.name}
                              onChange={(e) => handlePlayerChange(index, "name", e.target.value)}
                              required
                            />
                            <select
                              value={player.position}
                              onChange={(e) => handlePlayerChange(index, "position", e.target.value)}
                              required
                            >
                              <option value="">Select position</option>
                              {positions[formData.sport].map(pos => (
                                <option key={pos} value={pos}>{pos}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="bracket-delete-btn"
                              onClick={() => removePlayer(index)}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="bracket-form-actions">
                      <button type="submit" className="bracket-submit-btn">Create Team</button>
                      <button
                        type="button"
                        className="bracket-cancel-btn"
                        onClick={() => setFormData({ teamName: "", sport: "", players: [] })}
                      >
                        Clear Form
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* View Teams */}
            {activeTab === "view" && (
              <div className="bracket-view-section">
                <h2>All Teams</h2>
                {loading ? (
                  <p>Loading teams...</p>
                ) : teams.length === 0 ? (
                  <div className="bracket-no-brackets">
                    <p>No teams created yet. Create your first team!</p>
                    <button 
                      className="bracket-submit-btn" 
                      onClick={() => setActiveTab("create")}
                    >
                      Create Team
                    </button>
                  </div>
                ) : (
                  <div className="bracket-grid">
                    {teams.map(team => (
                      <div key={team.id} className="bracket-card">
                        <div className="bracket-card-header">
                          <h3>{team.name}</h3>
                          <span className={`bracket-sport-badge bracket-sport-${team.sport.toLowerCase()}`}>
                            {capitalize(team.sport)}
                          </span>
                        </div>
                        <div className="bracket-card-info">
                          <div><strong>Players:</strong> {team.players.length}</div>
                          <div className="players-list">
                            {team.players.slice(0, 3).map((player, i) => (
                              <div key={i}>{player.name} - {player.position}</div>
                            ))}
                            {team.players.length > 3 && (
                              <div>+{team.players.length - 3} more players</div>
                            )}
                          </div>
                        </div>
                        <div className="bracket-card-actions">
                          <button
                            className="bracket-delete-btn"
                            onClick={() => handleDeleteTeam(team.id)}
                          >
                            Delete Team
                          </button>
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

export default TeamsPage;