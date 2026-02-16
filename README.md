# BW Event Calendar

Simpler Event-Kalender mit Admin-Panel.

## Features

- 📅 Kalender mit mehrtägigen Events
- 🔐 Admin-Login unter `/admin`
- 👥 Admin-Verwaltung
- 🎨 Dark Mode mit roten Akzenten

## Setup

### Lokal

```bash
npm install
cd client && npm install && cd ..
cp .env.example .env   # DATABASE_URL und JWT_SECRET anpassen
npm run dev
```

Dann `/admin` öffnen für Setup.

### Railway

1. GitHub Repo verbinden + PostgreSQL hinzufügen
2. `JWT_SECRET` und `NODE_ENV=production` setzen
3. Deploy - fertig

## Struktur

```
├── client/          # React Frontend
├── server/
│   ├── db.js        # Postgres Verbindung
│   ├── routes/      # API
│   └── index.js
└── package.json
```
