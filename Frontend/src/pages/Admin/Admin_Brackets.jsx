import React, { useState, useEffect } from "react";
import "../../style/Admin_BracketPage.css";

const BracketsPage = ({ sidebarOpen }) => {
  const [activeTab, setActiveTab] = useState("create");
  const [brackets, setBrackets] = useState([]);
  const [selectedBracket, setSelectedBracket] = useState(null);

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");

  const [formData, setFormData] = useState({
    bracketName: "",
    bracketType: "single",
    sport: "",             // only 'basketball' or 'volleyball'
    description: "",
    teams: []
  });

  const [teamInput, setTeamInput] = useState("");

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
    const event = events.find(ev => ev.id === parseInt(selectedEventId));
    const sportChosen = formData.sport; // only basketball or volleyball now

    if (event && sportChosen && formData.bracketType && formData.teams.length >= 2) {
      const bracket = {
        id: Date.now(),
        eventId: event.id,
        eventName: event.name,
        // include sport in the bracket name if no custom provided
        name: formData.bracketName || `${event.name} - ${capitalize(sportChosen)} Bracket`,
        type: formData.bracketType,
        sport: sportChosen,
        description: formData.description,
        teams: formData.teams,
        rounds: [],
        createdAt: new Date().toLocaleDateString()
      };

      // build rounds
      let teams = [...formData.teams];
      let roundNumber = 1;

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

      setBrackets(prev => [...prev, bracket]);

      // reset
      setFormData({
        bracketName: "",
        bracketType: "single",
        sport: "",
        description: "",
        teams: []
      });
      setSelectedEventId("");
      setActiveTab("view");
    } else {
      alert("Please select an event, choose a sport (Basketball or Volleyball), and add at least 2 teams.");
    }
  };

  const isPowerOfTwo = (num) => num > 0 && (num & (num - 1)) === 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    generateBracket();
  };

  const deleteBracket = (id) => {
    setBrackets(prev => prev.filter(bracket => bracket.id !== id));
    if (selectedBracket && selectedBracket.id === id) {
      setSelectedBracket(null);
      setActiveTab("view");
    }
  };

  const getChampion = (bracket) => {
    if (bracket.rounds.length > 0) {
      const finalRound = bracket.rounds[bracket.rounds.length - 1];
      if (finalRound.matches[0]?.winner) {
        return finalRound.matches[0].winner;
      }
    }
    return null;
  };

  // helper to capitalize sport label
  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

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
                  {/* Event dropdown */}
                  <div className="bracket-form-group">
                    <label htmlFor="event">Select Event *</label>
                    <select
                      id="event"
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      required
                    >
                      <option value="">Choose an event</option>
                      {events.map(ev => (
                        <option key={ev.id} value={ev.id}>
                          {ev.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sport/Game: only Basketball or Volleyball */}
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

                  <div className="bracket-form-group">
                    <label htmlFor="description">Bracket Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter bracket description"
                      rows="4"
                    />
                  </div>

                  {/* Teams */}
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
                        setSelectedEventId("");
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
                        <span className={`bracket-sport-badge bracket-sport-${bracket.sport}`}>
                          {capitalize(bracket.sport)}
                        </span>
                      </div>
                      
                      <div className="bracket-card-info">
                        <div><strong>Event:</strong> {bracket.eventName}</div>
                        <div><strong>Type:</strong> {bracket.type === "single" ? "Single Elimination" : "Double Elimination"}</div>
                        <div><strong>Teams:</strong> {bracket.teams.length}</div>
                        <div><strong>Created:</strong> {bracket.createdAt}</div>
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

                        {bracket.sport === "basketball" || bracket.sport === "volleyball" ? (
                          <button 
                            className="bracket-stats-btn"
                            onClick={() => alert("Open statistics page for this bracket")}
                          >
                            Stats
                          </button>
                        ) : null}

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

          {/* Bracket Display */}
          {activeTab === "bracket" && selectedBracket && (
            <div className="bracket-display-section">
              <div className="bracket-display-header">
                <div>
                  <h2>{selectedBracket.name}</h2>
                  <p className="bracket-type-info">
                    {selectedBracket.type === "single" 
                      ? "Single Elimination Tournament" 
                      : "Double Elimination Tournament"} - {capitalize(selectedBracket.sport)}
                  </p>
                  <p><strong>Event:</strong> {selectedBracket.eventName}</p>
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
                  <div key={roundIndex} className={`bracket-round ${round.name === 'Final' ? 'bracket-final-round' : ''}`}>
                    <h3 className="bracket-round-title">{round.name}</h3>
                    <div className="bracket-matches">
                      {round.matches.map((match, matchIndex) => (
                        <div key={matchIndex} className="bracket-match">
                          <span>{match.team1.name}</span> vs <span>{match.team2.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {getChampion(selectedBracket) && (
                  <div className="bracket-champion-section">
                    <div className="bracket-champion-trophy">🏆</div>
                    <div className="bracket-champion-title">CHAMPION</div>
                    <div className="bracket-champion-name">
                      {getChampion(selectedBracket).name}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default BracketsPage;
