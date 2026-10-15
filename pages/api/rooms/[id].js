import { supabaseFetch, logApiError } from '../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!id || typeof id !== 'string' || id.length > 64) return res.status(400).json({ error: 'Invalid challenge ID.' });

  try {
    const queryId = encodeURIComponent(id);
    const puzzles = await supabaseFetch(`puzzles?id=eq.${queryId}&select=id,title,host_name,created_at,status&limit=1`);
    const puzzle = puzzles?.[0];
    if (!puzzle) return res.status(404).json({ error: 'Challenge not found.' });

    const guesses = await supabaseFetch(`guesses?puzzle_id=eq.${queryId}&select=id,player_name,guess_text,is_correct,created_at&order=created_at.desc&limit=30`);
    return res.status(200).json({ puzzle, guesses: guesses || [] });
  } catch (error) {
    logApiError('/api/rooms/[id] GET', error);
    return res.status(500).json({ error: 'Could not load the challenge.' });
  }
}
