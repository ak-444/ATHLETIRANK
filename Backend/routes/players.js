const express = require("express");
const router = express.Router();
const db = require("../config/database");

// GET all players
router.get("/", async (req, res) => {
  try {
    const [results] = await db.pool.query("SELECT * FROM players");
    res.json(results);
  } catch (err) {
    console.error("❌ Error fetching players:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST create player
router.post("/", async (req, res) => {
  try {
    const { team_id, name, position } = req.body;
    if (!team_id || !name) {
      return res.status(400).json({ error: "Team ID and player name required" });
    }

    const [result] = await db.pool.query(
      "INSERT INTO players (team_id, name, position, created_at) VALUES (?, ?, ?, NOW())",
      [team_id, name, position || null]
    );

    res.status(201).json({
      id: result.insertId,
      team_id,
      name,
      position,
      created_at: new Date()
    });
  } catch (err) {
    console.error("❌ Error creating player:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE player
router.delete("/:id", async (req, res) => {
  try {
    const playerId = req.params.id;
    await db.pool.query("DELETE FROM players WHERE id = ?", [playerId]);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error deleting player:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
