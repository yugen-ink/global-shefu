import crypto from 'crypto';
import { supabaseFetch } from '../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { title, answer } = req.body || {};
    if (!title?.trim() || !answer?.trim()) {
      return res.status(400).json({ error: 'Title and secret answer are required.' });
    }

    const id = crypto.randomBytes(5).toString('base64url');
    const hostToken = crypto.randomBytes(24).toString('hex');
    const createdAt = new Date().toISOString();

console.log('[Create challenge diagnostic]', {
  status: 'active',
  idType: typeof id,
  idLength: id.length,
  timestamp: createdAt
});

    await supabaseFetch('puzzles', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        id,
        title: title.trim(),
        secret_answer: answer.trim(),
        host_token: hostToken,
        created_at: createdAt,
        status: 'active'
      })
    });

    return res.status(201).json({ id, hostToken, createdAt });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Could not create the challenge.' });
  }
}
