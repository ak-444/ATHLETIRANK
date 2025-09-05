// routes/events.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// ✅ GET all events
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM events ORDER BY id DESC';
    const [results] = await db.pool.query(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching events',
      error: error.message,
      code: error.code
    });
  }
});

// ✅ GET single event by ID (FIXED: removed /events prefix)
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.pool.query("SELECT * FROM events WHERE id = ?", [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching event" });
  }
});

// ✅ GET brackets by event
router.get('/:eventId/brackets', async (req, res) => {
  try {
    const { eventId } = req.params;
    const query = `
      SELECT b.*, COUNT(bt.team_id) as team_count 
      FROM brackets b
      LEFT JOIN bracket_teams bt ON b.id = bt.bracket_id
      WHERE b.event_id = ?
      GROUP BY b.id
    `;
    const [brackets] = await db.pool.query(query, [eventId]);
    res.json(brackets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ GET matches by bracket
router.get('/brackets/:bracketId/matches', async (req, res) => {
  try {
    const { bracketId } = req.params;
    const query = `
      SELECT 
        m.*,
        t1.name as team1_name,
        t2.name as team2_name,
        tw.name as winner_name,
        p.name as mvp_name
      FROM matches m
      LEFT JOIN teams t1 ON m.team1_id = t1.id
      LEFT JOIN teams t2 ON m.team2_id = t2.id
      LEFT JOIN teams tw ON m.winner_id = tw.id
      LEFT JOIN players p ON m.mvp_id = p.id
      WHERE m.bracket_id = ?
      ORDER BY m.round_number, m.match_order
    `;
    const [matches] = await db.pool.query(query, [bracketId]);
    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Create event
router.post('/', async (req, res) => {
  try {
    const { name, start_date, end_date } = req.body;
    if (!name || !start_date || !end_date) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const status = 'ongoing';
    const archived = 'no';
    const query = `
      INSERT INTO events (name, start_date, end_date, status, archived)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.pool.query(query, [
      name,
      start_date,
      end_date,
      status,
      archived
    ]);

    res.status(201).json({
      message: 'Event created successfully',
      eventId: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error creating event',
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage || 'No SQL message'
    });
  }
});

// ✅ Delete event
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.pool.query('DELETE FROM events WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting event',
      error: error.message
    });
  }
});

module.exports = router;