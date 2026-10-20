# Security Policy

WeddingGPT stores couples' plans, budgets and guest lists, so we take security
reports seriously.

## Reporting a vulnerability

Please **do not open a public GitHub issue** for security problems.

Instead, report it privately through GitHub:
**Security** tab -> **Report a vulnerability** on
[selveapps/WeddingGPT](https://github.com/selveapps/WeddingGPT/security/advisories/new).

Include:

- what the issue is and where it lives (file, screen or endpoint),
- steps to reproduce it,
- the impact you think it has.

We aim to acknowledge reports within 3 working days and to keep you updated
until a fix ships.

## Supported versions

Only the latest release of the app and the current `main` branch receive
security fixes.

## Scope

In scope: the mobile app in this repository and the AI proxy in
`server/ai-proxy`.

Out of scope: third-party services (Expo, Apple, Google, Anthropic) - please
report those to the vendor directly.

## Handling secrets

- Never commit `.env` files or API keys. Only `.env.example` templates belong in git.
- `EXPO_PUBLIC_*` values are compiled into the app and are **not** secret.
- The Anthropic API key lives only on the AI proxy server.
