import { supabaseFetch } from '../../../../lib/supabaseAdmin';
import { generateModernClue } from '../../../../utils/shefuEngine';

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const puzzles = await supabaseFetch(`puzzles?id=eq.${encodeURIComponent(id)}&select=id,secret_answer,created_at,status`);
    const puzzle = puzzles?.[0];
    if (!puzzle) return res.status(404).json({ error: 'Challenge not found.' });
    if (puzzle.status !== 'open') return res.status(400).json({ error: 'This challenge is closed.' });

    const requested = Number(req.body?.clueNumber || 1);
    const clueNumber = Math.min(Math.max(Number.isFinite(requested) ? requested : 1, 1), 4);
    const result = generateModernClue({ answer: puzzle.secret_answer, roomId: puzzle.id, createdAt: puzzle.created_at, clueNumber });
    return res.status(200).json({ clue: result.clue, clueNumber: result.clueNumber });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Could not generate a clue.' });
  }
}
