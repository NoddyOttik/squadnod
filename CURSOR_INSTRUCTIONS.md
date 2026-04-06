# Cursor Instructions — SquadNod

Read this before making any changes in Cursor.

## What this project is

A real-time chat app with multiplayer games built on Next.js + Socket.io.
All architecture decisions are final. Do not introduce new patterns or abstractions.

## Critical rules

### Never touch the socket event names
All events are named and documented in README.md.
Renaming any event will silently break the client/server connection.

### The server is not a Next.js API route
`server.js` is a custom Node.js server that boots both Next.js and Socket.io.
Do not move socket logic into `app/api/` routes — Socket.io requires a persistent
connection which API routes do not support.

### State lives in page.js
`app/room/[roomId]/page.js` owns all state and socket subscriptions.
Child components receive data via props and call handlers via callbacks.
Do not add useState or useEffect for socket events in child components.

### gameId is always required for game events
Every game event carries a `gameId` field. The client ignores events whose
`gameId` doesn't match `myGameIdRef.current`. This is intentional — multiple
games can run simultaneously in the same room.

### The game panel slides from the LEFT
CSS transform: `-translate-x-full` (hidden) → `translate-x-0` (visible).
Do not change the slide direction.

## To run the project

```bash
npm install
npm run dev
```

## To test multiplayer

Open two browser tabs at http://localhost:3000.
Create a room in tab 1, join with the code in tab 2.

## Adding new trivia questions

Questions live in `server.js` in the `QUESTION_BANKS` object.
Each entry needs a `q` (question string) and `a` (answer string, lowercase).
Answers are matched case-insensitively and trimmed.

## Adding a new game type

1. Add a question bank to `QUESTION_BANKS` in `server.js`
2. Add the game to `GAMES_CATALOG` in `server.js` with `available: true`
3. The rest of the game logic (timer, scoring, rounds) is shared — no new code needed
   unless the game has different rules than trivia

## Phase 3 notes

Phase 3 adds Supabase for auth and persistence. When that work begins:
- The home screen (`app/page.js`) will be replaced with an auth + groups screen
- `server.js` will load rooms from Supabase on boot instead of starting empty
- Socket logic is unchanged — Supabase only affects identity and room persistence
