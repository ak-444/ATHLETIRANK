// routes/events.js
const express = require('express');
const router = express.Router();
const db = require('../config/database'); // db is { pool, testConnection }

// GET all events
router.get('/', async (req, res) => {
    try {
        console.log('Attempting to fetch events...');
        console.log('Database connection:', db && db.pool ? 'Connected' : 'Not connected');

        const query = 'SELECT * FROM events ORDER BY id DESC';
        console.log('Executing query:', query);

        const [results] = await db.pool.query(query);
        console.log('Query results:', results);
        console.log('Number of events found:', results.length);

        res.json(results);
    } catch (error) {
        console.error('Detailed error fetching events:');
        console.error('SQL Error:', error.sqlMessage);
        console.error('SQL Code:', error.code);
        console.error('Full Error:', error);

        res.status(500).json({
            message: 'Error fetching events',
            error: error.message,
            code: error.code
        });
    }
});

// Create event
router.post('/', async (req, res) => {
    try {
        console.log('Received POST request to create event');
        console.log('Request body:', req.body);

        const { name, sport_type, elimination_type, start_date, end_date } = req.body;

        // Validate required fields
        if (!name || !sport_type || !elimination_type || !start_date || !end_date) {
            console.log('Validation failed - missing fields');
            return res.status(400).json({
                message: 'All fields are required',
                received: { name, sport_type, elimination_type, start_date, end_date }
            });
        }

        // Default values for status and archived
        const status = 'ongoing';
        const archived = 'no';

        const query = `
            INSERT INTO events (name, sport_type, elimination_type, start_date, end_date, status, archived)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        console.log('Executing INSERT query:', query);
        console.log('With values:', [name, sport_type, elimination_type, start_date, end_date, status, archived]);

        const [result] = await db.pool.query(query, [
            name,
            sport_type,
            elimination_type,
            start_date,
            end_date,
            status,
            archived
        ]);

        console.log('Event created successfully with ID:', result.insertId);
        console.log('Insert result:', result);

        res.status(201).json({
            message: 'Event created successfully',
            eventId: result.insertId
        });
    } catch (error) {
        console.error('Detailed error creating event:');
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error stack:', error.stack);

        res.status(500).json({
            message: 'Error creating event',
            error: error.message,
            code: error.code,
            sqlMessage: error.sqlMessage || 'No SQL message'
        });
    }
});

// GET single event by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'SELECT * FROM events WHERE id = ?';
        const [results] = await db.pool.query(query, [id]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.json(results[0]);
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({
            message: 'Error fetching event',
            error: error.message
        });
    }
});

module.exports = router;
