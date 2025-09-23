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
             COUNT(bt.team_id) as team_count,
             t.name as winner_team_name
      FROM brackets b
      LEFT JOIN bracket_teams bt ON b.id = bt.bracket_id
      LEFT JOIN teams t ON b.winner_team_id = t.id
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
      `SELECT b.*, t.name as winner_team_name 
       FROM brackets b
       LEFT JOIN teams t ON b.winner_team_id = t.id
       WHERE b.id = ?`, 
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
      ORDER BY m.bracket_type, m.round_number, m.match_order
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

// POST generate full bracket (all rounds with placeholders) - FIXED DOUBLE ELIMINATION
router.post("/:id/generate", async (req, res) => {
  const bracketId = req.params.id;

  try {
    // Clear existing matches and reset bracket winner
    await db.pool.query("DELETE FROM matches WHERE bracket_id = ?", [bracketId]);
    await db.pool.query("UPDATE brackets SET winner_team_id = NULL WHERE id = ?", [bracketId]);

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
    const allMatches = [];

    if (eliminationType === "single") {
      // Single elimination logic (existing code)
      // Pad teams to next power of 2 (for complete bracket structure)
      const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(shuffledTeams.length)));
      while (shuffledTeams.length < nextPowerOfTwo) {
        shuffledTeams.push(null); // BYE slot
      }

      const totalRounds = Math.log2(nextPowerOfTwo);
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
            status: "scheduled",
            match_order: Math.floor(i / 2)
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
            `INSERT INTO matches (bracket_id, round_number, bracket_type, team1_id, team2_id, winner_id, status, match_order) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              matchData.bracket_id,
              matchData.round_number,
              matchData.bracket_type,
              matchData.team1_id,
              matchData.team2_id,
              matchData.winner_id,
              matchData.status,
              matchData.match_order
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
      // COMPREHENSIVE Double elimination bracket generation - handles 3-9+ teams
      const totalTeams = shuffledTeams.filter(t => t !== null).length;
      
      // Pad to next power of 2 for bracket structure
      const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(totalTeams)));
      while (shuffledTeams.length < nextPowerOfTwo) {
        shuffledTeams.push(null); // BYE slots
      }
      
      // Calculate winner's bracket rounds
      const winnerBracketRounds = Math.log2(nextPowerOfTwo);
      
      // WINNER'S BRACKET GENERATION
      let currentRoundTeams = shuffledTeams;
      
      for (let round = 1; round <= winnerBracketRounds; round++) {
        const matchCount = Math.floor(currentRoundTeams.length / 2);
        const nextRoundTeams = [];
        
        for (let i = 0; i < matchCount; i++) {
          const team1 = currentRoundTeams[i * 2];
          const team2 = currentRoundTeams[i * 2 + 1];
          
          const matchData = {
            bracket_id: bracketId,
            round_number: round, // Winner's bracket uses rounds 1, 2, 3, etc.
            bracket_type: 'winner',
            team1_id: team1 ? team1.id : null,
            team2_id: team2 ? team2.id : null,
            winner_id: null,
            status: "scheduled",
            match_order: i
          };
          
          // Handle BYE situations
          if (team1 && !team2) {
            matchData.winner_id = team1.id;
            matchData.status = "completed";
            nextRoundTeams.push(team1);
          } else if (team2 && !team1) {
            matchData.winner_id = team2.id;
            matchData.status = "completed";
            nextRoundTeams.push(team2);
          } else if (team1 && team2) {
            nextRoundTeams.push({ placeholder: true, round: round, match: i });
          }
          
          const [result] = await db.pool.query(
            `INSERT INTO matches (bracket_id, round_number, bracket_type, team1_id, team2_id, winner_id, status, match_order) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [matchData.bracket_id, matchData.round_number, matchData.bracket_type,
             matchData.team1_id, matchData.team2_id, matchData.winner_id,
             matchData.status, matchData.match_order]
          );
          
          matchData.id = result.insertId;
          allMatches.push(matchData);
        }
        
        currentRoundTeams = nextRoundTeams;
        
        // Stop when we have the winner's bracket champion
        if (nextRoundTeams.length <= 1) {
          break;
        }
      }
      
      // LOSER'S BRACKET GENERATION - FIXED VERSION
      // Create loser's bracket matches using a different round numbering system
      // LB rounds will be: 101, 102, 103, etc. (or use a separate field)
      
      // For 3-9 teams, calculate proper loser's bracket structure
      let loserRounds;
      if (totalTeams <= 2) {
        loserRounds = 0; // No loser's bracket needed
      } else if (totalTeams <= 4) {
        loserRounds = 2; // LB Round 1 + LB Final
      } else if (totalTeams <= 8) {
        loserRounds = 5; // More complex structure
      } else {
        loserRounds = 2 * (winnerBracketRounds - 1) + 1;
      }
      
      // Create initial loser's bracket matches (empty placeholders)
      for (let lbRound = 1; lbRound <= loserRounds; lbRound++) {
        let matchCount;
        
        // Calculate matches per loser's bracket round
        if (lbRound === 1) {
          // First LB round gets losers from first WB round
          matchCount = Math.max(1, Math.floor(totalTeams / 4));
        } else if (lbRound === loserRounds) {
          // LB Final - always 1 match
          matchCount = 1;
        } else {
          // Intermediate rounds - calculate based on remaining teams
          matchCount = Math.max(1, Math.floor(Math.pow(2, Math.max(0, winnerBracketRounds - Math.ceil(lbRound / 2)))));
        }
        
        // Limit match count to realistic numbers
        matchCount = Math.min(matchCount, totalTeams);
        
        for (let i = 0; i < matchCount; i++) {
          const matchData = {
            bracket_id: bracketId,
            round_number: lbRound + 100, // Use 101, 102, 103 for LB rounds
            bracket_type: 'loser',
            team1_id: null, // Will be filled when teams lose from WB
            team2_id: null,
            winner_id: null,
            status: "scheduled",
            match_order: i
          };
          
          const [result] = await db.pool.query(
            `INSERT INTO matches (bracket_id, round_number, bracket_type, team1_id, team2_id, winner_id, status, match_order) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [matchData.bracket_id, matchData.round_number, matchData.bracket_type,
             matchData.team1_id, matchData.team2_id, matchData.winner_id,
             matchData.status, matchData.match_order]
          );
          
          matchData.id = result.insertId;
          allMatches.push(matchData);
        }
      }
      
      // CHAMPIONSHIP MATCH - Use round 200
      const championshipMatch = {
        bracket_id: bracketId,
        round_number: 200, // Championship round
        bracket_type: 'championship',
        team1_id: null, // Winner of winner's bracket final
        team2_id: null, // Winner of loser's bracket final
        winner_id: null,
        status: "scheduled",
        match_order: 0
      };
      
      const [champResult] = await db.pool.query(
        `INSERT INTO matches (bracket_id, round_number, bracket_type, team1_id, team2_id, winner_id, status, match_order) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [championshipMatch.bracket_id, championshipMatch.round_number, championshipMatch.bracket_type,
         championshipMatch.team1_id, championshipMatch.team2_id, championshipMatch.winner_id,
         championshipMatch.status, championshipMatch.match_order]
      );
      
      championshipMatch.id = champResult.insertId;
      allMatches.push(championshipMatch);
      
      console.log(`Generated double elimination bracket:`);
      console.log(`- Teams: ${totalTeams}`);
      console.log(`- Winner's bracket rounds: ${winnerBracketRounds}`);
      console.log(`- Loser's bracket rounds: ${loserRounds}`);
      console.log(`- Total matches: ${allMatches.length}`);
    }

    res.json({
      success: true,
      message: `Generated ${allMatches.length} matches for ${eliminationType} elimination`,
      matches: allMatches,
      elimination_type: eliminationType
    });

  } catch (err) {
    console.error("Error generating full bracket:", err);
    res.status(500).json({ error: "Database error: " + err.message });
  }
});

// FIXED POST complete a match - Comprehensive double elimination advancement
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
      [winner_id, scores?.team1 || null, scores?.team2 || null, matchId]
    );
    
    // Get bracket elimination type and team count
    const [bracketInfo] = await db.pool.query(
      `SELECT b.elimination_type, COUNT(bt.team_id) as team_count 
       FROM brackets b
       LEFT JOIN bracket_teams bt ON b.id = bt.bracket_id 
       WHERE b.id = ?
       GROUP BY b.id`,
      [match.bracket_id]
    );
    
    if (bracketInfo.length === 0) {
      return res.status(404).json({ error: "Bracket not found" });
    }
    
    const eliminationType = bracketInfo[0].elimination_type;
    const totalTeams = bracketInfo[0].team_count;
    const loser_id = winner_id === match.team1_id ? match.team2_id : match.team1_id;
    
    let loserAdvanced = false;
    let winnerAdvanced = false;
    let tournamentComplete = false;
    
    // Handle bracket progression based on elimination type
    if (eliminationType === "single") {
      // Single elimination - advance winner to next round
      const [nextMatches] = await db.pool.query(
        `SELECT * FROM matches 
         WHERE bracket_id = ? AND bracket_type = 'winner' 
         AND round_number = ? 
         AND (team1_id IS NULL OR team2_id IS NULL)
         ORDER BY match_order
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
        winnerAdvanced = true;
      } else {
        // This is the final match - update bracket winner
        await db.pool.query(
          "UPDATE brackets SET winner_team_id = ? WHERE id = ?",
          [winner_id, match.bracket_id]
        );
        tournamentComplete = true;
      }
    } else if (eliminationType === "double") {
      // FIXED Double elimination advancement logic
      const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(totalTeams)));
      const totalWinnerRounds = Math.log2(nextPowerOfTwo);
      
      if (match.bracket_type === 'winner') {
        // WINNER BRACKET LOGIC
        const nextRound = match.round_number + 1;
        
        // Check if this is the final round of winner's bracket
        if (nextRound <= totalWinnerRounds) {
          // Advance within winner's bracket
          const nextMatchOrder = Math.floor(match.match_order / 2);
          
          const [nextWinnerMatches] = await db.pool.query(
            `SELECT * FROM matches 
             WHERE bracket_id = ? AND bracket_type = 'winner' 
             AND round_number = ? AND match_order = ?`,
            [match.bracket_id, nextRound, nextMatchOrder]
          );
          
          if (nextWinnerMatches.length > 0) {
            const nextMatch = nextWinnerMatches[0];
            const updateField = match.match_order % 2 === 0 ? 'team1_id' : 'team2_id';
            
            await db.pool.query(
              `UPDATE matches SET ${updateField} = ? WHERE id = ?`,
              [winner_id, nextMatch.id]
            );
            winnerAdvanced = true;
          }
        } else {
          // Winner's bracket final - advance to championship
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
            winnerAdvanced = true;
            console.log(`Winner bracket champion ${winner_id} advanced to championship`);
          }
        }
        
        // LOSER PLACEMENT LOGIC - Drop losers to loser's bracket
        if (loser_id) {
          let targetLoserRound;
          
          if (match.round_number === 1) {
            // First round losers go to LB round 101
            targetLoserRound = 101;
          } else {
            // Calculate where losers from later winner rounds go
            // Round 2 losers go to LB round 102, Round 3 to 103, etc.
            targetLoserRound = 100 + match.round_number;
          }
          
          // Find available loser bracket match
          const [loserBracketMatches] = await db.pool.query(
            `SELECT * FROM matches 
             WHERE bracket_id = ? AND bracket_type = 'loser' 
             AND round_number = ?
             AND (team1_id IS NULL OR team2_id IS NULL)
             ORDER BY match_order`,
            [match.bracket_id, targetLoserRound]
          );
          
          if (loserBracketMatches.length > 0) {
            const targetMatch = loserBracketMatches[0];
            const updateField = targetMatch.team1_id === null ? 'team1_id' : 'team2_id';
            
            await db.pool.query(
              `UPDATE matches SET ${updateField} = ? WHERE id = ?`,
              [loser_id, targetMatch.id]
            );
            loserAdvanced = true;
            console.log(`Loser ${loser_id} dropped to loser bracket round ${targetLoserRound}`);
          }
        }
        
      } else if (match.bracket_type === 'loser') {
        // LOSER BRACKET LOGIC - FIXED calculation
        // Calculate the maximum loser bracket round (CORRECTED FORMULA)
        const maxLoserRound = 100 + 2 * (totalWinnerRounds - 1);
        
        console.log(`Processing loser bracket match: round ${match.round_number}, maxLoserRound: ${maxLoserRound}`);
        
        if (match.round_number < maxLoserRound) {
          // Continue in loser's bracket
          const nextLoserRound = match.round_number + 1;
          const [nextLoserMatches] = await db.pool.query(
            `SELECT * FROM matches 
             WHERE bracket_id = ? AND bracket_type = 'loser' 
             AND round_number = ?
             AND (team1_id IS NULL OR team2_id IS NULL)
             ORDER BY match_order
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
            winnerAdvanced = true;
            console.log(`Loser bracket winner ${winner_id} advanced to next loser round ${nextLoserRound}`);
          }
        } else {
          // Loser's bracket final - advance to championship
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
            winnerAdvanced = true;
            console.log(`Loser bracket champion ${winner_id} advanced to championship`);
          }
        }
        
      } else if (match.bracket_type === 'championship') {
        // Championship match - tournament complete
        await db.pool.query(
          "UPDATE brackets SET winner_team_id = ? WHERE id = ?",
          [winner_id, match.bracket_id]
        );
        tournamentComplete = true;
        console.log(`Tournament completed! Champion: ${winner_id}`);
      }
    }
    
    res.json({ 
      success: true, 
      message: "Match updated successfully",
      advanced: winnerAdvanced || loserAdvanced,
      winnerId: winner_id,
      loserId: loser_id,
      loserAdvanced: loserAdvanced,
      winnerAdvanced: winnerAdvanced,
      tournamentComplete: tournamentComplete,
      bracketType: match.bracket_type,
      roundNumber: match.round_number
    });
  } catch (err) {
    console.error("Error completing match:", err);
    res.status(500).json({ error: "Database error: " + err.message });
  }
});

// PUT update bracket details
router.put("/:id", async (req, res) => {
  const bracketId = req.params.id;
  const { name, sport_type, elimination_type } = req.body;

  try {
    const [result] = await db.pool.query(
      "UPDATE brackets SET name = ?, sport_type = ?, elimination_type = ? WHERE id = ?",
      [name, sport_type, elimination_type, bracketId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Bracket not found" });
    }

    res.json({ success: true, message: "Bracket updated successfully" });
  } catch (err) {
    console.error("Error updating bracket:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// POST reset bracket (clear all matches)
router.post("/:id/reset", async (req, res) => {
  const bracketId = req.params.id;

  try {
    // Clear all matches and reset winner
    await db.pool.query("DELETE FROM matches WHERE bracket_id = ?", [bracketId]);
    await db.pool.query("UPDATE brackets SET winner_team_id = NULL WHERE id = ?", [bracketId]);

    res.json({ success: true, message: "Bracket reset successfully" });
  } catch (err) {
    console.error("Error resetting bracket:", err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;