import React, { useState, useEffect } from "react";
import "../../style/Admin_TeamPage.css";

const TeamsPage = ({ sidebarOpen }) => {
  const [activeTab, setActiveTab] = useState("create");
  const [teams, setTeams] = useState([]);
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
      const newTeam = await res.json();
      setTeams(prev => [...prev, newTeam]);

      setFormData({ teamName: "", sport: "", players: [] });
      setActiveTab("view");
    } catch (err) {
      console.error("Error creating team:", err);
    }
  };

  // Delete team
  const handleDeleteTeam = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/teams/${id}`, { method: "DELETE" });
      setTeams(prev => prev.filter(team => team.id !== id));
    } catch (err) {
      console.error("Error deleting team:", err);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="dashboard-header">
          <h1>Teams Management</h1>
          <p>Create and manage sports teams</p>
        </div>

        <div className="team-content">
          {/* Tabs */}
          <div className="team-tabs">
            <button
              className={`team-tab-button ${activeTab === "create" ? "team-tab-active" : ""}`}
              onClick={() => setActiveTab("create")}
            >
              Create Team
            </button>
            <button
              className={`team-tab-button ${activeTab === "view" ? "team-tab-active" : ""}`}
              onClick={() => setActiveTab("view")}
            >
              View Teams ({teams.length})
            </button>
          </div>

          {/* Create Team */}
          {activeTab === "create" && (
            <div className="team-form-container">
              <form onSubmit={handleSubmit} className="team-form">
                {/* Team Name & Sport */}
                <div className="team-form-group">
                  <label>Team Name *</label>
                  <input
                    type="text"
                    name="teamName"
                    value={formData.teamName}
                    onChange={handleInputChange}
                    placeholder="Enter team name"
                    required
                  />
                </div>

                <div className="team-form-group">
                  <label>Sport *</label>
                  <select
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

                {/* Players */}
                {formData.sport && (
                  <div className="team-players-section">
                    <div className="players-header">
                      <h3>Players</h3>
                      <button
                        type="button"
                        className="add-player-btn"
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
                          className="remove-player-btn"
                          onClick={() => removePlayer(index)}
                        >
                          ×
                        </button>
                      </div>
                     ))}
                  </div>
                )}

                {/* Actions */}
                <div className="team-form-actions">
                  <button type="submit" className="team-submit-btn">Create Team</button>
                  <button
                    type="button"
                    className="team-cancel-btn"
                    onClick={() => setFormData({ teamName: "", sport: "", players: [] })}
                  >
                    Clear Form
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* View Teams */}
          {activeTab === "view" && (
            <div className="team-view-section">
              {teams.length === 0 ? (
                <div className="team-no-teams">
                  <p>No teams created yet. Create your first team!</p>
                  <button
                    className="team-create-first-btn"
                    onClick={() => setActiveTab("create")}
                  >
                    Create Team
                  </button>
                </div>
              ) : (
                <div className="team-grid">
                  {teams.map(team => (
                    <div key={team.id} className="team-card">
                      <div className="team-card-header">
                        <h3>{team.name}</h3>
                        <span className="sport-badge">{team.sport}</span>
                      </div>
                      <div className="players-list">
                        <strong>Players ({team.players.length})</strong>
                        <ul>
                          {team.players.map((player, i) => (
                            <li key={i}>{player.name} - {player.position}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="team-card-actions">
                        <button
                          className="team-delete-btn"
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
  );
};

export default TeamsPage;
