{\rtf1\ansi\ansicpg1252\cocoartf2868
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 # SquadNod \'97 Project Context for Claude Code\
\
## What this is\
A real-time chat app with multiplayer games. Chat-first, games are a layer on top.\
Built with Next.js (App Router), Tailwind CSS, Socket.io, and Supabase (Phase 3).\
\
## Current status\
All architecture has been designed and specced in detail.\
Phase 2 code is written but not yet run or tested.\
Starting fresh implementation now.\
\
## Tech stack\
- Next.js 14 App Router\
- Tailwind CSS\
- Socket.io (custom Node.js server via server.js)\
- Supabase (auth + database \'97 Phase 3, not yet implemented)\
- Google Fonts: Bricolage Grotesque (display) + DM Sans (body)\
\
## File structure already designed\
server.js \'97 custom Node server, boots Next.js + Socket.io\
lib/socket.js \'97 client-side socket singleton\
app/globals.css\
app/layout.js\
app/page.js \'97 home screen (name entry, create/join room)\
app/room/[roomId]/page.js \'97 main room page, owns all state\
app/room/[roomId]/components/\
  TopBar.js\
  RejoinBanner.js\
  GameMenu.js\
  ChatView.js\
  ChatMessage.js\
  InviteCard.js\
  MemberList.js\
  GamePanel.js\
  GameLobby.js\
  GameQuestion.js\
  GameScoreboard.js\
  GameOver.js\
\
## Key architecture decisions\
- server.js runs both Next.js and Socket.io in one process\
- room.games is an array \'97 multiple games can run simultaneously\
- Each game has its own Socket.io sub-room: game:roomId:gameId\
- Game events all carry gameId so client knows which game they belong to\
- Chat stream is clean \'97 zero game noise, only a game-invite card type\
- Users can only be in one game at a time\
- Host transfers to next participant if host leaves\
- Game status: waiting | active | finished | ended\
\
## Socket events\
room:create, room:join\
chat:message\
game:create, game:join, game:spectate, game:start\
game:answer, game:wrong, game:correct\
game:timer, game:question, game:over\
game:leave, game:end, game:restart\
game:ended, game:card:update\
game:panel:close\
\
## Game catalog\
Four playable trivia types: world-history, pop-culture, science, music\
Three coming-soon categories: Word Games, Drawing\
\
## Design decisions\
- Font: Bricolage Grotesque for display, DM Sans for body\
- Game menu: dropdown anchored to game icon (top right), NOT a bottom sheet\
  - Small pointer triangle connecting card to button\
  - Body floats mid-screen for thumb reach\
- Room ID in topbar: shows copy icon on hover, copies full URL, shows "Copied!"\
- Game panel slides in from the LEFT, full screen\
- \uc0\u10005  closes panel only \'97 user stays in game, rejoin banner appears\
- Rejoin banner sits under topbar, pulsing dot, tappable full width\
- Leave button = permanent exit with inline confirmation\
- End button (host only) = terminates game with inline confirmation\
- Spectators: no Leave button, just \uc0\u10005 \
\
## Phase 3 (not started)\
- Supabase for auth (magic link) and database\
- Users table, rooms table, memberships table\
- Home screen becomes "Your Groups" list\
- Rooms persist across sessions\
\
## What to build first\
1. Scaffold the project (create-next-app, install dependencies)\
2. Implement server.js exactly as designed\
3. Implement all client components\
4. Test locally with two browser tabs\
5. Then move to Phase 3 Supabase integration}