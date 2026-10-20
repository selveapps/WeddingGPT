# Contributing to WeddingGPT

Thanks for helping build WeddingGPT. This guide covers how to get the app
running, how the code is organised, and what we expect from a pull request.

WeddingGPT is proprietary software (see [LICENSE](LICENSE)); contributions are
accepted from members of the Selve Apps team and people we have invited.

## Setup

You need **Node 24** (see [.nvmrc](.nvmrc)) and npm.

```bash
git clone https://github.com/selveapps/WeddingGPT.git
cd WeddingGPT
npm ci
cp .env.example .env   # optional - only needed for the Claude-backed assistant
npm start
```

Scan the QR code with Expo Go, or press `a` / `i` for an emulator. The AI proxy
is optional and lives in [server/ai-proxy](server/ai-proxy); without it the
on-device assistant answers everything.

## Project layout

| Path | What lives there |
| --- | --- |
| `app/` | Screens, using Expo Router file-based routing |
| `src/design-system/` | Tokens, theme and shared components. Screens never hardcode colours or sizes |
| `src/features/` | Feature-specific components and hooks |
| `src/models/` | Pure data logic - no React, easy to test |
| `src/store/` | Zustand stores, persisted to device storage |
| `src/services/` | AI, notifications, storage, contacts, location |
| `server/ai-proxy/` | Small Node server that holds the Anthropic API key |

## Code style

- JavaScript, React function components and hooks.
- Formatting is handled by Prettier; linting by ESLint (Expo config).
- Use `<Text variant="...">` and theme tokens rather than raw styles.
- Navigate with `Routes.*` from `src/navigation/routes.js`, not string literals.
- Comments explain *why*, not *what*.

Before pushing:

```bash
npm run lint
npm run format:check
npm test
```

## Tests

Tests live next to the code they cover in `__tests__` folders and run with
Jest (`jest-expo` preset). Logic in `src/models`, `src/lib` and
`src/services` should come with tests, especially anything that touches
money, dates or reminders.

## Pull requests

1. Branch from `main`: `feature/short-name` or `fix/short-name`.
2. Keep each PR focused on one change. Small PRs get reviewed faster.
3. Write commit messages in the imperative: "Add guest import", not "added".
4. Fill in the PR template, including how you tested it and screenshots for UI changes.
5. CI (lint and tests) must pass before merging.

## Reporting bugs and ideas

Use the issue templates on GitHub. For security problems, do **not** open a
public issue - follow [SECURITY.md](SECURITY.md).

By participating you agree to our [Code of Conduct](CODE_OF_CONDUCT.md).
