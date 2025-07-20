import React, { useState } from "react";
import "../../style/Admin_BracketPage.css";

const BracketsPage = ({ sidebarOpen }) => {
  const [activeTab, setActiveTab] = useState("create");
  const [brackets, setBrackets] = useState([]);
  const [selectedBracket, setSelectedBracket] = useState(null);
  
  const [formData, setFormData] = useState({
    bracketName: "",
    bracketType: "single",
    sport: "",
    description: "",
    teams: []
  });

  const [teamInput, setTeamInput] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTeamInputChange = (e) => {
    setTeamInput(e.target.value);
  };

  const addTeam = () => {
    if (teamInput.trim() && formData.teams.length < 16) {
      setFormData(prev => ({
        ...prev,
        teams: [...prev.teams, { name: teamInput.trim() }]
      }));
      setTeamInput("");
    }
  };

  const removeTeam = (index) => {
    setFormData(prev => ({
      ...prev,
      teams: prev.teams.filter((_, i) => i !== index)
    }));
  };

  const generateBracket = () => {
    if (formData.bracketName && formData.bracketType && formData.sport && formData.teams.length >= 2) {
      const bracket = {
        id: Date.now(),
        name: formData.bracketName,
        type: formData.bracketType,
        sport: formData.sport,
        description: formData.description,
        teams: formData.teams,
        rounds: [],
        createdAt: new Date().toLocaleDateString()
      };

      if (formData.bracketType === "single") {
        let teams = [...formData.teams];
        let roundNumber = 1;
        
        // If teams aren't a power of 2, add byes
        while (!isPowerOfTwo(teams.length)) {
          teams.push({ name: "BYE", isBye: true });
        }

        while (teams.length > 1) {
          const round = {
            name: roundNumber === 1 ? "First Round" : 
                  teams.length === 2 ? "Final" :
                  teams.length === 4 ? "Semi-Final" :
                  teams.length === 8 ? "Quarter-Final" :
                  `Round ${roundNumber}`,
            matches: []
          };

          for (let i = 0; i < teams.length; i += 2) {
            round.matches.push({
              id: `${roundNumber}-${i/2}`,
              team1: teams[i],
              team2: teams[i + 1],
              winner: null,
              completed: false
            });
          }

          bracket.rounds.push(round);
          teams = Array(teams.length / 2).fill().map((_, index) => ({ 
            name: "TBD", 
            isTBD: true,
            fromMatch: `${roundNumber}-${index}`
          }));
          roundNumber++;
        }
      }

      setBrackets(prev => [...prev, bracket]);
      
      // Reset form
      setFormData({
        bracketName: "",
        bracketType: "single",
        sport: "",
        description: "",
        teams: []
      });
      
      // Switch to view tab
      setActiveTab("view");
    } else {
      alert("Please fill in all required fields and add at least 2 teams.");
    }
  };

  const isPowerOfTwo = (num) => {
    return num > 0 && (num & (num - 1)) === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    generateBracket();
  };

  const updateMatchWinner = (bracketId, roundIndex, matchIndex, winner) => {
    setBrackets(prev => prev.map(bracket => {
      if (bracket.id === bracketId) {
        const updatedBracket = { ...bracket };
        updatedBracket.rounds = [...bracket.rounds];
        updatedBracket.rounds[roundIndex] = { ...bracket.rounds[roundIndex] };
        updatedBracket.rounds[roundIndex].matches = [...bracket.rounds[roundIndex].matches];
        updatedBracket.rounds[roundIndex].matches[matchIndex] = {
          ...bracket.rounds[roundIndex].matches[matchIndex],
          winner: winner,
          completed: true
        };

        // Update next round if exists
        if (roundIndex < bracket.rounds.length - 1) {
          const nextRound = updatedBracket.rounds[roundIndex + 1];
          const nextMatchIndex = Math.floor(matchIndex / 2);
          const isTeam1 = matchIndex % 2 === 0;
          
          if (nextRound.matches[nextMatchIndex]) {
            nextRound.matches[nextMatchIndex] = {
              ...nextRound.matches[nextMatchIndex],
              [isTeam1 ? 'team1' : 'team2']: winner
            };
          }
        }

        return updatedBracket;
      }
      return bracket;
    }));
  };

  const deleteBracket = (id) => {
    setBrackets(prev => prev.filter(bracket => bracket.id !== id));
    if (selectedBracket && selectedBracket.id === id) {
      setSelectedBracket(null);
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

          {activeTab === "create" && (
            <div className="bracket-create-section">
              <div className="bracket-form-container">
                <h2>Create New Bracket</h2>
                <form className="bracket-form" onSubmit={handleSubmit}>
                  <div className="bracket-form-row">
                    <div className="bracket-form-group">
                      <label htmlFor="bracketName">Bracket Name *</label>
                      <input
                        type="text"
                        id="bracketName"
                        name="bracketName"
                        value={formData.bracketName}
                        onChange={handleInputChange}
                        placeholder="Enter bracket name"
                        required
                      />
                    </div>

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
                  </div>

                  <div className="bracket-form-row">
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
                        <option value="Basketball">Basketball</option>
                        <option value="Volleyball">Volleyball</option>
                      </select>
                    </div>
                  </div>

                  <div className="bracket-form-group">
                    <label htmlFor="description">Bracket Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter bracket description"
                      rows="5"
                    />
                  </div>

                  <div className="bracket-form-group">
                    <label>Teams *</label>
                    <div className="bracket-team-input-container">
                      <input
                        type="text"
                        value={teamInput}
                        onChange={handleTeamInputChange}
                        placeholder="Enter team name"
                        className="bracket-team-input"
                      />
                      <button
                        type="button"
                        onClick={addTeam}
                        className="bracket-add-team-btn"
                        disabled={!teamInput.trim() || formData.teams.length >= 16}
                      >
                        Add Team
                      </button>
                    </div>
                    <small className="bracket-team-count">
                      {formData.teams.length} team(s) added (max 16)
                    </small>
                    
                    <div className="bracket-teams-list">
                      {formData.teams.map((team, index) => (
                        <div key={index} className="bracket-team-tag">
                          {team.name}
                          <button
                            type="button"
                            onClick={() => removeTeam(index)}
                            className="bracket-remove-team-btn"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bracket-form-actions">
                    <button type="submit" className="bracket-submit-btn">
                      Generate Bracket
                    </button>
                    
                    <button
                      type="button"
                      className="bracket-cancel-btn"
                      onClick={() => {
                        setFormData({
                          bracketName: "",
                          bracketType: "single",
                          sport: "",
                          description: "",
                          teams: []
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
            <div className="bracket-view-section">
              <h2>All Brackets</h2>
              {brackets.length === 0 ? (
                <div className="bracket-no-brackets">
                  <p>No brackets created yet. Create your first bracket!</p>
                  <button className="bracket-create-first-btn" onClick={() => setActiveTab("create")}>
                    Create Bracket
                  </button>
                </div>
              ) : (
                <div className="bracket-grid">
                  {brackets.map((bracket) => (
                    <div key={bracket.id} className="bracket-card">
                      <div className="bracket-card-header">
                        <h3>{bracket.name}</h3>
                        <span className={`bracket-sport-badge bracket-sport-${bracket.sport.toLowerCase()}`}>
                          {bracket.sport}
                        </span>
                      </div>
                      
                      <div className="bracket-card-info">
                        <div className="bracket-type-info">
                          <strong>Type:</strong> {bracket.type === "single" ? "Single Elimination" : "Double Elimination"}
                        </div>
                        <div className="bracket-teams-count">
                          <strong>Teams:</strong> {bracket.teams.length}
                        </div>
                        <div className="bracket-created-date">
                          <strong>Created:</strong> {bracket.createdAt}
                        </div>
                        {bracket.description && (
                          <div className="bracket-description">
                            <strong>Description:</strong> {bracket.description}
                          </div>
                        )}
                      </div>

                      <div className="bracket-card-actions">
                        <button 
                          className="bracket-view-btn"
                          onClick={() => {
                            setSelectedBracket(bracket);
                            setActiveTab("bracket");
                          }}
                        >
                          View Bracket
                        </button>
                        <button 
                          className="bracket-delete-btn" 
                          onClick={() => deleteBracket(bracket.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "bracket" && selectedBracket && (
            <div className="bracket-display-section">
              <div className="bracket-display-header">
                <div>
                  <h2>{selectedBracket.name}</h2>
                  <p className="bracket-type-info">
                    {selectedBracket.type === "single" 
                      ? "Single Elimination Tournament" 
                      : "Double Elimination Tournament"} - {selectedBracket.sport}
                  </p>
                </div>
                <button 
                  className="bracket-back-btn"
                  onClick={() => setActiveTab("view")}
                >
                  ← Back to Brackets
                </button>
              </div>
              
              <div className="bracket-visualization">
                {selectedBracket.rounds.map((round, roundIndex) => (
                  <div key={roundIndex} className="bracket-round">
                    <h3 className="bracket-round-title">{round.name}</h3>
                    <div className="bracket-matches">
                      {round.matches.map((match, matchIndex) => (
                        <div key={matchIndex} className="bracket-match">
                          <div className="bracket-match-container">
                            <div 
                              className={`bracket-team bracket-team-top ${
                                match.winner && match.winner.name === match.team1.name ? 'bracket-winner' : ''
                              } ${match.team1.isBye ? 'bracket-bye' : ''}`}
                              onClick={() => {
                                if (!match.team1.isBye && !match.team2.isBye && !match.team1.isTBD && !match.team2.isTBD) {
                                  updateMatchWinner(selectedBracket.id, roundIndex, matchIndex, match.team1);
                                }
                              }}
                            >
                              {match.team1.name}
                            </div>
                            
                            <div className="bracket-versus">vs</div>
                            
                            <div 
                              className={`bracket-team bracket-team-bottom ${
                                match.winner && match.winner.name === match.team2.name ? 'bracket-winner' : ''
                              } ${match.team2.isBye ? 'bracket-bye' : ''}`}
                              onClick={() => {
                                if (!match.team1.isBye && !match.team2.isBye && !match.team1.isTBD && !match.team2.isTBD) {
                                  updateMatchWinner(selectedBracket.id, roundIndex, matchIndex, match.team2);
                                }
                              }}
                            >
                              {match.team2.name}
                            </div>

                            {/* Connector line to next round */}
                            {roundIndex < selectedBracket.rounds.length - 1 && (
                              <div className="bracket-connector">
                                <div className="bracket-line-horizontal"></div>
                                <div className="bracket-line-vertical"></div>
                                <div className="bracket-line-horizontal-next"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Championship winner display */}
              {selectedBracket.rounds.length > 0 && 
               selectedBracket.rounds[selectedBracket.rounds.length - 1].matches[0]?.winner && (
                <div className="bracket-champion">
                  <div className="bracket-champion-container">
                    <h3>🏆 Tournament Champion</h3>
                    <div className="bracket-champion-name">
                      {selectedBracket.rounds[selectedBracket.rounds.length - 1].matches[0].winner.name}
                    </div>
                  </div>
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