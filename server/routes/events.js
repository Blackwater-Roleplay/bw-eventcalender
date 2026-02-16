const express = require('express');
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all events (public)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM events ORDER BY start_date ASC');
        const events = result.rows.map(e => ({
            id: e.id,
            title: e.title,
            description: e.description,
            startDate: e.start_date,
            endDate: e.end_date,
            color: e.color
        }));
        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Serverfehler' });
    }
});

// Create event (admin only)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, description, startDate, endDate, color } = req.body;

        if (!title || !startDate || !endDate) {
            return res.status(400).json({ error: 'Titel, Start- und Enddatum erforderlich' });
        }

        const result = await pool.query(
            'INSERT INTO events (title, description, start_date, end_date, color) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, description || null, startDate, endDate, color || '#dc2626']
        );

        const e = result.rows[0];
        res.json({ id: e.id, title: e.title, description: e.description, startDate: e.start_date, endDate: e.end_date, color: e.color });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Serverfehler' });
    }
});

// Update event (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, startDate, endDate, color } = req.body;

        const result = await pool.query(
            'UPDATE events SET title = $1, description = $2, start_date = $3, end_date = $4, color = $5 WHERE id = $6 RETURNING *',
            [title, description, startDate, endDate, color, id]
        );

        const e = result.rows[0];
        res.json({ id: e.id, title: e.title, description: e.description, startDate: e.start_date, endDate: e.end_date, color: e.color });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Serverfehler' });
    }
});

// Delete event (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await pool.query('DELETE FROM events WHERE id = $1', [req.params.id]);
        res.json({ message: 'Event gelöscht' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Serverfehler' });
    }
});

module.exports = router;
