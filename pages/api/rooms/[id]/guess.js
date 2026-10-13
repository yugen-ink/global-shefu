import { supabaseFetch, logApiError } from '../../../../lib/supabaseAdmin';
import { isGuessCorrect } from '../../../../utils/shefuEngine';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const guess = typeof req.body?.guess === 'string' ? req.body.guess.trim() : '';
  const playerName = typeof req.body?.playerName === 'string' ? req.body.playerName.trim() : 'Anonymous';
  if (!id || typeof id !== 'string' || id.length > 64) return res.status(400).json({ error: 'Invalid challenge ID.' });
  if (!guess) return res.status(400).json({ error: 'Please enter a guess.' });
  if (guess.length > 200) return res.status(400).json({ error: 'Guess must be 200 characters or fewer.' });
  if (playerName.length > 60) return res.status(400).json({ error: 'Player name must be 60 characters or fewer.' });

  try {
    const queryId = encodeURIComponent(id);
    const puzzles = await supabaseFetch(`puzzles?id=eq.${queryId}&select=id,secret_answer,status&limit=1`);
    const puzzle = puzzles?.[0];
    if (!puzzle) return res.status(404).json({ error: 'Challenge not found.' });
    if (puzzle.status !== 'active') return res.status(409).json({ error: 'This challenge has already been solved.' });

    const correct = isGuessCorrect(guess, puzzle.secret_answer);
    const accepted = await supabaseFetch('rpc/submit_guess', {
      method: 'POST',
      body: JSON.stringify({
        p_puzzle_id: id,
        p_player_name: playerName || 'Anonymous',
        p_guess_text: guess,
        p_is_correct: correct
      })
    });
    if (accepted !== true) return res.status(409).json({ error: 'This challenge has already been solved. Refresh the page.' });

    return res.status(200).json({ correct, message: correct ? 'Correct. You solved it.' : 'Not quite. Try another guess.' });
  } catch (error) {
    logApiError('/api/rooms/[id]/guess POST', error);
    return res.status(500).json({ error: 'Could not submit the guess.' });
  }
}
