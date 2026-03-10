# Pokedex

A server-rendered Pokedex web app showing all 151 Gen 1 Pokemon, built with Express and EJS.

## Features

- Browse all Gen 1 Pokemon in a card grid
- View detailed info for each Pokemon (stats, types, flavor text)
- Client-side search filtering by name
- In-memory caching of Pokemon data from PokeAPI

## Prerequisites

- Node.js 18+

## Getting Started

```bash
npm install
npm run build
npm start
```

The server starts on [http://localhost:3000](http://localhost:3000).

## Development

For development with auto-reload:

```bash
npm run dev
```

## Running Tests

```bash
npm test
```

## Tech Stack

- **Express** — HTTP server
- **EJS** — Server-side templating
- **PokeAPI** — Pokemon data source
- **Vitest** — Testing

## License

[MIT](LICENSE)
