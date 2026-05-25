# Supabase Setup & Admin Role Seeding Guide

## Prerequisites

- Supabase project created at https://supabase.com
- Node.js 18+ installed
- Environment variables configured

## Step 1: Set Up Environment Variables

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Update `.env.local` with your Supabase credentials:
   - Get `NEXT_PUBLIC_SUPABASE_URL` from Supabase Dashboard → Settings → API
   - Get `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the same location (anon/public key)
   - Get `SUPABASE_SERVICE_ROLE_KEY` from Settings → API (service_role key) — **Keep this secret!**

Example:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 2: Apply Database Migrations

Run migrations in Supabase:

```bash
# Using Supabase CLI
supabase db push
```

Or manually in Supabase SQL Editor:
1. Go to Supabase Dashboard → SQL Editor
2. Copy & paste each migration file from `supabase/migrations/`
3. Run them in order (000001, 000002, 000003, 000004)

## Step 3: Seed Admin Role

### Option A: Using the seed script (Recommended)

1. Install dependencies (if not already done):
```bash
npm install
```

2. Create a user account first:
   - Sign up in your app, or
   - Create a user in Supabase Dashboard → Authentication → Users

3. Run the seed script:
```bash
npx tsx scripts/seed-admin.ts admin@example.com super_admin
```

Example outputs:
```bash
# For super_admin
npx tsx scripts/seed-admin.ts your-email@example.com super_admin

# For moderator
npx tsx scripts/seed-admin.ts moderator@example.com moderator
```

### Option B: Manual SQL

In Supabase SQL Editor, run:

```sql
-- Find your user ID first
select id, email from auth.users where email = 'your-email@example.com';

-- Then insert the admin role (replace UUID with your user ID)
insert into public.admins (user_id, role) values ('YOUR-USER-UUID-HERE', 'super_admin')
on conflict (user_id) do nothing;
```

## Step 4: Verify Admin Role

Check if the admin role was created:

```sql
select u.email, a.role, a.created_at
from public.admins a
join auth.users u on a.user_id = u.id;
```

## Admin Roles

- **super_admin**: Full access to all admin features
- **moderator**: Limited access (can moderate nominees, votes, etc.)

## Environment Variables Reference

| Variable | Source | Notes |
|----------|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API | Public — safe to expose |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon/public | Public — safe to expose |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role | **Secret** — never commit or expose |
| `NEXT_PUBLIC_SITE_URL` | Your app URL | For auth redirects and Open Graph |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Dashboard → Turnstile | For CAPTCHA |

## Troubleshooting

### "User not found" error
- Make sure the user exists in `auth.users`
- Check the email spelling
- Create a new account by signing up in the app

### "Missing environment variables" error
- Ensure `.env.local` has all required variables
- Restart the dev server after updating `.env.local`

### Admin access not working
- Verify the user ID in `public.admins` table
- Check RLS policies in Supabase are correct
- Ensure the user's session is active

## Next Steps

1. Build out admin dashboard features
2. Configure RLS policies for data access control
3. Set up audit logging for admin actions
4. Consider implementing role-based permissions for different admin levels
