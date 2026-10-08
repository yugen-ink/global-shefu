# Global Async Shefu — V1

V1 goal: make the real game loop work across devices.

Create → Room URL → Share → Reveal clue → Guess → Correct/Wrong → shared guess history.

## 1. Supabase

Run `supabase-schema.sql` in the Supabase SQL Editor.

## 2. Environment variables

Create `.env.local`:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

The service-role key is server-only. Never expose it as `NEXT_PUBLIC_*`.

## 3. Run

```bash
npm install
npm run dev
```

## 4. Deploy to Vercel

Add the same two environment variables in Vercel Project Settings → Environment Variables, then redeploy.

## V1 design notes

- The secret answer is never returned by the room API.
- The clue API reads the answer on the server and generates progressive clues.
- Host and player are separated by the shared URL. The creator receives a host token locally so they can see the share panel.
- V1 intentionally avoids authentication, ranking, profiles, and real-time subscriptions. Those can be added after the core game loop is validated.
