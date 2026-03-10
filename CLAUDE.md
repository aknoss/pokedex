# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Start server:** `npm start` (runs `node server.js`, default port 3000)
- **Install deps:** `npm install`
- **Run tests:** `npm test` (vitest, runs all `tests/**/*.test.js`)
- **Run tests in watch mode:** `npx vitest`

## Architecture

Express + EJS server-rendered Pokedex app showing Gen 1 Pokemon (IDs 1–151).

**Data flow:** `server.js` → `src/routes/pokemon.js` → `src/services/pokeapi.js` → PokeAPI

- **server.js** — Entry point. Sets up Express with EJS views and static file serving. Eagerly warms the Pokemon cache before listening.
- **src/services/pokeapi.js** — Fetches from pokeapi.co in batches of 20, caches all 151 Pokemon in memory. Species flavor text is fetched and cached on-demand per Pokemon. Cache is permanent (survives until server restart).
- **src/routes/pokemon.js** — Factory function `createRouter(service?)` returning an Express router. Two routes: `GET /` (card grid) and `GET /pokemon/:id` (detail page). Accepts optional injected service for testing.
- **views/** — EJS templates. `index.ejs` renders the card grid, `detail.ejs` renders individual Pokemon. Shared layout via `partials/header.ejs` and `partials/footer.ejs`.
- **public/js/filter.js** — Client-side search filtering by Pokemon name using `data-name` attributes on cards.
- **public/css/styles.css** — All styling in one file. Type badge colors use `.type-{name}` classes (e.g., `.type-fire`).

## Key Details

- Requires Node 18+ (uses native `fetch`).
- Only two dependencies: `express` and `ejs`.
- Sprites are hotlinked from PokeAPI's GitHub (`official-artwork/{id}.png`), not stored locally.
