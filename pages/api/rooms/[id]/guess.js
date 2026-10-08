import { supabaseFetch } from '../../../../lib/supabaseAdmin';
import { isGuessCorrect } from '../../../../utils/shefuEngine';

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { guess } = req.body || {};
    if (!guess?.trim()) return res.status(400).json({ error: 'Please enter a guess.' });

    const puzzles = await supabaseFetch(`puzzles?id=eq.${encodeURIComponent(id)}&select=id,secret_answer,status`);
    const puzzle = puzzles?.[0];
    if (!puzzle) return res.status(404).json({ error: 'Challenge not found.' });

    const correct = isGuessCorrect(guess, puzzle.secret_answer);
    await supabaseFetch('guesses', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ puzzle_id: id, guess_text: guess.trim(), is_correct: correct, created_at: new Date().toISOString() })
    });

    if (correct) {
      await supabaseFetch(`puzzles?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status: 'solved' })
      });
    }
    return res.status(200).json({ correct, message: correct ? 'Correct. You solved it.' : 'Not quite. Try another guess.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Could not submit the guess.' });
  }
}
