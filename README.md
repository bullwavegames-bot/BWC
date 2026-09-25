# BWC

Bullwave Club sportsbook UI (React) and Node.js API.

The repo is split into two folders:

- `frontend` — Vite + React app (Vercel)
- `backend` — Express API (Render)

## Run locally

```bash
cd backend
npm install
npm start
```

```bash
cd frontend
npm install
npm run dev
```

From the repo root you can also run `npm run server` and `npm run dev` after installing in each folder.

Frontend talks to the live API at `https://bwc-wgbu.onrender.com` (see `VITE_API_URL`). Auth uses Supabase. Copy `frontend/env.example` to `frontend/.env` and `backend/env.example` to `backend/.env` for local keys.

## Vercel

Set the project **Root Directory** to `frontend`. Build command: `npm run build`. Output: `dist`.

## Render

Set the service **Root Directory** to `backend`. Start command: `npm start` (runs `node server/index.js`).
Set `JWT_SECRET` and `CORS_ORIGIN` in the Render dashboard.

The included `backend/render.yaml` configures the Node web service, health check, and
required secret placeholders. Connect the repository as a Render Blueprint or
use the same values when creating a Web Service manually.

Phone login uses MSG91 SendOTP. Set `MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID`,
`MSG91_SENDER_ID`, and `MSG91_OTP_LENGTH` on the backend service. Keep
`OTP_TEST_ENABLED=false` in every hosted environment. The frontend must set
`VITE_API_URL` and `VITE_OTP_API_URL` to the deployed backend URL before it is
built.
