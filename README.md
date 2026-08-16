# Javascript Snake Game
## An old-school snake game multiplayer online

# ytb_snake_js
(original version from a youtube video linked below)
https://youtu.be/J42SZXS-_Qo

Live demo here: https://carubbi-snake.azurewebsites.net

## Features

- Online multiplayer up to 8 players in the same room.
- Local multiplayer game up to 4 players in the same keyboard.
- Multiple rooms to enjoy with your friends.
- Modern client built with Next.js + Tailwind (dark "gamer" theme, slide-in settings drawer).

## Architecture

- `multiplayer/backend` — Express 5 + Socket.IO server written in TypeScript.
- `multiplayer/client` — Next.js (App Router) + Tailwind CSS v4 client, dev server on port 3001.

## Installation

Requires [Node.js](https://nodejs.org/) v18+.

```sh
cd ytb_snake_js
npm i
```

## Development

Runs backend (port 3000) and client (port 3001) together:

```sh
npm run dev
```

Or separately:

```sh
npm run dev:server   # tsx watch on multiplayer/backend/src/server.ts
npm run dev:client   # Next.js dev on port 3001
```

The client connects to `http://localhost:3000` by default; override with `NEXT_PUBLIC_SOCKET_URL`.

## Production build

Single process serves both the statically exported client and the socket.io backend:

```sh
npm run build        # compiles backend (tsc) + statically exports client (client/out)
npm start            # serves client + socket.io from multiplayer/backend/dist
```

Azure deploy (`.github/workflows/main_carubbi-snake.yml`) runs `npm install && npm run build` on Node 24, then deploys the repo to the `carubbi-snake` Web App; the app's start command is `npm start`.

## License

MIT

**Free Software, Hell Yeah!**
