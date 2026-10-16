import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [answer, setAnswer] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedName = localStorage.getItem('shefu-player-name') || '';
    if (savedName && savedName.trim().toLowerCase() !== 'anonymous') setPlayerName(savedName);
  }, []);

  async function createChallenge(e) {
    e.preventDefault();
    setLoading(true); setError('');
    const cleanName = playerName.trim();
    if (!cleanName || cleanName.toLowerCase() === 'anonymous') {
      setError('Please choose a nickname other than Anonymous.');
      setLoading(false);
      return;
    }
    if (cleanName.length > 60) { setError('Nickname must be 60 characters or fewer.'); setLoading(false); return; }
    localStorage.setItem('shefu-player-name', cleanName);
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, answer, playerName: cleanName })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not create challenge.');
      localStorage.setItem(`shefu-host-${data.id}`, data.hostToken);
      router.push(`/room/${data.id}?host=1`);
    } catch (err) { setError(err.message); setLoading(false); }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-between px-6 py-6">
      <nav className="w-full max-w-xl py-4 border-b border-white/10 flex justify-between">
        <span className="tracking-widest font-mono uppercase text-xs opacity-60">KronoClue</span>
      </nav>
      <div className="w-full max-w-xl py-12">
        <section className="text-center mb-12">
          <h1 className="text-3xl font-light tracking-tight">KronoClue</h1>
          <p className="mt-5 text-sm text-neutral-400 leading-relaxed">A mystery shaped by time. Hide an item, reveal four clues, and let others deduce it.</p>
        </section>

        <form onSubmit={createChallenge} className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-2">Your Nickname</label>
            <input required maxLength={60} value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Choose a nickname (not Anonymous)" className="w-full bg-neutral-900 border border-neutral-800 p-3 focus:outline-none focus:border-white" />
            <p className="mt-2 text-xs text-neutral-600">Saved in this browser and used for creating challenges and guesses.</p>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-2">Challenge Title</label>
            <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Something on my desk..." className="w-full bg-neutral-900 border border-neutral-800 p-3 focus:outline-none focus:border-white" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-2">Secret Item</label>
            <input required value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Only you should know this" className="w-full bg-neutral-900 border border-neutral-800 p-3 focus:outline-none focus:border-white" />
            <p className="mt-2 text-xs text-neutral-600">The answer is stored server-side and is never shown to players.</p>
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button disabled={loading} className="w-full py-3 bg-white text-black font-medium disabled:opacity-50">{loading ? 'Creating...' : 'Create a Challenge'}</button>
        </form>
      </div>
      <footer className="w-full max-w-xl text-center py-4 border-t border-white/10 text-xs text-neutral-600 font-mono">A MYSTERY SHAPED BY TIME</footer>
    </main>
  );
}
