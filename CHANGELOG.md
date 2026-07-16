# Changelog

All notable changes to `slidev-addon-sandpack` are documented here.

## 0.3.0 - 2026-07-16

### Added

- Configure one deck-wide Sandpack theme with built-in modes, partial custom
  objects, or optional `@codesandbox/sandpack-themes` catalog objects.

## 0.2.1 - 2026-07-14

### Fixed

- Pre-bundle the Sandpack runtime in Vite so its CommonJS dependencies load
  correctly in Slidev's development server.
- Stretch the Sandpack editor and preview to fill the available slide height.

## 0.2.0 - 2026-07-14

### Changed

- **Breaking:** Replaced `@@@` Sandpack containers with four-backtick
  `sandpack` fences. A named preset follows `sandpack` on the opening fence.
  The old container syntax is no longer supported.

## 0.1.1 - 2026-07-14

### Changed

- Moved development, issues, CI, and releases to the standalone
  `nirtamir2/slidev-addon-sandpack` repository.
- Added repository-owned ESLint 10 and Prettier 3 configuration, contributor
  documentation, dependency updates, and npm trusted publishing infrastructure.

## 0.1.0 - 2026-07-12

### Added

- Markdown-it-powered `@@@` live-code containers with multi-file inherited steps.
- Typed reusable presets with local source-backed files and single-parent inheritance.
- Accessible React Sandpack renderer mounted through an addon-owned Vue bridge.
- Development watching, isolated package verification, and a production Slidev example.
