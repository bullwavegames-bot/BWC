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

The included `render.yaml` configures the Node web service, health check, and
required secret placeholders. Connect the repository as a Render Blueprint or
use the same values when creating a Web Service manually.

Phone login uses MSG91 SendOTP. Set `MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID`,
`MSG91_SENDER_ID`, and `MSG91_OTP_LENGTH` on the backend service. Keep
`OTP_TEST_ENABLED=false` in every hosted environment. The frontend must set
`VITE_API_URL` and `VITE_OTP_API_URL` to the deployed backend URL before it is
built.
