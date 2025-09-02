import React, { useState, useEffect } from "react";
import { FaPlus, FaMinus, FaRedo, FaSave, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import "../../style/Staff_Stats.css";

const StaffStats = ({ sidebarOpen }) => {
  const [activeTab, setActiveTab] = useState("select");
  const [events, setEvents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [games, setGames] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [playerStats, setPlayerStats] = useState([]);
  const [teamScores, setTeamScores] = useState({ team1: [0, 0, 0, 0], team2: [0, 0, 0, 0] });
  const [currentQuarter, setCurrentQuarter] = useState(0); // 0-3 for quarters, 0-4 for sets
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mock data for demonstration
  const mockEvents = [
    { id: 1, name: "Summer Basketball Tournament", start_date: "2023-07-01", end_date: "2023-07-05", status: "upcoming" },
    { id: 2, name: "Regional Volleyball Championship", start_date: "2023-08-10", end_date: "2023-08-12", status: "upcoming" }
  ];

  const mockTeams = [
    { id: 1, name: "Team A", players: [
      { id: 1, name: "Player A1", jersey: "1" },
      { id: 2, name: "Player A2", jersey: "2" },
      { id: 3, name: "Player A3", jersey: "3" }
    ]},
    { id: 2, name: "Team B", players: [
      { id: 4, name: "Player B1", jersey: "4" },
      { id: 5, name: "Player B2", jersey: "5" },
      { id: 6, name: "Player B3", jersey: "6" }
    ]},
    { id: 3, name: "Team C", players: [
      { id: 7, name: "Player C1", jersey: "7" },
      { id: 8, name: "Player C2", jersey: "8" },
      { id: 9, name: "Player C3", jersey: "9" }
    ]},
    { id: 4, name: "Team D", players: [
      { id: 10, name: "Player D1", jersey: "10" },
      { id: 11, name: "Player D2", jersey: "11" },
      { id: 12, name: "Player D3", jersey: "12" }
    ]}
  ];

  const mockGames = [
    { id: 1, event_id: 1, team1_id: 1, team2_id: 2, sport: "Basketball", game_type: "pool", status: "upcoming" },
    { id: 2, event_id: 1, team1_id: 3, team2_id: 4, sport: "Basketball", game_type: "pool", status: "upcoming" },
    { id: 3, event_id: 2, team1_id: 1, team2_id: 3, sport: "Volleyball", game_type: "pool", status: "upcoming" }
  ];

  // Basketball stats template
  const basketballStatsTemplate = {
    points: [0, 0, 0, 0],
    field_goals_made: [0, 0, 0, 0],
    field_goals_attempted: [0, 0, 0, 0],
    three_pointers_made: [0, 0, 0, 0],
    three_pointers_attempted: [0, 0, 0, 0],
    free_throws_made: [0, 0, 0, 0],
    free_throws_attempted: [0, 0, 0, 0],
    rebounds_offensive: [0, 0, 0, 0],
    rebounds_defensive: [0, 0, 0, 0],
    assists: [0, 0, 0, 0],
    steals: [0, 0, 0, 0],
    blocks: [0, 0, 0, 0],
    turnovers: [0, 0, 0, 0],
    fouls: [0, 0, 0, 0],
    minutes_played: [0, 0, 0, 0],
  };

  // Volleyball stats template
  const volleyballStatsTemplate = {
    kills: [0, 0, 0, 0, 0],
    kill_errors: [0, 0, 0, 0, 0],
    kill_attempts: [0, 0, 0, 0, 0],
    assists_volleyball: [0, 0, 0, 0, 0],
    service_aces: [0, 0, 0, 0, 0],
    service_errors: [0, 0, 0, 0, 0],
    service_attempts: [0, 0, 0, 0, 0],
    digs: [0, 0, 0, 0, 0],
    blocks_volleyball: [0, 0, 0, 0, 0],
    block_errors: [0, 0, 0, 0, 0],
    block_attempts: [0, 0, 0, 0, 0],
    reception_errors: [0, 0, 0, 0, 0],
    reception_attempts: [0, 0, 0, 0, 0],
    minutes_played: [0, 0, 0, 0, 0],
  };

  // Fetch events - using mock data
  useEffect(() => {
    setEvents(mockEvents);
  }, []);

  // Handle event selection
  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    setSelectedGame(null);
    setPlayerStats([]);
    setTeamScores({ team1: [0, 0, 0, 0], team2: [0, 0, 0, 0] });
    setCurrentQuarter(0);
    setTeams(mockTeams);
    const eventGames = mockGames.filter(game => game.event_id === event.id);
    setGames(eventGames);
    setActiveTab("games");
  };

  // Initialize player stats for a game
  const initializePlayerStats = (game) => {
    const team1Players = teams.find(t => t.id === game.team1_id)?.players || [];
    const team2Players = teams.find(t => t.id === game.team2_id)?.players || [];
    
    const template = game.sport === 'Basketball' ? basketballStatsTemplate : volleyballStatsTemplate;
    
    const initialStats = [
      ...team1Players.map(player => ({
        player_id: player.id,
        player_name: player.name,
        team_id: game.team1_id,
        team_name: teams.find(t => t.id === game.team1_id)?.name,
        ...JSON.parse(JSON.stringify(template)) // Deep copy
      })),
      ...team2Players.map(player => ({
        player_id: player.id,
        player_name: player.name,
        team_id: game.team2_id,
        team_name: teams.find(t => t.id === game.team2_id)?.name,
        ...JSON.parse(JSON.stringify(template)) // Deep copy
      }))
    ];

    setPlayerStats(initialStats);
  };

  // Handle game selection
  const handleGameSelect = async (game) => {
    setSelectedGame(game);
    setLoading(true);
    // Initialize team scores based on sport
    const initialScores = game.sport === 'Basketball' 
      ? { team1: [0, 0, 0, 0], team2: [0, 0, 0, 0] } 
      : { team1: [0, 0, 0, 0, 0], team2: [0, 0, 0, 0, 0] };
    
    setTeamScores(initialScores);
    setCurrentQuarter(0);
    
    setTimeout(() => {
      initializePlayerStats(game);
      setLoading(false);
    }, 500);
    setActiveTab("statistics");
  };

  // Update player stat for current quarter/set
  const updatePlayerStat = (playerIndex, statName, value) => {
    const newStats = [...playerStats];
    const newValue = Math.max(0, parseInt(value) || 0);
    
    // Update the stat for the current quarter
    newStats[playerIndex][statName][currentQuarter] = newValue;
    
    // If updating points, update team score
    if (statName === 'points' && selectedGame) {
      const playerTeamId = newStats[playerIndex].team_id;
      const oldValue = playerStats[playerIndex][statName][currentQuarter] || 0;
      const pointDifference = newValue - oldValue;
      
      if (pointDifference !== 0) {
        const teamKey = playerTeamId === selectedGame.team1_id ? 'team1' : 'team2';
        setTeamScores(prevScores => {
          const newScores = {...prevScores};
          newScores[teamKey][currentQuarter] += pointDifference;
          return newScores;
        });
      }
    }
    
    setPlayerStats(newStats);
  };

  // Increment/decrement player stat for current quarter/set
  const adjustPlayerStat = (playerIndex, statName, increment) => {
    const newStats = [...playerStats];
    const currentValue = newStats[playerIndex][statName][currentQuarter] || 0;
    const newValue = Math.max(0, currentValue + (increment ? 1 : -1));
    newStats[playerIndex][statName][currentQuarter] = newValue;
    
    // If adjusting points, update team score
    if (statName === 'points' && selectedGame) {
      const playerTeamId = newStats[playerIndex].team_id;
      const pointDifference = increment ? 1 : -1;
      
      const teamKey = playerTeamId === selectedGame.team1_id ? 'team1' : 'team2';
      setTeamScores(prevScores => {
        const newScores = {...prevScores};
        newScores[teamKey][currentQuarter] += pointDifference;
        return newScores;
      });
    }
    
    setPlayerStats(newStats);
  };

  // Save statistics - mock function
  const saveStatistics = async () => {
    setLoading(true);
    setTimeout(() => {
      alert("Statistics saved successfully! (This is a frontend demo)");
      setLoading(false);
    }, 1000);
  };

  // Reset all statistics
  const resetStatistics = () => {
    if (window.confirm("Are you sure you want to reset all statistics?")) {
      initializePlayerStats(selectedGame);
      const initialScores = selectedGame.sport === 'Basketball' 
        ? { team1: [0, 0, 0, 0], team2: [0, 0, 0, 0] } 
        : { team1: [0, 0, 0, 0, 0], team2: [0, 0, 0, 0, 0] };
      setTeamScores(initialScores);
      setCurrentQuarter(0);
    }
  };

  // Navigate to next/previous quarter/set
  const changePeriod = (direction) => {
    const maxPeriod = selectedGame.sport === 'Basketball' ? 3 : 4;
    if (direction === 'next' && currentQuarter < maxPeriod) {
      setCurrentQuarter(currentQuarter + 1);
    } else if (direction === 'prev' && currentQuarter > 0) {
      setCurrentQuarter(currentQuarter - 1);
    }
  };

  // Calculate total score for a team
  const calculateTotalScore = (teamScoresArray) => {
    return teamScoresArray.reduce((total, score) => total + score, 0);
  };

  // Render period navigation
  const renderPeriodNavigation = () => {
    const maxPeriod = selectedGame.sport === 'Basketball' ? 3 : 4;
    const periodName = selectedGame.sport === 'Basketball' ? 'Quarter' : 'Set';
    
    return (
      <div className="period-navigation">
        <button 
          onClick={() => changePeriod('prev')} 
          disabled={currentQuarter === 0}
          className="period-nav-btn"
        >
          <FaArrowLeft />
        </button>
        
        <div className="period-display">
          {periodName} {currentQuarter + 1}
        </div>
        
        <button 
          onClick={() => changePeriod('next')} 
          disabled={currentQuarter === maxPeriod}
          className="period-nav-btn"
        >
          <FaArrowRight />
        </button>
      </div>
    );
  };

  // Render stat input fields based on sport
  const renderStatInputs = (player, playerIndex) => {
    const sport = selectedGame.sport;
    
    if (sport === 'Basketball') {
      return (
        <div className="stats-grid">
          <div className="stat-group">
            <label>Points</label>
            <div className="stat-controls">
              <button onClick={() => adjustPlayerStat(playerIndex, 'points', false)}>
                <FaMinus />
              </button>
              <input
                type="number"
                min="0"
                value={player.points[currentQuarter]}
                onChange={(e) => updatePlayerStat(playerIndex, 'points', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'points', true)}>
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="stat-group">
            <label>FG Made</label>
            <div className="stat-controls">
              <button onClick={() => adjustPlayerStat(playerIndex, 'field_goals_made', false)}>
                <FaMinus />
              </button>
              <input
                type="number"
                min="0"
                value={player.field_goals_made[currentQuarter]}
                onChange={(e) => updatePlayerStat(playerIndex, 'field_goals_made', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'field_goals_made', true)}>
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="stat-group">
            <label>FG Attempted</label>
            <div className="stat-controls">
              <button onClick={() => adjustPlayerStat(playerIndex, 'field_goals_attempted', false)}>
                <FaMinus />
              </button>
              <input
                type="number"
                min="0"
                value={player.field_goals_attempted[currentQuarter]}
                onChange={(e) => updatePlayerStat(playerIndex, 'field_goals_attempted', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'field_goals_attempted', true)}>
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="stat-group">
            <label>3PT Made</label>
            <div className="stat-controls">
              <button onClick={() => adjustPlayerStat(playerIndex, 'three_pointers_made', false)}>
                <FaMinus />
              </button>
              <input
                type="number"
                min="0"
                value={player.three_pointers_made[currentQuarter]}
                onChange={(e) => updatePlayerStat(playerIndex, 'three_pointers_made', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'three_pointers_made', true)}>
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="stat-group">
            <label>Assists</label>
            <div className="stat-controls">
              <button onClick={() => adjustPlayerStat(playerIndex, 'assists', false)}>
                <FaMinus />
              </button>
              <input
                type="number"
                min="0"
                value={player.assists[currentQuarter]}
                onChange={(e) => updatePlayerStat(playerIndex, 'assists', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'assists', true)}>
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="stat-group">
            <label>Rebounds</label>
            <div className="stat-controls">
              <button onClick={() => adjustPlayerStat(playerIndex, 'rebounds_defensive', false)}>
                <FaMinus />
              </button>
              <input
                type="number"
                min="0"
                value={player.rebounds_defensive[currentQuarter]}
                onChange={(e) => updatePlayerStat(playerIndex, 'rebounds_defensive', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'rebounds_defensive', true)}>
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="stat-group">
            <label>Steals</label>
            <div className="stat-controls">
              <button onClick={() => adjustPlayerStat(playerIndex, 'steals', false)}>
                <FaMinus />
              </button>
              <input
                type="number"
                min="0"
                value={player.steals[currentQuarter]}
                onChange={(e) => updatePlayerStat(playerIndex, 'steals', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'steals', true)}>
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="stat-group">
            <label>Fouls</label>
            <div className="stat-controls">
              <button onClick={() => adjustPlayerStat(playerIndex, 'fouls', false)}>
                <FaMinus />
              </button>
              <input
                type="number"
                min="0"
                value={player.fouls[currentQuarter]}
                onChange={(e) => updatePlayerStat(playerIndex, 'fouls', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'fouls', true)}>
                <FaPlus />
              </button>
            </div>
          </div>
        </div>
      );
    } else { // Volleyball
      return (
        <div className="stats-grid">
          <div className="stat-group">
            <label>Kills</label>
            <div className="stat-controls">
              <button onClick={() => adjustPlayerStat(playerIndex, 'kills', false)}>
                <FaMinus />
              </button>
              <input
                type="number"
                min="0"
                value={player.kills[currentQuarter]}
                onChange={(e) => updatePlayerStat(playerIndex, 'kills', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'kills', true)}>
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="stat-group">
            <label>Assists</label>
            <div className="stat-controls">
              <button onClick={() => adjustPlayerStat(playerIndex, 'assists_volleyball', false)}>
                <FaMinus />
              </button>
              <input
                type="number"
                min="0"
                value={player.assists_volleyball[currentQuarter]}
                onChange={(e) => updatePlayerStat(playerIndex, 'assists_volleyball', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'assists_volleyball', true)}>
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="stat-group">
            <label>Service Aces</label>
            <div className="stat-controls">
              <button onClick={() => adjustPlayerStat(playerIndex, 'service_aces', false)}>
                <FaMinus />
              </button>
              <input
                type="number"
                min="0"
                value={player.service_aces[currentQuarter]}
                onChange={(e) => updatePlayerStat(playerIndex, 'service_aces', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'service_aces', true)}>
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="stat-group">
            <label>Digs</label>
            <div className="stat-controls">
              <button onClick={() => adjustPlayerStat(playerIndex, 'digs', false)}>
                <FaMinus />
              </button>
              <input
                type="number"
                min="0"
                value={player.digs[currentQuarter]}
                onChange={(e) => updatePlayerStat(playerIndex, 'digs', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'digs', true)}>
                <FaPlus />
              </button>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="admin-dashboard">
      <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="dashboard-header">
          <h1>Staff Statistics</h1>
          <p>View events, manage games, and record statistics</p>
        </div>

        <div className="events-content">
          {/* Tabs */}
          <div className="events-tabs">
            <button
              className={`events-tab-button ${activeTab === "select" ? "events-tab-active" : ""}`}
              onClick={() => setActiveTab("select")}
            >
              Select Event
            </button>
            {selectedEvent && (
              <button
                className={`events-tab-button ${activeTab === "games" ? "events-tab-active" : ""}`}
                onClick={() => setActiveTab("games")}
              >
                Manage Games ({games.length})
              </button>
            )}
            {selectedGame && (
              <button
                className={`events-tab-button ${activeTab === "statistics" ? "events-tab-active" : ""}`}
                onClick={() => setActiveTab("statistics")}
              >
                Record Statistics
              </button>
            )}
          </div>

          {/* Select Event */}
          {activeTab === "select" && (
            <div className="events-view-section">
              {loading ? (
                <p>Loading events...</p>
              ) : error ? (
                <p style={{ color: "red" }}>Error: {error}</p>
              ) : events.length === 0 ? (
                <div className="events-no-events">
                  <p>No events available.</p>
                </div>
              ) : (
                <div className="events-grid">
                  {events.map((event) => (
                    <div className="events-card" key={event.id}>
                      <div className="events-card-header">
                        <h3>{event.name}</h3>
                      </div>
                      <div className="events-info">
                        <p><strong>Start:</strong> {new Date(event.start_date).toLocaleDateString()}</p>
                        <p><strong>End:</strong> {new Date(event.end_date).toLocaleDateString()}</p>
                        <p><strong>Status:</strong>
                          <span className={`status-${event.status}`}>
                            {event.status}
                          </span>
                        </p>
                      </div>
                      <div className="events-card-actions">
                        <button className="events-submit-btn" onClick={() => handleEventSelect(event)}>
                          View / Manage Games
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Manage Games */}
          {activeTab === "games" && selectedEvent && (
            <div className="events-view-section">
              <h2>Games for {selectedEvent.name}</h2>
              {games.length === 0 ? (
                <div className="events-no-events">
                  <p>No games created yet for this event.</p>
                </div>
              ) : (
                <div className="events-grid">
                  {games.map((game) => (
                    <div className="events-card" key={game.id}>
                      <div className="events-card-header">
                        <h3>
                          {teams.find(t => t.id === game.team1_id)?.name || 'Team 1'} 
                          {' vs '}
                          {teams.find(t => t.id === game.team2_id)?.name || 'Team 2'}
                        </h3>
                      </div>
                      <div className="events-info">
                        <p><strong>Sport:</strong> {game.sport}</p>
                        <p><strong>Status:</strong> 
                          <span className={`status-${game.status}`}>{game.status}</span>
                        </p>
                      </div>
                      <div className="events-card-actions">
                        <button className="events-submit-btn" onClick={() => handleGameSelect(game)}>
                          Record Statistics
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Record Statistics */}
          {activeTab === "statistics" && selectedGame && (
            <div className="events-view-section">
              <h2>
                Recording Statistics: {teams.find(t => t.id === selectedGame.team1_id)?.name} vs {teams.find(t => t.id === selectedGame.team2_id)?.name} ({selectedGame.sport})
              </h2>
              
              {/* Period Navigation */}
              {renderPeriodNavigation()}
              
              {/* Team Score Display */}
              <div className="team-scores-container">
                <div className="team-score">
                  <h3>{teams.find(t => t.id === selectedGame.team1_id)?.name}</h3>
                  <div className="score-display">{teamScores.team1[currentQuarter]}</div>
                  <div className="period-total">Total: {calculateTotalScore(teamScores.team1)}</div>
                </div>
                <div className="score-separator">-</div>
                <div className="team-score">
                  <h3>{teams.find(t => t.id === selectedGame.team2_id)?.name}</h3>
                  <div className="score-display">{teamScores.team2[currentQuarter]}</div>
                  <div className="period-total">Total: {calculateTotalScore(teamScores.team2)}</div>
                </div>
              </div>

              {loading ? (
                <div className="events-card">
                  <p>Loading statistics...</p>
                </div>
              ) : (
                <>
                  <div className="stats-actions">
                    <button className="events-cancel-btn" onClick={() => setActiveTab("games")}>
                      Back to Games
                    </button>
                    <div className="stats-action-buttons">
                      <button className="events-delete-btn" onClick={resetStatistics}>
                        <FaRedo /> Reset All
                      </button>
                      <button className="events-submit-btn" onClick={saveStatistics} disabled={loading}>
                        {loading ? 'Saving...' : <><FaSave /> Save Statistics</>}
                      </button>
                    </div>
                  </div>

                  <div className="teams-stats">
                    {[selectedGame.team1_id, selectedGame.team2_id].map((teamId) => {
                      const teamPlayers = playerStats.filter(p => p.team_id === teamId);
                      const teamName = teams.find(t => t.id === teamId)?.name || 'Unknown Team';
                      
                      return (
                        <div key={teamId} className="team-section">
                          <h3 className="team-title">{teamName}</h3>
                          
                          <div className="players-stats">
                            {teamPlayers.map((player, playerIndex) => {
                              const globalIndex = playerStats.findIndex(p => p.player_id === player.player_id);
                              return (
                                <div key={player.player_id} className="events-card player-card">
                                  <div className="player-header">
                                    <h4>{player.player_name}</h4>
                                    <span className="player-points">Points: {player.points[currentQuarter] || 0}</span>
                                  </div>
                                  {renderStatInputs(player, globalIndex)}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffStats;