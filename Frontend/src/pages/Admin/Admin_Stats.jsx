import React, { useState, useEffect } from "react";
import { FaSearch, FaFilter, FaDownload, FaTrophy, FaUsers, FaChartLine } from "react-icons/fa";
import "../../style/Admin_Stats.css";

const AdminStats = ({ sidebarOpen }) => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [brackets, setBrackets] = useState([]);
  const [matches, setMatches] = useState([]);
  const [playerStats, setPlayerStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("events");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

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

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:5000/api/stats/events");
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        console.error("Error fetching events:", err);
        // Mock data for demonstration
        setEvents([
          { id: 1, name: "Basketball Tournament", status: "completed", start_date: "2023-10-01", end_date: "2023-10-05" },
          { id: 2, name: "Volleyball Championship", status: "completed", start_date: "2023-11-01", end_date: "2023-11-03" }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Handle event selection
  const handleEventSelect = async (event) => {
    setSelectedEvent(event);
    setLoading(true);
    try {
      // Fetch brackets for the event
      const bracketRes = await fetch(`http://localhost:5000/api/stats/events/${event.id}/brackets`);
      const bracketData = await bracketRes.json();
      setBrackets(bracketData);

      // Fetch matches for all brackets
      const allMatches = [];
      for (const bracket of bracketData) {
        const matchRes = await fetch(`http://localhost:5000/api/stats/${bracket.id}/matches`);
        const matchData = await matchRes.json();
        const matchesWithBracket = matchData.map(match => ({
          ...match,
          bracket_name: bracket.name,
          sport_type: bracket.sport_type
        }));
        allMatches.push(...matchesWithBracket);
      }
      setMatches(allMatches);
      setActiveTab("brackets");
    } catch (err) {
      console.error("Error fetching event data:", err);
      // Mock data for demonstration
      setBrackets([
        { id: 1, name: "Men's Basketball Bracket", sport_type: "basketball", event_id: 1 },
        { id: 2, name: "Women's Volleyball Bracket", sport_type: "volleyball", event_id: 2 }
      ]);
      setMatches([
        { id: 1, bracket_id: 1, team1_name: "Team A", team2_name: "Team B", winner_name: "Team A", score_team1: 85, score_team2: 70, status: "completed", round_number: 1, bracket_name: "Men's Basketball Bracket", sport_type: "basketball" },
        { id: 2, bracket_id: 1, team1_name: "Team C", team2_name: "Team D", winner_name: "Team D", score_team1: 65, score_team2: 75, status: "completed", round_number: 1, bracket_name: "Men's Basketball Bracket", sport_type: "basketball" },
        { id: 3, bracket_id: 1, team1_name: "Team A", team2_name: "Team D", winner_name: "Team A", score_team1: 90, score_team2: 80, status: "completed", round_number: 2, bracket_name: "Men's Basketball Bracket", sport_type: "basketball" },
        { id: 4, bracket_id: 2, team1_name: "Team X", team2_name: "Team Y", winner_name: "Team X", score_team1: 3, score_team2: 1, status: "completed", round_number: 1, bracket_name: "Women's Volleyball Bracket", sport_type: "volleyball" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handle match selection to view player stats
  
const handleMatchSelect = async (match) => {
  setSelectedMatch(match);
  setLoading(true);
  try {
    // Get player stats with player names already included
    const res = await fetch(`http://localhost:5000/api/stats/matches/${match.id}/stats`);
    const data = await res.json();
    
    // The data now already includes player_name and team_name from the enhanced backend query
    const playersWithDetails = data.map((stat) => ({
      ...stat,
      // Use the data that now comes directly from the backend
      player_name: stat.player_name || "Unknown Player",
      jersey_number: stat.jersey_number || "N/A",
      team_name: stat.team_name || "Unknown Team"
    }));
    
    setPlayerStats(playersWithDetails);
    setActiveTab("statistics");
  } catch (err) {
    console.error("Error fetching player stats:", err);
    // Mock data for demonstration based on your database schema
    setPlayerStats([
      { 
        player_id: 1, 
        player_name: "John Doe", 
        team_name: "Team A", 
        jersey_number: 10,
        points: 25, 
        assists: 8, 
        rebounds: 10, 
        three_points_made: 3,
        steals: 2, 
        blocks: 1, 
        fouls: 3, 
        turnovers: 2,
        serves: 0,
        service_aces: 0,
        serve_errors: 0,
        receptions: 0,
        reception_errors: 0,
        digs: 0,
        kills: 0,
        attack_attempts: 0,
        attack_errors: 0,
        volleyball_assists: 0
      },
      { 
        player_id: 2, 
        player_name: "Jane Smith", 
        team_name: "Team A", 
        jersey_number: 5,
        points: 20, 
        assists: 12, 
        rebounds: 5, 
        three_points_made: 2,
        steals: 3, 
        blocks: 0, 
        fouls: 2, 
        turnovers: 1,
        serves: 0,
        service_aces: 0,
        serve_errors: 0,
        receptions: 0,
        reception_errors: 0,
        digs: 0,
        kills: 0,
        attack_attempts: 0,
        attack_errors: 0,
        volleyball_assists: 0
      }
    ]);
  } finally {
    setLoading(false);
  }
};

  // Calculate percentages for display
  const calculatePercentages = (player) => {
    const isBasketball = selectedMatch?.sport_type === "basketball";
    
    if (isBasketball) {
      // For basketball, calculate FG%, 3P%, FT%
      // These would normally be calculated from more detailed stats
      return {
        field_goal_percentage: "45.0%",
        three_point_percentage: "36.0%",
        free_throw_percentage: "78.0%"
      };
    } else {
      // For volleyball, calculate hitting percentage, service percentage, reception percentage
      const hittingPercentage = player.attack_attempts > 0 
        ? ((player.kills - player.attack_errors) / player.attack_attempts * 100).toFixed(1) + "%"
        : "0.0%";
        
      const servicePercentage = (player.serves + player.serve_errors) > 0
        ? (player.serves / (player.serves + player.serve_errors) * 100).toFixed(1) + "%"
        : "0.0%";
        
      const receptionPercentage = (player.receptions + player.reception_errors) > 0
        ? (player.receptions / (player.receptions + player.reception_errors) * 100).toFixed(1) + "%"
        : "0.0%";
        
      return {
        hitting_percentage: hittingPercentage,
        service_percentage: servicePercentage,
        reception_percentage: receptionPercentage
      };
    }
  };

  // Filter player stats based on search term
  const filteredPlayerStats = playerStats.filter(player => 
    player.player_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.jersey_number.toString().includes(searchTerm)
  );

  // Group matches by bracket
  const matchesByBracket = {};
  matches.forEach(match => {
    if (!matchesByBracket[match.bracket_id]) {
      matchesByBracket[match.bracket_id] = [];
    }
    matchesByBracket[match.bracket_id].push(match);
  });

  // Find bracket winners (teams that won the final round)
  const bracketWinners = {};
  brackets.forEach(bracket => {
    if (matchesByBracket[bracket.id]) {
      const finalMatches = matchesByBracket[bracket.id].filter(m => 
        Math.max(...matchesByBracket[bracket.id].map(m => m.round_number)) === m.round_number
      );
      if (finalMatches.length > 0) {
        bracketWinners[bracket.id] = finalMatches[0].winner_name;
      }
    }
  });

  // Render player statistics table
  const renderStatsTable = () => {
    if (playerStats.length === 0) return <p>No statistics available for this match.</p>;
    
    const isBasketball = selectedMatch?.sport_type === "basketball";
    
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
                <th>Team</th>
                <th>Jersey</th>
                {isBasketball ? (
                  <>
                    <th>PTS</th>
                    <th>AST</th>
                    <th>REB</th>
                    <th>STL</th>
                    <th>BLK</th>
                    <th>3PM</th>
                    <th>Fouls</th>
                    <th>TO</th>
                  </>
                ) : (
                  <>
                    <th>Kills</th>
                    <th>Assists</th>
                    <th>Digs</th>
                    <th>Blocks</th>
                    <th>Aces</th>
                    <th>Serve Err</th>
                    <th>Att Err</th>
                    <th>Rec Err</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredPlayerStats.map((player) => {
                const percentages = calculatePercentages(player);
                return (
                  <tr key={player.player_id}>
                    <td className="adminstats-player-name">{player.player_name}</td>
                    <td>{player.team_name}</td>
                    <td className="adminstats-jersey-number">{player.jersey_number}</td>
                    
                    {isBasketball ? (
                      <>
                        <td className="adminstats-highlight">{player.points || 0}</td>
                        <td>{player.assists || 0}</td>
                        <td>{player.rebounds || 0}</td>
                        <td>{player.steals || 0}</td>
                        <td>{player.blocks || 0}</td>
                        <td>{player.three_points_made || 0}</td>
                        <td>{player.fouls || 0}</td>
                        <td>{player.turnovers || 0}</td>
                      </>
                    ) : (
                      <>
                        <td className="adminstats-highlight">{player.kills || 0}</td>
                        <td>{player.volleyball_assists || 0}</td>
                        <td>{player.digs || 0}</td>
                        <td>{player.blocks || 0}</td>
                        <td>{player.service_aces || 0}</td>
                        <td>{player.serve_errors || 0}</td>
                        <td>{player.attack_errors || 0}</td>
                        <td>{player.reception_errors || 0}</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Export data as CSV
  const exportToCSV = () => {
    if (playerStats.length === 0) return;
    
    const isBasketball = selectedMatch?.sport_type === "basketball";
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Headers
    if (isBasketball) {
      csvContent += "Player,Team,Jersey,PTS,AST,REB,STL,BLK,3PM,Fouls,TO\n";
    } else {
      csvContent += "Player,Team,Jersey,Kills,Assists,Digs,Blocks,Aces,Serve Err,Att Err,Rec Err\n";
    }
    
    // Rows
    playerStats.forEach(player => {
      if (isBasketball) {
        csvContent += `${player.player_name},${player.team_name},${player.jersey_number},${player.points || 0},${player.assists || 0},${player.rebounds || 0},${player.steals || 0},${player.blocks || 0},${player.three_points_made || 0},${player.fouls || 0},${player.turnovers || 0}\n`;
      } else {
        csvContent += `${player.player_name},${player.team_name},${player.jersey_number},${player.kills || 0},${player.volleyball_assists || 0},${player.digs || 0},${player.blocks || 0},${player.service_aces || 0},${player.serve_errors || 0},${player.attack_errors || 0},${player.reception_errors || 0}\n`;
      }
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `match_stats.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="admin-dashboard">
      <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="dashboard-header">
          <h1>Admin Statistics</h1>
          <p>View match results and player statistics</p>
        </div>

        <div className="dashboard-main">
          <div className="bracket-content">
            {/* Tabs */}
            <div className="bracket-tabs">
              <button
                className={`bracket-tab-button ${activeTab === "events" ? "bracket-tab-active" : ""}`}
                onClick={() => setActiveTab("events")}
              >
                Events
              </button>
              {selectedEvent && (
                <button
                  className={`bracket-tab-button ${activeTab === "brackets" ? "bracket-tab-active" : ""}`}
                  onClick={() => setActiveTab("brackets")}
                >
                  Brackets & Matches
                </button>
              )}
              {playerStats.length > 0 && (
                <button
                  className={`bracket-tab-button ${activeTab === "statistics" ? "bracket-tab-active" : ""}`}
                  onClick={() => setActiveTab("statistics")}
                >
                  Player Statistics
                </button>
              )}
            </div>

            {/* Events Tab */}
            {activeTab === "events" && (
              <div className="bracket-view-section">
                <h2>All Events</h2>
                {loading ? (
                  <p>Loading events...</p>
                ) : events.length === 0 ? (
                  <div className="bracket-no-brackets">
                    <p>No events available.</p>
                  </div>
                ) : (
                  <div className="bracket-grid">
                    {events.map((event) => (
                      <div className="bracket-card" key={event.id} onClick={() => handleEventSelect(event)}>
                        <div className="bracket-card-header">
                          <h3>{event.name}</h3>
                          <span className={`bracket-sport-badge ${event.status === "completed" ? "status-completed" : "status-ongoing"}`}>
                            {event.status}
                          </span>
                        </div>
                        <div className="bracket-card-info">
                          <div><strong>Start:</strong> {new Date(event.start_date).toLocaleDateString()}</div>
                          <div><strong>End:</strong> {new Date(event.end_date).toLocaleDateString()}</div>
                          <div><strong>Status:</strong> 
                            <span className={event.status === "completed" ? "status-completed" : "status-ongoing"}>
                              {event.status}
                            </span>
                          </div>
                        </div>
                        <div className="bracket-card-actions">
                          <button className="bracket-view-btn">
                            View Results
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Brackets & Matches Tab */}
            {activeTab === "brackets" && selectedEvent && (
              <div className="bracket-view-section">
                <div className="event-details-header">
                  <h2>
                    {selectedEvent.name} - Results
                  </h2>
                  <div className="event-details-info">
                    <span><strong>Start:</strong> {new Date(selectedEvent.start_date).toLocaleDateString()}</span>
                    <span><strong>End:</strong> {new Date(selectedEvent.end_date).toLocaleDateString()}</span>
                    <span><strong>Status:</strong> {selectedEvent.status}</span>
                  </div>
                </div>

                {loading ? (
                  <p>Loading brackets and matches...</p>
                ) : brackets.length === 0 ? (
                  <div className="bracket-no-brackets">
                    <p>No brackets available for this event.</p>
                  </div>
                ) : (
                  <div>
                    {brackets.map((bracket) => (
                      <div key={bracket.id} className="bracket-section">
                        <div className="bracket-header">
                          <h3>{bracket.name}</h3>
                          {bracketWinners[bracket.id] && (
                            <div className="bracket-winner">
                              <FaTrophy /> Winner: {bracketWinners[bracket.id]}
                            </div>
                          )}
                        </div>
                        
                        {matchesByBracket[bracket.id] && matchesByBracket[bracket.id].length > 0 ? (
                          <div className="matches-grid">
                            {matchesByBracket[bracket.id].map((match) => (
                              <div 
                                key={match.id} 
                                className="match-card"
                                onClick={() => handleMatchSelect(match)}
                              >
                                <div className="match-teams">
                                  <div className={`match-team ${match.winner_id === match.team1_id ? "match-winner" : ""}`}>
                                    {match.team1_name}
                                  </div>
                                  <div className="match-vs">vs</div>
                                  <div className={`match-team ${match.winner_id === match.team2_id ? "match-winner" : ""}`}>
                                    {match.team2_name}
                                  </div>
                                </div>
                                <div className="match-score">
                                  {match.score_team1} - {match.score_team2}
                                </div>
                                <div className="match-info">
                                  <span>Round {match.round_number}</span>
                                  {match.winner_name && (
                                    <span className="match-winner-tag">
                                      Winner: {match.winner_name}
                                    </span>
                                  )}
                                </div>
                                <div className="match-actions">
                                  <button className="bracket-view-btn">
                                    View Stats
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p>No matches available for this bracket.</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Player Statistics Tab */}
            {activeTab === "statistics" && (
              <div className="bracket-view-section">
                <div className="event-details-header">
                  <h2>Player Statistics</h2>
                  <p>Detailed player performance data from the selected match</p>
                </div>

                {loading ? (
                  <p>Loading statistics...</p>
                ) : (
                  renderStatsTable()
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;