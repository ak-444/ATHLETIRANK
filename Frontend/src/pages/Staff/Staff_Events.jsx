import React, { useState, useEffect } from "react";
import { FaPlus, FaMinus, FaRedo, FaSave, FaUsers, FaTrophy, FaClock } from "react-icons/fa";
import "../../style/Staff_Events.css";

const StaffEvents = ({ sidebarOpen }) => {
  const [activeTab, setActiveTab] = useState("select");
  const [events, setEvents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [games, setGames] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [playerStats, setPlayerStats] = useState([]);
  const [teamScores, setTeamScores] = useState({ team1: 0, team2: 0 });
  const [loading, setLoading] = useState(false);

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
    points: 0,
    field_goals_made: 0,
    field_goals_attempted: 0,
    three_pointers_made: 0,
    three_pointers_attempted: 0,
    free_throws_made: 0,
    free_throws_attempted: 0,
    rebounds_offensive: 0,
    rebounds_defensive: 0,
    assists: 0,
    steals: 0,
    blocks: 0,
    turnovers: 0,
    fouls: 0,
    minutes_played: 0,
  };

  // Volleyball stats template
  const volleyballStatsTemplate = {
    kills: 0,
    kill_errors: 0,
    kill_attempts: 0,
    assists_volleyball: 0,
    service_aces: 0,
    service_errors: 0,
    service_attempts: 0,
    digs: 0,
    blocks_volleyball: 0,
    block_errors: 0,
    block_attempts: 0,
    reception_errors: 0,
    reception_attempts: 0,
    minutes_played: 0,
  };

  // Fetch events - using mock data
  useEffect(() => {
    setEvents(mockEvents);
  }, []);

  // Fetch teams for selected event - using mock data
  const fetchTeamsForEvent = async (eventId) => {
    setTeams(mockTeams);
  };

  // Fetch games for selected event - using mock data
  const fetchGamesForEvent = async (eventId) => {
    const eventGames = mockGames.filter(game => game.event_id === eventId);
    setGames(eventGames);
  };

  // Handle event selection
  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    setSelectedGame(null);
    setPlayerStats([]);
    setTeamScores({ team1: 0, team2: 0 });
    fetchTeamsForEvent(event.id);
    fetchGamesForEvent(event.id);
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
        ...template
      })),
      ...team2Players.map(player => ({
        player_id: player.id,
        player_name: player.name,
        team_id: game.team2_id,
        team_name: teams.find(t => t.id === game.team2_id)?.name,
        ...template
      }))
    ];

    setPlayerStats(initialStats);
  };

  // Handle game selection
  const handleGameSelect = async (game) => {
    setSelectedGame(game);
    setLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      initializePlayerStats(game);
      setLoading(false);
    }, 500);
  };

  // Update player stat
  const updatePlayerStat = (playerIndex, statName, value) => {
    const newStats = [...playerStats];
    const newValue = Math.max(0, parseInt(value) || 0);
    newStats[playerIndex][statName] = newValue;
    
    // If updating points, update team score
    if (statName === 'points' && selectedGame) {
      const playerTeamId = newStats[playerIndex].team_id;
      const oldValue = playerStats[playerIndex][statName] || 0;
      const pointDifference = newValue - oldValue;
      
      if (pointDifference !== 0) {
        const teamKey = playerTeamId === selectedGame.team1_id ? 'team1' : 'team2';
        setTeamScores(prevScores => ({
          ...prevScores,
          [teamKey]: prevScores[teamKey] + pointDifference
        }));
      }
    }
    
    setPlayerStats(newStats);
  };

  // Increment/decrement player stat
  const adjustPlayerStat = (playerIndex, statName, increment) => {
    const newStats = [...playerStats];
    const currentValue = newStats[playerIndex][statName] || 0;
    const newValue = Math.max(0, currentValue + (increment ? 1 : -1));
    newStats[playerIndex][statName] = newValue;
    
    // If adjusting points, update team score
    if (statName === 'points' && selectedGame) {
      const playerTeamId = newStats[playerIndex].team_id;
      const pointDifference = increment ? 1 : -1;
      
      const teamKey = playerTeamId === selectedGame.team1_id ? 'team1' : 'team2';
      setTeamScores(prevScores => ({
        ...prevScores,
        [teamKey]: prevScores[teamKey] + pointDifference
      }));
    }
    
    setPlayerStats(newStats);
  };

  // Save statistics - mock function
  const saveStatistics = async () => {
    setLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      alert("Statistics saved successfully! (This is a frontend demo)");
      setLoading(false);
    }, 1000);
  };

  // Reset all statistics
  const resetStatistics = () => {
    if (window.confirm("Are you sure you want to reset all statistics?")) {
      initializePlayerStats(selectedGame);
      setTeamScores({ team1: 0, team2: 0 });
    }
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
                value={player.points}
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
                value={player.field_goals_made}
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
                value={player.field_goals_attempted}
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
                value={player.three_pointers_made}
                onChange={(e) => updatePlayerStat(playerIndex, 'three_pointers_made', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'three_pointers_made', true)}>
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="stat-group">
            <label>3PT Attempted</label>
            <div className="stat-controls">
              <button onClick={() => adjustPlayerStat(playerIndex, 'three_pointers_attempted', false)}>
                <FaMinus />
              </button>
              <input
                type="number"
                min="0"
                value={player.three_pointers_attempted}
                onChange={(e) => updatePlayerStat(playerIndex, 'three_pointers_attempted', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'three_pointers_attempted', true)}>
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="stat-group">
            <label>FT Made</label>
            <div className="stat-controls">
              <button onClick={() => adjustPlayerStat(playerIndex, 'free_throws_made', false)}>
                <FaMinus />
              </button>
              <input
                type="number"
                min="0"
                value={player.free_throws_made}
                onChange={(e) => updatePlayerStat(playerIndex, 'free_throws_made', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'free_throws_made', true)}>
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="stat-group">
            <label>FT Attempted</label>
            <div className="stat-controls">
              <button onClick={() => adjustPlayerStat(playerIndex, 'free_throws_attempted', false)}>
                <FaMinus />
              </button>
              <input
                type="number"
                min="0"
                value={player.free_throws_attempted}
                onChange={(e) => updatePlayerStat(playerIndex, 'free_throws_attempted', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'free_throws_attempted', true)}>
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="stat-group">
            <label>Rebounds (Off)</label>
            <div className="stat-controls">
              <button onClick={() => adjustPlayerStat(playerIndex, 'rebounds_offensive', false)}>
                <FaMinus />
              </button>
              <input
                type="number"
                min="0"
                value={player.rebounds_offensive}
                onChange={(e) => updatePlayerStat(playerIndex, 'rebounds_offensive', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'rebounds_offensive', true)}>
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="stat-group">
            <label>Rebounds (Def)</label>
            <div className="stat-controls">
              <button onClick={() => adjustPlayerStat(playerIndex, 'rebounds_defensive', false)}>
                <FaMinus />
              </button>
              <input
                type="number"
                min="0"
                value={player.rebounds_defensive}
                onChange={(e) => updatePlayerStat(playerIndex, 'rebounds_defensive', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'rebounds_defensive', true)}>
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
                value={player.assists}
                onChange={(e) => updatePlayerStat(playerIndex, 'assists', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'assists', true)}>
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
                value={player.steals}
                onChange={(e) => updatePlayerStat(playerIndex, 'steals', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'steals', true)}>
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="stat-group">
            <label>Blocks</label>
            <div className="stat-controls">
              <button onClick={() => adjustPlayerStat(playerIndex, 'blocks', false)}>
                <FaMinus />
              </button>
              <input
                type="number"
                min="0"
                value={player.blocks}
                onChange={(e) => updatePlayerStat(playerIndex, 'blocks', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'blocks', true)}>
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="stat-group">
            <label>Turnovers</label>
            <div className="stat-controls">
              <button onClick={() => adjustPlayerStat(playerIndex, 'turnovers', false)}>
                <FaMinus />
              </button>
              <input
                type="number"
                min="0"
                value={player.turnovers}
                onChange={(e) => updatePlayerStat(playerIndex, 'turnovers', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'turnovers', true)}>
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
                value={player.fouls}
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
                value={player.kills}
                onChange={(e) => updatePlayerStat(playerIndex, 'kills', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'kills', true)}>
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="stat-group">
            <label>Kill Errors</label>
            <div className="stat-controls">
              <button onClick={() => adjustPlayerStat(playerIndex, 'kill_errors', false)}>
                <FaMinus />
              </button>
              <input
                type="number"
                min="0"
                value={player.kill_errors}
                onChange={(e) => updatePlayerStat(playerIndex, 'kill_errors', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'kill_errors', true)}>
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="stat-group">
            <label>Kill Attempts</label>
            <div className="stat-controls">
              <button onClick={() => adjustPlayerStat(playerIndex, 'kill_attempts', false)}>
                <FaMinus />
              </button>
              <input
                type="number"
                min="0"
                value={player.kill_attempts}
                onChange={(e) => updatePlayerStat(playerIndex, 'kill_attempts', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'kill_attempts', true)}>
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
                value={player.assists_volleyball}
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
                value={player.service_aces}
                onChange={(e) => updatePlayerStat(playerIndex, 'service_aces', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'service_aces', true)}>
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="stat-group">
            <label>Service Errors</label>
            <div className="stat-controls">
              <button onClick={() => adjustPlayerStat(playerIndex, 'service_errors', false)}>
                <FaMinus />
              </button>
              <input
                type="number"
                min="0"
                value={player.service_errors}
                onChange={(e) => updatePlayerStat(playerIndex, 'service_errors', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'service_errors', true)}>
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="stat-group">
            <label>Service Attempts</label>
            <div className="stat-controls">
              <button onClick={() => adjustPlayerStat(playerIndex, 'service_attempts', false)}>
                <FaMinus />
              </button>
              <input
                type="number"
                min="0"
                value={player.service_attempts}
                onChange={(e) => updatePlayerStat(playerIndex, 'service_attempts', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'service_attempts', true)}>
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
                value={player.digs}
                onChange={(e) => updatePlayerStat(playerIndex, 'digs', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'digs', true)}>
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="stat-group">
            <label>Blocks</label>
            <div className="stat-controls">
              <button onClick={() => adjustPlayerStat(playerIndex, 'blocks_volleyball', false)}>
                <FaMinus />
              </button>
              <input
                type="number"
                min="0"
                value={player.blocks_volleyball}
                onChange={(e) => updatePlayerStat(playerIndex, 'blocks_volleyball', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'blocks_volleyball', true)}>
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="stat-group">
            <label>Block Errors</label>
            <div className="stat-controls">
              <button onClick={() => adjustPlayerStat(playerIndex, 'block_errors', false)}>
                <FaMinus />
              </button>
              <input
                type="number"
                min="0"
                value={player.block_errors}
                onChange={(e) => updatePlayerStat(playerIndex, 'block_errors', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'block_errors', true)}>
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="stat-group">
            <label>Reception Errors</label>
            <div className="stat-controls">
              <button onClick={() => adjustPlayerStat(playerIndex, 'reception_errors', false)}>
                <FaMinus />
              </button>
              <input
                type="number"
                min="0"
                value={player.reception_errors}
                onChange={(e) => updatePlayerStat(playerIndex, 'reception_errors', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'reception_errors', true)}>
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="stat-group">
            <label>Reception Attempts</label>
            <div className="stat-controls">
              <button onClick={() => adjustPlayerStat(playerIndex, 'reception_attempts', false)}>
                <FaMinus />
              </button>
              <input
                type="number"
                min="0"
                value={player.reception_attempts}
                onChange={(e) => updatePlayerStat(playerIndex, 'reception_attempts', e.target.value)}
              />
              <button onClick={() => adjustPlayerStat(playerIndex, 'reception_attempts', true)}>
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
          <h1>Staff Events - Statistics Recording</h1>
          <p>Record player statistics for games and events</p>
        </div>

        <div className="staff-events-content">
          {/* Navigation Tabs */}
          <div className="staff-events-tabs">
            <button
              className={`staff-events-tab-button ${activeTab === "select" ? "staff-events-tab-active" : ""}`}
              onClick={() => setActiveTab("select")}
            >
              Select Event
            </button>
            {selectedEvent && (
              <button
                className={`staff-events-tab-button ${activeTab === "games" ? "staff-events-tab-active" : ""}`}
                onClick={() => setActiveTab("games")}
              >
                Manage Games ({games.length})
              </button>
            )}
            {selectedGame && (
              <button
                className={`staff-events-tab-button ${activeTab === "statistics" ? "staff-events-tab-active" : ""}`}
                onClick={() => setActiveTab("statistics")}
              >
                Record Statistics
              </button>
            )}
          </div>

          {/* Select Event Tab */}
          {activeTab === "select" && (
            <div className="staff-events-section">
              <h2>Select an Event</h2>
              {events.length === 0 ? (
                <div className="staff-events-empty">
                  <p>No events available. Please create an event first.</p>
                </div>
              ) : (
                <div className="staff-events-grid">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="staff-events-card"
                      onClick={() => handleEventSelect(event)}
                    >
                      <h3>{event.name}</h3>
                      <div className="staff-events-info">
                        <p><strong>Start:</strong> {new Date(event.start_date).toLocaleDateString()}</p>
                        <p><strong>End:</strong> {new Date(event.end_date).toLocaleDateString()}</p>
                        <p><strong>Status:</strong> 
                          <span className={`status-${event.status}`}>{event.status}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Manage Games Tab */}
          {activeTab === "games" && selectedEvent && (
            <div className="staff-events-section">
              <div className="staff-events-header">
                <h2>Games for {selectedEvent.name}</h2>
              </div>

              {games.length === 0 ? (
                <div className="staff-events-empty">
                  <p>No games created yet for this event.</p>
                </div>
              ) : (
                <div className="staff-games-list">
                  {games.map((game) => (
                    <div key={game.id} className="staff-game-card">
                      <div className="staff-game-header">
                        <h3>
                          {teams.find(t => t.id === game.team1_id)?.name || 'Team 1'} 
                          {' vs '}
                          {teams.find(t => t.id === game.team2_id)?.name || 'Team 2'}
                        </h3>
                        <span className="staff-game-sport">{game.sport}</span>
                      </div>
                      <div className="staff-game-info">
                        <p><strong>Status:</strong> <span className={`status-${game.status}`}>{game.status}</span></p>
                        
                      </div>
                      <div className="staff-game-actions">
                        <button
                          className="staff-stats-btn"
                          onClick={() => handleGameSelect(game)}
                        >
                          Record Statistics
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Statistics Recording Tab */}
          {activeTab === "statistics" && selectedGame && (
            <div className="staff-events-section">
              <div className="staff-events-header">
                <h2>
                  Statistics - {teams.find(t => t.id === selectedGame.team1_id)?.name} vs {teams.find(t => t.id === selectedGame.team2_id)?.name}
                </h2>
                <p>Sport: {selectedGame.sport}</p>
                
                {/* Team Score Display */}
                <div className="team-scores-container">
                  <div className="team-score">
                    <h3>{teams.find(t => t.id === selectedGame.team1_id)?.name}</h3>
                    <div className="score-display">{teamScores.team1}</div>
                  </div>
                  <div className="score-separator">-</div>
                  <div className="team-score">
                    <h3>{teams.find(t => t.id === selectedGame.team2_id)?.name}</h3>
                    <div className="score-display">{teamScores.team2}</div>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="staff-events-loading">Loading statistics...</div>
              ) : (
                <div className="staff-stats-container">
                  <div className="staff-stats-actions">
                    <button 
                      className="staff-reset-btn"
                      onClick={resetStatistics}
                    >
                      <FaRedo /> Reset All
                    </button>
                    <button 
                      className="staff-save-btn"
                      onClick={saveStatistics}
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : <><FaSave /> Save Statistics</>}
                    </button>
                  </div>

                  <div className="staff-teams-stats">
                    {/* Group players by team */}
                    {[selectedGame.team1_id, selectedGame.team2_id].map((teamId) => {
                      const teamPlayers = playerStats.filter(p => p.team_id === teamId);
                      const teamName = teams.find(t => t.id === teamId)?.name || 'Unknown Team';
                      
                      return (
                        <div key={teamId} className="staff-team-section">
                          <h3 className="staff-team-title">{teamName}</h3>
                          
                          <div className="staff-players-stats">
                            {teamPlayers.map((player, playerIndex) => {
                              const globalIndex = playerStats.findIndex(p => p.player_id === player.player_id);
                              return (
                                <div key={player.player_id} className="staff-player-card">
                                  <div className="staff-player-header">
                                    <h4>{player.player_name}</h4>
                                    <span className="player-points">Points: {player.points || 0}</span>
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
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffEvents;