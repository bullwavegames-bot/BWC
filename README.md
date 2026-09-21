# BWC

Bullwave Club sportsbook UI (React) and Node.js API.

## Run locally

```bash
npm install
npm run server
npm run dev
```

Frontend talks to the live API at `https://bullwavegames.onrender.com` (see `VITE_API_URL`). Auth uses Supabase. Copy `env.example` to `.env` for local keys.

## Render

Web service start command: `npm start` (runs `node server/index.js`).
Set `JWT_SECRET` and `CORS_ORIGIN` in the Render dashboard.
