# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Postchi** is a text-based HTTP client and IDE written in TypeScript using React and Shadcn UI. It's a Tauri application that runs on Windows, macOS, Linux, and in browsers by abstracting the filesystem and accepting browser API limitations.

## Code Standards

1. Functional over Object-oriented: Prefer functions and pure types over classes
2. Types over classes: Use TypeScript types rather than class-based abstractions
3. Testability without mocks: Code must be testable without complex mocking requirements

## Architecture

### Frontend (TypeScript + React)

The frontend is organized into functional domains:

- **src/lib/http/** - HTTP parsing, linting, and execution
  - `parser/`: Lezer-based HTTP grammar and parser generation
  - `linter/`: HTTP linting rules
  - `autocomplete/`: CodeMirror autocomplete integration
  - `decoration/`: Syntax highlighting and text decorations
  - `functions/`: HTTP template functions (e.g., `<user-agent>`, `<timestamp>`)

- **src/lib/environments/** - Environment variable system
  - `parser/`: Lezer-based environment variable grammar
  - `linter/`: Validation for environment files

- **src/lib/data/** - Core data models and operations
  - `project/`: Project structure and metadata
  - `files/`: File system abstraction (`FileStorage` interface) supporting both memfs and native filesystems
  - `http/`: HTTP request execution, response handling, and template variable resolution
  - `import/`: Postman collection import logic

- **src/lib/hooks/** - Custom React hooks for core functionality
  - File watching, file tree management, persistent state

- **src/components/** - React UI components (mostly shadcn-based)

- **src/editors/** - CodeMirror-based editors for HTTP requests and environments

- **src/active-environment/** - Environment context and selection management

- **src/http/** - HTTP request/response display and execution UI

### Backend (Rust via Tauri)

- **src-tauri/src/** - Rust backend providing system integration
  - Uses Tauri plugins: fs, http, log, opener, os, store
  - Handles file I/O, HTTP requests, and system commands

### Key Files and Patterns

- **FileStorage abstraction**: Enables testability by allowing in-memory (memfs) or real filesystems
- **Result types**: Uses `true-myth` library for error handling without try-catch
- **Parser generation**: Lezer grammars in `http.grammar` and `environments.grammar` must be compiled with `pnpm run parsers`
- **React Context**: Used for theme and environment selection

## Development Commands

### Build and Run
- `pnpm install` - Install dependencies
- `pnpm run dev` - Start Tauri dev server (includes Vite HMR on port 1420)
- `pnpm run build` - TypeScript check + Vite production build
- `pnpm run preview` - Preview production build locally
- `pnpm run tauri dev` - Run Tauri dev directly (usually use `pnpm run dev`)
- `pnpm run tauri build` - Create production binaries

### Parsers and Grammars
- `pnpm run parsers` - Regenerate parsers from grammar files (http.grammar, environments.grammar)
- Required before testing if grammar files changed

### Testing
- `pnpm run test` - Run all tests (auto-generates parsers first)
- `pnpm run test src/lib/http/parser/http.test.ts` - Run specific test file
- Tests are co-located with source using `.test.ts` suffix
- Test data and utilities can use `FileStorage` abstraction for testability without mocks

## Configuration Files

- **vite.config.ts** - Frontend bundling with Tailwind CSS and Tauri dev integration
- **tsconfig.json** - TypeScript configuration with path alias `@/*` → `src/*`
- **src-tauri/tauri.conf.json** - Tauri app configuration (window size, plugin settings)
- **src-tauri/Cargo.toml** - Rust dependencies and build configuration

## Common Development Tasks

### Adding a new HTTP feature (e.g., new function or syntax)
1. Update/extend grammar: `src/lib/http/parser/http.grammar`
2. Run `pnpm run parsers` to generate parser
3. Add parsing logic in `src/lib/http/parser/`
4. Add linting rules if needed in `src/lib/http/linter/`
5. Add autocomplete in `src/lib/http/autocomplete/`
6. Write tests alongside the feature

### Adding a new component
- Place in `src/components/` following shadcn conventions
- Import from `@/components/ui/` or other components as needed

### Working with the file system
- Use `FileStorage` interface rather than direct filesystem access
- This allows your code to work with memfs in tests and real filesystem in production
- See `src/lib/data/files/file-default.ts` for the default implementation

### Modifying environment parsing
1. Update grammar: `src/lib/environments/parser/environments.grammar`
2. Run `pnpm run parsers`
3. Update linter rules in `src/lib/environments/linter/`
4. Test with `pnpm run test`