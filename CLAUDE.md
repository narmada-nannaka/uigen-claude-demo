# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup       # First-time setup: install deps, generate Prisma client, run migrations
npm run dev         # Start dev server with Turbopack
npm run build       # Production build
npm run lint        # ESLint
npm test            # Run Vitest unit tests
npm run db:reset    # Reset SQLite database (--force, destructive)
```

Requires an `ANTHROPIC_API_KEY` env var for live AI generation; without it the app falls back to a mock provider returning static code.

## Architecture

**UIGen** is a Next.js 15 (App Router) app that lets users describe React components in a chat interface, then generates and previews them live using Claude AI.

### Routing

- `/` — Home; redirects authenticated users to their latest project
- `/[projectId]` — Protected project workspace
- `/api/chat` — Server-sent events endpoint for AI streaming

### State: Two React Contexts

- **`FileSystemProvider`** (`src/lib/contexts/file-system-context.tsx`) — Owns the virtual file system (VFS) state and exposes file CRUD operations.
- **`ChatProvider`** (`src/lib/contexts/chat-context.tsx`) — Owns chat messages and wires Vercel AI SDK's `useChat` to the `/api/chat` route.

### Virtual File System

`src/lib/file-system.ts` — An in-memory class (`VirtualFileSystem`) backed by a `Map`. No files are ever written to disk during generation. The VFS serializes/deserializes to JSON for persistence in the database. AI tools write to this VFS via `str_replace_editor` and `file_manager` tool calls.

### AI Integration

- **Route:** `src/app/api/chat/route.ts` — Uses Vercel AI SDK `streamText` with two tools: `str_replace_editor` (create/view/replace/insert file content) and `file_manager` (rename/delete).
- **Provider:** `src/lib/provider.ts` — Returns Anthropic SDK (`claude-haiku-4-5` by default) or a mock provider when no API key is set.
- **Prompts:** `src/lib/prompts.ts` — System prompt instructing the model how to generate React components.

### Preview Rendering

`src/components/preview/preview-frame.tsx` — Renders an `<iframe srcdoc=...>` with a dynamically generated import map. Babel standalone transforms JSX in the browser. Auto-detects the entry point (`App.jsx/tsx` or `index.jsx/tsx`).

### Auth

JWT-based sessions via `jose`, stored in HTTP-only cookies (7-day expiry). Server actions in `src/actions/index.ts` handle sign-up/sign-in/sign-out. Middleware in `src/middleware.ts` protects API routes.

### Database

Prisma + SQLite. Two models:
- `User` — id, email (unique), password, createdAt, updatedAt
- `Project` — id, name, userId (nullable), messages (JSON string), data (JSON string of serialized VFS)

### Key Path Alias

`@/*` maps to `./src/*` — use this for all internal imports.

## Code Style

Use comments sparingly — only on complex or non-obvious logic.

## Testing

Vitest with jsdom. Test files live in `__tests__` subdirectories. Run a single test file:

```bash
npx vitest run src/path/to/__tests__/file.test.ts
```
