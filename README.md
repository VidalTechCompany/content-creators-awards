# Molo content Creators (Web)

Production-oriented Next.js 15 + Supabase voting platform with verified accounts, CAPTCHA, audit logging, admin tools, and realtime-ready aggregates.

## Quick start

```bash
cd content-creators-awards
cp .env.example .env.local
# fill NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev
```

> **Note:** `npm create` cannot target a folder whose name breaks npm package rules. The app lives in `content-creators-awards/`.

## Supabase setup

1. Create a Supabase project.
2. In the SQL editor, run the files in `supabase/migrations/` in order (`000001`, `000002`, `000003`).
3. **Auth → URL configuration**
   - Site URL: your `NEXT_PUBLIC_SITE_URL` (e.g. `http://localhost:3000` or production domain).
   - Additional redirect URLs: include `http://localhost:3000/auth/callback` and your production callback URL.
4. **Auth → Email** — enable confirmations so `email_confirmed_at` is set before voting.
5. **Storage** — migration `000003` creates the `nominee-images` bucket and policies. Upload images from **Admin → Nominees**.
6. **Realtime** — in `Database → Replication`, enable realtime for `nominee_stats` (and optionally `site_settings`) so live counts and countdown updates propagate to clients.
7. **Bootstrap admins** — after you can log in, insert yourself into `admins`:

```sql
insert into public.admins (user_id, role)
values ('<your-auth-user-uuid>', 'super_admin');
```

8. **Seed nominees** — insert rows into `nominees` with `status = 'approved'` (and valid `category_id`).

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server | Supabase anon (publishable) key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Trusted server routes (vote insert, optional exports) |
| `NEXT_PUBLIC_SITE_URL` | Client + server | Canonical site URL for metadata + CSRF origin checks |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Client | Cloudflare Turnstile widget |
| `TURNSTILE_SECRET_KEY` | Server | Turnstile siteverify |
| `TRUSTED_ORIGINS` | Server | Optional comma-separated extra allowed origins for CSRF checks |

Never expose `SUPABASE_SERVICE_ROLE_KEY` as `NEXT_PUBLIC_*`.

## Security model (summary)

- **RLS** on all public tables; `votes` has no client-facing policies (inserts go through `/api/vote` with the service role after checks).
- **Email verification** enforced in the vote API using `user.email_confirmed_at`.
- **CAPTCHA** via Cloudflare Turnstile (dev bypass only when no Turnstile keys are configured and `NODE_ENV !== "production"`).
- **CSRF** defense on state-changing APIs via `assertTrustedOrigin` (`NEXT_PUBLIC_SITE_URL` / `TRUSTED_ORIGINS`).
- **Rate limiting** — per-IP sliding window in memory (swap for Redis/Upstash for multi-node production).
- **Cooldown** — `VOTE_COOLDOWN_SEC` between votes per profile (`profiles.last_vote_at`).
- **Audit trail** — `audit_logs` + `suspicious_activity` hooks from the vote API.
- **Middleware** — security headers (`next.config.ts`) + Supabase session refresh + `/admin` login wall.
- **Session inactivity** — client auto sign-out after `INACTIVITY_MS` (see `src/lib/constants.ts`).

## Deploying to Vercel

1. Push the `content-creators-awards` project to GitHub.
2. Import into Vercel; set Root Directory to `content-creators-awards` if the repo root is the parent workspace folder.
3. Add the same environment variables in the Vercel dashboard (including `SUPABASE_SERVICE_ROLE_KEY` as a **secret**).
4. Ensure Supabase redirect URLs include your production domain `/auth/callback`.

## Roles

- `super_admin` and `moderator` are modeled in `public.admins`. The UI currently grants the same admin surface to both; tighten policies in SQL or route handlers if moderators should be read-only.

## Scripts

- `npm run dev` — Turbopack dev server
- `npm run build` / `npm start` — production

## License

Use and modify for your event; supply your own legal copy for Terms/Privacy pages before going live.
