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
      ORDER BY m.round_number, m.id
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

    let currentRoundTeams = shuffledTeams;

    for (let round = 1; round <= totalRounds; round++) {
      const nextRoundTeams = [];

      for (let i = 0; i < currentRoundTeams.length; i += 2) {
        const team1 = currentRoundTeams[i];
        const team2 = currentRoundTeams[i + 1];

        let matchData = {
          bracket_id: bracketId,
          round_number: round,
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
          `INSERT INTO matches (bracket_id, round_number, team1_id, team2_id, winner_id, status) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            matchData.bracket_id,
            matchData.round_number,
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

    res.json({
      success: true,
      message: `Generated ${allMatches.length} matches across ${totalRounds} rounds`,
      matches: allMatches
    });

  } catch (err) {
    console.error("Error generating full bracket:", err);
    res.status(500).json({ error: "Database error: " + err.message });
  }
});

module.exports = router;
