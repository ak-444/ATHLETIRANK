const express = require("express");
const router = express.Router();
const db = require("../config/database");

// GET all bracket-team assignments
router.get("/", async (req, res) => {
  try {
    const [results] = await db.pool.query(
      `SELECT bt.id, bt.bracket_id, bt.team_id, 
              b.name AS bracket_name, t.name AS team_name, t.sport
       FROM bracket_teams bt
       JOIN brackets b ON bt.bracket_id = b.id
       JOIN teams t ON bt.team_id = t.id`
    );
    res.json(results);
  } catch (err) {
    console.error("Error fetching bracket_teams:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// POST assign team to bracket
router.post("/", async (req, res) => {
  const { bracket_id, team_id } = req.body;
  if (!bracket_id || !team_id) return res.status(400).json({ error: "bracket_id and team_id are required" });

  try {
    // Check if already assigned
    const [existing] = await db.pool.query(
      "SELECT * FROM bracket_teams WHERE bracket_id = ? AND team_id = ?",
      [bracket_id, team_id]
    );
    if (existing.length > 0) return res.status(400).json({ error: "Team already assigned" });

    const [result] = await db.pool.query(
      "INSERT INTO bracket_teams (bracket_id, team_id) VALUES (?, ?)",
      [bracket_id, team_id]
    );

    res.status(201).json({ id: result.insertId, bracket_id, team_id });
  } catch (err) {
    console.error("Error inserting bracket_team:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// DELETE a team from a bracket
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.pool.query("DELETE FROM bracket_teams WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Bracket-Team assignment not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting bracket_team:", err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
