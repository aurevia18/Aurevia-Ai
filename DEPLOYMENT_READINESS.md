# Aurevia release readiness and Render deployment checklist

This checklist applies to the source archive where `package.json` is at the repository root. It is not a statement that the production service or database has been verified.

## Current verification status

- ZIP integrity: passed for the previous archive.
- Static TypeScript/TSX syntax transpilation: passed for 308 source/test files in the review workspace.
- CSS parsing: passed for 4 CSS files.
- `package.json` and `package-lock.json` JSON parsing: passed; root package name/version match.
- Full dependency install, typecheck, tests, production build, and Playwright E2E: **not verified in this environment**. At the latest recheck, `npm ping` still failed with DNS `EAI_AGAIN`; the official npm status page currently reports operational services, so this session-specific resolver/network failure is not proof of a current global outage. The installed `node_modules` tree is incomplete. `npm ci --include=dev` could not complete because DNS/network access to `registry.npmjs.org` failed (`EAI_AGAIN`). Run these checks in GitHub Codespaces or another environment with npm registry access.
- Production migration readiness: **BLOCKED pending database-owner reconciliation**. The recorded database migration history has included `20261013110000_payment_method_network`, which is absent from this source checkout, while later checked-in migrations were reported unapplied. Do not run production migrations, `prisma db push`, or reset commands until the authoritative missing migration is recovered, migration history is reconciled, a backup is confirmed, and the exact migration plan is reviewed and approved.
- Deployment: not performed by this checklist.

The supplied manifest also pins `@next/env` and `@next/eslint-plugin-next` to 14.2.35 while Next.js is 16.4.0. Review and align these tool versions after registry access is restored; do not hand-edit package-lock metadata or claim a verified build until `npm ci` and the full checks pass.

## 1. Verify the exact source in Codespaces

Open the repository root (the folder containing `package.json`) and run:

```bash
pwd
node --version
npm --version
git status --short
git log -1 --oneline
```

Use a Node version supported by `package.json`; Node 22.13+ and below 23 is a suitable line for the current manifest. Confirm no `.env` or credentials are staged. Keep `.env` out of Git.

Install and run checks:

```bash
npm ci --include=dev
npx prisma validate
npx prisma generate
npm run typecheck
npm test
npm run lint
npm run build
```

Run browser E2E tests only against a disposable local test database, never the production Supabase database:

```bash
npm run test:e2e:isolated
```

If any command fails, stop and resolve it before release. Do not hide failing tests or change package versions merely to silence an error.

## 2. Render service settings

Use a **Node Web Service**, not a static site. The project `package.json` is at the repository root, so Render's Root Directory should be blank/default (or `.`). The archive does not contain `render.yaml`; use the Render dashboard unless a reviewed Blueprint is added separately.

- Build Command: `npm ci --include=dev && npm run build`
- Start Command: `npm start`
- Health Check Path: `/api/health`
- Node version: choose a supported Node 22 release (22.13+ and below 23) or another version explicitly supported by `package.json`.
- Use one service instance while the in-process market ticker and Socket.IO engine are enabled; horizontal scaling is not configured for a shared market worker/Socket.IO adapter.

## 3. Render environment variables

Set values in Render's Environment page; never paste secrets into source files, chat, screenshots, or Git. Use the existing Supabase project and its existing database—do not create a replacement database for deployment.

Required application/database settings (confirm exact values against `.env.example` and the deployment README):

- `DATABASE_URL` — application database connection; use the appropriate Supabase pooled URL.
- `DIRECT_URL` — direct Supabase PostgreSQL connection for Prisma migration operations.
- `NEXTAUTH_SECRET` — strong random secret.
- `NEXTAUTH_URL` — canonical HTTPS production URL.
- `NEXT_PUBLIC_APP_URL` — same canonical HTTPS production origin.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` — server-side private storage workflows; service-role key must never use a `NEXT_PUBLIC_` name.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — only where the application expects the public Supabase configuration.
- `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` — administrator provisioning/sign-in configuration; use a strong unique password and do not share it.

Only add optional SMTP, market, or Alpaca **paper** credentials if you intend to use those features and have verified the values. Keep `REAL_EXECUTION_ENABLED=false`. Customer balances/order workflows described by the project are internal simulations; do not represent simulated activity as real external trades, deposits, withdrawals, or returns.

## 4. Database migration gate — do not skip

Before production deploy, the database owner must reconcile the missing migration source/history and identify which checked-in migrations are unapplied. Back up the database and review the exact migration SQL and data impact. Only after that review and explicit authorization should the approved migrations be applied. Do not put production migrations in the Render build command; do not use `prisma db push`, `prisma migrate reset`, or an improvised SQL replacement on production.

If this migration blocker is not resolved, do not promote the release to production. A successful build alone does not prove database compatibility.

## 5. Deploy and smoke-test after all gates pass

1. Commit and push the exact verified code to the intended GitHub branch.
2. In Render, confirm the correct repository, branch, root directory, build command, start command, environment values, and `/api/health` check.
3. Deploy only after the migration gate is cleared.
4. Read the complete Render build and runtime logs. Confirm the service is healthy and `GET /api/health` returns HTTP 200 with `ok: true` and `database: "ok"`.
5. Test login/logout, normal user vs admin access, Demo starting balance, Real starting balance, account-mode isolation, portfolio, order placement/cancellation, funding request/review, withdrawal restrictions, notifications, and support using designated test accounts.
6. Check desktop and mobile layout, browser console, server logs, and the admin audit log. Do not use real customer funds or production financial actions as test fixtures.
7. If health checks fail or ledger/account behavior differs from expected, stop promotion and roll back the application deployment using Render's rollback controls. Do not roll back database schema blindly; follow the reviewed migration rollback plan.

## 6. Safe Git commands

After tests pass and you have reviewed the diff:

```bash
git status --short
git diff --check
git diff --stat
# Stage only the intended source/docs files, then commit:
git add app/layout.tsx README.md DEPLOYMENT_READINESS.md
git commit -m "Prepare Aurevia skeuomorphic release"
git push origin main
```

If other feature files are part of the intended release, stage those explicitly too after reviewing them. Do not stage `.env`, credentials, private uploads, generated output, or database dumps. These commands publish source to GitHub; Render deployment still needs to be triggered/configured separately.

## Generative AI configuration

Set `OPENAI_API_KEY` in the Render service environment to enable live OpenAI Responses API answers in Nova, the optional portfolio-education explanation, and on-demand fictional learning scenarios. `OPENAI_MODEL` is optional and defaults to `gpt-6-astra`; select a model available to your API project. Keep the key server-side and never use a `NEXT_PUBLIC_` prefix. The AI endpoints use rate limiting, request timeouts, non-persistent API requests (`store: false`), and deterministic fallbacks for account, trading, funding and support workflows. AI cannot approve funding, alter ledgers, perform KYC decisions or submit trades. Portfolio explanation requests send only the selected account mode, aggregate recorded value and allocation percentages, after the user clicks the AI explanation button.

The learning-network profiles are explicitly fictional educational examples; they are not real people, real users or testimonials. AI can generate additional fictional learning scenarios, but public posting/member chat is not implemented by this AI integration.
