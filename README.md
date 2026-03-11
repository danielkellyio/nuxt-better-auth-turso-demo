# Nuxt Better Auth Template

A Nuxt 4 app with [Better Auth](https://better-auth.com/) for authentication: email/password sign-up, social login (e.g. GitHub), SSR-safe sessions, protected routes, and optional plugins (2FA, organizations, etc.). Uses Nuxt UI, Tailwind, and SQLite (via Turso/libSQL).

## Setup

```bash
pnpm install
```

Set `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` in `.env`, then run migrations:

```bash
pnpm run better-auth:migrate
```

## Development

```bash
pnpm run dev
```

Runs at `http://localhost:3000`.

## Production

```bash
pnpm run build
pnpm run preview
```

See the [Nuxt deployment docs](https://nuxt.com/docs/getting-started/deployment) for deployment options.
