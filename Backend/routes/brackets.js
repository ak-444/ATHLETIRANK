const express = require("express");
const router = express.Router();
const db = require("../config/database");

// Import Fisher-Yates shuffle from utils
const fisherYatesShuffle = require("../utils/fisherYates");

// GET all brackets with team count
router.get("/", async (req, res) => {
  try {
    const [results] = await db.pool.query(`
      SELECT b.*, 
             COUNT(bt.team_id) as team_count
      FROM brackets b
      LEFT JOIN bracket_teams bt ON b.id = bt.bracket_id
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `);
    res.json(results);
  } catch (err) {
    console.error("Error fetching brackets:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET single bracket with teams
router.get("/:id", async (req, res) => {
  try {
    const [bracketRows] = await db.pool.query(
      "SELECT * FROM brackets WHERE id = ?", 
      [req.params.id]
    );

    if (bracketRows.length === 0) {
      return res.status(404).json({ message: "Bracket not found" });
    }

    const [teams] = await db.pool.query(
      `SELECT t.* 
       FROM bracket_teams bt 
       JOIN teams t ON bt.team_id = t.id 
       WHERE bt.bracket_id = ?`,
      [req.params.id]
    );

    res.json({ ...bracketRows[0], teams });
  } catch (err) {
    console.error("Error fetching bracket:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET matches for a bracket
router.get("/:id/matches", async (req, res) => {
  try {
    const [matches] = await db.pool.query(`
      SELECT m.*, 
        t1.name as team1_name, 
        t2.name as team2_name,
        t1.sport as sport,
        w.name as winner_name
      FROM matches m
      LEFT JOIN teams t1 ON m.team1_id = t1.id
      LEFT JOIN teams t2 ON m.team2_id = t2.id
      LEFT JOIN teams w ON m.winner_id = w.id
      WHERE m.bracket_id = ?
      ORDER BY m.bracket_type, m.round_number, m.id
    `, [req.params.id]);

    res.json(matches);
  } catch (err) {
    console.error("Error fetching matches:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// POST create bracket
router.post("/", async (req, res) => {
  const { event_id, name, sport_type, elimination_type } = req.body;
  
  if (!name || !sport_type || !elimination_type || !event_id) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const [result] = await db.pool.query(
      "INSERT INTO brackets (event_id, name, sport_type, elimination_type, created_at) VALUES (?, ?, ?, ?, NOW())",
      [event_id, name, sport_type, elimination_type]
    );

    res.status(201).json({
      id: result.insertId,
      event_id,
      name,
      sport_type,
      elimination_type,
      created_at: new Date()
    });
  } catch (err) {
    console.error("Error creating bracket:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// DELETE bracket and all related data
router.delete("/:id", async (req, res) => {
  try {
    // Delete in proper order to handle foreign key constraints
    await db.pool.query("DELETE FROM matches WHERE bracket_id = ?", [req.params.id]);
    await db.pool.query("DELETE FROM bracket_teams WHERE bracket_id = ?", [req.params.id]);
    await db.pool.query("DELETE FROM brackets WHERE id = ?", [req.params.id]);
    
    res.json({ success: true, message: "Bracket deleted successfully" });
  } catch (err) {
    console.error("Error deleting bracket:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// POST generate full bracket (all rounds with placeholders)
router.post("/:id/generate", async (req, res) => {
  const bracketId = req.params.id;

  try {
    // Clear existing matches
    await db.pool.query("DELETE FROM matches WHERE bracket_id = ?", [bracketId]);

    // Fetch bracket info including elimination type
    const [bracketInfo] = await db.pool.query(
      "SELECT elimination_type FROM brackets WHERE id = ?",
      [bracketId]
    );
    
    if (bracketInfo.length === 0) {
      return res.status(404).json({ error: "Bracket not found" });
    }
    
    const eliminationType = bracketInfo[0].elimination_type;

    // Fetch teams in this bracket
    const [teams] = await db.pool.query(
      `SELECT t.id, t.name, t.sport
       FROM bracket_teams bt
       JOIN teams t ON bt.team_id = t.id
       WHERE bt.bracket_id = ?`,
      [bracketId]
    );

    if (teams.length < 2) {
      return res.status(400).json({ error: "At least 2 teams are required to generate matches" });
    }

    // Shuffle teams
    const shuffledTeams = fisherYatesShuffle(teams);

    // Pad teams to next power of 2 (for complete bracket structure)
    const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(shuffledTeams.length)));
    while (shuffledTeams.length < nextPowerOfTwo) {
      shuffledTeams.push(null); // BYE slot
    }

    const totalRounds = Math.log2(nextPowerOfTwo);
    const allMatches = [];

    if (eliminationType === "single") {
      // Single elimination logic (existing code)
      let currentRoundTeams = shuffledTeams;

      for (let round = 1; round <= totalRounds; round++) {
        const nextRoundTeams = [];

        for (let i = 0; i < currentRoundTeams.length; i += 2) {
          const team1 = currentRoundTeams[i];
          const team2 = currentRoundTeams[i + 1];

          let matchData = {
            bracket_id: bracketId,
            round_number: round,
            bracket_type: 'winner',
            team1_id: team1 ? team1.id : null,
            team2_id: team2 ? team2.id : null,
            winner_id: null,
            status: "scheduled"
          };

          // If BYE → auto advance
          if (team1 && !team2) {
            matchData.winner_id = team1.id;
            matchData.status = "completed";
            nextRoundTeams.push(team1);
          } else if (team2 && !team1) {
            matchData.winner_id = team2.id;
            matchData.status = "completed";
            nextRoundTeams.push(team2);
          } else {
            nextRoundTeams.push({ placeholder: true }); // advance slot for winner
          }

          const [result] = await db.pool.query(
            `INSERT INTO matches (bracket_id, round_number, bracket_type, team1_id, team2_id, winner_id, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              matchData.bracket_id,
              matchData.round_number,
              matchData.bracket_type,
              matchData.team1_id,
              matchData.team2_id,
              matchData.winner_id,
              matchData.status
            ]
          );

          allMatches.push({
            id: result.insertId,
            ...matchData
          });
        }

        currentRoundTeams = nextRoundTeams;
      }
    } else if (eliminationType === "double") {
      // Enhanced double elimination logic
      let currentRoundTeams = shuffledTeams;
      const winnerBracketMatchesByRound = [];

      // Generate winner's bracket (same as single elimination)
      for (let round = 1; round <= totalRounds; round++) {
        const nextRoundTeams = [];
        const roundMatches = [];

        for (let i = 0; i < currentRoundTeams.length; i += 2) {
          const team1 = currentRoundTeams[i];
          const team2 = currentRoundTeams[i + 1];

          let matchData = {
            bracket_id: bracketId,
            round_number: round,
            bracket_type: 'winner',
            team1_id: team1 ? team1.id : null,
            team2_id: team2 ? team2.id : null,
            winner_id: null,
            status: "scheduled"
          };

          // If BYE → auto advance
          if (team1 && !team2) {
            matchData.winner_id = team1.id;
            matchData.status = "completed";
            nextRoundTeams.push(team1);
          } else if (team2 && !team1) {
            matchData.winner_id = team2.id;
            matchData.status = "completed";
            nextRoundTeams.push(team2);
          } else {
            nextRoundTeams.push({ placeholder: true });
          }

          const [result] = await db.pool.query(
            `INSERT INTO matches (bracket_id, round_number, bracket_type, team1_id, team2_id, winner_id, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              matchData.bracket_id,
              matchData.round_number,
              matchData.bracket_type,
              matchData.team1_id,
              matchData.team2_id,
              matchData.winner_id,
              matchData.status
            ]
          );

          const matchWithId = {
            id: result.insertId,
            ...matchData
          };
          
          roundMatches.push(matchWithId);
          allMatches.push(matchWithId);
        }

        winnerBracketMatchesByRound.push(roundMatches);
        currentRoundTeams = nextRoundTeams;
      }

      // Generate loser's bracket with proper connections
      // Loser's bracket has rounds that correspond to winner's bracket rounds
      const loserBracketRounds = 2 * totalRounds - 1;
      const loserBracketMatchesByRound = [];
      
      for (let round = 1; round <= loserBracketRounds; round++) {
        const roundMatches = [];
        let matchesCount = 0;
        
        // Determine number of matches based on round
        if (round === 1) {
          matchesCount = Math.pow(2, totalRounds - 2); // First round of loser's bracket
        } else if (round < totalRounds) {
          matchesCount = Math.pow(2, totalRounds - round - 1);
        } else {
          matchesCount = 1; // Later rounds
        }
        
        for (let i = 0; i < matchesCount; i++) {
          const matchData = {
            bracket_id: bracketId,
            round_number: round,
            bracket_type: 'loser',
            team1_id: null,
            team2_id: null,
            winner_id: null,
            status: "scheduled"
          };
          
          const [result] = await db.pool.query(
            `INSERT INTO matches (bracket_id, round_number, bracket_type, team1_id, team2_id, winner_id, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              matchData.bracket_id,
              matchData.round_number,
              matchData.bracket_type,
              matchData.team1_id,
              matchData.team2_id,
              matchData.winner_id,
              matchData.status
            ]
          );
          
          const matchWithId = {
            id: result.insertId,
            ...matchData
          };
          
          roundMatches.push(matchWithId);
          allMatches.push(matchWithId);
        }
        
        loserBracketMatchesByRound.push(roundMatches);
      }
      
      // Create championship match
      const championshipMatch = {
        bracket_id: bracketId,
        round_number: 1,
        bracket_type: 'championship',
        team1_id: null, // Winner of winner's bracket
        team2_id: null, // Winner of loser's bracket
        winner_id: null,
        status: "scheduled"
      };
      
      const [champResult] = await db.pool.query(
        `INSERT INTO matches (bracket_id, round_number, bracket_type, team1_id, team2_id, winner_id, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          championshipMatch.bracket_id,
          championshipMatch.round_number,
          championshipMatch.bracket_type,
          championshipMatch.team1_id,
          championshipMatch.team2_id,
          championshipMatch.winner_id,
          championshipMatch.status
        ]
      );
      
      championshipMatch.id = champResult.insertId;
      allMatches.push(championshipMatch);
    }

    res.json({
      success: true,
      message: `Generated ${allMatches.length} matches`,
      matches: allMatches,
      elimination_type: eliminationType
    });

  } catch (err) {
    console.error("Error generating full bracket:", err);
    res.status(500).json({ error: "Database error: " + err.message });
  }
});

// POST complete a match and handle bracket progression - ENHANCED FOR DOUBLE ELIMINATION
router.post("/matches/:id/complete", async (req, res) => {
  const matchId = req.params.id;
  const { winner_id, scores } = req.body;

  try {
    // Get match details
    const [matches] = await db.pool.query(
      "SELECT * FROM matches WHERE id = ?",
      [matchId]
    );
    
    if (matches.length === 0) {
      return res.status(404).json({ error: "Match not found" });
    }
    
    const match = matches[0];
    
    // Update match with winner and scores
    await db.pool.query(
      "UPDATE matches SET winner_id = ?, status = 'completed', score_team1 = ?, score_team2 = ? WHERE id = ?",
      [winner_id, scores.team1, scores.team2, matchId]
    );
    
    // Get bracket elimination type
    const [bracketInfo] = await db.pool.query(
      "SELECT elimination_type FROM brackets WHERE id = ?",
      [match.bracket_id]
    );
    
    if (bracketInfo.length === 0) {
      return res.status(404).json({ error: "Bracket not found" });
    }
    
    const eliminationType = bracketInfo[0].elimination_type;
    const loser_id = winner_id === match.team1_id ? match.team2_id : match.team1_id;
    
    let loserAdvanced = false;
    
    // Handle bracket progression based on elimination type
    if (eliminationType === "single") {
      // Single elimination - advance winner to next round
      const [nextMatches] = await db.pool.query(
        `SELECT * FROM matches 
         WHERE bracket_id = ? AND bracket_type = 'winner' 
         AND round_number = ? 
         AND (team1_id IS NULL OR team2_id IS NULL)
         ORDER BY id
         LIMIT 1`,
        [match.bracket_id, match.round_number + 1]
      );
      
      if (nextMatches.length > 0) {
        const nextMatch = nextMatches[0];
        const updateField = nextMatch.team1_id === null ? 'team1_id' : 'team2_id';
        
        await db.pool.query(
          `UPDATE matches SET ${updateField} = ? WHERE id = ?`,
          [winner_id, nextMatch.id]
        );
      }
    } else if (eliminationType === "double") {
      // Enhanced double elimination logic
      if (match.bracket_type === 'winner') {
        // Winner advances in winner's bracket
        const [nextWinnerMatches] = await db.pool.query(
          `SELECT * FROM matches 
           WHERE bracket_id = ? AND bracket_type = 'winner' 
           AND round_number = ? 
           AND (team1_id IS NULL OR team2_id IS NULL)
           ORDER BY id
           LIMIT 1`,
          [match.bracket_id, match.round_number + 1]
        );
        
        if (nextWinnerMatches.length > 0) {
          const nextMatch = nextWinnerMatches[0];
          const updateField = nextMatch.team1_id === null ? 'team1_id' : 'team2_id';
          
          await db.pool.query(
            `UPDATE matches SET ${updateField} = ? WHERE id = ?`,
            [winner_id, nextMatch.id]
          );
        } else {
          // Winner of winner's bracket final goes to championship
          const [championshipMatches] = await db.pool.query(
            `SELECT * FROM matches 
             WHERE bracket_id = ? AND bracket_type = 'championship'
             AND team1_id IS NULL`,
            [match.bracket_id]
          );
          
          if (championshipMatches.length > 0) {
            await db.pool.query(
              "UPDATE matches SET team1_id = ? WHERE id = ?",
              [winner_id, championshipMatches[0].id]
            );
          }
        }
        
        // Loser goes to loser's bracket - FIXED TYPO HERE
        if (loser_id) {
          // Calculate which loser's bracket round this team should go to
          // For double elimination, teams drop from winner's bracket round N 
          // to loser's bracket at specific positions based on bracket structure
          
          // Simple mapping: winner's bracket round 1 losers go to loser's bracket round 1
          // winner's bracket round 2 losers go to loser's bracket round 2, etc.
          const loserBracketRound = match.round_number; // FIXED: was "loserBasketRound"
          
          // Find the appropriate loser's bracket match
          const [loserBracketMatches] = await db.pool.query(
            `SELECT * FROM matches 
             WHERE bracket_id = ? AND bracket_type = 'loser' 
             AND round_number = ? 
             AND (team1_id IS NULL OR team2_id IS NULL)
             ORDER BY id
             LIMIT 1`,
            [match.bracket_id, loserBracketRound]
          );
          
          if (loserBracketMatches.length > 0) {
            const loserMatch = loserBracketMatches[0];
            const updateField = loserMatch.team1_id === null ? 'team1_id' : 'team2_id';
            
            await db.pool.query(
              `UPDATE matches SET ${updateField} = ? WHERE id = ?`,
              [loser_id, loserMatch.id]
            );
            loserAdvanced = true;
          }
        }
      } else if (match.bracket_type === 'loser') {
        // Winner advances in loser's bracket
        const nextLoserRound = match.round_number + 1;
        
        // Check if this is the final of the loser's bracket
        const [teamCountResult] = await db.pool.query(
          `SELECT COUNT(*) as count FROM bracket_teams WHERE bracket_id = ?`,
          [match.bracket_id]
        );
        
        const totalTeams = teamCountResult[0].count;
        const maxLoserRounds = 2 * Math.ceil(Math.log2(totalTeams)) - 1;
        
        if (match.round_number < maxLoserRounds) {
          // Continue in loser's bracket
          const [nextLoserMatches] = await db.pool.query(
            `SELECT * FROM matches 
             WHERE bracket_id = ? AND bracket_type = 'loser' 
             AND round_number = ? 
             AND (team1_id IS NULL OR team2_id IS NULL)
             ORDER BY id
             LIMIT 1`,
            [match.bracket_id, nextLoserRound]
          );
          
          if (nextLoserMatches.length > 0) {
            const nextMatch = nextLoserMatches[0];
            const updateField = nextMatch.team1_id === null ? 'team1_id' : 'team2_id';
            
            await db.pool.query(
              `UPDATE matches SET ${updateField} = ? WHERE id = ?`,
              [winner_id, nextMatch.id]
            );
          }
        } else {
          // Winner of the loser's bracket final goes to championship
          const [championshipMatches] = await db.pool.query(
            `SELECT * FROM matches 
             WHERE bracket_id = ? AND bracket_type = 'championship'
             AND team2_id IS NULL`,
            [match.bracket_id]
          );
          
          if (championshipMatches.length > 0) {
            await db.pool.query(
              "UPDATE matches SET team2_id = ? WHERE id = ?",
              [winner_id, championshipMatches[0].id]
            );
          }
        }
        
        // Loser in loser's bracket is eliminated (no further action needed)
      } else if (match.bracket_type === 'championship') {
        // Championship match - update the bracket winner
        await db.pool.query(
          "UPDATE brackets SET winner_team_id = ? WHERE id = ?",
          [winner_id, match.bracket_id]
        );
      }
    }
    
    res.json({ 
      success: true, 
      message: "Match updated successfully",
      advanced: true,
      winnerId: winner_id,
      loserId: loser_id,
      loserAdvanced: loserAdvanced
    });
  } catch (err) {
    console.error("Error completing match:", err);
    res.status(500).json({ error: "Database error: " + err.message });
  }
});

module.exports = router;