import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Room() {
  const router = useRouter();
  const { id } = router.query;
  const [puzzle, setPuzzle] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [clue, setClue] = useState('');
  const [clueNumber, setClueNumber] = useState(0);
  const [guess, setGuess] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [clueLoading, setClueLoading] = useState(false);
  const [host, setHost] = useState(false);

  async function loadRoom() {
    if (!id) return;
    const response = await fetch(`/api/rooms/${id}`);
    const data = await response.json();
    if (!response.ok) { setStatus(data.error || 'Room not found.'); setLoading(false); return; }
    setPuzzle(data.puzzle); setGuesses(data.guesses || []); setLoading(false);
  }

  useEffect(() => {
    if (!id) return;
    setHost(router.query.host === '1' || Boolean(localStorage.getItem(`shefu-host-${id}`)));
    loadRoom();
  }, [id, router.query.host]);

  async function revealClue() {
    setClueLoading(true); setStatus('');
    const response = await fetch(`/api/rooms/${id}/clue`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clueNumber: clueNumber + 1 }) });
    const data = await response.json();
    if (response.ok) { setClue(data.clue); setClueNumber(data.clueNumber); } else setStatus(data.error || 'Could not reveal clue.');
    setClueLoading(false);
  }

  async function submitGuess(e) {
    e.preventDefault();
    if (!guess.trim()) return;
    setStatus('Submitting...');
    const response = await fetch(`/api/rooms/${id}/guess`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ guess })
    });
    const data = await response.json();
    if (!response.ok) { setStatus(data.error || 'Could not submit guess.'); return; }
    setStatus(data.message);
    setGuess('');
    await loadRoom();
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center text-sm text-neutral-500">Loading room...</main>;
  if (!puzzle) return <main className="min-h-screen flex items-center justify-center p-6"><div>{status || 'Room not found.'}</div></main>;

  const shareUrl = typeof window !== 'undefined' ? window.location.origin + `/room/${id}` : '';

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-6">
      <nav className="w-full max-w-xl py-4 border-b border-white/10 flex justify-between">
        <span className="tracking-widest font-mono uppercase text-xs opacity-60">Global Async Shefu</span>
        <button onClick={() => router.push('/')} className="text-xs opacity-60">[ HOME ]</button>
      </nav>

      <div className="w-full max-w-xl py-12">
        <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">{host ? 'Your Challenge' : 'Active Challenge'}</span>
        <h1 className="text-2xl font-light mt-2">{puzzle.title}</h1>

        {host && (
          <div className="mt-6 p-4 border border-neutral-800 bg-neutral-900/50">
            <p className="text-xs text-neutral-500 uppercase tracking-wider">Share this room</p>
            <p className="mt-2 text-sm break-all text-neutral-300">{shareUrl}</p>
            <button onClick={() => navigator.clipboard?.writeText(shareUrl)} className="mt-3 text-xs border border-white/20 px-3 py-2 hover:border-white">Copy Link</button>
          </div>
        )}

        <section className="mt-10 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-neutral-400">Need a clue?</span>
            <button onClick={revealClue} disabled={clueLoading || puzzle.status === 'solved'} className="px-4 py-2 border border-white/20 text-xs font-mono disabled:opacity-40">{clueLoading ? 'DEDUCING...' : '[ REVEAL A CLUE ]'}</button>
          </div>
          {clue && <div className="p-4 bg-neutral-900/60 border border-neutral-800 text-sm text-neutral-300 font-mono">&gt; {clue}</div>}
        </section>

        <form onSubmit={submitGuess} className="mt-8 pt-6 border-t border-neutral-800 space-y-3">
          <label className="block text-xs uppercase tracking-wider text-neutral-400">Your Guess</label>
          <div className="flex gap-2">
            <input disabled={puzzle.status === 'solved'} value={guess} onChange={e => setGuess(e.target.value)} placeholder="What is hidden?" className="flex-1 bg-neutral-900 border border-neutral-800 p-3 text-sm focus:outline-none focus:border-white disabled:opacity-40" />
            <button disabled={puzzle.status === 'solved'} className="px-5 bg-white text-black text-sm disabled:opacity-40">Submit</button>
          </div>
          {status && <p className="text-sm text-neutral-400">{status}</p>}
        </form>

        <section className="mt-10 pt-6 border-t border-neutral-800">
          <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Recent Guesses</span>
          <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
            {!guesses.length && <p className="text-xs text-neutral-600 italic">No guesses yet. Be the first one.</p>}
            {guesses.map(g => (
              <div key={g.id} className="flex justify-between gap-4 text-xs p-2 bg-neutral-900/40 border border-neutral-900">
                <span className={g.is_correct ? 'text-white' : 'text-neutral-400'}>{g.guess_text}</span>
                <span className="text-neutral-600">{g.is_correct ? 'SOLVED' : 'WRONG'}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
