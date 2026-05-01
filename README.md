# BoardFlow

A fullstack Kanban board with real-time collaboration, rich text cards, and end-to-end encryption.

![BoardFlow screenshot](docs/Screenshot%202026-05-01%20at%207.59.18%20PM.png)

## Quick Start

```bash
git clone <repo-url>
cd cocompetence
docker compose up
```

Open [http://localhost:5173](http://localhost:5173) in your browser. No additional setup required.

> First boot takes ~60 seconds while Docker pulls images and the database initializes. The frontend will be ready once the backend health checks pass.

## What's Inside

| Service    | URL                          | Description               |
|------------|------------------------------|---------------------------|
| Frontend   | http://localhost:5173        | React SPA (Vite dev mode) |
| Backend    | http://localhost:4000        | Express REST API          |
| Database   | postgres (internal)          | PostgreSQL 16             |
| Test DB    | localhost:5433               | Ephemeral PostgreSQL for tests |

## Running Tests

Tests run inside the backend container against an isolated test database:

```bash
docker compose exec backend yarn test
```

Frontend tests:

```bash
docker compose exec frontend yarn test
```

## Features

### Core
- **Authentication** — Email/password registration and login with JWT stored in httpOnly cookies. Sessions persist across page refreshes.
- **Kanban board** — Lanes can be created, renamed, and deleted.
- **Cards** — Create, edit, and delete cards with a title and rich-text description. Card content persists to PostgreSQL.
- **Drag & Drop** — Move cards between lanes and reorder within lanes. Uses fractional positioning so re-ordering never renumbers everything. Includes optimistic updates with rollback on failure.

### Stretch Goals Completed
- **Real-time collaboration** — Server-Sent Events broadcast `board:changed` events to all connected clients. Other users see your changes without refreshing.
- **Rich text cards** — Cards use Toast UI Editor with full Markdown support (bold, italic, headings, code blocks, tables) and embedded images.
- **End-to-end encryption** — Card titles and descriptions are encrypted with AES-256-GCM before being written to the database. The server decrypts them for authenticated users. Database administrators see only ciphertext.
- **Dark mode + settings panel** — Settings panel (gear icon) controls theme (light/dark), animation speed, card size, and board density. All settings persist to localStorage.
- **Full REST API** — Every operation is available via REST. OpenAPI 3.1.0 schema is included at [`packages/backend/openapi.json`](packages/backend/openapi.json).

## Tech Stack

| Layer     | Technology                                                  |
|-----------|-------------------------------------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS, TanStack Query, dnd-kit       |
| Backend   | Node.js 20, Express, TypeScript (tsx)                       |
| Database  | PostgreSQL 16                                               |
| Auth      | JWT (httpOnly cookies), bcryptjs                            |
| Realtime  | Server-Sent Events (SSE)                                    |
| Encryption| AES-256-GCM (Node.js built-in crypto)                       |
| Testing   | Vitest, Supertest, React Testing Library                    |
| Monorepo  | Yarn workspaces (backend / frontend / shared)               |

## Architecture Decisions & Tradeoffs

### Shared board model
All authenticated users share a single board. There is no concept of per-user boards or team workspaces. This kept the data model simple but means anyone who registers can see and edit all cards. A multi-tenant model would require a `boards` table and ownership joins throughout.

### Encryption key management
Card content is encrypted with a key derived from `JWT_SECRET` (or `CARD_ENCRYPTION_KEY` if set separately). There is one key for all users. This protects against database dumps but not against a compromised server — the server must hold the key to decrypt responses. Per-user client-side encryption would be stronger but would break search and server-side rendering.

### Real-time via SSE (not WebSockets)
SSE is simpler to deploy (standard HTTP, no upgrade handshake, works through proxies) and sufficient for read-fan-out. The tradeoff: all connected clients re-fetch the full board on any change rather than receiving a delta. SSE state lives in memory, so it does not survive backend restarts and does not scale across multiple backend instances. Redis pub/sub + WebSockets would be needed for horizontal scaling.

### Fractional positioning
Cards and lanes use floating-point positions (e.g., 1.0, 2.0, 1.5) to allow insertion between items without renumbering. When gaps shrink below 0.001 the server renormalizes the entire lane back to integer spacing. This is simple and correct but produces occasional full-column writes on dense reordering.

### No migration tool
SQL schema files are read in alphabetical order at startup. There is no versioned migration system (no Flyway, Liquibase, or Drizzle migrate). Adding a new column requires a new numbered SQL file and a container restart. This was a speed tradeoff — acceptable for a prototype, not for production.

### Vite dev server in production container
The frontend Docker container runs `vite dev`, not a production build. This means HMR is active, bundle splitting is disabled, and there is no CDN-ready static output. Build time and startup are faster, but serving a production audience would require switching to `vite build` + a static file server (nginx).

## What Works

- Register and log in; session survives refresh
- Create, edit, delete cards; content is preserved between sessions
- Drag cards between lanes and within a lane; position is saved to the database
- Create and delete lanes
- Rich text editing (Markdown, headings, code, tables)
- Real-time updates: open two browser windows, edit a card in one, see it update in the other
- Card content is encrypted at rest (check `packages/backend/src/encryption.ts` for the scheme)
- Settings panel: dark mode, animation speed, card size, board density
- REST API: full CRUD accessible without the browser UI (see `openapi.json`)
- Backend test suite: auth, cards, lanes, events, encryption, SQL injection safety
- Frontend test suite: board rendering, card interaction, realtime hook

## Known Limitations

- **No private boards** — Every user sees every card. Adding board ownership would require a schema change.
- **No conflict resolution** — If two users drag the same card simultaneously, the last write wins. There is no operational transform or CRDT.
- **No password reset** — Forgot-password flow requires an email delivery service (out of scope for this challenge).
- **No rate limiting** — Auth endpoints are not rate-limited. A production deployment should add rate limiting (e.g., express-rate-limit) in front of `/api/auth`.
- **Single-server realtime** — SSE connections are stored in process memory. Restarting the backend drops all clients and they reconnect on next board interaction. Multiple backend replicas would not share events.
- **Soft deletes accumulate** — Deleted cards are marked with `deleted_at` but not purged. The table grows indefinitely; a periodic cleanup job would be needed at scale.
- **No image upload backend** — The rich text editor accepts images but stores them as base64 data URIs inside the card content. Large images inflate the encrypted payload size considerably.

## Project Structure

```
.
├── docker-compose.yml
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── routes/        # Express route handlers (auth, cards, lanes, events)
│   │   │   ├── db/            # PostgreSQL client and migrations
│   │   │   ├── encryption.ts  # AES-256-GCM encrypt/decrypt
│   │   │   └── index.ts       # Server entry point
│   │   ├── tests/             # Vitest + Supertest integration tests
│   │   └── openapi.json       # OpenAPI 3.1.0 schema
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── components/    # React components (Board, Lane, Card, modals)
│   │   │   ├── hooks/         # useBoardData, useRealtimeBoard, useSettings
│   │   │   └── api/           # Typed API client (fetch wrappers)
│   │   └── src/__tests__/     # Vitest + React Testing Library tests
│   └── shared/
│       └── src/types.ts       # Shared TypeScript interfaces (User, Card, Lane)
└── README.md
```
