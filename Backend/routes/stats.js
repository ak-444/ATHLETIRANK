const express = require("express");
const router = express.Router();
const db = require("../config/database");

// Get all events
router.get("/events", async (req, res) => {
  try {
    const [rows] = await db.pool.query("SELECT * FROM events WHERE archived = 'no' ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// GET brackets by event
router.get("/events/:eventId/brackets", async (req, res) => {
  try {
    const { eventId } = req.params;
    console.log("Fetching brackets for event:", eventId);
    
    const query = `
      SELECT b.*, COUNT(bt.team_id) as team_count 
      FROM brackets b
      LEFT JOIN bracket_teams bt ON b.id = bt.bracket_id
      WHERE b.event_id = ?
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `;
    const [brackets] = await db.pool.query(query, [eventId]);
    console.log("Brackets found:", brackets);
    res.json(brackets);
  } catch (error) {
    console.error("Error fetching brackets:", error);
    res.status(500).json({ error: "Failed to fetch brackets" });
  }
});

// GET teams by bracket
router.get('/:bracketId/teams', async (req, res) => {
  try {
    const { bracketId } = req.params;
    const query = `
      SELECT t.*, bt.bracket_id 
      FROM teams t
      INNER JOIN bracket_teams bt ON t.id = bt.team_id
      WHERE bt.bracket_id = ?
      ORDER BY t.name
    `;
    const [teams] = await db.pool.query(query, [bracketId]);
    res.json(teams);
  } catch (error) {
    console.error('Error fetching bracket teams:', error);
    res.status(500).json({ 
      message: 'Error fetching teams',
      error: error.message 
    });
  }
});

// GET matches by bracket
router.get('/:bracketId/matches', async (req, res) => {
  try {
    const { bracketId } = req.params;
    const query = `
      SELECT 
        m.*,
        t1.name as team1_name,
        t2.name as team2_name,
        tw.name as winner_name,
        p.name as mvp_name,
        b.sport_type,
        b.name as bracket_name
      FROM matches m
      LEFT JOIN teams t1 ON m.team1_id = t1.id
      LEFT JOIN teams t2 ON m.team2_id = t2.id
      LEFT JOIN teams tw ON m.winner_id = tw.id
      LEFT JOIN players p ON m.mvp_id = p.id
      LEFT JOIN brackets b ON m.bracket_id = b.id
      WHERE m.bracket_id = ?
      ORDER BY m.round_number, m.match_order
    `;
    const [matches] = await db.pool.query(query, [bracketId]);
    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ 
      message: 'Error fetching matches',
      error: error.message 
    });
  }
});

// Get players for a team
router.get("/teams/:teamId/players", async (req, res) => {
  try {
    const [rows] = await db.pool.query(
      "SELECT * FROM players WHERE team_id = ? ORDER BY name", 
      [req.params.teamId]
    );
    console.log(`Players for team ${req.params.teamId}:`, rows);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching players:", err);
    res.status(500).json({ error: "Failed to fetch players" });
  }
});

// Get existing stats for a match
router.get("/matches/:matchId/stats", async (req, res) => {
  try {
    const [rows] = await db.pool.query(
      "SELECT * FROM player_stats WHERE match_id = ?",
      [req.params.matchId]
    );
    console.log(`Stats for match ${req.params.matchId}:`, rows);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching match stats:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Save stats for a match
router.post("/matches/:matchId/stats", async (req, res) => {
  const { players, team1_id, team2_id } = req.body;
  const matchId = req.params.matchId;

  console.log("Saving stats for match:", matchId);
  console.log("Players data:", players);

  const conn = await db.pool.getConnection();
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
    console.log("Stats saved successfully:", { team1Total, team2Total, winnerId });
    res.json({ message: "Stats saved successfully", team1Total, team2Total, winnerId });
  } catch (err) {
    await conn.rollback();
    console.error("Error saving stats:", err);
    res.status(500).json({ error: "Failed to save stats: " + err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;