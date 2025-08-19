const express = require("express");
const router = express.Router();
const db = require("../config/database");

// ✅ GET all teams with players
router.get("/", async (req, res) => {
  try {
    // Make sure to select sport
    const [teams] = await db.pool.query("SELECT id, name, sport FROM teams");
    const [players] = await db.pool.query("SELECT * FROM players");

    const teamsWithPlayers = teams.map(team => ({
      ...team,
      players: players.filter(p => p.team_id === team.id),
    }));

    res.json(teamsWithPlayers);
  } catch (err) {
    console.error("Error fetching teams:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ✅ CREATE new team with players
router.post("/", async (req, res) => {
  const { name, sport, players } = req.body;

  if (!name || !sport || !players || players.length === 0) {
    return res.status(400).json({ error: "Team name, sport, and at least one player required" });
  }

  const conn = await db.pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      "INSERT INTO teams (name, sport) VALUES (?, ?)",
      [name, sport]
    );
    const teamId = result.insertId;

    const playerValues = players.map(p => [teamId, p.name, p.position]);
    await conn.query(
      "INSERT INTO players (team_id, name, position) VALUES ?",
      [playerValues]
    );

    await conn.commit();

    res.json({ id: teamId, name, sport, players });
  } catch (err) {
    await conn.rollback();
    console.error("Error creating team:", err);
    res.status(500).json({ error: "Database error" });
  } finally {
    conn.release();
  }
});

// ✅ DELETE team
router.delete("/:id", async (req, res) => {
  try {
    await db.pool.query("DELETE FROM teams WHERE id = ?", [req.params.id]);
    res.json({ message: "Team deleted" });
  } catch (err) {
    console.error("Error deleting team:", err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
