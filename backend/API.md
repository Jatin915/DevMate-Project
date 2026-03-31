# DevMate API

Base URL: `http://localhost:3000/api` (or your deployed host).

All endpoints except `POST /auth/signup` and `POST /auth/login` require:

```http
Authorization: Bearer <JWT>
Content-Type: application/json
```

---

## Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/signup` | Register |
| POST | `/auth/login` | Login |
| GET | `/auth/profile` | Current user |
| PUT | `/auth/update-profile` | Update name/email |

**Signup body:** `{ "name", "email", "password" }`  
**Login body:** `{ "email", "password" }`  
**Response:** `{ "success", "token", "user": { "id", "name", "email", "role" }, "onboarding" }`

**Update profile body:** `{ "name"?, "email"? }`

---

## Playlists

| Method | Path | Description |
|--------|------|-------------|
| POST | `/playlists/add` | Add playlist from YouTube URL |
| GET | `/playlists/user` | List current user’s playlists |
| GET | `/playlists/:id` | Get one playlist (with videos) |
| DELETE | `/playlists/:id` | Delete playlist (cascades videos, tasks, related progress/submissions) |

**Add body:** `{ "playlistUrl", "title"?, "description"? }`  
Requires a URL containing `list=<playlistId>`. With `YOUTUBE_API_KEY` set, videos are imported from the YouTube Data API.

---

## Videos

| Method | Path | Description |
|--------|------|-------------|
| GET | `/videos/:playlistId` | List videos for a playlist (must own playlist) |

---

## Tasks

| Method | Path | Description |
|--------|------|-------------|
| GET | `/tasks/:videoId` | List tasks (auto-seeds 3 default tasks if none exist) |
| POST | `/tasks/complete` | Mark task complete |
| GET | `/tasks/user-progress` | Summary + per-video breakdown |

**Complete body:** `{ "taskId" }`

---

## Progress

| Method | Path | Description |
|--------|------|-------------|
| GET | `/progress/user` | All progress rows (populated) |
| POST | `/progress/update` | Upsert progress |

**Update body:** `{ "taskId", "videoId"?, "completed": boolean }`

---

## Dashboard

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard/summary` | Aggregated stats |

**Response fields:** `totalTasks`, `completedTasks`, `pendingTasks`, `totalPlaylists`, `totalVideos`, `learningProgressPercentage`

---

## Job readiness

| Method | Path | Description |
|--------|------|-------------|
| GET | `/job-readiness/score` | Recomputes and returns stored scores |
| GET | `/job-readiness/report` | Narrative report + strengths/weaknesses |

---

## Chat

| Method | Path | Description |
|--------|------|-------------|
| POST | `/chat/message` | Store message + placeholder assistant reply |
| GET | `/chat/history?limit=50` | Recent messages |

**Message body:** `{ "message" }`

---

## Roadmap

| Method | Path | Description |
|--------|------|-------------|
| GET | `/roadmap` | All roadmap rows for user |
| POST | `/roadmap/update` | Upsert by `language` |

**Update body:** `{ "language", "level"?, "miniProjectsCompleted"?, "tasksCompleted"? }`

---

## Skill-Based onboarding and assessment

| Method | Path | Description |
|--------|------|-------------|
| POST | `/user/skills` | Save selected known languages |
| GET | `/user/skills` | Get onboarding/assessment progress |
| GET | `/assessments` | Get assessment tasks for selected languages |
| POST | `/assessment/submit` | Submit assessment code for one language |

**Save skills body:** `{ "knownLanguages": ["HTML", "CSS", "JavaScript"] }`  
**Submit body:** `{ "language": "JavaScript", "code": "..." }`

`POST /assessment/submit` returns:
- `score` (`0-100`)
- `passed` (`true` when `score >= 80`)
- `assessmentCompleted` (all selected languages passed)
- `recommendedNextLanguage` (e.g., `React` when HTML/CSS/JavaScript are all passed)

OpenAI evaluation is used when `OPENAI_API_KEY` is present; otherwise the backend uses deterministic fallback scoring.

---

## Code submission

| Method | Path | Description |
|--------|------|-------------|
| POST | `/code/submit` | Submit code for a task |

**Body:** `{ "taskId", "code" }`  
**Response:** includes `submission`, `score`, `feedback`, `status`.

### Legacy (demo)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/submit` | Same as submit but body `{ "code" }` only; binds to first task |

---

## Errors

JSON shape: `{ "success": false, "message": "..." }`  
Typical codes: `400` validation, `401` auth, `403` forbidden, `404` not found, `409` conflict, `500` server.

---

## Health

`GET /health` — no auth.

---

## Run the backend locally

1. Install MongoDB locally or create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Copy `.env.example` to `.env` and set `MONGODB_URI`, `JWT_SECRET`, and optionally `YOUTUBE_API_KEY`.
3. From the `backend` folder: `npm install` then `npm run dev` (or `npm start`).
4. Confirm `GET http://localhost:3000/health` returns JSON.

## Connect the frontend

1. **Base URL:** Point your React app at `http://localhost:3000/api` (or your deployed API URL).
2. **CORS:** Set `CLIENT_ORIGIN` in `.env` to your Vite dev URL (e.g. `http://localhost:5173`).
3. **Proxy (optional):** In `vite.config.js`, add `server.proxy` so `/api` forwards to the backend and you can call `fetch('/api/...')` without CORS issues during development.
4. **Auth:** After `POST /auth/login` or `/auth/signup`, store the JWT (e.g. `localStorage`) and send `Authorization: Bearer <token>` on protected requests.
5. **Decorative code in `CodeBackground.jsx`:** `/api/roadmap` and `/api/submit` require the same auth header; replace mock navigation with real login + API calls when wiring the UI.
