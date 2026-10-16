import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Room() {
  const router = useRouter();
  const { id } = router.query;
  const [puzzle, setPuzzle] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [clues, setClues] = useState([]);
  const [clueNumber, setClueNumber] = useState(0);
  const [guess, setGuess] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [clueLoading, setClueLoading] = useState(false);
  const [host, setHost] = useState(false);
  const [nickname, setNickname] = useState('');
  const [nicknameDraft, setNicknameDraft] = useState('');
  const [nicknameStatus, setNicknameStatus] = useState('');

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
    const savedName = localStorage.getItem('shefu-player-name') || '';
    const validName = savedName.trim() && savedName.trim().toLowerCase() !== 'anonymous' ? savedName.trim() : '';
    setNickname(validName);
    setNicknameDraft(validName);
    loadRoom();
  }, [id, router.query.host]);

  async function revealClue() {
    setClueLoading(true); setStatus('');
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const response = await fetch(`/api/rooms/${id}/clue`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ timeZone }) });
    const data = await response.json();
    if (response.ok) { setClues(data.clues || []); setClueNumber(4); } else setStatus(data.error || 'Could not reveal clues.');
    setClueLoading(false);
  }

  function saveNickname(e) {
    e.preventDefault();
    const cleanName = nicknameDraft.trim();
    if (!cleanName || cleanName.toLowerCase() === 'anonymous') { setNicknameStatus('Choose a nickname other than Anonymous.'); return; }
    if (cleanName.length > 60) { setNicknameStatus('Nickname must be 60 characters or fewer.'); return; }
    localStorage.setItem('shefu-player-name', cleanName);
    setNickname(cleanName);
    setNicknameDraft(cleanName);
    setNicknameStatus('Nickname saved for this browser.');
  }

  async function submitGuess(e) {
    e.preventDefault();
    if (!nickname) { setStatus('Please save a nickname before guessing.'); return; }
    if (!guess.trim()) return;
    setStatus('Submitting...');
    const response = await fetch(`/api/rooms/${id}/guess`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ guess, playerName: nickname })
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
        <span className="tracking-widest font-mono uppercase text-xs opacity-60">KronoClue</span>
        <button onClick={() => router.push('/')} className="text-xs opacity-60">[ HOME ]</button>
      </nav>

      <div className="w-full max-w-xl py-12">
        <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">{host ? 'Your Challenge' : puzzle.status === 'solved' ? 'Solved Challenge' : 'Active Challenge'}</span>
        <h1 className="text-2xl font-light mt-2">{puzzle.title}</h1>
        <p className="mt-2 text-xs text-neutral-500">Created by <span className="text-neutral-300">{puzzle.host_name || 'Unknown host'}</span></p>

        <form onSubmit={saveNickname} className="mt-6 p-4 border border-neutral-800 space-y-3">
          <label className="block text-xs uppercase tracking-wider text-neutral-400">Your Nickname</label>
          <div className="flex gap-2">
            <input required maxLength={60} value={nicknameDraft} onChange={e => { setNicknameDraft(e.target.value); setNicknameStatus(''); }} placeholder="Choose a nickname" className="flex-1 min-w-0 bg-neutral-900 border border-neutral-800 p-3 text-sm focus:outline-none focus:border-white" />
            <button className="px-4 border border-white/20 text-xs hover:border-white">Save</button>
          </div>
          <p className="text-xs text-neutral-600">Same nickname for creating and guessing, saved only in this browser.</p>
          {nicknameStatus && <p className="text-xs text-neutral-400">{nicknameStatus}</p>}
        </form>

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
            <button onClick={revealClue} disabled={clueLoading || puzzle.status === 'solved' || clueNumber >= 4} className="px-4 py-2 border border-white/20 text-xs font-mono disabled:opacity-40">{clueLoading ? 'DEDUCING...' : clueNumber >= 4 ? '[ ALL 4 CLUES REVEALED ]' : '[ REVEAL ALL 4 CLUES ]'}</button>
          </div>
          {clues.length > 0 && <div className="space-y-2">{clues.map((item, index) => <div key={index} className="p-4 bg-neutral-900/60 border border-neutral-800 text-sm text-neutral-300 font-mono"><span className="text-neutral-500 mr-2">{index + 1}.</span>{item}</div>)}</div>}
        </section>

        <form onSubmit={submitGuess} className="mt-8 pt-6 border-t border-neutral-800 space-y-3">
          <label className="block text-xs uppercase tracking-wider text-neutral-400">Your Guess</label>
          <div className="flex gap-2">
            <input disabled={puzzle.status === 'solved'} value={guess} onChange={e => setGuess(e.target.value)} placeholder="What is hidden?" className="flex-1 bg-neutral-900 border border-neutral-800 p-3 text-sm focus:outline-none focus:border-white disabled:opacity-40" />
            <button disabled={puzzle.status === 'solved' || !nickname} className="px-5 bg-white text-black text-sm disabled:opacity-40">Submit</button>
          </div>
          {status && <p className="text-sm text-neutral-400">{status}</p>}
        </form>

        <section className="mt-10 pt-6 border-t border-neutral-800">
          <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Recent Guesses</span>
          <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
            {!guesses.length && <p className="text-xs text-neutral-600 italic">No guesses yet. Be the first one.</p>}
            {guesses.map(g => (
              <div key={g.id} className="flex justify-between gap-4 text-xs p-2 bg-neutral-900/40 border border-neutral-900">
                <span className={g.is_correct ? 'text-white' : 'text-neutral-400'}>{g.player_name || 'Unknown player'}: {g.guess_text}</span>
                <span className="text-neutral-600">{g.is_correct ? 'SOLVED' : 'WRONG'}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
