const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Check if setup is needed
router.get('/setup-required', async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(*) FROM admins');
        res.json({ setupRequired: parseInt(result.rows[0].count) === 0 });
    } catch (error) {
        res.status(500).json({ error: 'Serverfehler' });
    }
});

// Initial setup - create first admin
router.post('/setup', async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(*) FROM admins');

        if (parseInt(result.rows[0].count) > 0) {
            return res.status(400).json({ error: 'Setup bereits abgeschlossen' });
        }

        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Benutzername und Passwort erforderlich' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen haben' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const adminResult = await pool.query(
            'INSERT INTO admins (username, password) VALUES ($1, $2) RETURNING id, username',
            [username, hashedPassword]
        );

        const admin = adminResult.rows[0];
        const token = jwt.sign({ adminId: admin.id }, JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({ message: 'Admin erstellt', admin });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Serverfehler' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
        const admin = result.rows[0];

        if (!admin || !(await bcrypt.compare(password, admin.password))) {
            return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
        }

        const token = jwt.sign({ adminId: admin.id }, JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({ message: 'Erfolgreich angemeldet', admin: { id: admin.id, username: admin.username } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Serverfehler' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Erfolgreich abgemeldet' });
});

// Check auth status
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username FROM admins WHERE id = $1', [req.adminId]);
        const admin = result.rows[0];

        if (!admin) return res.status(401).json({ error: 'Admin nicht gefunden' });
        res.json({ admin });
    } catch (error) {
        res.status(500).json({ error: 'Serverfehler' });
    }
});

module.exports = router;
