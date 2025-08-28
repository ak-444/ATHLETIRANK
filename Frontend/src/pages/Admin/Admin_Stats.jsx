import React, { useState, useEffect } from "react";
import { FaSearch, FaFilter, FaDownload, FaUsers, FaChartLine } from "react-icons/fa";
import "../../style/Admin_Stats.css";

const AdminStats = ({ sidebarOpen }) => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [playerStats, setPlayerStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
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

  // Mock data for demonstration
  const mockTeams = [
    { id: 1, name: "Team A", sport: "Basketball" },
    { id: 2, name: "Team B", sport: "Basketball" },
    { id: 3, name: "Team C", sport: "Volleyball" },
    { id: 4, name: "Team D", sport: "Volleyball" }
  ];

  const mockPlayers = [
    { id: 1, name: "Player A1", jersey: "1", team_id: 1 },
    { id: 2, name: "Player A2", jersey: "2", team_id: 1 },
    { id: 3, name: "Player A3", jersey: "3", team_id: 1 },
    { id: 4, name: "Player B1", jersey: "4", team_id: 2 },
    { id: 5, name: "Player B2", jersey: "5", team_id: 2 },
    { id: 6, name: "Player B3", jersey: "6", team_id: 2 },
    { id: 7, name: "Player C1", jersey: "7", team_id: 3 },
    { id: 8, name: "Player C2", jersey: "8", team_id: 3 },
    { id: 9, name: "Player C3", jersey: "9", team_id: 3 },
    { id: 10, name: "Player D1", jersey: "10", team_id: 4 },
    { id: 11, name: "Player D2", jersey: "11", team_id: 4 },
    { id: 12, name: "Player D3", jersey: "12", team_id: 4 }
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
    }, 500);
  };

  // Filter players based on search term
  const filteredPlayers = playerStats.filter(player => 
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.jersey.includes(searchTerm)
  );

  // Calculate team totals
  const calculateTeamTotals = () => {
    if (playerStats.length === 0) return null;
    
    const isBasketball = selectedTeam.sport === "Basketball";
    
    if (isBasketball) {
      return {
        games_played: Math.max(...playerStats.map(p => p.games_played || 0)),
        points: playerStats.reduce((sum, player) => sum + (player.points || 0), 0),
        field_goals_made: playerStats.reduce((sum, player) => sum + (player.field_goals_made || 0), 0),
        field_goals_attempted: playerStats.reduce((sum, player) => sum + (player.field_goals_attempted || 0), 0),
        three_pointers_made: playerStats.reduce((sum, player) => sum + (player.three_pointers_made || 0), 0),
        three_pointers_attempted: playerStats.reduce((sum, player) => sum + (player.three_pointers_attempted || 0), 0),
        free_throws_made: playerStats.reduce((sum, player) => sum + (player.free_throws_made || 0), 0),
        free_throws_attempted: playerStats.reduce((sum, player) => sum + (player.free_throws_attempted || 0), 0),
        rebounds_offensive: playerStats.reduce((sum, player) => sum + (player.rebounds_offensive || 0), 0),
        rebounds_defensive: playerStats.reduce((sum, player) => sum + (player.rebounds_defensive || 0), 0),
        assists: playerStats.reduce((sum, player) => sum + (player.assists || 0), 0),
        steals: playerStats.reduce((sum, player) => sum + (player.steals || 0), 0),
        blocks: playerStats.reduce((sum, player) => sum + (player.blocks || 0), 0),
        turnovers: playerStats.reduce((sum, player) => sum + (player.turnovers || 0), 0),
        fouls: playerStats.reduce((sum, player) => sum + (player.fouls || 0), 0),
        minutes_played: playerStats.reduce((sum, player) => sum + (player.minutes_played || 0), 0),
      };
    } else {
      return {
        games_played: Math.max(...playerStats.map(p => p.games_played || 0)),
        kills: playerStats.reduce((sum, player) => sum + (player.kills || 0), 0),
        kill_errors: playerStats.reduce((sum, player) => sum + (player.kill_errors || 0), 0),
        kill_attempts: playerStats.reduce((sum, player) => sum + (player.kill_attempts || 0), 0),
        assists_volleyball: playerStats.reduce((sum, player) => sum + (player.assists_volleyball || 0), 0),
        service_aces: playerStats.reduce((sum, player) => sum + (player.service_aces || 0), 0),
        service_errors: playerStats.reduce((sum, player) => sum + (player.service_errors || 0), 0),
        service_attempts: playerStats.reduce((sum, player) => sum + (player.service_attempts || 0), 0),
        digs: playerStats.reduce((sum, player) => sum + (player.digs || 0), 0),
        blocks_volleyball: playerStats.reduce((sum, player) => sum + (player.blocks_volleyball || 0), 0),
        block_errors: playerStats.reduce((sum, player) => sum + (player.block_errors || 0), 0),
        block_attempts: playerStats.reduce((sum, player) => sum + (player.block_attempts || 0), 0),
        reception_errors: playerStats.reduce((sum, player) => sum + (player.reception_errors || 0), 0),
        reception_attempts: playerStats.reduce((sum, player) => sum + (player.reception_attempts || 0), 0),
        minutes_played: playerStats.reduce((sum, player) => sum + (player.minutes_played || 0), 0),
      };
    }
  };

  const teamTotals = selectedTeam ? calculateTeamTotals() : null;

  // Export data as CSV
  const exportToCSV = () => {
    if (playerStats.length === 0) return;
    
    const isBasketball = selectedTeam.sport === "Basketball";
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Headers
    if (isBasketball) {
      csvContent += "Player,Jersey,GP,PTS,FGM,FGA,3PM,3PA,FTM,FTA,OREB,DREB,AST,STL,BLK,TO,PF,MIN\n";
    } else {
      csvContent += "Player,Jersey,GP,KILLS,KILL ERRORS,KILL ATTEMPTS,ASSISTS,SERVICE ACES,SERVICE ERRORS,SERVICE ATTEMPTS,DIGS,BLOCKS,BLOCK ERRORS,BLOCK ATTEMPTS,RECEPTION ERRORS,RECEPTION ATTEMPTS,MIN\n";
    }
    
    // Rows
    playerStats.forEach(player => {
      if (isBasketball) {
        csvContent += `${player.name},${player.jersey},${player.games_played || 0},${player.points || 0},${player.field_goals_made || 0},${player.field_goals_attempted || 0},${player.three_pointers_made || 0},${player.three_pointers_attempted || 0},${player.free_throws_made || 0},${player.free_throws_attempted || 0},${player.rebounds_offensive || 0},${player.rebounds_defensive || 0},${player.assists || 0},${player.steals || 0},${player.blocks || 0},${player.turnovers || 0},${player.fouls || 0},${player.minutes_played || 0}\n`;
      } else {
        csvContent += `${player.name},${player.jersey},${player.games_played || 0},${player.kills || 0},${player.kill_errors || 0},${player.kill_attempts || 0},${player.assists_volleyball || 0},${player.service_aces || 0},${player.service_errors || 0},${player.service_attempts || 0},${player.digs || 0},${player.blocks_volleyball || 0},${player.block_errors || 0},${player.block_attempts || 0},${player.reception_errors || 0},${player.reception_attempts || 0},${player.minutes_played || 0}\n`;
      }
    });
    
    // Team totals row
    if (teamTotals) {
      csvContent += "TOTALS,,";
      if (isBasketball) {
        csvContent += `${teamTotals.games_played || 0},${teamTotals.points || 0},${teamTotals.field_goals_made || 0},${teamTotals.field_goals_attempted || 0},${teamTotals.three_pointers_made || 0},${teamTotals.three_pointers_attempted || 0},${teamTotals.free_throws_made || 0},${teamTotals.free_throws_attempted || 0},${teamTotals.rebounds_offensive || 0},${teamTotals.rebounds_defensive || 0},${teamTotals.assists || 0},${teamTotals.steals || 0},${teamTotals.blocks || 0},${teamTotals.turnovers || 0},${teamTotals.fouls || 0},${teamTotals.minutes_played || 0}\n`;
      } else {
        csvContent += `${teamTotals.games_played || 0},${teamTotals.kills || 0},${teamTotals.kill_errors || 0},${teamTotals.kill_attempts || 0},${teamTotals.assists_volleyball || 0},${teamTotals.service_aces || 0},${teamTotals.service_errors || 0},${teamTotals.service_attempts || 0},${teamTotals.digs || 0},${teamTotals.blocks_volleyball || 0},${teamTotals.block_errors || 0},${teamTotals.block_attempts || 0},${teamTotals.reception_errors || 0},${teamTotals.reception_attempts || 0},${teamTotals.minutes_played || 0}\n`;
      }
    }
    
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
      <div className="adminstats-table-container">
        <div className="adminstats-table-controls">
          <div className="adminstats-search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="adminstats-filter-controls">
            {isMobile ? (
              <>
                <button 
                  className="adminstats-filter-toggle-btn"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <FaFilter /> Filters
                </button>
                
                {showFilters && (
                  <div className="adminstats-mobile-filters">
                    <div className="adminstats-filter-group">
                      <select 
                        value={sportFilter} 
                        onChange={(e) => setSportFilter(e.target.value)}
                        disabled
                      >
                        <option value="all">All Sports</option>
                        <option value="basketball">Basketball</option>
                        <option value="volleyball">Volleyball</option>
                      </select>
                    </div>
                    
                    <div className="adminstats-filter-group">
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
              <>
                <div className="adminstats-filter-group">
                  
                  <select 
                    value={sportFilter} 
                    onChange={(e) => setSportFilter(e.target.value)}
                    disabled
                  >
                    <option value="all">All Sports</option>
                    <option value="basketball">Basketball</option>
                    <option value="volleyball">Volleyball</option>
                  </select>
                </div>
                
                <div className="adminstats-filter-group">
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
              </>
            )}
            
            <button className="adminstats-export-btn" onClick={exportToCSV}>
              <FaDownload /> Export CSV
            </button>
          </div>
        </div>
        
        <div className="adminstats-table-wrapper">
          <table className="adminstats-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Jersey</th>
                <th>GP</th>
                
                {isBasketball ? (
                  <>
                    <th>PTS</th>
                    <th>FGM</th>
                    <th>FGA</th>
                    <th>3PM</th>
                    <th>3PA</th>
                    <th>FTM</th>
                    <th>FTA</th>
                    <th>OREB</th>
                    <th>DREB</th>
                    <th>AST</th>
                    <th>STL</th>
                    <th>BLK</th>
                    <th>TO</th>
                    <th>PF</th>
                    <th>MIN</th>
                  </>
                ) : (
                  <>
                    <th>KILLS</th>
                    <th>KILL ERR</th>
                    <th>KILL ATT</th>
                    <th>AST</th>
                    <th>SERV ACE</th>
                    <th>SERV ERR</th>
                    <th>SERV ATT</th>
                    <th>DIGS</th>
                    <th>BLOCKS</th>
                    <th>BLOCK ERR</th>
                    <th>BLOCK ATT</th>
                    <th>REC ERR</th>
                    <th>REC ATT</th>
                    <th>MIN</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player) => (
                <tr key={player.id}>
                  <td className="adminstats-player-name">{player.name}</td>
                  <td className="adminstats-jersey-number">{player.jersey}</td>
                  <td>{player.games_played || 0}</td>
                  
                  {isBasketball ? (
                    <>
                      <td className="adminstats-highlight">{player.points || 0}</td>
                      <td>{player.field_goals_made || 0}</td>
                      <td>{player.field_goals_attempted || 0}</td>
                      <td>{player.three_pointers_made || 0}</td>
                      <td>{player.three_pointers_attempted || 0}</td>
                      <td>{player.free_throws_made || 0}</td>
                      <td>{player.free_throws_attempted || 0}</td>
                      <td>{player.rebounds_offensive || 0}</td>
                      <td>{player.rebounds_defensive || 0}</td>
                      <td>{player.assists || 0}</td>
                      <td>{player.steals || 0}</td>
                      <td>{player.blocks || 0}</td>
                      <td>{player.turnovers || 0}</td>
                      <td>{player.fouls || 0}</td>
                      <td>{player.minutes_played || 0}</td>
                    </>
                  ) : (
                    <>
                      <td className="adminstats-highlight">{player.kills || 0}</td>
                      <td>{player.kill_errors || 0}</td>
                      <td>{player.kill_attempts || 0}</td>
                      <td>{player.assists_volleyball || 0}</td>
                      <td>{player.service_aces || 0}</td>
                      <td>{player.service_errors || 0}</td>
                      <td>{player.service_attempts || 0}</td>
                      <td>{player.digs || 0}</td>
                      <td>{player.blocks_volleyball || 0}</td>
                      <td>{player.block_errors || 0}</td>
                      <td>{player.block_attempts || 0}</td>
                      <td>{player.reception_errors || 0}</td>
                      <td>{player.reception_attempts || 0}</td>
                      <td>{player.minutes_played || 0}</td>
                    </>
                  )}
                </tr>
              ))}
              
              {/* Team Totals Row */}
              {teamTotals && (
                <tr className="adminstats-team-totals">
                  <td colSpan="2">TEAM TOTALS</td>
                  <td>{teamTotals.games_played || 0}</td>
                  
                  {isBasketball ? (
                    <>
                      <td className="adminstats-highlight">{teamTotals.points || 0}</td>
                      <td>{teamTotals.field_goals_made || 0}</td>
                      <td>{teamTotals.field_goals_attempted || 0}</td>
                      <td>{teamTotals.three_pointers_made || 0}</td>
                      <td>{teamTotals.three_pointers_attempted || 0}</td>
                      <td>{teamTotals.free_throws_made || 0}</td>
                      <td>{teamTotals.free_throws_attempted || 0}</td>
                      <td>{teamTotals.rebounds_offensive || 0}</td>
                      <td>{teamTotals.rebounds_defensive || 0}</td>
                      <td>{teamTotals.assists || 0}</td>
                      <td>{teamTotals.steals || 0}</td>
                      <td>{teamTotals.blocks || 0}</td>
                      <td>{teamTotals.turnovers || 0}</td>
                      <td>{teamTotals.fouls || 0}</td>
                      <td>{teamTotals.minutes_played || 0}</td>
                    </>
                  ) : (
                    <>
                      <td className="adminstats-highlight">{teamTotals.kills || 0}</td>
                      <td>{teamTotals.kill_errors || 0}</td>
                      <td>{teamTotals.kill_attempts || 0}</td>
                      <td>{teamTotals.assists_volleyball || 0}</td>
                      <td>{teamTotals.service_aces || 0}</td>
                      <td>{teamTotals.service_errors || 0}</td>
                      <td>{teamTotals.service_attempts || 0}</td>
                      <td>{teamTotals.digs || 0}</td>
                      <td>{teamTotals.blocks_volleyball || 0}</td>
                      <td>{teamTotals.block_errors || 0}</td>
                      <td>{teamTotals.block_attempts || 0}</td>
                      <td>{teamTotals.reception_errors || 0}</td>
                      <td>{teamTotals.reception_attempts || 0}</td>
                      <td>{teamTotals.minutes_played || 0}</td>
                    </>
                  )}
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredPlayers.length === 0 && (
          <div className="adminstats-no-stats-message">
            <FaChartLine />
            <p>No player statistics found for this team.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="adminstats-dashboard">
      <div className={`adminstats-dashboard-content ${sidebarOpen ? "adminstats-sidebar-open" : ""}`}>
        <div className="adminstats-dashboard-header">
          <h1>Admin Stats</h1>
          <p>View and analyze team and player statistics</p>
        </div>
        
        <div className="adminstats-content">
          {/* Team Selection */}
          <div className="adminstats-section">
            <h2>Select a Team</h2>
            <div className="adminstats-teams-grid">
              {teams.map(team => (
                <div 
                  key={team.id} 
                  className={`adminstats-team-card ${selectedTeam?.id === team.id ? 'adminstats-selected' : ''}`}
                  onClick={() => handleTeamSelect(team)}
                >
                  <div className="adminstats-team-icon">
                    <FaUsers />
                  </div>
                  <h3>{team.name}</h3>
                  <p className="adminstats-team-sport">{team.sport}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Statistics Display */}
          {selectedTeam && (
            <div className="adminstats-section">
              <div className="adminstats-section-header">
                <h2>
                  {selectedTeam.name} Statistics 
                  <span className="adminstats-sport-badge">{selectedTeam.sport}</span>
                </h2>
                {loading && <div className="adminstats-loading-spinner">Loading...</div>}
              </div>
              
              {!loading && renderStatsTable()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminStats;