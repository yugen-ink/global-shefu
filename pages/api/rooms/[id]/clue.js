import { supabaseFetch, logApiError } from '../../../../lib/supabaseAdmin';
import { generateModernClue } from '../../../../utils/shefuEngine';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!id || typeof id !== 'string' || id.length > 64) return res.status(400).json({ error: 'Invalid challenge ID.' });
  const requested = Number(req.body?.clueNumber ?? 1);
  if (!Number.isInteger(requested) || requested < 1 || requested > 4) {
    return res.status(400).json({ error: 'Clue number must be between 1 and 4.' });
  }

  try {
    const puzzles = await supabaseFetch(`puzzles?id=eq.${encodeURIComponent(id)}&select=id,secret_answer,created_at,status&limit=1`);
    const puzzle = puzzles?.[0];
    if (!puzzle) return res.status(404).json({ error: 'Challenge not found.' });
    if (puzzle.status !== 'active') return res.status(409).json({ error: 'This challenge has already been solved.' });

    const result = generateModernClue({ answer: puzzle.secret_answer, roomId: puzzle.id, createdAt: puzzle.created_at, clueNumber: requested });
    return res.status(200).json({ clue: result.clue, clueNumber: result.clueNumber });
  } catch (error) {
    logApiError('/api/rooms/[id]/clue POST', error);
    return res.status(500).json({ error: 'Could not generate a clue.' });
  }
}
