import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaMinus,
  FaRedo,
  FaSave,
  FaArrowLeft,
  FaArrowRight,
  FaChevronDown,
  FaChevronUp
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
  const [teamScores, setTeamScores] = useState({
    team1: [0, 0, 0, 0],
    team2: [0, 0, 0, 0],
  });
  const [currentQuarter, setCurrentQuarter] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRounds, setExpandedRounds] = useState(new Set([1])); // First round expanded by default

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

  // Calculate team scores from player stats
  const calculateTeamScores = (stats, team1Id, team2Id, sportType) => {
    const team1Scores = sportType === "basketball" 
      ? [0, 0, 0, 0] 
      : [0, 0, 0, 0, 0];
    const team2Scores = sportType === "basketball" 
      ? [0, 0, 0, 0] 
      : [0, 0, 0, 0, 0];

    stats.forEach(player => {
      const scoringStat = sportType === "basketball" ? "points" : "kills";
      const playerTeamId = player.team_id;
      
      if (playerTeamId === team1Id) {
        for (let i = 0; i < team1Scores.length; i++) {
          team1Scores[i] += player[scoringStat][i] || 0;
        }
      } else if (playerTeamId === team2Id) {
        for (let i = 0; i < team2Scores.length; i++) {
          team2Scores[i] += player[scoringStat][i] || 0;
        }
      }
    });

    return { team1: team1Scores, team2: team2Scores };
  };

  // Group games by round and bracket
  const groupGamesByRound = (games) => {
    const grouped = {};
    
    games.forEach(game => {
      let roundKey;
      
      // Handle championship matches specially
      if (game.bracket_type === 'championship') {
        roundKey = 'Championship';
      } else {
        roundKey = `Round ${game.round_number}`;
      }
      
      if (!grouped[roundKey]) {
        grouped[roundKey] = {};
      }
      
      const bracketKey = game.bracket_name;
      if (!grouped[roundKey][bracketKey]) {
        grouped[roundKey][bracketKey] = [];
      }
      
      grouped[roundKey][bracketKey].push(game);
    });

    return grouped;
  };

  // Toggle round expansion
  const toggleRoundExpansion = (roundNumber) => {
    const newExpandedRounds = new Set(expandedRounds);
    if (newExpandedRounds.has(roundNumber)) {
      newExpandedRounds.delete(roundNumber);
    } else {
      newExpandedRounds.add(roundNumber);
    }
    setExpandedRounds(newExpandedRounds);
  };

  // Handle event selection
  const handleEventSelect = async (event) => {
    console.log("Selected event:", event);
    setSelectedEvent(event);
    setSelectedGame(null);
    setPlayerStats([]);
    setTeamScores({ team1: [0, 0, 0, 0], team2: [0, 0, 0, 0] });
    setCurrentQuarter(0);
    setExpandedRounds(new Set([1])); // Reset to show first round
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
          bracket_id: bracket.id,
          elimination_type: bracket.elimination_type
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

      // Sort matches by round number
      allMatches.sort((a, b) => a.round_number - b.round_number);
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

  // Initialize player stats
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

      const initialStats = [
        ...team1Players.map((p) => ({
          player_id: p.id,
          player_name: p.name,
          jersey_number: p.jersey_number || p.jerseyNumber || "N/A",
          team_id: game.team1_id,
          team_name: teams.find((t) => t.id === game.team1_id)?.name,
          ...JSON.parse(JSON.stringify(template)),
        })),
        ...team2Players.map((p) => ({
          player_id: p.id,
          player_name: p.name,
          jersey_number: p.jersey_number || p.jerseyNumber || "N/A",
          team_id: game.team2_id,
          team_name: teams.find((t) => t.id === game.team2_id)?.name,
          ...JSON.parse(JSON.stringify(template)),
        })),
      ];
      
      setPlayerStats(initialStats);

      // Calculate initial team scores
      const scores = calculateTeamScores(initialStats, game.team1_id, game.team2_id, game.sport_type);
      setTeamScores(scores);

      // Load existing stats
      try {
        const resStats = await fetch(`http://localhost:5000/api/stats/matches/${game.id}/stats`);
        const existingStats = await resStats.json();
        
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
          
          // Recalculate team scores with loaded stats
          const loadedScores = calculateTeamScores(merged, game.team1_id, game.team2_id, game.sport_type);
          setTeamScores(loadedScores);
        }
        
      } catch (statsErr) {
        console.log("No existing stats found or error loading:", statsErr);
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
    setPlayerStats(newStats);

    // Recalculate team scores from all player stats
    if ((statName === "points" || statName === "kills") && selectedGame) {
      const scores = calculateTeamScores(newStats, selectedGame.team1_id, selectedGame.team2_id, selectedGame.sport_type);
      setTeamScores(scores);
    }
  };

  // Adjust player stat
  const adjustPlayerStat = (playerIndex, statName, increment) => {
    const newStats = [...playerStats];
    const currentValue = newStats[playerIndex][statName][currentQuarter] || 0;
    const newValue = Math.max(0, currentValue + (increment ? 1 : -1));
    newStats[playerIndex][statName][currentQuarter] = newValue;
    setPlayerStats(newStats);

    // Recalculate team scores from all player stats
    if ((statName === "points" || statName === "kills") && selectedGame) {
      const scores = calculateTeamScores(newStats, selectedGame.team1_id, selectedGame.team2_id, selectedGame.sport_type);
      setTeamScores(scores);
    }
  };

  // Calculate hitting percentage for volleyball
  const calculateHittingPercentage = (player) => {
    const kills = player.kills ? player.kills.reduce((a, b) => a + b, 0) : 0;
    const attempts = player.attack_attempts ? player.attack_attempts.reduce((a, b) => a + b, 0) : 0;
    const errors = player.attack_errors ? player.attack_errors.reduce((a, b) => a + b, 0) : 0;
    
    if (attempts === 0) return "0.00%";
    return (((kills - errors) / attempts) * 100).toFixed(2) + "%";
  };

  // Save statistics - UPDATED FOR DOUBLE ELIMINATION
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
            // Add bracket type for double elimination handling
            bracket_type: selectedGame.bracket_type,
            elimination_type: selectedGame.elimination_type
          }),
        }
      );
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Show success message with advancement info
      let message = "Statistics saved successfully!";
      
      // Enhanced messaging for double elimination
      if (data.advanced) {
        if (selectedGame.elimination_type === 'double') {
          if (selectedGame.bracket_type === 'winner') {
            message += " Winner has been advanced in the winner's bracket!";
            if (data.loserAdvanced) {
              message += " Loser has been moved to the loser's bracket.";
            }
          } else if (selectedGame.bracket_type === 'loser') {
            message += " Winner has been advanced in the loser's bracket!";
            message += " Loser has been eliminated from the tournament.";
          } else if (selectedGame.bracket_type === 'championship') {
            message += " Championship match completed!";
          }
        } else {
          message += " Winner has been advanced to the next round!";
        }
      }
      
      if (data.winnerId) {
        const winnerTeam = data.winnerId === selectedGame.team1_id ? 
          selectedGame.team1_name : selectedGame.team2_name;
        message += ` Winner: ${winnerTeam}`;
        
        // For championship matches in double elimination
        if (selectedGame.bracket_type === 'championship' && selectedGame.elimination_type === 'double') {
          message += ` is the tournament champion!`;
        }
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
        {/* Stats Section */}
        {sport === "basketball" ? (
          <div className="stats-grid basketball-stats">
            {/* Row 1 */}
            <div className="stat-group">
              <label>Points</label>
              <div className="stat-controls">
                <button 
                  className="stat-button stat-button-minus"
                  onClick={() => adjustPlayerStat(idx, "points", false)}
                >
                  <FaMinus />
                </button>
                <input
                  type="number"
                  min="0"
                  className="stat-input"
                  value={player.points[currentQuarter]}
                  onChange={(e) => updatePlayerStat(idx, "points", e.target.value)}
                />
                <button 
                  className="stat-button stat-button-plus"
                  onClick={() => adjustPlayerStat(idx, "points", true)}
                >
                  <FaPlus />
                </button>
              </div>
            </div>
            
            <div className="stat-group">
              <label>Assists</label>
              <div className="stat-controls">
                <button 
                  className="stat-button stat-button-minus"
                  onClick={() => adjustPlayerStat(idx, "assists", false)}
                >
                  <FaMinus />
                </button>
                <input
                  type="number"
                  min="0"
                  className="stat-input"
                  value={player.assists[currentQuarter]}
                  onChange={(e) => updatePlayerStat(idx, "assists", e.target.value)}
                />
                <button 
                  className="stat-button stat-button-plus"
                  onClick={() => adjustPlayerStat(idx, "assists", true)}
                >
                  <FaPlus />
                </button>
              </div>
            </div>
            
            <div className="stat-group">
              <label>Rebounds</label>
              <div className="stat-controls">
                <button 
                  className="stat-button stat-button-minus"
                  onClick={() => adjustPlayerStat(idx, "rebounds", false)}
                >
                  <FaMinus />
                </button>
                <input
                  type="number"
                  min="0"
                  className="stat-input"
                  value={player.rebounds[currentQuarter]}
                  onChange={(e) => updatePlayerStat(idx, "rebounds", e.target.value)}
                />
                <button 
                  className="stat-button stat-button-plus"
                  onClick={() => adjustPlayerStat(idx, "rebounds", true)}
                >
                  <FaPlus />
                </button>
              </div>
            </div>
            
            {/* Row 2 */}
            <div className="stat-group">
              <label>3-Pointers</label>
              <div className="stat-controls">
                <button 
                  className="stat-button stat-button-minus"
                  onClick={() => adjustPlayerStat(idx, "three_points_made", false)}
                >
                  <FaMinus />
                </button>
                <input
                  type="number"
                  min="0"
                  className="stat-input"
                  value={player.three_points_made[currentQuarter]}
                  onChange={(e) => updatePlayerStat(idx, "three_points_made", e.target.value)}
                />
                <button 
                  className="stat-button stat-button-plus"
                  onClick={() => adjustPlayerStat(idx, "three_points_made", true)}
                >
                  <FaPlus />
                </button>
              </div>
            </div>
            
            <div className="stat-group">
              <label>Steals</label>
              <div className="stat-controls">
                <button 
                  className="stat-button stat-button-minus"
                  onClick={() => adjustPlayerStat(idx, "steals", false)}
                >
                  <FaMinus />
                </button>
                <input
                  type="number"
                  min="0"
                  className="stat-input"
                  value={player.steals[currentQuarter]}
                  onChange={(e) => updatePlayerStat(idx, "steals", e.target.value)}
                />
                <button 
                  className="stat-button stat-button-plus"
                  onClick={() => adjustPlayerStat(idx, "steals", true)}
                >
                  <FaPlus />
                </button>
              </div>
            </div>
            
            <div className="stat-group">
              <label>Blocks</label>
              <div className="stat-controls">
                <button 
                  className="stat-button stat-button-minus"
                  onClick={() => adjustPlayerStat(idx, "blocks", false)}
                >
                  <FaMinus />
                </button>
                <input
                  type="number"
                  min="0"
                  className="stat-input"
                  value={player.blocks[currentQuarter]}
                  onChange={(e) => updatePlayerStat(idx, "blocks", e.target.value)}
                />
                <button 
                  className="stat-button stat-button-plus"
                  onClick={() => adjustPlayerStat(idx, "blocks", true)}
                >
                  <FaPlus />
                </button>
              </div>
            </div>
            
            {/* Row 3 */}
            <div className="stat-group">
              <label>Fouls</label>
              <div className="stat-controls">
                <button 
                  className="stat-button stat-button-minus"
                  onClick={() => adjustPlayerStat(idx, "fouls", false)}
                >
                  <FaMinus />
                </button>
                <input
                  type="number"
                  min="0"
                  className="stat-input"
                  value={player.fouls[currentQuarter]}
                  onChange={(e) => updatePlayerStat(idx, "fouls", e.target.value)}
                />
                <button 
                  className="stat-button stat-button-plus"
                  onClick={() => adjustPlayerStat(idx, "fouls", true)}
                >
                  <FaPlus />
                </button>
              </div>
            </div>
            
            <div className="stat-group">
              <label>Turnovers</label>
              <div className="stat-controls">
                <button 
                  className="stat-button stat-button-minus"
                  onClick={() => adjustPlayerStat(idx, "turnovers", false)}
                >
                  <FaMinus />
                </button>
                <input
                  type="number"
                  min="0"
                  className="stat-input"
                  value={player.turnovers[currentQuarter]}
                  onChange={(e) => updatePlayerStat(idx, "turnovers", e.target.value)}
                />
                <button 
                  className="stat-button stat-button-plus"
                  onClick={() => adjustPlayerStat(idx, "turnovers", true)}
                >
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
            {/* Volleyball stats in a clean grid layout */}
            {Object.entries(volleyballStatLabels).map(([stat, label]) => (
              <div className="stat-group" key={stat}>
                <label>{label}</label>
                <div className="stat-controls">
                  <button 
                    className="stat-button stat-button-minus"
                    onClick={() => adjustPlayerStat(idx, stat, false)}
                  >
                    <FaMinus />
                  </button>
                  <input
                    type="number"
                    min="0"
                    className="stat-input"
                    value={player[stat][currentQuarter]}
                    onChange={(e) => updatePlayerStat(idx, stat, e.target.value)}
                  />
                  <button 
                    className="stat-button stat-button-plus"
                    onClick={() => adjustPlayerStat(idx, stat, true)}
                  >
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
          <p>Record player statistics for matches</p>
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

            {/* Manage Games - UPDATED WITH ROUND ORGANIZATION */}
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
                  <div className="rounds-container">
                    {Object.entries(groupGamesByRound(games))
                      .sort(([a], [b]) => {
                        const aNum = parseInt(a.split(' ')[1]);
                        const bNum = parseInt(b.split(' ')[1]);
                        return aNum - bNum;
                      })
                      .map(([roundName, brackets]) => {
                        const roundNumber = roundName === "Championship" ? 999 : parseInt(roundName.split(' ')[1]);
                        const isExpanded = expandedRounds.has(roundNumber) || roundName === "Championship";
                        const roundGames = Object.values(brackets).flat();
                        const completedGames = roundGames.filter(g => g.status === 'completed').length;
                        const totalGames = roundGames.length;
                        
                        return (
                          <div key={roundName} className="round-section">
                            <div 
                              className="round-header"
                              onClick={() => toggleRoundExpansion(roundNumber)}
                            >
                              <div className="round-header-content">
                                <h3>{roundName}</h3>
                                <div className="round-info">
                                  <span className="round-progress">
                                    {completedGames}/{totalGames} matches completed
                                  </span>
                                  <div className="round-progress-bar">
                                    <div 
                                      className="round-progress-fill"
                                      style={{ width: `${totalGames > 0 ? (completedGames / totalGames) * 100 : 0}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                              <button className="round-toggle-btn">
                                {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                              </button>
                            </div>
                            
                            {isExpanded && (
                              <div className="round-content">
                                {Object.entries(brackets).map(([bracketName, bracketGames]) => (
                                  <div key={bracketName} className="bracket-section">
                                    <h4 className="bracket-section-title">{bracketName}</h4>
                                    <div className="bracket-grid">
                                      {bracketGames.map((game) => (
                                        <div className="bracket-card" key={game.id}>
                                          <div className="bracket-card-header">
                                            <h3>
                                              {game.team1_name || "Team 1"} vs {game.team2_name || "Team 2"}
                                            </h3>
                                            <span className={`bracket-sport-badge bracket-sport-${game.sport_type}`}>
                                              {game.sport_type}
                                            </span>
                                            {game.elimination_type === 'double' && (
                                              <span className={`bracket-type-badge bracket-type-${game.bracket_type || 'winner'}`}>
                                                {game.bracket_type ? game.bracket_type.charAt(0).toUpperCase() + game.bracket_type.slice(1) : 'Winner'} Bracket
                                              </span>
                                            )}
                                          </div>
                                          <div className="bracket-card-info">
                                            <div><strong>Type:</strong> 
                                              <span className={`elimination-type-${game.elimination_type}`}>
                                                {game.elimination_type === 'double' ? 'Double Elimination' : 'Single Elimination'}
                                              </span>
                                            </div>
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
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
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
                    {selectedGame.elimination_type === 'double' && (
                      <span><strong>Bracket Type:</strong> 
                        <span className={`bracket-type-${selectedGame.bracket_type || 'winner'}`}>
                          {selectedGame.bracket_type ? selectedGame.bracket_type.charAt(0).toUpperCase() + selectedGame.bracket_type.slice(1) : 'Winner'} Bracket
                        </span>
                      </span>
                    )}
                  </div>
                </div>

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
                      {loading ? "Saving..." : <><FaSave /> Save Statistics</>}
                    </button>
                  </div>
                </div>

                {/* Player Stats */}
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
                                  <span className="player-jersey">#{player.jersey_number}</span>
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
                                  <span className="player-jersey">#{player.jersey_number}</span>
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