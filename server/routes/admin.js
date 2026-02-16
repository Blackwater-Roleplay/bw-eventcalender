const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all admins (admin only)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, created_at FROM admins');
        res.json(result.rows.map(a => ({ id: a.id, username: a.username, createdAt: a.created_at })));
    } catch (error) {
        res.status(500).json({ error: 'Serverfehler' });
    }
});

// Create new admin (admin only)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Benutzername und Passwort erforderlich' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen haben' });
        }

        const existing = await pool.query('SELECT id FROM admins WHERE username = $1', [username]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Benutzername bereits vergeben' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO admins (username, password) VALUES ($1, $2) RETURNING id, username, created_at',
            [username, hashedPassword]
        );

        const a = result.rows[0];
        res.json({ id: a.id, username: a.username, createdAt: a.created_at });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Serverfehler' });
    }
});

// Delete admin (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        if (parseInt(id) === req.adminId) {
            return res.status(400).json({ error: 'Du kannst dich nicht selbst löschen' });
        }

        const count = await pool.query('SELECT COUNT(*) FROM admins');
        if (parseInt(count.rows[0].count) <= 1) {
            return res.status(400).json({ error: 'Es muss mindestens ein Admin existieren' });
        }

        await pool.query('DELETE FROM admins WHERE id = $1', [id]);
        res.json({ message: 'Admin gelöscht' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Serverfehler' });
    }
});

module.exports = router;
