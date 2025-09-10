import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaMinus,
  FaRedo,
  FaSave,
  FaArrowLeft,
  FaArrowRight,
  FaTrophy
} from "react-icons/fa";
import "../../style/Staff_Stats.css";

const StaffStats = ({ sidebarOpen }) => {
  const [activeTab, setActiveTab] = useState("select");
  const [events, setEvents] = useState([]);
  const [brackets, setBrackets] = useState([]);
  const [teams, setTeams] = useState([]);
  const [games, setGames] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [playerStats, setPlayerStats] = useState([]);
  const [matchAwards, setMatchAwards] = useState([]);
  const [teamScores, setTeamScores] = useState({
    team1: [0, 0, 0, 0],
    team2: [0, 0, 0, 0],
  });
  const [currentQuarter, setCurrentQuarter] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Award types based on sport
  const getAwardTypes = (sportType) => {
    if (sportType === 'basketball') {
      return ['MVP', 'BestDefender', 'MostAssists', 'BestRebounder', 'Best3PointShooter'];
    } else if (sportType === 'volleyball') {
      return ['MVP', 'BestServer', 'BestBlocker', 'BestReceiver', 'BestLibero'];
    }
    return ['MVP'];
  };

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

  // Enhanced volleyball template with new stats
  const volleyballStatsTemplate = {
    kills: [0, 0, 0, 0, 0],
    attack_attempts: [0, 0, 0, 0, 0],
    attack_errors: [0, 0, 0, 0, 0],
    serves: [0, 0, 0, 0, 0],
    service_aces: [0, 0, 0, 0, 0],
    serve_errors: [0, 0, 0, 0, 0],
    receptions: [0, 0, 0, 0, 0],
    reception_errors: [0, 0, 0, 0, 0],
    digs: [0, 0, 0, 0, 0],
    volleyball_assists: [0, 0, 0, 0, 0],
  };

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:5000/api/stats/events");
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
    setMatchAwards([]);
    setTeamScores({ team1: [0, 0, 0, 0], team2: [0, 0, 0, 0] });
    setCurrentQuarter(0);
    setLoading(true);
    setError(null);

    try {
      const bracketRes = await fetch(
        `http://localhost:5000/api/stats/events/${event.id}/brackets`
      );
      
      if (!bracketRes.ok) {
        throw new Error(`HTTP error! status: ${bracketRes.status}`);
      }
      
      const bracketData = await bracketRes.json();
      setBrackets(bracketData);

      if (bracketData.length === 0) {
        setError("No brackets found for this event. Create brackets first.");
        setGames([]);
        setTeams([]);
        setLoading(false);
        setActiveTab("games");
        return;
      }

      const allMatches = [];
      const allTeams = [];

      for (const bracket of bracketData) {
        const matchRes = await fetch(
          `http://localhost:5000/api/stats/${bracket.id}/matches`
        );
        
        if (!matchRes.ok) {
          console.error(`Failed to fetch matches for bracket ${bracket.id}: ${matchRes.status}`);
          continue;
        }
        
        const matchData = await matchRes.json();
        const matchesWithBracket = matchData.map(match => ({
          ...match,
          bracket_name: bracket.name,
          sport_type: bracket.sport_type,
          bracket_id: bracket.id
        }));
        
        allMatches.push(...matchesWithBracket);

        try {
          const teamRes = await fetch(
            `http://localhost:5000/api/stats/${bracket.id}/teams`
          );
          
          if (teamRes.ok) {
            const teamData = await teamRes.json();
            teamData.forEach(team => {
              if (!allTeams.find(t => t.id === team.id)) {
                allTeams.push(team);
              }
            });
          }
        } catch (teamErr) {
          console.error(`Error fetching teams for bracket ${bracket.id}:`, teamErr);
        }
      }

      setGames(allMatches);
      setTeams(allTeams);

      if (allMatches.length === 0) {
        setError("No matches found for this event. Make sure brackets have matches.");
      }

    } catch (err) {
      console.error("Error loading event data:", err);
      setError("Failed to load event data: " + err.message);
    } finally {
      setLoading(false);
      setActiveTab("games");
    }
  };

  // Initialize player stats with awards loading - FIXED: Get all players per team
  const initializePlayerStats = async (game) => {
    try {
      console.log("Initializing player stats for game:", game);
      
      const res1 = await fetch(
        `http://localhost:5000/api/stats/teams/${game.team1_id}/players`
      );
      const team1Players = await res1.json();

      const res2 = await fetch(
        `http://localhost:5000/api/stats/teams/${game.team2_id}/players`
      );
      const team2Players = await res2.json();

      const template =
        game.sport_type === "basketball"
          ? basketballStatsTemplate
          : volleyballStatsTemplate;

      // FIXED: Get all players from each team
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
      
      setPlayerStats(initialStats);

      // Load existing stats and awards
      try {
        const [resStats, resAwards] = await Promise.all([
          fetch(`http://localhost:5000/api/stats/matches/${game.id}/stats`),
          fetch(`http://localhost:5000/api/stats/matches/${game.id}/awards`)
        ]);
        
        const existingStats = await resStats.json();
        const existingAwards = await resAwards.json();
        
        if (existingStats.length > 0) {
          const merged = initialStats.map((p) => {
            const found = existingStats.find((s) => s.player_id === p.player_id);
            if (found) {
              const mergedPlayer = { ...p };
              
              if (game.sport_type === "basketball") {
                mergedPlayer.points = [found.points || 0, 0, 0, 0];
                mergedPlayer.assists = [found.assists || 0, 0, 0, 0];
                mergedPlayer.rebounds = [found.rebounds || 0, 0, 0, 0];
                mergedPlayer.three_points_made = [found.three_points_made || 0, 0, 0, 0];
                mergedPlayer.steals = [found.steals || 0, 0, 0, 0];
                mergedPlayer.blocks = [found.blocks || 0, 0, 0, 0];
                mergedPlayer.fouls = [found.fouls || 0, 0, 0, 0];
                mergedPlayer.turnovers = [found.turnovers || 0, 0, 0, 0];
              } else {
                mergedPlayer.kills = [found.kills || 0, 0, 0, 0, 0];
                mergedPlayer.attack_attempts = [found.attack_attempts || 0, 0, 0, 0, 0];
                mergedPlayer.attack_errors = [found.attack_errors || 0, 0, 0, 0, 0];
                mergedPlayer.serves = [found.serves || 0, 0, 0, 0, 0];
                mergedPlayer.service_aces = [found.service_aces || 0, 0, 0, 0, 0];
                mergedPlayer.serve_errors = [found.serve_errors || 0, 0, 0, 0, 0];
                mergedPlayer.receptions = [found.receptions || 0, 0, 0, 0, 0];
                mergedPlayer.reception_errors = [found.reception_errors || 0, 0, 0, 0, 0];
                mergedPlayer.digs = [found.digs || 0, 0, 0, 0, 0];
                mergedPlayer.volleyball_assists = [found.volleyball_assists || 0, 0, 0, 0, 0];
              }
              
              return mergedPlayer;
            }
            return p;
          });
          setPlayerStats(merged);
        }

        // Set existing awards
        setMatchAwards(existingAwards);
        
      } catch (statsErr) {
        console.log("No existing stats/awards found or error loading:", statsErr);
        setMatchAwards([]);
      }
    } catch (err) {
      console.error("Error initializing player stats:", err);
      setError("Failed to load players/stats: " + err.message);
    }
  };

  // Handle game selection
  const handleGameSelect = async (game) => {
    setSelectedGame(game);
    setLoading(true);
    
    const initialScores =
      game.sport_type === "basketball"
        ? { team1: [0, 0, 0, 0], team2: [0, 0, 0, 0] }
        : { team1: [0, 0, 0, 0, 0], team2: [0, 0, 0, 0, 0] };
    
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

    if ((statName === "points" || statName === "kills") && selectedGame) {
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

    if ((statName === "points" || statName === "kills") && selectedGame) {
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

  // Award management functions
  const addAward = (playerId, awardType) => {
    // Check if award already exists for this player
    const existingAward = matchAwards.find(
      a => a.player_id === playerId && a.award_type === awardType
    );
    
    if (existingAward) {
      alert("This player already has this award for this match.");
      return;
    }

    const player = playerStats.find(p => p.player_id === playerId);
    if (!player) return;

    const newAward = {
      player_id: playerId,
      player_name: player.player_name,
      team_name: player.team_name,
      award_type: awardType
    };

    setMatchAwards(prev => [...prev, newAward]);
  };

  const removeAward = (playerId, awardType) => {
    setMatchAwards(prev => 
      prev.filter(a => !(a.player_id === playerId && a.award_type === awardType))
    );
  };

  // Calculate hitting percentage for volleyball
  const calculateHittingPercentage = (player) => {
    const kills = player.kills ? player.kills.reduce((a, b) => a + b, 0) : 0;
    const attempts = player.attack_attempts ? player.attack_attempts.reduce((a, b) => a + b, 0) : 0;
    const errors = player.attack_errors ? player.attack_errors.reduce((a, b) => a + b, 0) : 0;
    
    if (attempts === 0) return "0.00%";
    return (((kills - errors) / attempts) * 100).toFixed(2) + "%";
  };

  // Save statistics with awards
  const saveStatistics = async () => {
    if (!selectedGame) return;
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/stats/matches/${selectedGame.id}/stats`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            team1_id: selectedGame.team1_id,
            team2_id: selectedGame.team2_id,
            players: playerStats.map((p) => ({
              player_id: p.player_id,
              team_id: p.team_id,
              // Basketball stats
              points: p.points ? p.points.reduce((a, b) => a + b, 0) : 0,
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
              // Volleyball stats
              kills: p.kills ? p.kills.reduce((a, b) => a + b, 0) : 0,
              attack_attempts: p.attack_attempts
                ? p.attack_attempts.reduce((a, b) => a + b, 0)
                : 0,
              attack_errors: p.attack_errors
                ? p.attack_errors.reduce((a, b) => a + b, 0)
                : 0,
              serves: p.serves ? p.serves.reduce((a, b) => a + b, 0) : 0,
              service_aces: p.service_aces
                ? p.service_aces.reduce((a, b) => a + b, 0)
                : 0,
              serve_errors: p.serve_errors
                ? p.serve_errors.reduce((a, b) => a + b, 0)
                : 0,
              receptions: p.receptions
                ? p.receptions.reduce((a, b) => a + b, 0)
                : 0,
              reception_errors: p.reception_errors
                ? p.reception_errors.reduce((a, b) => a + b, 0)
                : 0,
              digs: p.digs ? p.digs.reduce((a, b) => a + b, 0) : 0,
              volleyball_assists: p.volleyball_assists
                ? p.volleyball_assists.reduce((a, b) => a + b, 0)
                : 0,
            })),
            awards: matchAwards.map(award => ({
              player_id: award.player_id,
              award_type: award.award_type
            }))
          }),
        }
      );
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Show success message with advancement info
      let message = "Statistics saved successfully!";
      if (data.advanced) {
        message += " Winner has been advanced to the next round!";
      }
      if (data.winnerId) {
        const winnerTeam = data.winnerId === selectedGame.team1_id ? 
          selectedGame.team1_name : selectedGame.team2_name;
        message += ` Winner: ${winnerTeam}`;
      }
      
      alert(message);
      console.log(data);
      
      // Refresh the games list to show updated match status
      if (selectedEvent) {
        handleEventSelect(selectedEvent);
      }
      
    } catch (err) {
      console.error("Save stats error:", err);
      alert("Failed to save stats: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset stats
  const resetStatistics = () => {
    if (window.confirm("Are you sure you want to reset all statistics and awards?")) {
      initializePlayerStats(selectedGame);
      const initialScores =
        selectedGame.sport_type === "basketball"
          ? { team1: [0, 0, 0, 0], team2: [0, 0, 0, 0] }
          : { team1: [0, 0, 0, 0, 0], team2: [0, 0, 0, 0, 0] };
      setTeamScores(initialScores);
      setCurrentQuarter(0);
      setMatchAwards([]);
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
    const playerAwards = matchAwards.filter(a => a.player_id === player.player_id);
    const availableAwards = getAwardTypes(sport).filter(
      awardType => !playerAwards.find(a => a.award_type === awardType)
    );

    // Volleyball stat labels mapping
    const volleyballStatLabels = {
      kills: "Kills",
      attack_attempts: "Att",
      attack_errors: "Att Err",
      serves: "Serve",
      service_aces: "Ace",
      serve_errors: "Serve Err",
      receptions: "Rec",
      reception_errors: "Rec Err",
      digs: "Digs",
      volleyball_assists: "Ast"
    };

    return (
      <div className="player-stats-container">
        {/* Award Section */}
        <div className="player-awards-section">
          <h5><FaTrophy /> Awards</h5>
          <div className="current-awards">
            {playerAwards.map((award, awardIdx) => (
              <span key={awardIdx} className="award-badge">
                {award.award_type}
                <button 
                  type="button"
                  onClick={() => removeAward(player.player_id, award.award_type)}
                  className="remove-award-btn"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          
          {availableAwards.length > 0 && (
            <div className="add-award-section">
              <select 
                onChange={(e) => {
                  if (e.target.value) {
                    addAward(player.player_id, e.target.value);
                    e.target.value = '';
                  }
                }}
                value=""
              >
                <option value="">Add Award...</option>
                {availableAwards.map(award => (
                  <option key={award} value={award}>{award}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Stats Section */}
        {sport === "basketball" ? (
          <div className="stats-grid basketball-stats">
            {/* Row 1 */}
            <div className="stat-group">
              <label>Points</label>
              <div className="stat-controls">
                <button onClick={() => adjustPlayerStat(idx, "points", false)}>
                  <FaMinus />
                </button>
                <input
                  type="number"
                  min="0"
                  value={player.points[currentQuarter]}
                  onChange={(e) => updatePlayerStat(idx, "points", e.target.value)}
                />
                <button onClick={() => adjustPlayerStat(idx, "points", true)}>
                  <FaPlus />
                </button>
              </div>
            </div>
            
            <div className="stat-group">
              <label>Assists</label>
              <div className="stat-controls">
                <button onClick={() => adjustPlayerStat(idx, "assists", false)}>
                  <FaMinus />
                </button>
                <input
                  type="number"
                  min="0"
                  value={player.assists[currentQuarter]}
                  onChange={(e) => updatePlayerStat(idx, "assists", e.target.value)}
                />
                <button onClick={() => adjustPlayerStat(idx, "assists", true)}>
                  <FaPlus />
                </button>
              </div>
            </div>
            
            <div className="stat-group">
              <label>Rebounds</label>
              <div className="stat-controls">
                <button onClick={() => adjustPlayerStat(idx, "rebounds", false)}>
                  <FaMinus />
                </button>
                <input
                  type="number"
                  min="0"
                  value={player.rebounds[currentQuarter]}
                  onChange={(e) => updatePlayerStat(idx, "rebounds", e.target.value)}
                />
                <button onClick={() => adjustPlayerStat(idx, "rebounds", true)}>
                  <FaPlus />
                </button>
              </div>
            </div>
            
            {/* Row 2 */}
            <div className="stat-group">
              <label>3-Pointers</label>
              <div className="stat-controls">
                <button onClick={() => adjustPlayerStat(idx, "three_points_made", false)}>
                  <FaMinus />
                </button>
                <input
                  type="number"
                  min="0"
                  value={player.three_points_made[currentQuarter]}
                  onChange={(e) => updatePlayerStat(idx, "three_points_made", e.target.value)}
                />
                <button onClick={() => adjustPlayerStat(idx, "three_points_made", true)}>
                  <FaPlus />
                </button>
              </div>
            </div>
            
            <div className="stat-group">
              <label>Steals</label>
              <div className="stat-controls">
                <button onClick={() => adjustPlayerStat(idx, "steals", false)}>
                  <FaMinus />
                </button>
                <input
                  type="number"
                  min="0"
                  value={player.steals[currentQuarter]}
                  onChange={(e) => updatePlayerStat(idx, "steals", e.target.value)}
                />
                <button onClick={() => adjustPlayerStat(idx, "steals", true)}>
                  <FaPlus />
                </button>
              </div>
            </div>
            
            <div className="stat-group">
              <label>Blocks</label>
              <div className="stat-controls">
                <button onClick={() => adjustPlayerStat(idx, "blocks", false)}>
                  <FaMinus />
                </button>
                <input
                  type="number"
                  min="0"
                  value={player.blocks[currentQuarter]}
                  onChange={(e) => updatePlayerStat(idx, "blocks", e.target.value)}
                />
                <button onClick={() => adjustPlayerStat(idx, "blocks", true)}>
                  <FaPlus />
                </button>
              </div>
            </div>
            
            {/* Row 3 */}
            <div className="stat-group">
              <label>Fouls</label>
              <div className="stat-controls">
                <button onClick={() => adjustPlayerStat(idx, "fouls", false)}>
                  <FaMinus />
                </button>
                <input
                  type="number"
                  min="0"
                  value={player.fouls[currentQuarter]}
                  onChange={(e) => updatePlayerStat(idx, "fouls", e.target.value)}
                />
                <button onClick={() => adjustPlayerStat(idx, "fouls", true)}>
                  <FaPlus />
                </button>
              </div>
            </div>
            
            <div className="stat-group">
              <label>Turnovers</label>
              <div className="stat-controls">
                <button onClick={() => adjustPlayerStat(idx, "turnovers", false)}>
                  <FaMinus />
                </button>
                <input
                  type="number"
                  min="0"
                  value={player.turnovers[currentQuarter]}
                  onChange={(e) => updatePlayerStat(idx, "turnovers", e.target.value)}
                />
                <button onClick={() => adjustPlayerStat(idx, "turnovers", true)}>
                  <FaPlus />
                </button>
              </div>
            </div>
            
            <div className="stat-group total-stats">
              <label>Total Points</label>
              <div className="total-display">
                {player.points.reduce((a, b) => a + b, 0)}
              </div>
            </div>
          </div>
        ) : (
          <div className="stats-grid volleyball-stats">
            {/* Volleyball stats in a clean grid layout without section headers */}
            {Object.entries(volleyballStatLabels).map(([stat, label]) => (
              <div className="stat-group" key={stat}>
                <label>{label}</label>
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
            
            {/* Hitting Percentage */}
            <div className="stat-group total-stats">
              <label>Hit%</label>
              <div className="total-display">
                {calculateHittingPercentage(player)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="admin-dashboard">
      <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="dashboard-header">
          <h1>Staff Statistics</h1>
          <p>Record player statistics and awards for matches</p>
        </div>

        <div className="dashboard-main">
          <div className="bracket-content">
            {/* Tabs */}
            <div className="bracket-tabs">
              <button
                className={`bracket-tab-button ${activeTab === "select" ? "bracket-tab-active" : ""}`}
                onClick={() => setActiveTab("select")}
              >
                Select Event
              </button>
              {selectedEvent && (
                <button
                  className={`bracket-tab-button ${activeTab === "games" ? "bracket-tab-active" : ""}`}
                  onClick={() => setActiveTab("games")}
                >
                  Manage Games ({games.length})
                </button>
              )}
              {selectedGame && (
                <button
                  className={`bracket-tab-button ${activeTab === "statistics" ? "bracket-tab-active" : ""}`}
                  onClick={() => setActiveTab("statistics")}
                >
                  Record Statistics
                </button>
              )}
            </div>

            {/* Select Event */}
            {activeTab === "select" && (
              <div className="bracket-view-section">
                <h2>All Events</h2>
                {loading ? (
                  <p>Loading events...</p>
                ) : error ? (
                  <p className="bracket-error">Error: {error}</p>
                ) : events.length === 0 ? (
                  <div className="bracket-no-brackets">
                    <p>No events available.</p>
                  </div>
                ) : (
                  <div className="bracket-grid">
                    {events.map((event) => (
                      <div className="bracket-card" key={event.id}>
                        <div className="bracket-card-header">
                          <h3>{event.name}</h3>
                          <span className={`bracket-sport-badge ${event.status === "ongoing" ? "bracket-sport-basketball" : "bracket-sport-volleyball"}`}>
                            {event.status}
                          </span>
                        </div>
                        <div className="bracket-card-info">
                          <div><strong>Start:</strong> {new Date(event.start_date).toLocaleDateString()}</div>
                          <div><strong>End:</strong> {new Date(event.end_date).toLocaleDateString()}</div>
                          <div><strong>Status:</strong> 
                            <span className={event.status === "ongoing" ? "status-ongoing" : "status-completed"}>
                              {event.status}
                            </span>
                          </div>
                        </div>
                        <div className="bracket-card-actions">
                          <button className="bracket-view-btn" onClick={() => handleEventSelect(event)}>
                            Manage Games
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
              <div className="bracket-view-section">
                <div className="event-details-header">
                  <h2>Games for {selectedEvent.name}</h2>
                  <div className="event-details-info">
                    <span><strong>Start:</strong> {new Date(selectedEvent.start_date).toLocaleDateString()}</span>
                    <span><strong>End:</strong> {new Date(selectedEvent.end_date).toLocaleDateString()}</span>
                    <span><strong>Status:</strong> {selectedEvent.status}</span>
                  </div>
                </div>
                
                {error && (
                  <div className="bracket-error">
                    {error}
                  </div>
                )}
                
                {loading ? (
                  <p>Loading games...</p>
                ) : games.length === 0 ? (
                  <div className="bracket-no-brackets">
                    <p>No games found for this event.</p>
                    <p>Make sure brackets have been created and matches have been generated.</p>
                  </div>
                ) : (
                  <div className="bracket-grid">
                    {games.map((game) => (
                      <div className="bracket-card" key={game.id}>
                        <div className="bracket-card-header">
                          <h3>
                            {game.team1_name || "Team 1"} vs {game.team2_name || "Team 2"}
                          </h3>
                          <span className={`bracket-sport-badge bracket-sport-${game.sport_type}`}>
                            {game.sport_type}
                          </span>
                        </div>
                        <div className="bracket-card-info">
                          <div><strong>Bracket:</strong> {game.bracket_name}</div>
                          <div><strong>Round:</strong> {game.round_number}</div>
                          <div><strong>Status:</strong> 
                            <span className={`status-${game.status}`}>
                              {game.status}
                            </span>
                          </div>
                          {game.status === "completed" && (
                            <div><strong>Score:</strong> {game.score_team1} - {game.score_team2}</div>
                          )}
                          {game.winner_name && (
                            <div><strong>Winner:</strong> {game.winner_name}</div>
                          )}
                        </div>
                        <div className="bracket-card-actions">
                          <button className="bracket-view-btn" onClick={() => handleGameSelect(game)}>
                            {game.status === "completed" ? "Edit Statistics" : "Record Statistics"}
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
              <div className="bracket-view-section">
                <div className="event-details-header">
                  <h2>
                    Recording Statistics: {selectedGame.team1_name} vs {selectedGame.team2_name}
                  </h2>
                  <div className="event-details-info">
                    <span><strong>Sport:</strong> {selectedGame.sport_type}</span>
                    <span><strong>Bracket:</strong> {selectedGame.bracket_name}</span>
                    <span><strong>Round:</strong> {selectedGame.round_number}</span>
                  </div>
                </div>

                {/* Awards Summary */}
                {matchAwards.length > 0 && (
                  <div className="match-awards-summary">
                    <h3><FaTrophy /> Match Awards ({matchAwards.length})</h3>
                    <div className="awards-list">
                      {matchAwards.map((award, idx) => (
                        <div key={idx} className="award-item">
                          <span className="award-type">{award.award_type}</span>
                          <span className="award-player">{award.player_name} ({award.team_name})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Period Navigation */}
                <div className="period-navigation">
                  <button
                    onClick={() => changePeriod("prev")}
                    disabled={currentQuarter === 0}
                    className="bracket-cancel-btn"
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
                    className="bracket-submit-btn"
                  >
                    <FaArrowRight />
                  </button>
                </div>

                {/* Team Scores */}
                <div className="team-scores-container">
                  <div className="team-score">
                    <h3>{selectedGame.team1_name}</h3>
                    <div className="score-display">
                      {teamScores.team1[currentQuarter]}
                    </div>
                    <div className="period-total">
                      Total: {teamScores.team1.reduce((a, b) => a + b, 0)}
                    </div>
                  </div>
                  <div className="score-separator">-</div>
                  <div className="team-score">
                    <h3>{selectedGame.team2_name}</h3>
                    <div className="score-display">
                      {teamScores.team2[currentQuarter]}
                    </div>
                    <div className="period-total">
                      Total: {teamScores.team2.reduce((a, b) => a + b, 0)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="bracket-form-actions">
                  <button className="bracket-cancel-btn" onClick={() => setActiveTab("games")}>
                    Back to Games
                  </button>
                  <div className="stats-action-buttons">
                    <button className="bracket-delete-btn" onClick={resetStatistics}>
                      <FaRedo /> Reset All
                    </button>
                    <button
                      className="bracket-submit-btn"
                      onClick={saveStatistics}
                      disabled={loading}
                    >
                      {loading ? "Saving..." : <><FaSave /> Save Statistics & Awards</>}
                    </button>
                  </div>
                </div>

                {/* Player Stats - FIXED: Two-column layout for all players */}
                {loading ? (
                  <p>Loading player data...</p>
                ) : (
                  <div className="teams-stats-container">
                    {/* Team 1 Column */}
                    <div className="team-column">
                      <h3 className="team-title">{selectedGame.team1_name}</h3>
                      <div className="players-container">
                        {playerStats
                          .filter(player => player.team_id === selectedGame.team1_id)
                          .map((player, playerIndex) => {
                            const globalIndex = playerStats.findIndex(
                              p => p.player_id === player.player_id
                            );
                            return (
                              <div
                                key={player.player_id}
                                className="bracket-card player-card"
                              >
                                <div className="bracket-card-header">
                                  <h4>{player.player_name}</h4>
                                  <div className="player-stats-summary">
                                    <span className="player-points">
                                      {selectedGame.sport_type === "basketball" 
                                        ? `Points: ${player.points ? player.points[currentQuarter] || 0 : 0}`
                                        : `Kills: ${player.kills ? player.kills[currentQuarter] || 0 : 0}`
                                      }
                                    </span>
                                    {selectedGame.sport_type === "volleyball" && (
                                      <span className="player-hitting-pct">
                                        Hit%: {calculateHittingPercentage(player)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="bracket-card-info">
                                  {renderStatInputs(player, globalIndex)}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Team 2 Column */}
                    <div className="team-column">
                      <h3 className="team-title">{selectedGame.team2_name}</h3>
                      <div className="players-container">
                        {playerStats
                          .filter(player => player.team_id === selectedGame.team2_id)
                          .map((player, playerIndex) => {
                            const globalIndex = playerStats.findIndex(
                              p => p.player_id === player.player_id
                            );
                            return (
                              <div
                                key={player.player_id}
                                className="bracket-card player-card"
                              >
                                <div className="bracket-card-header">
                                  <h4>{player.player_name}</h4>
                                  <div className="player-stats-summary">
                                    <span className="player-points">
                                      {selectedGame.sport_type === "basketball" 
                                        ? `Points: ${player.points ? player.points[currentQuarter] || 0 : 0}`
                                        : `Kills: ${player.kills ? player.kills[currentQuarter] || 0 : 0}`
                                      }
                                    </span>
                                    {selectedGame.sport_type === "volleyball" && (
                                      <span className="player-hitting-pct">
                                        Hit%: {calculateHittingPercentage(player)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="bracket-card-info">
                                  {renderStatInputs(player, globalIndex)}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffStats;