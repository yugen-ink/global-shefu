import { supabaseFetch } from '../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const puzzles = await supabaseFetch(`puzzles?id=eq.${encodeURIComponent(id)}&select=id,title,created_at,status`);
    if (!puzzles?.length) return res.status(404).json({ error: 'Challenge not found.' });

    const guesses = await supabaseFetch(`guesses?puzzle_id=eq.${encodeURIComponent(id)}&select=id,guess_text,is_correct,created_at&order=created_at.desc&limit=30`);
    return res.status(200).json({ puzzle: puzzles[0], guesses: guesses || [] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Could not load the challenge.' });
  }
}
