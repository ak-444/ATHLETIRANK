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
        // Basketball stats
        points = 0,
        assists = 0,
        rebounds = 0,
        three_points_made = 0,
        steals = 0,
        blocks = 0,
        fouls = 0,
        turnovers = 0,
        // Volleyball stats
        serves = 0,
        service_aces = 0,
        serve_errors = 0,
        receptions = 0,
        reception_errors = 0,
        digs = 0,
        kills = 0,
        attack_attempts = 0,
        attack_errors = 0,
        volleyball_assists = 0,
      } = player;

      await conn.query(
        `INSERT INTO player_stats 
        (match_id, player_id, points, assists, rebounds, three_points_made, steals, blocks, fouls, turnovers,
         serves, service_aces, serve_errors, receptions, reception_errors, digs, kills, attack_attempts, attack_errors, volleyball_assists) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          matchId,
          player_id,
          points,
          assists,
          rebounds,
          three_points_made,
          steals,
          blocks,
          fouls,
          turnovers,
          serves,
          service_aces,
          serve_errors,
          receptions,
          reception_errors,
          digs,
          kills,
          attack_attempts,
          attack_errors,
          volleyball_assists,
        ]
      );

      // Track total team points/kills for scoring
      if (team_id === team1_id) {
        team1Total += points > 0 ? points : kills; // Use points for basketball, kills for volleyball
      }
      if (team_id === team2_id) {
        team2Total += points > 0 ? points : kills; // Use points for basketball, kills for volleyball
      }
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

// Get player statistics summary for a match or event
router.get("/matches/:matchId/summary", async (req, res) => {
  try {
    const { matchId } = req.params;
    
    const query = `
      SELECT 
        ps.*,
        p.name as player_name,
        p.jersey_number,
        t.name as team_name,
        m.sport_type,
        -- Calculate hitting percentage for volleyball
        CASE 
          WHEN ps.attack_attempts > 0 
          THEN ROUND((ps.kills - ps.attack_errors) / ps.attack_attempts * 100, 2)
          ELSE 0 
        END as hitting_percentage,
        -- Calculate service percentage
        CASE 
          WHEN (ps.serves + ps.serve_errors) > 0 
          THEN ROUND(ps.serves / (ps.serves + ps.serve_errors) * 100, 2)
          ELSE 0 
        END as service_percentage,
        -- Calculate reception percentage
        CASE 
          WHEN (ps.receptions + ps.reception_errors) > 0 
          THEN ROUND(ps.receptions / (ps.receptions + ps.reception_errors) * 100, 2)
          ELSE 0 
        END as reception_percentage
      FROM player_stats ps
      JOIN players p ON ps.player_id = p.id
      JOIN teams t ON p.team_id = t.id
      JOIN matches m ON ps.match_id = m.id
      WHERE ps.match_id = ?
      ORDER BY t.name, p.name
    `;
    
    const [rows] = await db.pool.query(query, [matchId]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching match summary:", err);
    res.status(500).json({ error: "Failed to fetch match summary" });
  }
});

module.exports = router;