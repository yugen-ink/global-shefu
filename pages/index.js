import { useState, useEffect } from 'react';
import { generateModernClue } from '../utils/shefuEngine'; // 引入我们第一步写好的算法

export default function ShefuApp() {
  const [view, setView] = useState('home'); // 'home', 'create', 'play'
  const [puzzleId, setPuzzleId] = useState(null);
  
  // 出题状态
  const [titleInput, setTitleInput] = useState('');
  const [secretInput, setSecretInput] = useState('');
  
  // 答题状态
  const [currentClue, setCurrentClue] = useState('');
  const [guessInput, setGuessInput] = useState('');
  const [guessesList, setGuessesList] = useState([]);
  const [loading, setLoading] = useState(false);

  // 模拟加载谜题数据
  const handleCreatePuzzle = (e) => {
    e.preventDefault();
    if (!titleInput || !secretInput) return;
    
    // 实际项目中这里会将数据 POST 到 Supabase 数据库
    const mockNewId = 'puzzle_' + Math.random().toString(36.substring(2, 9));
    setPuzzleId(mockNewId);
    setView('play');
    // 清空输入
    setTitleInput('');
  };

  // 点击按钮获取平实线索
  const handleGetClue = () => {
    setLoading(true);
    setTimeout(() => {
      // 调用梅花易数平实转化算法
      const result = generateModernClue(puzzleId || 'default', Math.random().toString());
      setCurrentClue(result.clue);
      setLoading(false);
    }, 400); // 模拟极速响应
  };

  // 提交猜测
  const handleSubmitGuess = (e) => {
    e.preventDefault();
    if (!guessInput) return;
    
    const newGuess = {
      name: 'Player_' + Math.floor(Math.random() * 1000),
      content: guessInput,
      time: 'Just now'
    };
    
    setGuessesList([newGuess, ...guessesList]);
    setGuessInput('');
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] flex flex-col items-center justify-between p-6 font-sans selection:bg-white selection:text-black">
      {/* 顶部极简导航 */}
      <nav className="w-full max-w-xl flex justify-between items-center py-4 border-b border-white/10 text-sm">
        <span className="tracking-widest font-mono uppercase text-xs opacity-60">Global Async Shefu</span>
        <button 
          onClick={() => setView('home')} 
          className="hover:opacity-100 opacity-60 transition text-xs tracking-wider"
        >
          [ HOME ]
        </button>
      </nav>

      {/* 主体内容区域 */}
      <div className="w-full max-w-xl my-auto py-12 flex flex-col items-center text-center">
        
        {/* 视图 1：首页引导 */}
        {view === 'home' && (
          <div className="space-y-6 animate-fadeIn">
            <h1 className="text-3xl font-light tracking-tight">The Global Guessing Board</h1>
            <p className="text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
              An asynchronous, minimalist guessing game powered by time-signature logic. Hide an item, share the link, and let the world deduce it.
            </p>
            <div className="pt-4 flex gap-4 justify-center">
              <button 
                onClick={() => setView('create')}
                className="px-6 py-3 bg-white text-black text-sm font-medium rounded-none hover:bg-neutral-200 transition"
              >
                Create a Challenge
              </button>
            </div>
          </div>
        )}

        {/* 视图 2：创建谜题页 */}
        {view === 'create' && (
          <form onSubmit={handleCreatePuzzle} className="w-full space-y-6 text-left animate-fadeIn">
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-2">Challenge Hint / Title</label>
              <input 
                type="text" 
                placeholder="e.g., Something found on my desk..." 
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 p-3 text-sm text-white focus:outline-none focus:border-white transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-2">Secret Item (Answer)</label>
              <input 
                type="text" 
                placeholder="e.g., AirPods Pro" 
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 p-3 text-sm text-white focus:outline-none focus:border-white transition"
                required
              />
            </div>
            <button 
              type="submit" 
              className="w-full py-3 bg-white text-black text-sm font-medium hover:bg-neutral-200 transition"
            >
              Generate Link & Start
            </button>
          </form>
        )}

        {/* 视图 3：答题/猜谜核心页 */}
        {view === 'play' && (
          <div className="w-full space-y-8 animate-fadeIn text-left">
            <div className="border-b border-neutral-800 pb-4">
              <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Active Challenge</span>
              <h2 className="text-xl font-medium mt-1">“Something found on my desk...”</h2>
            </div>

            {/* 线索生成区块 */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-400">Need a hint based on current time?</span>
                <button 
                  onClick={handleGetClue}
                  disabled={loading}
                  className="px-4 py-2 border border-white/20 text-xs font-mono tracking-wider hover:border-white transition disabled:opacity-40"
                >
                  {loading ? 'DEDUCING...' : '[ REVEAL A CLUE ]'}
                </button>
              </div>

              {currentClue && (
                <div className="p-4 bg-neutral-900/60 border border-neutral-800 text-sm text-neutral-300 leading-relaxed font-mono animate-fadeIn">
                  &gt; {currentClue}
                </div>
              )}
            </div>

            {/* 提交猜测表单 */}
            <form onSubmit={handleSubmitGuess} className="space-y-3 pt-4 border-t border-neutral-800">
              <label className="block text-xs uppercase tracking-wider text-neutral-400">Your Guess</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Type your guess here..." 
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  className="flex-1 bg-neutral-900 border border-neutral-800 p-3 text-sm text-white focus:outline-none focus:border-white transition"
                />
                <button 
                  type="submit" 
                  className="px-5 bg-white text-black text-sm font-medium hover:bg-neutral-200 transition"
                >
                  Submit
                </button>
              </div>
            </form>

            {/* 全球猜测实时流 (Live Feed) */}
            <div className="pt-6 space-y-3">
              <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Global Recent Guesses</span>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {guessesList.length === 0 ? (
                  <p className="text-xs text-neutral-600 italic">No guesses yet. Be the first one!</p>
                ) : (
                  guessesList.map((g, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs p-2 bg-neutral-900/40 border border-neutral-900">
                      <span className="font-mono text-neutral-400">{g.name} guessed: <strong className="text-white">{g.content}</strong></span>
                      <span className="text-neutral-600">{g.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* 底部极简版权 */}
      <footer className="w-full max-w-xl text-center py-4 border-t border-white/10 text-xs text-neutral-600 font-mono">
        Zero Cost Global Minimalist Shefu
      </footer>
    </main>
  );
}