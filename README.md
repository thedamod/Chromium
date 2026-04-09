# Chromium Tools

Chromium Tools is a small browser-based utility suite for file and text transforms. The app is organized as a set of focused tools rather than a broad dashboard, which keeps each workflow simple and fast to reach.

## What’s Included

- Image ↔ Base64
- Image to ICO
- Markdown to PDF
- Image Converter
- Image Compressor
- Regex DSL
- About page

## Stack

- TanStack Start
- TanStack Router
- React 19
- Vite
- Tailwind CSS 4
- shadcn/ui components

## Development

Install dependencies:

```bash
bun install
```

Run the dev server:

```bash
bun --bun run dev
```

## Build

Create a production build:

```bash
bun --bun run build
```

The production build is configured for Vercel through Nitro and writes output to `.vercel/output`.

## Scripts

- `bun --bun run dev` - start the dev server
- `bun --bun run build` - create a production build
- `bun --bun run preview` - preview the production build locally
- `bun --bun run test` - run the test suite
- `bun --bun run lint` - run Biome lint
- `bun --bun run format` - format the codebase
- `bun --bun run check` - run Biome check

## Project Structure

- `src/routes/` contains the file-based routes
- `src/components/` contains shared UI and tool components
- `src/lib/` contains utility helpers and worker code
- `public/` contains static assets like icons and the manifest

## Routing

Routes are defined with TanStack Router file-based routing. The home page lives in `src/routes/index.tsx`, and each utility has its own route file under `src/routes/`.

## Deployment

This project is set up for Vercel using Nitro. Keep `pnpm-lock.yaml` in sync with `package.json`, since Vercel installs with a frozen lockfile by default.
