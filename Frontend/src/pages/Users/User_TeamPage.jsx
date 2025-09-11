import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../style/User_TeamPage.css";
import { RiTeamFill } from "react-icons/ri";

const UserTeamsPage = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSport, setSelectedSport] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Available sports for filtering
  const sports = ["Basketball", "Volleyball"];

  // Handle back to homepage
  const handleBackToHome = () => {
    navigate("/");
  };

  // Fetch teams on component mount
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

  // Filter teams based on search and sport selection
  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSport = selectedSport === "" || team.sport === selectedSport;
    return matchesSearch && matchesSport;
  });

  // Capitalize first letter
  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

  // Handle team detail view
  const handleViewTeam = (team) => {
    setSelectedTeam(team);
  };

  const handleCloseModal = () => {
    setSelectedTeam(null);
  };

  return (
    <div className="user-teams-page">
      <div className="teams-header">
        <div className="header-content">
          <div className="header-top">
            <button className="back-btn" onClick={handleBackToHome}>
              <span className="back-arrow">←</span>
              Back to Home
            </button>
          </div>
          
          <p>
            <h1><RiTeamFill className="header-icon"/>Teams</h1>Explore all registered teams and their players
            </p>
        </div>
      </div>

      <div className="teams-container">
        {/* Search and Filter Section */}
        <div className="teams-controls">
          <div className="search-section">
            <input
              type="text"
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-section">
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="sport-filter"
            >
              <option value="">All Sports</option>
              {sports.map(sport => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Teams Display */}
        <div className="teams-content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading teams...</p>
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏆</div>
              <h3>No teams found</h3>
              <p>
                {searchTerm || selectedSport 
                  ? "Try adjusting your search or filter criteria" 
                  : "No teams have been registered yet"
                }
              </p>
            </div>
          ) : (
            <>
              <div className="teams-stats">
                <span className="stats-text">
                  Showing {filteredTeams.length} of {teams.length} teams
                </span>
              </div>
              <div className="teams-grid">
                {filteredTeams.map(team => (
                  <div key={team.id} className="team-card">
                    <div className="team-card-header">
                      <h3 className="team-name">{team.name}</h3>
                      <span className={`sport-badge sport-${team.sport.toLowerCase()}`}>
                        {capitalize(team.sport)}
                      </span>
                    </div>
                    <div className="team-card-body">
                      <div className="team-info">
                        <div className="info-item">
                          <span className="info-label">Players:</span>
                          <span className="info-value">{team.players.length}</span>
                        </div>
                      </div>
                      <div className="players-preview">
                        {team.players.slice(0, 3).map((player, i) => (
                          <div key={i} className="player-preview">
                            <span className="player-name">{player.name}</span>
                            <span className="player-position">{player.position}</span>
                          </div>
                        ))}
                        {team.players.length > 3 && (
                          <div className="more-players">
                            +{team.players.length - 3} more players
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="team-card-footer">
                      <button 
                        className="view-team-btn"
                        onClick={() => handleViewTeam(team)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Team Detail Modal */}
      {selectedTeam && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <h2>{selectedTeam.name}</h2>
                <span className={`sport-badge sport-${selectedTeam.sport.toLowerCase()}`}>
                  {capitalize(selectedTeam.sport)}
                </span>
              </div>
              <button className="close-btn" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="team-details">
                <h3>Team Roster ({selectedTeam.players.length} players)</h3>
                <div className="players-list">
                  {selectedTeam.players.map((player, index) => (
                    <div key={index} className="player-item">
                      <div className="player-info">
                        <span className="player-name">{player.name}</span>
                        <span className="player-position">{player.position}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTeamsPage;