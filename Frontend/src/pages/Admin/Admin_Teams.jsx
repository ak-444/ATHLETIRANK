import React, { useState } from "react";
import Sidebar from "../../components/sidebar";
import "../../style/Admin_TeamPage.css";

const TeamsPage = ({sidebarOpen}) => {
  
  const [activeTab, setActiveTab] = useState("create");
  const [teams, setTeams] = useState([]);
  const [formData, setFormData] = useState({
    teamName: "",
    sport: "",
    coach: "",
    players: []
  });

  // Position options based on sport
  const positions = {
    Basketball: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"],
    Volleyball: ["Setter", "Outside Hitter", "Middle Blocker", "Opposite Hitter", "Libero", "Defensive Specialist"]
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Reset players when sport changes
    if (name === "sport") {
      setFormData(prev => ({
        ...prev,
        players: []
      }));
    }
  };

  const addPlayer = () => {
    if (formData.sport && formData.players.length < 15) {
      setFormData(prev => ({
        ...prev,
        players: [...prev.players, { name: "", position: "" }]
      }));
    }
  };

  const removePlayer = (index) => {
    setFormData(prev => ({
      ...prev,
      players: prev.players.filter((_, i) => i !== index)
    }));
  };

  const handlePlayerChange = (index, field, value) => {
    const newPlayers = [...formData.players];
    newPlayers[index][field] = value;
    setFormData(prev => ({
      ...prev,
      players: newPlayers
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Filter out players with empty names
    const validPlayers = formData.players.filter(player => player.name.trim() !== "");
    
    if (formData.teamName && formData.sport && formData.coach && validPlayers.length > 0) {
      const newTeam = {
        id: Date.now(),
        teamName: formData.teamName,
        sport: formData.sport,
        coach: formData.coach,
        players: validPlayers,
        createdAt: new Date().toLocaleDateString()
      };
      
      setTeams(prev => [...prev, newTeam]);
      
      // Reset form
      setFormData({
        teamName: "",
        sport: "",
        coach: "",
        players: []
      });
      
      // Switch to view tab
      setActiveTab("view");
    } else {
      alert("Please fill in all required fields and add at least one player.");
    }
  };

  const handleDeleteTeam = (id) => {
    setTeams(prev => prev.filter(team => team.id !== id));
  };

  return (
    <div className="admin-dashboard">
      
      
      <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="dashboard-header">
          <h1>Teams Management</h1>
          <p>Create and manage sports teams</p>
        </div>
        
        <div className="add-team-container">
          <div className="add-team-tabs">
            <button 
              className={`add-team-tab-button ${activeTab === "create" ? "add-team-active" : ""}`}
              onClick={() => setActiveTab("create")}
            >
              Create Team
            </button>
            <button 
              className={`add-team-tab-button ${activeTab === "view" ? "add-team-active" : ""}`}
              onClick={() => setActiveTab("view")}
            >
              View Teams ({teams.length})
            </button>
          </div>

          {activeTab === "create" && (
            <div className="add-team-create-section">
              <div className="add-team-form-container">
                <h2>Create New Team</h2>
                <form onSubmit={handleSubmit} className="add-team-form">
                  <div className="add-team-form-row">
                    <div className="add-team-form-group">
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
                    
                    <div className="add-team-form-group">
                      <label htmlFor="sport">Sport *</label>
                      <select
                        id="sport"
                        name="sport"
                        value={formData.sport}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select a sport</option>
                        <option value="Basketball">Basketball</option>
                        <option value="Volleyball">Volleyball</option>
                      </select>
                    </div>
                  </div>

                  <div className="add-team-form-group">
                    <label htmlFor="coach">Coach Name *</label>
                    <input
                      type="text"
                      id="coach"
                      name="coach"
                      value={formData.coach}
                      onChange={handleInputChange}
                      placeholder="Enter coach name"
                      required
                    />
                  </div>

                  <div className="add-team-players-section">
                    <div className="add-team-players-header">
                      <h3>Players</h3>
                      <button 
                        type="button" 
                        onClick={addPlayer}
                        className="add-team-add-player-btn"
                        disabled={!formData.sport || formData.players.length >= 15}
                      >
                        Add Player
                      </button>
                    </div>
                    
                    {formData.sport && formData.players.length === 0 && (
                      <p className="add-team-players-note">
                        Click "Add Player" to start adding players for your {formData.sport} team
                      </p>
                    )}

                    <div className="add-team-players-list">
                      {formData.players.map((player, index) => (
                        <div key={index} className="add-team-player-card">
                          <div className="add-team-player-header">
                            <span className="add-team-player-number">Player {index + 1}</span>
                            <button 
                              type="button"
                              onClick={() => removePlayer(index)}
                              className="add-team-remove-player-btn"
                            >
                              ×
                            </button>
                          </div>
                          
                          <div className="add-team-player-inputs">
                            <div className="add-team-player-input-group">
                              <label>Player Name *</label>
                              <input
                                type="text"
                                value={player.name}
                                onChange={(e) => handlePlayerChange(index, 'name', e.target.value)}
                                placeholder="Enter player name"
                                required
                              />
                            </div>
                            
                            <div className="add-team-player-input-group">
                              <label>Position *</label>
                              <select
                                value={player.position}
                                onChange={(e) => handlePlayerChange(index, 'position', e.target.value)}
                                required
                              >
                                <option value="">Select position</option>
                                {positions[formData.sport]?.map(pos => (
                                  <option key={pos} value={pos}>{pos}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="add-team-form-actions">
                    <button type="submit" className="add-team-submit-btn">
                      Create Team
                    </button>
                    <button 
                      type="button" 
                      className="add-team-cancel-btn"
                      onClick={() => {
                        setFormData({
                          teamName: "",
                          sport: "",
                          coach: "",
                          players: []
                        });
                      }}
                    >
                      Clear Form
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === "view" && (
            <div className="add-team-view-section">
              <h2>All Teams</h2>
              {teams.length === 0 ? (

                <div className="add-team-no-teams">
                  <p>No teams created yet. Create your first team!</p>
                  <button className="add-team-create-first-btn" onClick={() => setActiveTab("create")}>
                    Create Team
                  </button>
                </div>

              )
               
              : (
                <div className="add-team-grid">
                  {teams.map((team) => (
                    <div key={team.id} className="add-team-card">

                      <div className="add-team-card-header">

                        <h3>{team.teamName}</h3>

                        <span className={`add-team-sport-badge add-team-sport-${team.sport.toLowerCase()}`}>
                          {team.sport}
                        </span>

                      </div>
                      
                      <div className="add-team-card-info">

                        <div className="add-team-coach-info">
                          <strong>Coach:</strong> {team.coach}
                        </div>

                        <div className="add-team-created-date">
                          <strong>Created:</strong> {team.createdAt}
                        </div>
                        
                      </div>

                      <div className="add-team-players-display">
                        <h4>Players ({team.players.length})</h4>
                        <div className="add-team-players-grid">
                          {team.players.map((player, index) => (
                            <div key={index} className="add-team-player-item">
                              <div className="add-team-player-name">{player.name}</div>
                              <div className="add-team-player-position">{player.position}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="add-team-card-actions">
                        <button className="add-team-delete-btn" onClick={() => handleDeleteTeam(team.id)}>
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