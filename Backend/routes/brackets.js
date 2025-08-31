const express = require("express");
const router = express.Router();
const db = require("../config/database");

// Fisher-Yates Shuffle utility function
function fisherYatesShuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

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

// POST generate matches using Fisher–Yates shuffle
router.post("/:id/generate", async (req, res) => {
  const bracketId = req.params.id;

  try {
    // First, clear any existing matches for this bracket
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

    console.log(`Generating matches for ${teams.length} teams in bracket ${bracketId}`);

    // Shuffle teams for random bracket seeding
    const shuffledTeams = fisherYatesShuffle(teams);

    // Create first round matches
    const matches = [];
    for (let i = 0; i < shuffledTeams.length; i += 2) {
      const team1 = shuffledTeams[i];
      const team2 = shuffledTeams[i + 1] || null;

      if (team2 === null) {
        // Handle bye - team1 advances automatically
        console.log(`Creating bye match: ${team1.name} gets a bye`);
        
        const [result] = await db.pool.query(
          `INSERT INTO matches 
           (bracket_id, round_number, team1_id, team2_id, winner_id, status) 
           VALUES (?, 1, ?, NULL, ?, 'completed')`,
          [bracketId, team1.id, team1.id]
        );

        matches.push({
          id: result.insertId,
          round_number: 1,
          team1_id: team1.id,
          team1_name: team1.name,
          team2_id: null,
          team2_name: null,
          winner_id: team1.id,
          winner_name: team1.name,
          status: "completed"
        });
      } else {
        // Normal match between two teams
        console.log(`Creating match: ${team1.name} vs ${team2.name}`);
        
        const [result] = await db.pool.query(
          `INSERT INTO matches 
           (bracket_id, round_number, team1_id, team2_id, status) 
           VALUES (?, 1, ?, ?, 'scheduled')`,
          [bracketId, team1.id, team2.id]
        );

        matches.push({
          id: result.insertId,
          round_number: 1,
          team1_id: team1.id,
          team1_name: team1.name,
          team2_id: team2.id,
          team2_name: team2.name,
          winner_id: null,
          winner_name: null,
          status: "scheduled"
        });
      }
    }

    console.log(`Successfully created ${matches.length} matches for bracket ${bracketId}`);
    res.json({ 
      success: true,
      message: `Generated ${matches.length} matches for Round 1`, 
      matches 
    });

  } catch (err) {
    console.error("Error generating matches:", err);
    res.status(500).json({ error: "Database error: " + err.message });
  }
});

module.exports = router;