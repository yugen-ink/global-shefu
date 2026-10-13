import crypto from 'crypto';
import { supabaseFetch, logApiError } from '../../../lib/supabaseAdmin';

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const title = cleanText(req.body?.title);
  const answer = cleanText(req.body?.answer);
  if (!title || !answer) return res.status(400).json({ error: 'Title and secret answer are required.' });
  if (title.length > 120) return res.status(400).json({ error: 'Title must be 120 characters or fewer.' });
  if (answer.length > 200) return res.status(400).json({ error: 'Secret answer must be 200 characters or fewer.' });

  const id = crypto.randomBytes(9).toString('base64url');
  const hostToken = crypto.randomBytes(32).toString('hex');

  try {
    const rows = await supabaseFetch('puzzles?select=id,title,created_at,status', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ id, title, secret_answer: answer, host_token: hostToken, status: 'active' })
    });
    const puzzle = rows?.[0];
    if (!puzzle) throw new Error('Supabase did not return the created challenge');
    return res.status(201).json({ id: puzzle.id, hostToken, createdAt: puzzle.created_at });
  } catch (error) {
    logApiError('/api/rooms POST', error);
    return res.status(500).json({ error: 'Could not create the challenge. Please try again.' });
  }
}
