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

// Helper function to create proper double elimination structure
function createDoubleEliminationStructure(totalTeams) {
  // Calculate winner's bracket structure
  const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(totalTeams)));
  const winnerRounds = Math.log2(nextPowerOfTwo);
  
  // Define loser bracket structure based on team count
  const loserBracketStructure = {
    4: [
      { round: 1, matches: 1, description: "LB Round 1 - WB R1 losers" },
      { round: 2, matches: 1, description: "LB Final - LB R1 winner vs WB R2 loser" }
    ],
    8: [
      { round: 1, matches: 2, description: "LB Round 1 - WB R1 losers compete" },
      { round: 2, matches: 2, description: "LB Round 2 - LB R1 winners vs WB R2 losers" },
      { round: 3, matches: 1, description: "LB Round 3 - LB R2 winners compete" },
      { round: 4, matches: 1, description: "LB Final - LB R3 winner vs WB Final loser" }
    ],
    16: [
      { round: 1, matches: 4, description: "LB Round 1 - WB R1 losers compete" },
      { round: 2, matches: 4, description: "LB Round 2 - LB R1 winners vs WB R2 losers" },
      { round: 3, matches: 2, description: "LB Round 3 - LB R2 winners compete" },
      { round: 4, matches: 2, description: "LB Round 4 - LB R3 winners vs WB R3 losers" },
      { round: 5, matches: 1, description: "LB Round 5 - LB R4 winners compete" },
      { round: 6, matches: 1, description: "LB Final - LB R5 winner vs WB Final loser" }
    ]
  };

  // Find the appropriate structure (use next power of 2)
  const structure = loserBracketStructure[nextPowerOfTwo] || loserBracketStructure[8];
  
  return {
    winnerRounds: winnerRounds,
    loserStructure: structure,
    totalTeams: nextPowerOfTwo
  };
}

// POST generate full bracket - COMPLETELY REWRITTEN FOR PROPER DOUBLE ELIMINATION
router.post("/:id/generate", async (req, res) => {
  const bracketId = req.params.id;

  try {
    // Clear existing matches and reset bracket winner
    await db.pool.query("DELETE FROM matches WHERE bracket_id = ?", [bracketId]);
    await db.pool.query("UPDATE brackets SET winner_team_id = NULL WHERE id = ?", [bracketId]);

    // Fetch bracket info
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
    const totalTeams = shuffledTeams.length;

    if (eliminationType === "single") {
      // Single elimination logic (unchanged)
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
            nextRoundTeams.push({ placeholder: true });
          }

          const [result] = await db.pool.query(
            `INSERT INTO matches (bracket_id, round_number, bracket_type, team1_id, team2_id, winner_id, status, match_order) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [matchData.bracket_id, matchData.round_number, matchData.bracket_type,
             matchData.team1_id, matchData.team2_id, matchData.winner_id,
             matchData.status, matchData.match_order]
          );

          allMatches.push({
            id: result.insertId,
            ...matchData
          });
        }

        currentRoundTeams = nextRoundTeams;
      }
    } else if (eliminationType === "double") {
      // PROPER DOUBLE ELIMINATION BRACKET GENERATION
      const structure = createDoubleEliminationStructure(totalTeams);
      const nextPowerOfTwo = structure.totalTeams;
      
      // Pad teams to next power of 2
      while (shuffledTeams.length < nextPowerOfTwo) {
        shuffledTeams.push(null); // BYE slot
      }

      // GENERATE WINNER'S BRACKET
      let currentRoundTeams = shuffledTeams;
      let winnerMatches = 0;

      for (let round = 1; round <= structure.winnerRounds; round++) {
        const roundMatches = Math.floor(currentRoundTeams.length / 2);
        const nextRoundTeams = [];

        for (let i = 0; i < roundMatches; i++) {
          const team1 = currentRoundTeams[i * 2];
          const team2 = currentRoundTeams[i * 2 + 1] || null;

          const matchData = {
            bracket_id: bracketId,
            round_number: round,
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
          } else if (!team1 && team2) {
            matchData.winner_id = team2.id;
            matchData.status = "completed";
            nextRoundTeams.push(team2);
          } else {
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
          winnerMatches++;
        }

        // Handle odd number of teams
        if (currentRoundTeams.length % 2 === 1) {
          nextRoundTeams.push(currentRoundTeams[currentRoundTeams.length - 1]);
        }

        currentRoundTeams = nextRoundTeams;
      }

      // GENERATE LOSER'S BRACKET USING PROPER STRUCTURE
      let loserMatches = 0;
      
      for (const roundInfo of structure.loserStructure) {
        for (let i = 0; i < roundInfo.matches; i++) {
          const matchData = {
            bracket_id: bracketId,
            round_number: 100 + roundInfo.round, // 101, 102, 103, etc.
            bracket_type: 'loser',
            team1_id: null,
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
          loserMatches++;
        }
      }

      // CHAMPIONSHIP MATCH
      const championshipMatch = {
        bracket_id: bracketId,
        round_number: 200,
        bracket_type: 'championship',
        team1_id: null,
        team2_id: null,
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

      console.log(`Generated proper double elimination bracket:`);
      console.log(`- Teams: ${totalTeams} (padded to ${nextPowerOfTwo})`);
      console.log(`- Winner's bracket matches: ${winnerMatches}`);
      console.log(`- Loser's bracket matches: ${loserMatches}`);
      console.log(`- Championship matches: 1`);
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

// Helper function to get proper loser bracket round for winner bracket losers
function getLoserBracketRound(winnerRound, totalTeams) {
  // This maps where losers from each winner bracket round should go
  const roundMappings = {
    4: {
      1: 101, // WB R1 losers go to LB R1
      2: 102  // WB R2 losers go to LB R2 (final)
    },
    8: {
      1: 101, // WB R1 losers go to LB R1
      2: 102, // WB R2 losers go to LB R2
      3: 104  // WB R3 (final) losers go to LB R4 (final)
    },
    16: {
      1: 101, // WB R1 losers go to LB R1
      2: 102, // WB R2 losers go to LB R2
      3: 104, // WB R3 losers go to LB R4
      4: 106  // WB R4 (final) losers go to LB R6 (final)
    }
  };

  const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(totalTeams)));
  const mapping = roundMappings[nextPowerOfTwo] || roundMappings[8];
  
  return mapping[winnerRound] || (100 + winnerRound);
}

// COMPLETELY REWRITTEN POST complete a match - Proper double elimination advancement
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
      // PROPER DOUBLE ELIMINATION ADVANCEMENT LOGIC
      
      if (match.bracket_type === 'winner') {
        // WINNER BRACKET LOGIC
        
        // 1. Advance winner within winner's bracket
        const nextRound = match.round_number + 1;
        const [maxWinnerRound] = await db.pool.query(
          `SELECT MAX(round_number) as max_round FROM matches 
           WHERE bracket_id = ? AND bracket_type = 'winner'`,
          [match.bracket_id]
        );
        
        if (nextRound <= maxWinnerRound[0].max_round) {
          // Continue in winner's bracket
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
             WHERE bracket_id = ? AND bracket_type = 'championship'`,
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
        
        // 2. PROPER LOSER PLACEMENT - Drop losers to correct loser's bracket round
        if (loser_id) {
          const targetLoserRound = getLoserBracketRound(match.round_number, totalTeams);
          
          console.log(`Placing WB R${match.round_number} loser ${loser_id} into LB R${targetLoserRound - 100}`);
          
          // Find available spot in target loser bracket round
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
            console.log(`Loser ${loser_id} placed in LB R${targetLoserRound - 100}, match ${targetMatch.id}`);
          }
        }
        
      } else if (match.bracket_type === 'loser') {
        // LOSER BRACKET LOGIC
        const [maxLoserRound] = await db.pool.query(
          `SELECT MAX(round_number) as max_round FROM matches 
           WHERE bracket_id = ? AND bracket_type = 'loser'`,
          [match.bracket_id]
        );
        
        if (match.round_number < maxLoserRound[0].max_round) {
          // Continue in loser's bracket - find next available match
          const [nextLoserMatches] = await db.pool.query(
            `SELECT * FROM matches 
             WHERE bracket_id = ? AND bracket_type = 'loser' 
             AND round_number > ?
             AND (team1_id IS NULL OR team2_id IS NULL)
             ORDER BY round_number, match_order
             LIMIT 1`,
            [match.bracket_id, match.round_number]
          );
          
          if (nextLoserMatches.length > 0) {
            const nextMatch = nextLoserMatches[0];
            const updateField = nextMatch.team1_id === null ? 'team1_id' : 'team2_id';
            
            await db.pool.query(
              `UPDATE matches SET ${updateField} = ? WHERE id = ?`,
              [winner_id, nextMatch.id]
            );
            winnerAdvanced = true;
            console.log(`Loser bracket winner ${winner_id} advanced to LB R${nextMatch.round_number - 100}`);
          }
        } else {
          // Loser's bracket final - advance to championship
          const [championshipMatches] = await db.pool.query(
            `SELECT * FROM matches 
             WHERE bracket_id = ? AND bracket_type = 'championship'`,
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