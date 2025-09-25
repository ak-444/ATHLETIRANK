import React, { useState, useEffect } from "react";
import CustomBracket from "../../components/CustomBracket";
import DoubleEliminationBracket from "../../components/DoubleEliminationBracket"; // Import the double elimination component
import "../../style/Admin_BracketPage.css";

const StaffBrackets = ({ sidebarOpen }) => {
  const [activeTab, setActiveTab] = useState("view");
  const [brackets, setBrackets] = useState([]);
  const [selectedBracket, setSelectedBracket] = useState(null);
  const [bracketMatches, setBracketMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [teams, setTeams] = useState([]);

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

  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

  const handleViewBracket = async (bracket) => {
    setSelectedBracket(bracket);
    await fetchBracketMatches(bracket.id);
    setActiveTab("bracket");
  };

  const handleBackToBrackets = () => {
    setSelectedBracket(null);
    setBracketMatches([]);
    setActiveTab("view");
  };

  // Function to render the appropriate bracket component based on elimination type
  const renderBracketVisualization = () => {
    if (!selectedBracket || !bracketMatches) return null;

    // Check if it's double elimination
    if (selectedBracket.elimination_type === 'double') {
      return (
        <DoubleEliminationBracket 
          matches={bracketMatches} 
          eliminationType="double" 
        />
      );
    } else {
      // Single elimination - use existing CustomBracket component
      return (
        <CustomBracket 
          matches={bracketMatches} 
          eliminationType="single"
        />
      );
    }
  };

  return (
    <div className="admin-dashboard">
      <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="dashboard-header">
          <h1>Tournament Brackets</h1>
          <p>View tournament brackets and match details</p>
        </div>

        <div className="dashboard-main">
          <div className="bracket-content">
            {/* Tabs */}
            <div className="bracket-tabs">
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

            {/* View Brackets */}
            {activeTab === "view" && (
              <div className="bracket-view-section">
                <h2>All Brackets</h2>
                {loading ? (
                  <p>Loading brackets...</p>
                ) : brackets.length === 0 ? (
                  <p>No brackets available.</p>
                ) : (
                  <div className="bracket-grid">
                    {brackets.map(b => {
                      const eventName = events.find(e => e.id === b.event_id)?.name || `Event ${b.event_id}`;
                      return (
                        <div key={b.id} className="bracket-card">
                          <div className="bracket-card-header">
                            <h3>{b.name}</h3>
                            <div className="bracket-badges">
                              <span className={`bracket-sport-badge bracket-sport-${b.sport_type}`}>
                                {capitalize(b.sport_type)}
                              </span>
                            </div>
                          </div>
                          <div className="bracket-card-info">
                            <div><strong>Event:</strong> {eventName}</div>
                            <div><strong>Format:</strong> {b.elimination_type === "single" ? "Single" : "Double"} Elimination</div>
                            <div><strong>Teams:</strong> {b.team_count || 0}</div>
                            <div><strong>Created:</strong> {new Date(b.created_at).toLocaleDateString()}</div>
                            {b.winner_team_name && (
                              <div className="bracket-winner">
                                <strong>Winner:</strong> {b.winner_team_name}
                              </div>
                            )}
                          </div>
                          <div className="bracket-card-actions">
                            <button 
                              className="bracket-view-btn" 
                              onClick={() => handleViewBracket(b)}
                            >
                              View Bracket
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Bracket Visualization */}
            {activeTab === "bracket" && selectedBracket && (
              <div className="bracket-visualization-section">
                <h2>{selectedBracket.name} - Tournament Bracket</h2>
                <div className="bracket-info">
                  <p><strong>Sport:</strong> {capitalize(selectedBracket.sport_type)}</p>
                  <p><strong>Type:</strong> {selectedBracket.elimination_type === "single" ? "Single" : "Double"} Elimination</p>
                  <p><strong>Teams:</strong> {selectedBracket.team_count || 0}</p>
                </div>
                
                {/* Conditional rendering based on elimination type */}
                {selectedBracket.elimination_type === 'single' ? (
                  <CustomBracket 
                    matches={bracketMatches} 
                    eliminationType={selectedBracket.elimination_type} 
                  />
                ) : (
                  <DoubleEliminationBracket 
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

export default StaffBrackets;