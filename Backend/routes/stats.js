// routes/stats.js
const express = require("express");
const router = express.Router();
const db = require("../config/database"); // adjust path to your db connection

// Get all events
router.get("/events", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM events WHERE archived = 'no'");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// GET matches by event
router.get("/events/:eventId/matches", async (req, res) => {
  try {
    // Find the bracket for this event
    const [brackets] = await db.query(
      "SELECT id FROM brackets WHERE event_id = ? LIMIT 1",
      [req.params.eventId]
    );

    if (brackets.length === 0) {
      return res.json([]); // no bracket yet
    }

    const bracketId = brackets[0].id;

    // Now fetch matches for this bracket
    const [rows] = await db.query(
      `SELECT m.*, 
              t1.name as team1_name, 
              t2.name as team2_name,
              w.name as winner_name,
              b.sport_type as sport_type
      FROM matches m
      JOIN brackets b ON m.bracket_id = b.id
      LEFT JOIN teams t1 ON m.team1_id = t1.id
      LEFT JOIN teams t2 ON m.team2_id = t2.id
      LEFT JOIN teams w ON m.winner_id = w.id
      WHERE m.bracket_id = ?
      ORDER BY m.round_number, m.id`,
      [bracketId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Error fetching matches by event:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET teams by event
router.get("/events/:eventId/teams", async (req, res) => {
  try {
    // Find the bracket for this event
    const [brackets] = await db.query(
      "SELECT id FROM brackets WHERE event_id = ? LIMIT 1",
      [req.params.eventId]
    );

    if (brackets.length === 0) {
      return res.json([]); // no bracket yet
    }

    const bracketId = brackets[0].id;

    // Now fetch teams assigned to this bracket
    const [rows] = await db.query(
      `SELECT DISTINCT t.* 
       FROM teams t
       JOIN bracket_teams bt ON t.id = bt.team_id
       WHERE bt.bracket_id = ?`,
      [bracketId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Error fetching teams by event:", err);
    res.status(500).json({ error: "Database error" });
  }
});


// Get all teams (optional, if you want a list of all teams)
router.get("/teams", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM teams");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

// Get players for a team
router.get("/teams/:teamId/players", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM players WHERE team_id = ?", [
      req.params.teamId,
    ]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch players" });
  }
});

// Get existing stats for a match
router.get("/matches/:matchId/stats", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM player_stats WHERE match_id = ?",
      [req.params.matchId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Save stats for a match
router.post("/matches/:matchId/stats", async (req, res) => {
  const { players, team1_id, team2_id } = req.body;
  const matchId = req.params.matchId;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Clear existing stats
    await conn.query("DELETE FROM player_stats WHERE match_id = ?", [matchId]);

    let team1Total = 0;
    let team2Total = 0;

    for (const player of players) {
      const {
        player_id,
        team_id,
        points = 0,
        assists = 0,
        rebounds = 0,
        three_points_made = 0,
        steals = 0,
        blocks = 0,
        serves = 0,
        receptions = 0,
        digs = 0,
        fouls = 0,
        turnovers = 0,
        kills = 0,
      } = player;

      await conn.query(
        `INSERT INTO player_stats 
        (match_id, player_id, points, assists, rebounds, three_points_made, steals, blocks, serves, receptions, digs, fouls, turnovers, kills) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          matchId,
          player_id,
          points,
          assists,
          rebounds,
          three_points_made,
          steals,
          blocks,
          serves,
          receptions,
          digs,
          fouls,
          turnovers,
          kills,
        ]
      );

      // Track total team points
      if (team_id === team1_id) team1Total += points;
      if (team_id === team2_id) team2Total += points;
    }

    // Determine winner
    let winnerId = null;
    if (team1Total > team2Total) winnerId = team1_id;
    else if (team2Total > team1Total) winnerId = team2_id;

    // Update match
    await conn.query(
      `UPDATE matches 
       SET score_team1 = ?, score_team2 = ?, winner_id = ?, status = 'completed' 
       WHERE id = ?`,
      [team1Total, team2Total, winnerId, matchId]
    );

    await conn.commit();
    res.json({ message: "Stats saved", team1Total, team2Total, winnerId });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: "Failed to save stats" });
  } finally {
    conn.release();
  }
});

module.exports = router;
