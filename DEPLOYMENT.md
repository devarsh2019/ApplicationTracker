# Deploy: Vercel + Render + Neon

Free-tier stack for Application Tracker.

| Part | Service | URL example |
|------|---------|-------------|
| Frontend | [Vercel](https://vercel.com) | `https://your-app.vercel.app` |
| Backend | [Render](https://render.com) | `https://application-tracker-api.onrender.com` |
| Database | [Neon](https://neon.tech) | PostgreSQL (serverless) |

---

## 1. Neon (database)

1. Create a project at [neon.tech](https://neon.tech).
2. Copy connection details from **Dashboard → Connection details**.
3. Build a JDBC URL (Neon requires SSL):

```text
DATABASE_URL=jdbc:postgresql://ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
DB_USERNAME=neondb_owner
DB_PASSWORD=your-password
```

Flyway runs automatically on first backend start.

---

## 2. Render (backend)

### Option A — Blueprint (recommended)

1. Push this repo to GitHub.
2. In Render: **New → Blueprint** → connect repo → use root `render.yaml`.
3. Set these env vars when prompted:
   - `DATABASE_URL`, `DB_USERNAME`, `DB_PASSWORD` (from Neon)
   - `CORS_ALLOWED_ORIGINS` = your Vercel URL (set after step 3, e.g. `https://your-app.vercel.app`)
   - `JWT_SECRET` — long random string (32+ chars); Render can auto-generate one
4. Deploy. Copy the service URL, e.g. `https://application-tracker-api.onrender.com`.

### Option B — Manual web service

| Setting | Value |
|---------|--------|
| Root directory | `Backend/ApplicationTracker` |
| Runtime | Docker |
| Dockerfile | `./Dockerfile` |
| Health check | `/actuator/health` |
| Plan | Free |

**Environment variables:**

```text
SPRING_PROFILES_ACTIVE=prod
APP_SEED_DEMO_USER=false
SERVER_PORT=8080
DATABASE_URL=jdbc:postgresql://...neon.tech/neondb?sslmode=require
DB_USERNAME=...
DB_PASSWORD=...
JWT_SECRET=...
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
```

**Free tier note:** Render sleeps after ~15 minutes with no traffic. The first request after idle may take 30–60 seconds.

---

## 3. Vercel (frontend)

1. Import the GitHub repo in [Vercel](https://vercel.com).
2. Set **Root Directory** to `Frontend/ApplicationTracker`.
3. Edit `vercel.json` — replace the placeholder:

```json
"destination": "https://application-tracker-api.onrender.com/api/:path*"
```

Use your actual Render URL (no trailing slash).

4. Deploy. Vercel builds with `npm run build` and serves `dist/ApplicationTracker/browser`.

The `/api/*` rewrite proxies API calls to Render, so the app uses same-origin `/api` and avoids CORS issues in the browser.

5. Go back to Render and set `CORS_ALLOWED_ORIGINS` to your Vercel URL if not already set. Redeploy the backend.

---

## 4. Verify

1. Open `https://your-app.vercel.app`
2. Register a new account (demo user is off in prod).
3. Add an application and a calendar event.
4. Check backend health: `https://your-app.onrender.com/actuator/health`

---

## Environment summary

| Variable | Where | Example |
|----------|--------|---------|
| `DATABASE_URL` | Render | `jdbc:postgresql://...neon.tech/neondb?sslmode=require` |
| `DB_USERNAME` | Render | from Neon |
| `DB_PASSWORD` | Render | from Neon |
| `JWT_SECRET` | Render | random 32+ char secret |
| `CORS_ALLOWED_ORIGINS` | Render | `https://your-app.vercel.app` |
| `SPRING_PROFILES_ACTIVE` | Render | `prod` |
| `APP_SEED_DEMO_USER` | Render | `false` |
| Render URL | `vercel.json` | rewrite destination |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| First load very slow | Render free tier waking up — normal |
| CORS error | Set `CORS_ALLOWED_ORIGINS` to exact Vercel URL (https, no trailing slash) |
| DB connection failed | Ensure `?sslmode=require` in JDBC URL for Neon |
| 404 on refresh | Vercel SPA rewrite to `/index.html` is in `vercel.json` |
| Flyway / schema error | Check Neon DB is empty on first deploy; migrations run from `V1` |

---

## Upgrade path

When traffic grows, upgrade Render to a paid plan (~$7/mo) for always-on API and consider Neon paid tier for more storage/compute.
