import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaMinus,
  FaRedo,
  FaSave,
  FaArrowLeft,
  FaArrowRight,
} from "react-icons/fa";
import "../../style/Staff_Stats.css";

const StaffStats = ({ sidebarOpen }) => {
  const [activeTab, setActiveTab] = useState("select");
  const [events, setEvents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [games, setGames] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [playerStats, setPlayerStats] = useState([]);
  const [teamScores, setTeamScores] = useState({
    team1: [0, 0, 0, 0],
    team2: [0, 0, 0, 0],
  });
  const [currentQuarter, setCurrentQuarter] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Basketball template
  const basketballStatsTemplate = {
    points: [0, 0, 0, 0],
    assists: [0, 0, 0, 0],
    rebounds: [0, 0, 0, 0],
    three_points_made: [0, 0, 0, 0],
    steals: [0, 0, 0, 0],
    blocks: [0, 0, 0, 0],
    fouls: [0, 0, 0, 0],
    turnovers: [0, 0, 0, 0],
  };

  // Volleyball template
  const volleyballStatsTemplate = {
    serves: [0, 0, 0, 0, 0],
    receptions: [0, 0, 0, 0, 0],
    digs: [0, 0, 0, 0, 0],
    kills: [0, 0, 0, 0, 0],
  };

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:5000/api/events");
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        setError("Failed to load events");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Handle event selection
  const handleEventSelect = async (event) => {
    console.log("Selected event:", event);
    setSelectedEvent(event);
    setSelectedGame(null);
    setPlayerStats([]);
    setTeamScores({ team1: [0, 0, 0, 0], team2: [0, 0, 0, 0] });
    setCurrentQuarter(0);
    setLoading(true);

    try {
      // Fetch teams for this event
      const teamRes = await fetch(
        `http://localhost:5000/api/events/${event.id}/teams`
      );
      const teamData = await teamRes.json();
      console.log("Teams fetched:", teamData);
      setTeams(teamData);

      // Fetch matches for this event
      const matchRes = await fetch(
        `http://localhost:5000/api/events/${event.id}/matches`
      );
      const matchData = await matchRes.json();
      console.log("Matches fetched:", matchData);
      setGames(matchData);

      if (matchData.length === 0) {
        setError("No matches found for this event. Make sure brackets have been created.");
      } else {
        setError(null);
      }
    } catch (err) {
      console.error("Error loading event data:", err);
      setError("Failed to load event matches");
    } finally {
      setLoading(false);
      setActiveTab("games");
    }
  };

  // Initialize player stats
  const initializePlayerStats = async (game) => {
    try {
      console.log("Initializing player stats for game:", game);
      
      // Fetch players for both teams
      const res1 = await fetch(
        `http://localhost:5000/api/teams/${game.team1_id}/players`
      );
      const team1Players = await res1.json();
      console.log("Team 1 players:", team1Players);

      const res2 = await fetch(
        `http://localhost:5000/api/teams/${game.team2_id}/players`
      );
      const team2Players = await res2.json();
      console.log("Team 2 players:", team2Players);

      const template =
        game.sport_type === "basketball"
          ? basketballStatsTemplate
          : volleyballStatsTemplate;

      const initialStats = [
        ...team1Players.map((p) => ({
          player_id: p.id,
          player_name: p.name,
          team_id: game.team1_id,
          team_name: teams.find((t) => t.id === game.team1_id)?.name,
          ...JSON.parse(JSON.stringify(template)),
        })),
        ...team2Players.map((p) => ({
          player_id: p.id,
          player_name: p.name,
          team_id: game.team2_id,
          team_name: teams.find((t) => t.id === game.team2_id)?.name,
          ...JSON.parse(JSON.stringify(template)),
        })),
      ];
      
      console.log("Initial player stats:", initialStats);
      setPlayerStats(initialStats);

      // Load existing stats if any
      const resStats = await fetch(
        `http://localhost:5000/api/matches/${game.id}/stats`
      );
      const existingStats = await resStats.json();
      
      if (existingStats.length > 0) {
        console.log("Found existing stats:", existingStats);
        const merged = initialStats.map((p) => {
          const found = existingStats.find((s) => s.player_id === p.player_id);
          if (found) {
            return {
              ...p,
              points: [found.points, 0, 0, 0],
              assists: [found.assists, 0, 0, 0],
              rebounds: [found.rebounds, 0, 0, 0],
              three_points_made: [found.three_points_made, 0, 0, 0],
              steals: [found.steals, 0, 0, 0],
              blocks: [found.blocks, 0, 0, 0],
              fouls: [found.fouls, 0, 0, 0],
              turnovers: [found.turnovers, 0, 0, 0],
              serves: [found.serves, 0, 0, 0, 0],
              receptions: [found.receptions, 0, 0, 0, 0],
              digs: [found.digs, 0, 0, 0, 0],
              kills: [found.kills, 0, 0, 0, 0],
            };
          }
          return p;
        });
        setPlayerStats(merged);
      }
    } catch (err) {
      console.error("Error initializing player stats:", err);
      setError("Failed to load players/stats");
    }
  };

  // Handle game selection (SINGLE FUNCTION - removed duplicate)
  const handleGameSelect = async (game) => {
    console.log("Selected game:", game);
    console.log("Game sport_type:", game.sport_type);
    
    setSelectedGame(game);
    setLoading(true);
    
    // Set initial scores based on sport type
    const initialScores =
      game.sport_type === "basketball"
        ? { team1: [0, 0, 0, 0], team2: [0, 0, 0, 0] }
        : { team1: [0, 0, 0, 0, 0], team2: [0, 0, 0, 0, 0] };
    
    console.log("Initial scores set:", initialScores);
    setTeamScores(initialScores);
    setCurrentQuarter(0);

    await initializePlayerStats(game);
    setLoading(false);
    setActiveTab("statistics");
  };

  // Update player stat
  const updatePlayerStat = (playerIndex, statName, value) => {
    const newStats = [...playerStats];
    const newValue = Math.max(0, parseInt(value) || 0);
    newStats[playerIndex][statName][currentQuarter] = newValue;

    if (statName === "points" && selectedGame) {
      const playerTeamId = newStats[playerIndex].team_id;
      const oldValue = playerStats[playerIndex][statName][currentQuarter] || 0;
      const diff = newValue - oldValue;

      if (diff !== 0) {
        const teamKey =
          playerTeamId === selectedGame.team1_id ? "team1" : "team2";
        setTeamScores((prev) => {
          const copy = { ...prev };
          copy[teamKey][currentQuarter] += diff;
          return copy;
        });
      }
    }

    setPlayerStats(newStats);
  };

  // Adjust player stat
  const adjustPlayerStat = (playerIndex, statName, increment) => {
    const newStats = [...playerStats];
    const currentValue =
      newStats[playerIndex][statName][currentQuarter] || 0;
    const newValue = Math.max(0, currentValue + (increment ? 1 : -1));
    newStats[playerIndex][statName][currentQuarter] = newValue;

    if (statName === "points" && selectedGame) {
      const playerTeamId = newStats[playerIndex].team_id;
      const diff = increment ? 1 : -1;
      const teamKey =
        playerTeamId === selectedGame.team1_id ? "team1" : "team2";
      setTeamScores((prev) => {
        const copy = { ...prev };
        copy[teamKey][currentQuarter] += diff;
        return copy;
      });
    }

    setPlayerStats(newStats);
  };

  // Save statistics
  const saveStatistics = async () => {
    if (!selectedGame) return;
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/matches/${selectedGame.id}/stats`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            team1_id: selectedGame.team1_id,
            team2_id: selectedGame.team2_id,
            players: playerStats.map((p) => ({
              player_id: p.player_id,
              team_id: p.team_id,
              points: p.points.reduce((a, b) => a + b, 0),
              assists: p.assists ? p.assists.reduce((a, b) => a + b, 0) : 0,
              rebounds: p.rebounds ? p.rebounds.reduce((a, b) => a + b, 0) : 0,
              three_points_made: p.three_points_made
                ? p.three_points_made.reduce((a, b) => a + b, 0)
                : 0,
              steals: p.steals ? p.steals.reduce((a, b) => a + b, 0) : 0,
              blocks: p.blocks ? p.blocks.reduce((a, b) => a + b, 0) : 0,
              fouls: p.fouls ? p.fouls.reduce((a, b) => a + b, 0) : 0,
              turnovers: p.turnovers
                ? p.turnovers.reduce((a, b) => a + b, 0)
                : 0,
              serves: p.serves ? p.serves.reduce((a, b) => a + b, 0) : 0,
              receptions: p.receptions
                ? p.receptions.reduce((a, b) => a + b, 0)
                : 0,
              digs: p.digs ? p.digs.reduce((a, b) => a + b, 0) : 0,
              kills: p.kills ? p.kills.reduce((a, b) => a + b, 0) : 0,
            })),
          }),
        }
      );
      const data = await res.json();
      alert("Statistics saved! Winner updated.");
      console.log(data);
    } catch (err) {
      alert("Failed to save stats");
    } finally {
      setLoading(false);
    }
  };

  // Reset stats
  const resetStatistics = () => {
    if (window.confirm("Are you sure you want to reset all statistics?")) {
      initializePlayerStats(selectedGame);
      const initialScores =
        selectedGame.sport_type === "basketball"
          ? { team1: [0, 0, 0, 0], team2: [0, 0, 0, 0] }
          : { team1: [0, 0, 0, 0, 0], team2: [0, 0, 0, 0, 0] };
      setTeamScores(initialScores);
      setCurrentQuarter(0);
    }
  };

  // Change quarter/set
  const changePeriod = (direction) => {
    const maxPeriod = selectedGame.sport_type === "basketball" ? 3 : 4;
    if (direction === "next" && currentQuarter < maxPeriod) {
      setCurrentQuarter(currentQuarter + 1);
    } else if (direction === "prev" && currentQuarter > 0) {
      setCurrentQuarter(currentQuarter - 1);
    }
  };

  // Render stat inputs
  const renderStatInputs = (player, idx) => {
    const sport = selectedGame.sport_type;
    if (sport === "basketball") {
      return (
        <div className="stats-grid">
          {[
            "points",
            "assists",
            "rebounds",
            "three_points_made",
            "steals",
            "blocks",
            "fouls",
            "turnovers",
          ].map((stat) => (
            <div className="stat-group" key={stat}>
              <label>{stat.replace("_", " ")}</label>
              <div className="stat-controls">
                <button onClick={() => adjustPlayerStat(idx, stat, false)}>
                  <FaMinus />
                </button>
                <input
                  type="number"
                  min="0"
                  value={player[stat][currentQuarter]}
                  onChange={(e) => updatePlayerStat(idx, stat, e.target.value)}
                />
                <button onClick={() => adjustPlayerStat(idx, stat, true)}>
                  <FaPlus />
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      return (
        <div className="stats-grid">
          {["kills", "serves", "receptions", "digs"].map((stat) => (
            <div className="stat-group" key={stat}>
              <label>{stat}</label>
              <div className="stat-controls">
                <button onClick={() => adjustPlayerStat(idx, stat, false)}>
                  <FaMinus />
                </button>
                <input
                  type="number"
                  min="0"
                  value={player[stat][currentQuarter]}
                  onChange={(e) => updatePlayerStat(idx, stat, e.target.value)}
                />
                <button onClick={() => adjustPlayerStat(idx, stat, true)}>
                  <FaPlus />
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <div className="admin-dashboard">
      <div
        className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}
      >
        <div className="dashboard-header">
          <h1>Staff Statistics</h1>
        </div>

        <div className="events-content">
          {/* Tabs */}
          <div className="events-tabs">
            <button
              className={`events-tab-button ${
                activeTab === "select" ? "events-tab-active" : ""
              }`}
              onClick={() => setActiveTab("select")}
            >
              Select Event
            </button>
            {selectedEvent && (
              <button
                className={`events-tab-button ${
                  activeTab === "games" ? "events-tab-active" : ""
                }`}
                onClick={() => setActiveTab("games")}
              >
                Manage Games ({games.length})
              </button>
            )}
            {selectedGame && (
              <button
                className={`events-tab-button ${
                  activeTab === "statistics" ? "events-tab-active" : ""
                }`}
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
                <p>No events available.</p>
              ) : (
                <div className="events-grid">
                  {events.map((event) => (
                    <div className="events-card" key={event.id}>
                      <div className="events-card-header">
                        <h3>{event.name}</h3>
                      </div>
                      <div className="events-info">
                        <p>
                          <strong>Start:</strong>{" "}
                          {new Date(event.start_date).toLocaleDateString()}
                        </p>
                        <p>
                          <strong>End:</strong>{" "}
                          {new Date(event.end_date).toLocaleDateString()}
                        </p>
                        <p>
                          <strong>Status:</strong>{" "}
                          <span className={`status-${event.status}`}>
                            {event.status}
                          </span>
                        </p>
                      </div>
                      <div className="events-card-actions">
                        <button
                          className="events-submit-btn"
                          onClick={() => handleEventSelect(event)}
                        >
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
              {error && <p style={{ color: "red" }}>{error}</p>}
              {loading ? (
                <p>Loading games...</p>
              ) : games.length === 0 ? (
                <p>No games created yet for this event.</p>
              ) : (
                <div className="events-grid">
                  {games.map((game) => (
                    <div className="events-card" key={game.id}>
                      <div className="events-card-header">
                        <h3>
                          {teams.find((t) => t.id === game.team1_id)?.name ||
                            "Team 1"}{" "}
                          vs{" "}
                          {teams.find((t) => t.id === game.team2_id)?.name ||
                            "Team 2"}
                        </h3>
                      </div>
                      <div className="events-info">
                        <p>
                          <strong>Sport:</strong> {game.sport_type}
                        </p>
                        <p>
                          <strong>Status:</strong>{" "}
                          <span className={`status-${game.status}`}>
                            {game.status}
                          </span>
                        </p>
                      </div>
                      <div className="events-card-actions">
                        <button
                          className="events-submit-btn"
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

          {/* Record Statistics */}
          {activeTab === "statistics" && selectedGame && (
            <div className="events-view-section">
              <h2>
                Recording Statistics:{" "}
                {teams.find((t) => t.id === selectedGame.team1_id)?.name} vs{" "}
                {teams.find((t) => t.id === selectedGame.team2_id)?.name} (
                {selectedGame.sport_type})
              </h2>

              {/* Period Navigation */}
              <div className="period-navigation">
                <button
                  onClick={() => changePeriod("prev")}
                  disabled={currentQuarter === 0}
                  className="period-nav-btn"
                >
                  <FaArrowLeft />
                </button>
                <div className="period-display">
                  {selectedGame.sport_type === "basketball"
                    ? `Quarter ${currentQuarter + 1}`
                    : `Set ${currentQuarter + 1}`}
                </div>
                <button
                  onClick={() => changePeriod("next")}
                  disabled={
                    currentQuarter ===
                    (selectedGame.sport_type === "basketball" ? 3 : 4)
                  }
                  className="period-nav-btn"
                >
                  <FaArrowRight />
                </button>
              </div>

              {/* Team Scores */}
              <div className="team-scores-container">
                <div className="team-score">
                  <h3>
                    {teams.find((t) => t.id === selectedGame.team1_id)?.name}
                  </h3>
                  <div className="score-display">
                    {teamScores.team1[currentQuarter]}
                  </div>
                  <div className="period-total">
                    Total: {teamScores.team1.reduce((a, b) => a + b, 0)}
                  </div>
                </div>
                <div className="score-separator">-</div>
                <div className="team-score">
                  <h3>
                    {teams.find((t) => t.id === selectedGame.team2_id)?.name}
                  </h3>
                  <div className="score-display">
                    {teamScores.team2[currentQuarter]}
                  </div>
                  <div className="period-total">
                    Total: {teamScores.team2.reduce((a, b) => a + b, 0)}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="stats-actions">
                <button
                  className="events-cancel-btn"
                  onClick={() => setActiveTab("games")}
                >
                  Back to Games
                </button>
                <div className="stats-action-buttons">
                  <button className="events-delete-btn" onClick={resetStatistics}>
                    <FaRedo /> Reset All
                  </button>
                  <button
                    className="events-submit-btn"
                    onClick={saveStatistics}
                    disabled={loading}
                  >
                    {loading ? "Saving..." : <><FaSave /> Save Statistics</>}
                  </button>
                </div>
              </div>

              {/* Player Stats */}
              <div className="teams-stats">
                {[selectedGame.team1_id, selectedGame.team2_id].map((teamId) => {
                  const teamPlayers = playerStats.filter(
                    (p) => p.team_id === teamId
                  );
                  const teamName =
                    teams.find((t) => t.id === teamId)?.name || "Unknown Team";

                  return (
                    <div key={teamId} className="team-section">
                      <h3 className="team-title">{teamName}</h3>
                      <div className="players-stats">
                        {teamPlayers.map((player, playerIndex) => {
                          const globalIndex = playerStats.findIndex(
                            (p) => p.player_id === player.player_id
                          );
                          return (
                            <div
                              key={player.player_id}
                              className="events-card player-card"
                            >
                              <div className="player-header">
                                <h4>{player.player_name}</h4>
                                <span className="player-points">
                                  Points:{" "}
                                  {player.points
                                    ? player.points[currentQuarter] || 0
                                    : 0}
                                </span>
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
      </div>
    </div>
  );
};

export default StaffStats;