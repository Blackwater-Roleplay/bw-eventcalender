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

// Create recurring events (admin only)
router.post('/recurring', authMiddleware, async (req, res) => {
    try {
        const { title, description, color, recurringStart, recurringEnd, days } = req.body;

        if (!title || !recurringStart || !recurringEnd || !days || Object.keys(days).length === 0) {
            return res.status(400).json({ error: 'Titel, Zeitraum und mindestens ein Wochentag erforderlich' });
        }

        const dayMap = {
            sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
            thursday: 4, friday: 5, saturday: 6
        };

        const startDate = new Date(recurringStart);
        const endDate = new Date(recurringEnd);
        const events = [];

        // Iteriere durch jeden Tag im Zeitraum
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay();

            // Finde den passenden Wochentag
            for (const [dayKey, times] of Object.entries(days)) {
                if (dayMap[dayKey] === dayOfWeek) {
                    // Lokales Datum extrahieren (nicht UTC)
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    const eventDate = `${year}-${month}-${day}`;

                    // Zeit aus den vom Client konvertierten ISO-Strings extrahieren
                    // Client sendet: { startISO: "2024-01-01T15:00:00.000Z", endISO: "2024-01-01T17:00:00.000Z", endsNextDay: false }
                    const startTime = times.startISO.split('T')[1]; // z.B. "15:00:00.000Z"
                    const endTime = times.endISO.split('T')[1];

                    const startDateTime = `${eventDate}T${startTime}`;
                    
                    // Bei Terminen über Mitternacht: Enddatum auf nächsten Tag setzen
                    let endEventDate = eventDate;
                    if (times.endsNextDay) {
                        const nextDay = new Date(d);
                        nextDay.setDate(nextDay.getDate() + 1);
                        const nextYear = nextDay.getFullYear();
                        const nextMonth = String(nextDay.getMonth() + 1).padStart(2, '0');
                        const nextDayNum = String(nextDay.getDate()).padStart(2, '0');
                        endEventDate = `${nextYear}-${nextMonth}-${nextDayNum}`;
                    }
                    const endDateTime = `${endEventDate}T${endTime}`;

                    events.push({
                        title,
                        description: description || null,
                        startDate: startDateTime,
                        endDate: endDateTime,
                        color: color || '#dc2626'
                    });
                }
            }
        }

        // Füge alle Events in die DB ein
        for (const event of events) {
            await pool.query(
                'INSERT INTO events (title, description, start_date, end_date, color) VALUES ($1, $2, $3, $4, $5)',
                [event.title, event.description, event.startDate, event.endDate, event.color]
            );
        }

        res.json({ message: `${events.length} Events erstellt` });
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
