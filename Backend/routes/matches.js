const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET all matches with team details
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        m.*,
        t1.name as team1_name,
        t2.name as team2_name,
        tw.name as winner_name,
        b.sport_type,
        b.elimination_type,
        b.name as bracket_name
      FROM matches m
      LEFT JOIN teams t1 ON m.team1_id = t1.id
      LEFT JOIN teams t2 ON m.team2_id = t2.id
      LEFT JOIN teams tw ON m.winner_id = tw.id
      LEFT JOIN brackets b ON m.bracket_id = b.id
      ORDER BY m.bracket_id, m.round_number, m.match_order
    `;
    
    const [matches] = await db.pool.query(query);
    res.json(matches);
  } catch (err) {
    console.error('Error fetching matches:', err);
    res.status(500).json({ 
      message: 'Error fetching matches', 
      error: err.message 
    });
  }
});

// GET single match by ID
router.get('/:id', async (req, res) => {
  try {
    const [matches] = await db.pool.query(
      `SELECT m.*, 
        t1.name as team1_name, 
        t2.name as team2_name,
        tw.name as winner_name
       FROM matches m
       LEFT JOIN teams t1 ON m.team1_id = t1.id
       LEFT JOIN teams t2 ON m.team2_id = t2.id
       LEFT JOIN teams tw ON m.winner_id = tw.id
       WHERE m.id = ?`,
      [req.params.id]
    );

    if (matches.length === 0) {
      return res.status(404).json({ message: 'Match not found' });
    }

    res.json(matches[0]);
  } catch (err) {
    console.error('Error fetching match:', err);
    res.status(500).json({ message: 'Error fetching match' });
  }
});

module.exports = router;