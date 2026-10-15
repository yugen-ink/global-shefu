import { supabaseFetch, logApiError } from '../../../../lib/supabaseAdmin';
import { generateModernClue } from '../../../../utils/shefuEngine';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!id || typeof id !== 'string' || id.length > 64) {
    return res.status(400).json({ error: 'Invalid challenge ID.' });
  }

  const requested = Number(req.body?.clueNumber ?? 1);
  if (!Number.isInteger(requested) || requested < 1 || requested > 4) {
    return res.status(400).json({ error: 'Clue number must be between 1 and 4.' });
  }

  const timeZone = req.body?.timeZone;
  if (typeof timeZone !== 'string' || !timeZone.trim() || timeZone.length > 100) {
    return res.status(400).json({ error: 'A valid player timezone is required.' });
  }

  try {
    const puzzles = await supabaseFetch(
      `puzzles?id=eq.${encodeURIComponent(id)}&select=id,status&limit=1`
    );
    const puzzle = puzzles?.[0];
    if (!puzzle) return res.status(404).json({ error: 'Challenge not found.' });
    if (puzzle.status !== 'active') {
      return res.status(409).json({ error: 'This challenge has already been solved.' });
    }

    const result = generateModernClue({ timeZone, clueNumber: requested });
    return res.status(200).json({
      clue: result.clue,
      clueNumber: result.clueNumber,
      localTime: result.localTime,
      timeZone: result.timeZone
    });
  } catch (error) {
    logApiError('/api/rooms/[id]/clue POST', error);
    if (error instanceof RangeError || error instanceof TypeError) {
      return res.status(400).json({ error: 'Could not use the supplied timezone or date.' });
    }
    return res.status(500).json({ error: 'Could not generate a clue.' });
  }
}
