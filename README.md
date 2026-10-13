# Global Shefu — Clean Rebuild V1

Core loop: create challenge → share room URL → reveal clues → submit guesses → shared guess history.

The included `supabase-schema.sql` is intended for a newly created Supabase project. It is non-destructive and does not drop existing tables. Review it before running. `CREATE TABLE IF NOT EXISTS` does not repair an older, incompatible table definition; use this on the fresh project you just created.

## 1. Initialize the Supabase schema

1. Open the newly created Supabase project.
2. Open **SQL Editor** and create a new query.
3. Paste the full contents of `supabase-schema.sql`.
4. Run it and confirm the query succeeds before deploying the app.
5. In Table Editor, verify `puzzles` and `guesses` exist and `guesses.puzzle_id` references `puzzles.id`.
6. Confirm RLS is enabled on both tables. No direct browser-role policies are added because this V1 uses server-side API routes with the service-role key.

The schema uses `status = 'active' | 'solved'`, text IDs, and a transactional `submit_guess` database function. Run it only against the intended new project.

## 2. Environment variables

Set these in `.env.local` for local development and in Vercel → Project Settings → Environment Variables for **Production** (and Preview if you test previews):

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

Use the project URL and service-role/secret server key from the same Supabase project. Do not use a publishable/anon key for this server-side module. Never prefix the service-role key with `NEXT_PUBLIC_`, commit it, or paste it into chat. Redeploy Vercel after changing environment variables.

## 3. Deploy

1. Commit and push the complete project to the Git repository connected to Vercel.
2. Wait until the deployment shows **Ready**.
3. Make sure the production domain is assigned to that deployment.
4. Test the production domain, not just a preview deployment.

Local commands:

```bash
npm install
npm run dev
npm run build
```

## Time-based clue engine

The clue API now reads the current timestamp for every clue request and uses the player browser's IANA timezone (for example, `Asia/Singapore`) to derive local civil time. `lunar-javascript` converts that local date to the lunar calendar. The engine then uses one documented convention: upper trigram = (lunar-year earthly-branch number + lunar month + lunar day) mod 8; lower trigram adds the local earthly-branch hour; moving line uses the same total mod 6. A zero remainder maps to 8 for trigrams and 6 for the moving line.

The current product behavior intentionally computes each progressive clue from the time of that individual request. Because the time is re-read on each request, separate clues may come from different time charts and may not describe one perfectly consistent object. The object-attribute mapping is a game-design heuristic, not a factual identification method. Leap lunar months are treated as their corresponding numbered lunar month.

Run the pure calculation tests with `node --test tests/shefuEngine.test.js`. A full Next.js build also requires installing project dependencies with `npm install`.

## 4. Acceptance test

1. Create a challenge with a short title and answer.
2. Confirm it redirects to a room and the room reloads successfully.
3. Open the share URL in a private/incognito window.
4. Reveal clues; the fourth clue should disable further clue requests.
5. Submit a wrong answer and confirm it appears in recent guesses.
6. Submit the exact answer (case and repeated whitespace are normalized) and confirm the room becomes solved.
7. Refresh both windows. Confirm the answer is never included in the public room response and solved challenges reject further guesses.

## Security notes

- The service-role key is used only by server-side API routes.
- The public room API returns only `id`, `title`, `created_at`, and `status`, plus recent guesses. It never returns `secret_answer` or `host_token`.
- The answer is checked server-side. A database function inserts the guess and marks the puzzle solved atomically.
- This V1 has no user authentication or durable rate limiting; the share URL is effectively public. Add abuse controls before broad public launch.
