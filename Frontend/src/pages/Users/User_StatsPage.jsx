import React, { useState, useEffect } from "react";
import { FaSearch, FaFilter, FaDownload, FaUsers, FaChartLine, FaTrophy, FaEye, FaArrowLeft } from "react-icons/fa";
import '../../style/User_StatsPage.css'
import { useNavigate } from "react-router-dom";

const UserStatsPage = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [playerStats, setPlayerStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("teams");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState(null);

   const filteredTeams = teams.filter(team => 
    sportFilter === "all" || team.sport?.toLowerCase() === sportFilter
  );
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setShowFilters(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleBackToHome = () => {
    navigate("/");
  };

  // Fetch teams with statistics from API
  // Change line ~47:
useEffect(() => {
  const fetchTeams = async () => {
    setLoading(true);
    setError(null);
    try {
      // ✅ FIXED: Changed endpoint
     const response = await fetch("http://localhost:5000/api/user-stats/teams");
      if (!response.ok) {
        throw new Error("Failed to fetch teams");
      }
      const data = await response.json();
      console.log('Teams loaded:', data); // Debug log
      setTeams(data);
    } catch (err) {
      console.error("Error fetching teams:", err);
      setError("Failed to load teams. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  fetchTeams();
}, []);

// Change line ~68:
const handleTeamSelect = async (team) => {
  console.log('=== TEAM SELECTED ===');
  console.log('Team object:', team);
  console.log('Team ID:', team.id);
  
  setSelectedTeam(team);
  setLoading(true);
  setError(null);
  
  try {
    // ✅ FIXED: Changed endpoint
    const response = await fetch(`http://localhost:5000/api/user-stats/teams/${team.id}/stats-summary`);
    if (!response.ok) {
      throw new Error("Failed to fetch team statistics");
    }
    const data = await response.json();
    
    console.log('Stats received:', data); // Debug log
    
    // Transform the data to ensure all fields exist
    const transformedStats = data.players?.map(player => ({
      id: player.id || player._id,
      name: player.name || 'Unknown Player',
      jersey: player.jersey || 'N/A',
      position: player.position || '-',
      games_played: player.games_played || 0,
      // Basketball stats
      points: player.points || 0,
      assists: player.assists || 0,
      rebounds: player.rebounds || 0,
      three_pointers_made: player.three_pointers_made || 0,
      steals: player.steals || 0,
      blocks: player.blocks || 0,
      fouls: player.fouls || 0,
      turnovers: player.turnovers || 0,
      // Volleyball stats
      kills: player.kills || 0,
      kill_attempts: player.kill_attempts || 0,
      kill_errors: player.kill_errors || 0,
      assists_volleyball: player.assists_volleyball || 0,
      service_aces: player.service_aces || 0,
      service_errors: player.service_errors || 0,
      service_attempts: player.service_attempts || 0,
      digs: player.digs || 0,
      blocks_volleyball: player.blocks_volleyball || 0,
      reception_attempts: player.reception_attempts || 0,
      reception_errors: player.reception_errors || 0
    })) || [];
    
    setPlayerStats(transformedStats);
    setActiveTab("statistics");
  } catch (err) {
    console.error("Error fetching team data:", err);
    setError("Failed to load team statistics.");
    setPlayerStats([]);
  } finally {
    setLoading(false);
  }
};

  // Filter players based on search term
  const filteredPlayers = playerStats.filter(player => 
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (player.jersey && player.jersey.toString().includes(searchTerm)) ||
    (player.position && player.position.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate team averages
  const calculateTeamAverages = () => {
    if (playerStats.length === 0) return null;
    
    const isBasketball = selectedTeam?.sport?.toLowerCase() === "basketball";
    const playerCount = playerStats.length;
    
    if (isBasketball) {
      return {
        games_played: Math.max(...playerStats.map(p => p.games_played || 0)),
        avg_points: (playerStats.reduce((sum, player) => sum + (player.points || 0), 0) / playerCount).toFixed(1),
        avg_rebounds: (playerStats.reduce((sum, player) => sum + (player.rebounds || 0), 0) / playerCount).toFixed(1),
        avg_assists: (playerStats.reduce((sum, player) => sum + (player.assists || 0), 0) / playerCount).toFixed(1),
        avg_steals: (playerStats.reduce((sum, player) => sum + (player.steals || 0), 0) / playerCount).toFixed(1),
        avg_blocks: (playerStats.reduce((sum, player) => sum + (player.blocks || 0), 0) / playerCount).toFixed(1),
      };
    } else {
      const totalKills = playerStats.reduce((sum, player) => sum + (player.kills || 0), 0);
      const totalKillAttempts = playerStats.reduce((sum, player) => sum + (player.kill_attempts || 0), 0);
      
      return {
        games_played: Math.max(...playerStats.map(p => p.games_played || 0)),
        avg_kills: (totalKills / playerCount).toFixed(1),
        avg_assists: (playerStats.reduce((sum, player) => sum + (player.assists_volleyball || 0), 0) / playerCount).toFixed(1),
        avg_digs: (playerStats.reduce((sum, player) => sum + (player.digs || 0), 0) / playerCount).toFixed(1),
        avg_blocks: (playerStats.reduce((sum, player) => sum + (player.blocks_volleyball || 0), 0) / playerCount).toFixed(1),
        avg_aces: (playerStats.reduce((sum, player) => sum + (player.service_aces || 0), 0) / playerCount).toFixed(1),
        kill_percentage: totalKillAttempts > 0 ? ((totalKills / totalKillAttempts) * 100).toFixed(1) : '0.0'
      };
    }
  };

  const teamAverages = selectedTeam ? calculateTeamAverages() : null;

  // Export data as CSV
  const exportToCSV = () => {
    if (playerStats.length === 0) return;
    
    const isBasketball = selectedTeam?.sport?.toLowerCase() === "basketball";
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (isBasketball) {
      csvContent += "Player,Jersey,Position,GP,PTS,AST,REB,3PM,STL,BLK,TO,Fouls\n";
      playerStats.forEach(player => {
        csvContent += `${player.name},${player.jersey},${player.position || ''},${player.games_played || 0},${player.points || 0},${player.assists || 0},${player.rebounds || 0},${player.three_pointers_made || 0},${player.steals || 0},${player.blocks || 0},${player.turnovers || 0},${player.fouls || 0}\n`;
      });
    } else {
      csvContent += "Player,Jersey,Position,GP,KILLS,AST,DIGS,BLOCKS,ACES,SERVICE ERRORS,ATTACK ERRORS,RECEPTION ERRORS\n";
      playerStats.forEach(player => {
        csvContent += `${player.name},${player.jersey},${player.position || ''},${player.games_played || 0},${player.kills || 0},${player.assists_volleyball || 0},${player.digs || 0},${player.blocks_volleyball || 0},${player.service_aces || 0},${player.service_errors || 0},${player.kill_errors || 0},${player.reception_errors || 0}\n`;
      });
    }
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedTeam?.name || 'team'}_stats.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render stats table based on sport
  const renderStatsTable = () => {
    if (!selectedTeam) return null;
    
    const isBasketball = selectedTeam.sport?.toLowerCase() === "basketball";
    
    return (
      <div className="table-container">
        <div className="table-controls">
          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search players by name, jersey, or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-controls">
            {isMobile ? (
              <>
                <button 
                  className="filter-toggle-btn"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <FaFilter /> Filters
                </button>
                
                {showFilters && (
                  <div className="mobile-filters">
                    <div className="filter-group">
                      <select 
                        value={timeFilter} 
                        onChange={(e) => setTimeFilter(e.target.value)}
                      >
                        <option value="all">All Time</option>
                        <option value="season">This Season</option>
                        <option value="month">This Month</option>
                        <option value="week">This Week</option>
                      </select>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="filter-group">
                <select 
                  value={timeFilter} 
                  onChange={(e) => setTimeFilter(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="season">This Season</option>
                  <option value="month">This Month</option>
                  <option value="week">This Week</option>
                </select>
              </div>
            )}
            
            <button className="export-btn" onClick={exportToCSV} disabled={playerStats.length === 0}>
              <FaDownload /> Export CSV
            </button>
          </div>
        </div>

        {/* Team Summary Card */}
        {teamAverages && (
          <div className="team-summary">
            <h3>Team Overview</h3>
            <div className="summary-grid">
              {isBasketball ? (
                <>
                  <div className="summary-item">
                    <span className="summary-label">Avg Points</span>
                    <span className="summary-value">{teamAverages.avg_points}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Avg Rebounds</span>
                    <span className="summary-value">{teamAverages.avg_rebounds}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Avg Assists</span>
                    <span className="summary-value">{teamAverages.avg_assists}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Avg Steals</span>
                    <span className="summary-value">{teamAverages.avg_steals}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Avg Blocks</span>
                    <span className="summary-value">{teamAverages.avg_blocks}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="summary-item">
                    <span className="summary-label">Avg Kills</span>
                    <span className="summary-value">{teamAverages.avg_kills}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Avg Assists</span>
                    <span className="summary-value">{teamAverages.avg_assists}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Avg Digs</span>
                    <span className="summary-value">{teamAverages.avg_digs}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Avg Blocks</span>
                    <span className="summary-value">{teamAverages.avg_blocks}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Kill%</span>
                    <span className="summary-value">{teamAverages.kill_percentage}%</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
        <div className="table-wrapper">
          {filteredPlayers.length === 0 ? (
            <div className="empty-state">
              <p>No players found{searchTerm ? ' matching your search' : ' for this team'}.</p>
            </div>
          ) : (
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Jersey</th>
                  <th>Position</th>
                  <th>GP</th>
                  
                  {isBasketball ? (
                    <>
                      <th>PTS</th>
                      <th>REB</th>
                      <th>AST</th>
                      <th>3PM</th>
                      <th>STL</th>
                      <th>BLK</th>
                      <th>TO</th>
                    </>
                  ) : (
                    <>
                      <th>KILLS</th>
                      <th>AST</th>
                      <th>DIGS</th>
                      <th>BLOCKS</th>
                      <th>ACES</th>
                      <th>KILL%</th>
                      <th>REC%</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player) => {
                  const killPercentage = player.kill_attempts > 0 
                    ? ((player.kills / player.kill_attempts) * 100).toFixed(1)
                    : '0.0';
                  
                  const receptionPercentage = player.reception_attempts > 0
                    ? (((player.reception_attempts - player.reception_errors) / player.reception_attempts) * 100).toFixed(1)
                    : '0.0';

                  return (
                    <tr key={player.id}>
                      <td className="player-name">{player.name}</td>
                      <td className="jersey-number">{player.jersey}</td>
                      <td className="position">{player.position}</td>
                      <td>{player.games_played}</td>
                      
                      {isBasketball ? (
                        <>
                          <td className="highlight">{player.points}</td>
                          <td>{player.rebounds}</td>
                          <td>{player.assists}</td>
                          <td>{player.three_pointers_made}</td>
                          <td>{player.steals}</td>
                          <td>{player.blocks}</td>
                          <td>{player.turnovers}</td>
                        </>
                      ) : (
                        <>
                          <td className="highlight">{player.kills}</td>
                          <td>{player.assists_volleyball}</td>
                          <td>{player.digs}</td>
                          <td>{player.blocks_volleyball}</td>
                          <td>{player.service_aces}</td>
                          <td>{killPercentage}%</td>
                          <td>{receptionPercentage}%</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="user-teams-page">
      <div className="teams-header">
        <div className="header-content">
          <div className="header-top">
            <button className="back-btn" onClick={handleBackToHome}>
              <FaArrowLeft className="back-arrow" />
              Back to Home
            </button>
          </div>
          <div className="header-center">
            <h1><FaChartLine className="header-icon" /> Team Statistics</h1>
            <p>Explore team performance and player statistics</p>
          </div>
        </div>
      </div>

      <div className="teams-container">
        <div className="content">
          {/* Error message */}
          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={() => setError(null)} className="error-close">×</button>
            </div>
          )}

          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab-button ${activeTab === "teams" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("teams")}
            >
              <FaUsers /> Select Team
            </button>
            {selectedTeam && (
              <button
                className={`tab-button ${activeTab === "statistics" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("statistics")}
              >
                <FaTrophy /> View Statistics
              </button>
            )}
          </div>

          {/* Select Team */}
          {activeTab === "teams" && (
            <div className="view-section">
              <div className="section-header">
                <h2>Choose a Team</h2>
                <div className="sport-filter">
                  <label>Filter by Sport:</label>
                  <select 
                    value={sportFilter} 
                    onChange={(e) => setSportFilter(e.target.value)}
                  >
                    <option value="all">All Sports</option>
                    <option value="basketball">Basketball</option>
                    <option value="volleyball">Volleyball</option>
                  </select>
                </div>
              </div>
              
              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading teams...</p>
                </div>
              ) : filteredTeams.length === 0 ? (
                <div className="empty-state">
                  <FaUsers className="empty-icon" />
                  <p>No teams available{sportFilter !== 'all' ? ' for the selected sport' : ''}.</p>
                </div>
              ) : (
                <div className="teams-grid">
                  {filteredTeams.map((team) => (
                    <div className="team-card" key={team.id} onClick={() => handleTeamSelect(team)}>
                      <div className="team-card-header">
                        <h3 className="team-name">{team.name}</h3>
                        <span className={`sport-badge ${team.sport?.toLowerCase() === "basketball" ? "sport-basketball" : "sport-volleyball"}`}>
                          {team.sport}
                        </span>
                      </div>
                      
                      <div className="team-record">
                        <div className="record-item">
                          <span className="record-label">Wins</span>
                          <span className="record-value wins">{team.wins || 0}</span>
                        </div>
                        <div className="record-divider">-</div>
                        <div className="record-item">
                          <span className="record-label">Losses</span>
                          <span className="record-value losses">{team.losses || 0}</span>
                        </div>
                      </div>
                      
                      <div className="team-info">
                        <div className="rank">
                          <FaTrophy className="rank-icon" />
                          <span>Rank #{team.rank || 'N/A'}</span>
                        </div>
                        <div className={`status status-${team.status?.toLowerCase() || 'active'}`}>
                          {team.status || 'Active'}
                        </div>
                      </div>
                      
                      <div className="team-actions">
                        <button className="view-team-btn">
                          <FaEye /> View Statistics
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Team Statistics */}
          {activeTab === "statistics" && selectedTeam && (
            <div className="view-section">
              <div className="section-header">
                <div className="team-header-info">
                  <h2>{selectedTeam.name} Statistics</h2>
                  <span className={`sport-badge ${selectedTeam.sport?.toLowerCase() === "basketball" ? "sport-basketball" : "sport-volleyball"}`}>
                    {selectedTeam.sport}
                  </span>
                </div>
                <div className="team-record-display">
                  <span className="record">
                    {selectedTeam.wins || 0} - {selectedTeam.losses || 0}
                  </span>
                  <span className="rank">Rank #{selectedTeam.rank || 'N/A'}</span>
                </div>
              </div>
              
              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading team statistics...</p>
                </div>
              ) : (
                renderStatsTable()
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserStatsPage;