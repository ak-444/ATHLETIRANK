const express = require("express");
const router = express.Router();
const db = require("../config/database");

// POST - Assign team to bracket
router.post("/", async (req, res) => {
  const { bracket_id, team_id } = req.body;
  
  if (!bracket_id || !team_id) {
    return res.status(400).json({ error: "bracket_id and team_id are required" });
  }

  try {
    // Check if this team is already assigned to this bracket
    const [existing] = await db.pool.query(
      "SELECT id FROM bracket_teams WHERE bracket_id = ? AND team_id = ?",
      [bracket_id, team_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: "Team already assigned to this bracket" });
    }

    // Insert the assignment
    const [result] = await db.pool.query(
      "INSERT INTO bracket_teams (bracket_id, team_id) VALUES (?, ?)",
      [bracket_id, team_id]
    );

    res.status(201).json({
      id: result.insertId,
      bracket_id,
      team_id,
      message: "Team assigned to bracket successfully"
    });

  } catch (err) {
    console.error("Error assigning team to bracket:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET - Get all teams in a bracket
router.get("/bracket/:bracketId", async (req, res) => {
  try {
    const [teams] = await db.pool.query(`
      SELECT t.*, bt.id as assignment_id
      FROM bracket_teams bt
      JOIN teams t ON bt.team_id = t.id
      WHERE bt.bracket_id = ?
    `, [req.params.bracketId]);

    res.json(teams);
  } catch (err) {
    console.error("Error fetching bracket teams:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// DELETE - Remove team from bracket
router.delete("/:id", async (req, res) => {
  try {
    await db.pool.query("DELETE FROM bracket_teams WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Team removed from bracket" });
  } catch (err) {
    console.error("Error removing team from bracket:", err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;