# SquadNod

Real-time chat app with multiplayer games. Chat-first — games live as a layer on top.

## Stack

- Next.js 14 (App Router)
- Tailwind CSS
- Socket.io (custom Node.js server)
- Fonts: Bricolage Grotesque + DM Sans

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Run in development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Test with multiple players

Open two or more browser tabs. Create a room in one tab, join with the room code in the others.

## How it works

### Entry
- Home screen: enter a name, create a room or join with a code
- Names must be unique per room (case-insensitive check)
- Room code is auto-generated (6 characters)
- Share the room link via the copy icon next to the room ID

### Chat
- All members share a single **room** chat stream
- System messages for join/leave events
- Each active game has its own **game chat** (lobby through scoreboard) — messages never appear in room chat, and room chat never appears in game chat

### Games
- Tap the 🎮 icon in the top bar to open the game menu
- Game menu is a dropdown anchored to the icon, not a bottom sheet
- Pick any available game to start it — you're auto-joined as a participant
- Others see an invite card in chat: Join / Spectate / Ignore
- Multiple games can run simultaneously in the same room
- Users can only be in one game at a time

### Game panel
- Slides in from the left, full screen
- ✕ closes the panel only — you stay in the game
- Rejoin banner appears under the top bar when your game is active but panel is closed
- Leave button: permanent exit, frees you to join another game
- End button (host only): terminates game for everyone with scores at time of end
- Host transfers to next participant if host leaves

### Spectators
- See all questions, answers, and scores in real time
- Cannot submit answers
- Only the ✕ button — no Leave/End controls needed

## Project structure

```
squadnod/
├── server.js                          # Custom server: Next.js + Socket.io
├── lib/
│   └── socket.js                      # Client-side socket singleton
└── app/
    ├── globals.css                    # Fonts + Tailwind base
    ├── layout.js
    ├── page.js                        # Home screen
    └── room/
        └── [roomId]/
            ├── page.js                # Room page — owns all state
            └── components/
                ├── TopBar.js          # Room ID + copy + game icon
                ├── RejoinBanner.js    # "Game in progress" strip
                ├── GameMenu.js        # Dropdown game catalog
                ├── ChatView.js        # Message feed + input
                ├── ChatMessage.js     # Message | system | invite card router
                ├── InviteCard.js      # Three-state game invite card
                ├── MemberList.js      # Collapsible presence list
                ├── GamePanel.js       # Slide-in panel container
                ├── GameChatPanel.js   # Game-only chat (lobby + play)
                ├── GameLobby.js       # Waiting room inside panel
                ├── GameQuestion.js    # Question + timer + answer input
                ├── GameScoreboard.js  # Live scores during game
                └── GameOver.js        # End state + final scores
```

## Socket events

| Event | Direction | Description |
|---|---|---|
| `room:create` | client → server | Create a new room |
| `room:join` | client → server | Join a room by ID |
| `room:members` | server → room | Updated member list |
| `chat:message` | both | Room chat message or game-invite card |
| `game:chat:message` | both | Game-only chat for participants/spectators of that game |
| `game:create` | client → server | Start a new game from catalog |
| `game:join` | client → server | Join a game as participant |
| `game:spectate` | client → server | Join a game as spectator |
| `game:start` | client → server | Host starts the game |
| `game:answer` | client → server | Submit an answer |
| `game:leave` | client → server | Permanently leave a game |
| `game:end` | client → server | Host ends game early |
| `game:restart` | client → server | Host restarts finished game |
| `game:question` | server → game | New question for all in game |
| `game:timer` | server → game | Countdown tick |
| `game:correct` | server → game | Correct answer + reveal |
| `game:wrong` | server → socket | Wrong answer (private) |
| `game:over` | server → game | Game finished naturally |
| `game:ended` | server → game | Game terminated by host |
| `game:card:update` | server → room | Updated invite card state |

## Phase 3 (not yet built)

- Supabase auth (magic link email sign-in)
- Persistent rooms and user accounts
- "Your Groups" home screen
- Users table, rooms table, memberships table
