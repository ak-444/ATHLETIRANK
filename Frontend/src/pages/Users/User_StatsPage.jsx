import React, { useState, useEffect } from "react";
import { FaSearch, FaFilter, FaDownload, FaUsers, FaChartLine, FaTrophy, FaEye } from "react-icons/fa";
import '../../style/User_StatsPage.css'
import { useNavigate } from "react-router-dom";

const UserStatsPage = () => {
    const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [playerStats, setPlayerStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("teams");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showFilters, setShowFilters] = useState(false);

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

  // Mock data for demonstration
  const mockTeams = [
    { id: 1, name: "Team A", sport: "Basketball", status: "active", wins: 8, losses: 2, rank: 1 },
    { id: 2, name: "Team B", sport: "Basketball", status: "active", wins: 6, losses: 4, rank: 3 },
    { id: 3, name: "Team C", sport: "Volleyball", status: "active", wins: 7, losses: 3, rank: 2 },
    { id: 4, name: "Team D", sport: "Volleyball", status: "active", wins: 5, losses: 5, rank: 4 }
  ];

  const mockPlayers = [
    { id: 1, name: "Player A1", jersey: "1", team_id: 1, position: "Guard" },
    { id: 2, name: "Player A2", jersey: "2", team_id: 1, position: "Forward" },
    { id: 3, name: "Player A3", jersey: "3", team_id: 1, position: "Center" },
    { id: 4, name: "Player B1", jersey: "4", team_id: 2, position: "Guard" },
    { id: 5, name: "Player B2", jersey: "5", team_id: 2, position: "Forward" },
    { id: 6, name: "Player B3", jersey: "6", team_id: 2, position: "Center" },
    { id: 7, name: "Player C1", jersey: "7", team_id: 3, position: "Setter" },
    { id: 8, name: "Player C2", jersey: "8", team_id: 3, position: "Spiker" },
    { id: 9, name: "Player C3", jersey: "9", team_id: 3, position: "Libero" },
    { id: 10, name: "Player D1", jersey: "10", team_id: 4, position: "Setter" },
    { id: 11, name: "Player D2", jersey: "11", team_id: 4, position: "Spiker" },
    { id: 12, name: "Player D3", jersey: "12", team_id: 4, position: "Libero" }
  ];

  // Mock player statistics data
  const mockPlayerStats = [
    // Basketball players
    { 
      player_id: 1, 
      games_played: 5, 
      points: 85, 
      field_goals_made: 35, 
      field_goals_attempted: 70, 
      three_pointers_made: 15, 
      three_pointers_attempted: 30, 
      free_throws_made: 20, 
      free_throws_attempted: 25, 
      rebounds_offensive: 10, 
      rebounds_defensive: 25, 
      assists: 22, 
      steals: 8, 
      blocks: 5, 
      turnovers: 12, 
      fouls: 15, 
      minutes_played: 150 
    },
    { 
      player_id: 2, 
      games_played: 5, 
      points: 65, 
      field_goals_made: 25, 
      field_goals_attempted: 55, 
      three_pointers_made: 10, 
      three_pointers_attempted: 25, 
      free_throws_made: 15, 
      free_throws_attempted: 20, 
      rebounds_offensive: 8, 
      rebounds_defensive: 20, 
      assists: 30, 
      steals: 12, 
      blocks: 2, 
      turnovers: 10, 
      fouls: 12, 
      minutes_played: 145 
    },
    { 
      player_id: 3, 
      games_played: 5, 
      points: 45, 
      field_goals_made: 18, 
      field_goals_attempted: 40, 
      three_pointers_made: 5, 
      three_pointers_attempted: 15, 
      free_throws_made: 10, 
      free_throws_attempted: 12, 
      rebounds_offensive: 15, 
      rebounds_defensive: 30, 
      assists: 8, 
      steals: 5, 
      blocks: 10, 
      turnovers: 8, 
      fouls: 10, 
      minutes_played: 140 
    },
    // Volleyball players
    { 
      player_id: 7, 
      games_played: 4, 
      kills: 25, 
      kill_errors: 8, 
      kill_attempts: 60, 
      assists_volleyball: 15, 
      service_aces: 5, 
      service_errors: 3, 
      service_attempts: 20, 
      digs: 18, 
      blocks_volleyball: 6, 
      block_errors: 2, 
      block_attempts: 12, 
      reception_errors: 4, 
      reception_attempts: 30, 
      minutes_played: 120 
    },
    { 
      player_id: 8, 
      games_played: 4, 
      kills: 18, 
      kill_errors: 6, 
      kill_attempts: 45, 
      assists_volleyball: 30, 
      service_aces: 3, 
      service_errors: 2, 
      service_attempts: 15, 
      digs: 12, 
      blocks_volleyball: 4, 
      block_errors: 1, 
      block_attempts: 10, 
      reception_errors: 3, 
      reception_attempts: 25, 
      minutes_played: 125 
    },
    { 
      player_id: 9, 
      games_played: 4, 
      kills: 15, 
      kill_errors: 5, 
      kill_attempts: 40, 
      assists_volleyball: 10, 
      service_aces: 2, 
      service_errors: 4, 
      service_attempts: 18, 
      digs: 20, 
      blocks_volleyball: 3, 
      block_errors: 2, 
      block_attempts: 8, 
      reception_errors: 2, 
      reception_attempts: 22, 
      minutes_played: 115 
    }
  ];

  // Fetch teams - using mock data
  useEffect(() => {
    setTeams(mockTeams);
  }, []);

  // Filter teams based on sport filter
  const filteredTeams = teams.filter(team => 
    sportFilter === "all" || team.sport.toLowerCase() === sportFilter.toLowerCase()
  );

  // Handle team selection
  const handleTeamSelect = async (team) => {
    setSelectedTeam(team);
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Filter players by team
      const teamPlayers = mockPlayers.filter(player => player.team_id === team.id);
      setPlayers(teamPlayers);
      
      // Get stats for these players
      const stats = teamPlayers.map(player => {
        const playerStat = mockPlayerStats.find(stat => stat.player_id === player.id);
        return { ...player, ...playerStat };
      });
      
      setPlayerStats(stats);
      setLoading(false);
      setActiveTab("statistics");
    }, 500);
  };

  // Filter players based on search term
  const filteredPlayers = playerStats.filter(player => 
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.jersey.includes(searchTerm) ||
    (player.position && player.position.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate team averages (instead of totals for better user readability)
  const calculateTeamAverages = () => {
    if (playerStats.length === 0) return null;
    
    const isBasketball = selectedTeam.sport === "Basketball";
    const playerCount = playerStats.length;
    
    if (isBasketball) {
      return {
        games_played: Math.max(...playerStats.map(p => p.games_played || 0)),
        avg_points: (playerStats.reduce((sum, player) => sum + (player.points || 0), 0) / playerCount).toFixed(1),
        avg_rebounds: ((playerStats.reduce((sum, player) => sum + (player.rebounds_offensive || 0) + (player.rebounds_defensive || 0), 0)) / playerCount).toFixed(1),
        avg_assists: (playerStats.reduce((sum, player) => sum + (player.assists || 0), 0) / playerCount).toFixed(1),
        avg_steals: (playerStats.reduce((sum, player) => sum + (player.steals || 0), 0) / playerCount).toFixed(1),
        avg_blocks: (playerStats.reduce((sum, player) => sum + (player.blocks || 0), 0) / playerCount).toFixed(1),
        fg_percentage: ((playerStats.reduce((sum, player) => sum + (player.field_goals_made || 0), 0) / 
          playerStats.reduce((sum, player) => sum + (player.field_goals_attempted || 0), 0)) * 100).toFixed(1)
      };
    } else {
      return {
        games_played: Math.max(...playerStats.map(p => p.games_played || 0)),
        avg_kills: (playerStats.reduce((sum, player) => sum + (player.kills || 0), 0) / playerCount).toFixed(1),
        avg_assists: (playerStats.reduce((sum, player) => sum + (player.assists_volleyball || 0), 0) / playerCount).toFixed(1),
        avg_digs: (playerStats.reduce((sum, player) => sum + (player.digs || 0), 0) / playerCount).toFixed(1),
        avg_blocks: (playerStats.reduce((sum, player) => sum + (player.blocks_volleyball || 0), 0) / playerCount).toFixed(1),
        avg_aces: (playerStats.reduce((sum, player) => sum + (player.service_aces || 0), 0) / playerCount).toFixed(1),
        kill_percentage: ((playerStats.reduce((sum, player) => sum + (player.kills || 0), 0) / 
          playerStats.reduce((sum, player) => sum + (player.kill_attempts || 0), 0)) * 100).toFixed(1)
      };
    }
  };

  const teamAverages = selectedTeam ? calculateTeamAverages() : null;

  // Export data as CSV
  const exportToCSV = () => {
    if (playerStats.length === 0) return;
    
    const isBasketball = selectedTeam.sport === "Basketball";
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Headers
    if (isBasketball) {
      csvContent += "Player,Jersey,Position,GP,PTS,FGM,FGA,3PM,3PA,FTM,FTA,OREB,DREB,AST,STL,BLK,TO,PF,MIN\n";
    } else {
      csvContent += "Player,Jersey,Position,GP,KILLS,KILL ERRORS,KILL ATTEMPTS,ASSISTS,SERVICE ACES,SERVICE ERRORS,SERVICE ATTEMPTS,DIGS,BLOCKS,BLOCK ERRORS,BLOCK ATTEMPTS,RECEPTION ERRORS,RECEPTION ATTEMPTS,MIN\n";
    }
    
    // Rows
    playerStats.forEach(player => {
      if (isBasketball) {
        csvContent += `${player.name},${player.jersey},${player.position || ''},${player.games_played || 0},${player.points || 0},${player.field_goals_made || 0},${player.field_goals_attempted || 0},${player.three_pointers_made || 0},${player.three_pointers_attempted || 0},${player.free_throws_made || 0},${player.free_throws_attempted || 0},${player.rebounds_offensive || 0},${player.rebounds_defensive || 0},${player.assists || 0},${player.steals || 0},${player.blocks || 0},${player.turnovers || 0},${player.fouls || 0},${player.minutes_played || 0}\n`;
      } else {
        csvContent += `${player.name},${player.jersey},${player.position || ''},${player.games_played || 0},${player.kills || 0},${player.kill_errors || 0},${player.kill_attempts || 0},${player.assists_volleyball || 0},${player.service_aces || 0},${player.service_errors || 0},${player.service_attempts || 0},${player.digs || 0},${player.blocks_volleyball || 0},${player.block_errors || 0},${player.block_attempts || 0},${player.reception_errors || 0},${player.reception_attempts || 0},${player.minutes_played || 0}\n`;
      }
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedTeam.name}_stats.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render stats table based on sport
  const renderStatsTable = () => {
    if (!selectedTeam) return null;
    
    const isBasketball = selectedTeam.sport === "Basketball";
    
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
            
            <button className="export-btn" onClick={exportToCSV}>
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
                    <span className="summary-label">FG%</span>
                    <span className="summary-value">{teamAverages.fg_percentage}%</span>
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
                    <span className="summary-label">Kill%</span>
                    <span className="summary-value">{teamAverages.kill_percentage}%</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
        <div className="table-wrapper">
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
                    <th>FG%</th>
                    <th>3P%</th>
                    <th>FT%</th>
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
              {filteredPlayers.map((player) => (
                <tr key={player.id}>
                  <td className="player-name">{player.name}</td>
                  <td className="jersey-number">{player.jersey}</td>
                  <td className="position">{player.position || '-'}</td>
                  <td>{player.games_played || 0}</td>
                  
                  {isBasketball ? (
                    <>
                      <td className="highlight">{player.points || 0}</td>
                      <td>{(player.rebounds_offensive || 0) + (player.rebounds_defensive || 0)}</td>
                      <td>{player.assists || 0}</td>
                      <td>{player.field_goals_attempted ? ((player.field_goals_made / player.field_goals_attempted) * 100).toFixed(1) + '%' : '0.0%'}</td>
                      <td>{player.three_pointers_attempted ? ((player.three_pointers_made / player.three_pointers_attempted) * 100).toFixed(1) + '%' : '0.0%'}</td>
                      <td>{player.free_throws_attempted ? ((player.free_throws_made / player.free_throws_attempted) * 100).toFixed(1) + '%' : '0.0%'}</td>
                      <td>{player.steals || 0}</td>
                      <td>{player.blocks || 0}</td>
                      <td>{player.turnovers || 0}</td>
                    </>
                  ) : (
                    <>
                      <td className="highlight">{player.kills || 0}</td>
                      <td>{player.assists_volleyball || 0}</td>
                      <td>{player.digs || 0}</td>
                      <td>{player.blocks_volleyball || 0}</td>
                      <td>{player.service_aces || 0}</td>
                      <td>{player.kill_attempts ? ((player.kills / player.kill_attempts) * 100).toFixed(1) + '%' : '0.0%'}</td>
                      <td>{player.reception_attempts ? (((player.reception_attempts - player.reception_errors) / player.reception_attempts) * 100).toFixed(1) + '%' : '0.0%'}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
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
        <span className="back-arrow">←</span>
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
              
              {filteredTeams.length === 0 ? (
                <div className="empty-state">
                  <FaUsers className="empty-icon" />
                  <p>No teams available for the selected sport.</p>
                </div>
              ) : (
                <div className="teams-grid">
                  {filteredTeams.map((team) => (
                    <div className="team-card" key={team.id} onClick={() => handleTeamSelect(team)}>
                      <div className="team-card-header">
                        <h3 className="team-name">{team.name}</h3>
                        <span className={`sport-badge ${team.sport === "Basketball" ? "sport-basketball" : "sport-volleyball"}`}>
                          {team.sport}
                        </span>
                      </div>
                      
                      <div className="team-record">
                        <div className="record-item">
                          <span className="record-label">Wins</span>
                          <span className="record-value wins">{team.wins}</span>
                        </div>
                        <div className="record-divider">-</div>
                        <div className="record-item">
                          <span className="record-label">Losses</span>
                          <span className="record-value losses">{team.losses}</span>
                        </div>
                      </div>
                      
                      <div className="team-info">
                        <div className="rank">
                          <FaTrophy className="rank-icon" />
                          <span>Rank #{team.rank}</span>
                        </div>
                        <div className={`status status-${team.status}`}>
                          {team.status}
                        </div>
                      </div>
                      
                      <div className="team-actions">
                        <button className="view-btn">
                          <FaEye /> View Stats
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* View Statistics */}
          {activeTab === "statistics" && selectedTeam && (
            <div className="view-section">
              <div className="stats-header">
                <div className="team-info-header">
                  <h2>
                    {selectedTeam.name} Statistics
                    <span className="sport-badge-header">{selectedTeam.sport}</span>
                  </h2>
                  <div className="team-details">
                    <span className="team-record-header">
                      Record: {selectedTeam.wins}-{selectedTeam.losses}
                    </span>
                    <span className="team-rank-header">
                      <FaTrophy /> Rank #{selectedTeam.rank}
                    </span>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading player statistics...</p>
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