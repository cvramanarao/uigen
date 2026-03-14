# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Next.js with Turbopack)
npm run build        # Production build
npm run lint         # Run ESLint
npm run test         # Run vitest tests
npm run setup        # Install deps + generate Prisma client + run migrations
npm run db:reset     # Reset database (drops all data)
```

Run a single test file:
```bash
npx vitest run src/lib/__tests__/file-system.test.ts
```

## Architecture

UIGen is an AI-powered React component generator with live preview. Users describe components via chat, and Claude generates code that renders in a sandboxed iframe preview.

### Core Flow

1. **Chat Interface** (`src/components/chat/`) - User sends message describing desired component
2. **API Route** (`src/app/api/chat/route.ts`) - Streams response from Claude using Vercel AI SDK with two tools:
   - `str_replace_editor` - Creates/edits files (view, create, str_replace, insert commands)
   - `file_manager` - Renames/deletes files
3. **Virtual File System** (`src/lib/file-system.ts`) - In-memory file system, no disk writes. Files stored as `Map<string, FileNode>`
4. **JSX Transformer** (`src/lib/transform/jsx-transformer.ts`) - Uses Babel standalone to compile JSX/TSX to ES modules. Creates blob URLs for each file and builds an import map
5. **Preview Frame** (`src/components/preview/PreviewFrame.tsx`) - Sandboxed iframe that loads compiled code via import maps. Entry point defaults to `/App.jsx`

### Context Providers

- `FileSystemProvider` - Manages virtual file system state, handles tool calls from chat
- `ChatProvider` - Wraps `useChat` from `@ai-sdk/react`, syncs file system to API requests

### Key Conventions

- Generated code uses `@/` import alias for local files (e.g., `@/components/Button`)
- All generated projects must have `/App.jsx` as the entry point
- Tailwind CSS v4 is loaded via CDN in the preview iframe
- Third-party packages in generated code are loaded from esm.sh

### Database

SQLite via Prisma. Schema defined in `prisma/schema.prisma` - reference it for data structure.

Two models:
- `User` - Email/password auth
- `Project` - Stores serialized messages and file system state as JSON strings

## Testing

Uses Vitest with jsdom environment. Test files are colocated in `__tests__` directories.
