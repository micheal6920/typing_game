# 🏁 Typing Race

A fast, frontend-only typing speed test and racing game — no backend, no
database, no accounts. Just enter a name and start typing. Play solo or
race friends in real time, then host it for free on GitHub Pages.

**Live demo:** _add your GitHub Pages URL here after deploying_

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [How Typing Is Scored](#how-typing-is-scored)
- [How Multiplayer Works](#how-multiplayer-works)
- [Deploying to GitHub Pages](#deploying-to-github-pages)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Features

**Single Player**
- Random paragraph each round
- Live WPM speedometer, accuracy, and error count while you type
- Racing "start lights" countdown (3‑2‑1‑GO)
- Confetti + result banner with your name, WPM, accuracy, errors, and time

**Multiplayer**
- Create a race and share a 5‑character room code — no login for anyone
- Waiting room with per‑player ready states
- Synchronized countdown so everyone starts together
- Live race‑lane leaderboard — see opponents' avatars move as they type
- Ranked final leaderboard with medals for the podium

**No accounts, ever**
- Your name is just a game identifier for the current session
- Optionally remembered in `localStorage` so you don't have to retype it
- No registration, login, password reset, or user database anywhere

---

## Tech Stack

| Purpose        | Library                          |
|-----------------|-----------------------------------|
| UI framework    | React 18                          |
| Build tool      | Vite 5                            |
| Routing         | React Router (`HashRouter`)       |
| Multiplayer     | PeerJS (WebRTC, browser‑to‑browser) |
| Styling         | Plain CSS with design tokens (no framework) |
| Persistence     | `localStorage` only (no database) |

No custom backend, API server, or database is used anywhere in this project.

---

## Prerequisites

You need **Node.js** (which includes npm) installed.

Check if you already have it:
```bash
node --version
npm --version
```

If not installed, download the **LTS** version from
[nodejs.org](https://nodejs.org/) and install it with default options.
On Windows, restart your terminal after installing so it picks up the
updated PATH.

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
```

Vite will print a local URL, typically:
```
➜  Local:   http://localhost:5173/
```

Open that in your browser. Changes to any file hot‑reload automatically.

### Testing on your phone or another device

By default the dev server only binds to `localhost`. To make it reachable
from other devices on the same Wi‑Fi (useful for testing multiplayer
between a laptop and a phone):

```bash
npm run dev -- --host
```

Vite will then also print a **Network** URL — use that one on the other
device.

---

## Available Scripts

| Command              | What it does                                              |
|------------------------|-------------------------------------------------------------|
| `npm run dev`          | Start the local development server with hot reload         |
| `npm run dev -- --host`| Same, but reachable from other devices on your network      |
| `npm run build`        | Build an optimized production bundle into `dist/`           |
| `npm run preview`      | Serve the production build locally to sanity‑check it       |
| `npm run deploy`       | Build and publish `dist/` to the `gh-pages` branch on GitHub |

---

## Project Structure

```
typing-race/
├── index.html
├── package.json
├── vite.config.js
├── README.md
└── src/
    ├── App.jsx                 # Routes (Home / Single Player / Multiplayer)
    ├── main.jsx                # React entry point
    ├── index.css                # Design tokens, shared styles, animations
    │
    ├── pages/
    │   ├── Home.jsx              # Landing page
    │   ├── SinglePlayer.jsx      # Name → countdown → typing test → result
    │   └── Multiplayer.jsx       # Full room lifecycle (create/join/race/results)
    │
    ├── components/
    │   ├── Header.jsx
    │   ├── PlayerNameModal.jsx   # Name entry, shown before every game mode
    │   ├── Countdown.jsx         # Racing start-lights (3-2-1-GO)
    │   ├── TypingArea.jsx        # Core typing engine — the only component
    │   │                         # that re-renders on every keystroke
    │   ├── SpeedGauge.jsx        # Live WPM speedometer (SVG)
    │   ├── Timer.jsx             # Self-ticking elapsed-time display
    │   ├── ResultCard.jsx        # Single-player result banner
    │   ├── Leaderboard.jsx       # Multiplayer live + final leaderboard
    │   └── Confetti.jsx          # CSS-only confetti burst
    │
    ├── services/
    │   ├── storage.js            # localStorage: last name + local history only
    │   └── multiplayer.js        # PeerJS room/session logic (see below)
    │
    └── utils/
        ├── typingCalculator.js   # WPM / accuracy / error math
        ├── ranking.js            # Leaderboard sort + tie-break rules
        ├── paragraphs.js         # Pool of sample typing texts
        └── avatars.js            # Deterministic emoji + color per name
```

---

## How Typing Is Scored

**WPM (Words Per Minute)**
```
WPM = (correct characters ÷ 5) ÷ minutes elapsed
```
The "5 characters = 1 word" convention is standard across typing tests.
Only *correct* characters count, so mistakes lower your WPM — this is
sometimes called "net WPM."

**Accuracy**
```
Accuracy = (correct characters ÷ total typed characters) × 100
```

**Errors**
```
Errors = count of incorrectly typed characters
```

**Multiplayer ranking** — finished players are ordered by:
1. WPM (higher wins)
2. Accuracy (first tie‑breaker)
3. Completion time (second tie‑breaker, lower wins)

Players who don't finish are ranked below everyone who did, ordered by
how much of the paragraph they completed.

---

## How Multiplayer Works

Multiplayer uses **PeerJS**, a WebRTC wrapper, so players' browsers talk
**directly to each other** — race progress and results never pass through
any server this project runs.

### The one unavoidable dependency

Two browsers can't discover each other out of thin air. WebRTC requires a
brief *signaling* handshake to exchange connection details before a
direct link can open. This project doesn't run a signaling server of its
own — it uses **PeerJS's free public broker** (`0.peerjs.com`), operated
by the PeerJS maintainers. This keeps the whole project backend‑free for
you, but it does mean:

- Creating/joining a room depends on that public broker being reachable.
  It's generally reliable, but it's a third‑party service outside this
  project's control.
- There's no way to offer genuinely zero‑infrastructure multiplayer
  *discovery* in a browser — some minimal signaling point is unavoidable
  for any WebRTC app.

Once two players are connected, everything else (progress updates, final
results) flows directly peer‑to‑peer with no server involved.

### Topology

**Star, not full mesh.** The player who creates the room is the "host"
peer. Every other player connects *only* to the host — never to each
other directly. The host relays roster changes, the synchronized
countdown start time, and final results to everyone. This is simpler and
more reliable than a full mesh for small groups (works well for 2–8
players; a large tournament would strain the host's single connection).

---

## Deploying to GitHub Pages

### 1. Create a GitHub repository
Go to [github.com/new](https://github.com/new), name it (e.g.
`typing-race`), keep it **Public**, and don't initialize it with a
README (you already have one).

### 2. Push your local project

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

### 3. Install dependencies (if you haven't already)

```bash
npm install
```

### 4. Build and deploy

```bash
npm run build
npm run deploy
```

`npm run deploy` uses the `gh-pages` package (already configured in
`package.json`) to push the contents of `dist/` to a `gh-pages` branch.

### 5. Enable Pages in your repo settings

1. Open your repo on GitHub → **Settings → Pages**
2. Under **Source**, choose **Deploy from a branch**
3. Branch: `gh-pages`, folder: `/ (root)` → **Save**
4. Wait about a minute, then your site is live at:
   ```
   https://<your-username>.github.io/<repo-name>/
   ```

You don't need to configure a repo‑specific base path — this project
uses relative asset paths (`base: './'` in `vite.config.js`) and
`HashRouter` for routing, so it works correctly at any subpath.

### Updating the live site later

```bash
git add .
git commit -m "describe your change"
git push          # updates the source code on GitHub

npm run build
npm run deploy    # updates the live site
```
These are two separate steps — pushing to `main` does **not**
automatically redeploy the site.

---

## Troubleshooting

**`npm run deploy` fails with a Git/permissions error**
Make sure you've pushed to `origin` at least once (`git push -u origin
main`) and that you're logged into Git with access to the repo.

**Multiplayer room won't connect**
- Confirm both players have a working internet connection — the initial
  handshake needs to reach PeerJS's public broker.
- Corporate/school networks sometimes block WebRTC traffic; try a
  personal hotspot if it hangs on "Connecting…".
- The host's browser tab must stay open for the room to stay alive.

**Port already in use when running `npm run dev`**
```bash
npm run dev -- --port 3000
```

**Windows: PowerShell blocks script execution when activating things**
If you ever add a Python‑based tool to this repo and hit an execution
policy error activating a venv, run once (as your normal user):
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
(Not required for this project itself — it's pure Node/React.)

**Build works locally but the GitHub Pages site is blank**
Hard‑refresh the page (Ctrl/Cmd + Shift + R). If it's still blank, check
the browser console for a 404 on an asset — this usually means Pages is
serving from the wrong branch/folder; re‑check step 5 above.

---

## License

This project is provided as‑is for personal or educational use. Add a
license file (e.g. MIT) if you plan to publish it publicly and want to
be explicit about reuse terms.
