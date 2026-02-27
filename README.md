# Insider Tracker — UI

Next.js frontend for the Insider Tracker. Displays SEC insider trade data alongside
your personal trade log and performance tracking.

---

## Pages

- `/` — Dashboard with stats overview and recent activity feeds
- `/insider` — Filterable table of insider trades (ticker, date, type, value)
- `/my-trades` — Personal buy/sell log with add/delete
- `/performance` — Return tracking with bar chart and price snapshot updates

---

## Local Development

```bash
npm install
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Visit `http://localhost:3000`. Make sure the FastAPI backend is running locally too.

---

## Production Deployment (VPS)

```bash
git clone <this-repo> insider-ui
cd insider-ui

cp .env.local.example .env.local
nano .env.local
# Set: NEXT_PUBLIC_API_URL=http://yourdomain.com/api

npm install
npm run build

# Copy static assets into standalone output (required)
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public 2>/dev/null || true
```

Then run via systemd — see the `vps-config` repo for the service file.

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the FastAPI backend |

---

## Stack

- Next.js 14 (App Router, standalone output)
- TypeScript
- Tailwind CSS
- Recharts (performance bar chart)
- Lucide React (icons)
