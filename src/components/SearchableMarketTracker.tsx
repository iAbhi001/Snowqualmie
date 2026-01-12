import React, {
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react';
import { Plus, Trash2, Search, RefreshCw } from 'lucide-react';

type MarketQuote = {
  price: string | null;
  changePercent?: string;
  error?: string;
};

export default function SearchableMarketTracker() {
  const [query, setQuery] = useState('');
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [marketData, setMarketData] = useState<Record<string, MarketQuote>>({});
  const [status, setStatus] = useState<'Ready' | 'Syncing' | 'Updated'>('Ready');

  // prevents overlapping sync loops
  const syncingRef = useRef(false);

  /* ------------------ INIT ------------------ */
  useEffect(() => {
    const saved = localStorage.getItem('alpha-watchlist');
    if (saved) {
      setWatchlist(JSON.parse(saved));
    }
  }, []);

  /* ------------------ API ------------------ */
  const fetchSingleSymbol = async (symbol: string) => {
    try {
      const res = await fetch(`/api/market?symbol=${symbol}`);
      const json = await res.json();

      setMarketData(prev => ({
        ...prev,
        [symbol]: json
      }));
    } catch {
      setMarketData(prev => ({
        ...prev,
        [symbol]: { price: null, error: 'NETWORK ERROR' }
      }));
    }
  };

  const fetchSequentially = useCallback(async (symbols: string[]) => {
    if (syncingRef.current || symbols.length === 0) return;

    syncingRef.current = true;
    setStatus('Syncing');

    for (let i = 0; i < symbols.length; i++) {
      await fetchSingleSymbol(symbols[i]);

      if (i < symbols.length - 1) {
        await new Promise(r => setTimeout(r, 13000));
      }
    }

    setStatus('Updated');
    syncingRef.current = false;
  }, []);

  /* ------------------ EFFECT ------------------ */
  useEffect(() => {
    localStorage.setItem('alpha-watchlist', JSON.stringify(watchlist));

    if (watchlist.length === 0) {
      setStatus('Ready');
      return;
    }

    fetchSequentially(watchlist);
  }, [watchlist, fetchSequentially]);

  /* ------------------ ACTIONS ------------------ */
  const handleAdd = () => {
    const symbol = query.trim().toUpperCase();
    if (!symbol || watchlist.includes(symbol)) return;

    setWatchlist(prev => [...prev, symbol]);
    setMarketData(prev => ({
      ...prev,
      [symbol]: { price: null }
    }));
    setQuery('');
  };

  const handleRemove = (symbol: string) => {
    setWatchlist(prev => prev.filter(s => s !== symbol));
    setMarketData(prev => {
      const copy = { ...prev };
      delete copy[symbol];
      return copy;
    });
  };

  /* ------------------ UI ------------------ */
  return (
    <div className="w-full max-w-3xl mx-auto bg-[#0a0c10] text-white rounded-3xl p-8 space-y-8">

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
          <input
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none"
            placeholder="AAPL, TSLA, DJT..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <button
          onClick={handleAdd}
          className="bg-blue-600 px-6 rounded-xl font-bold"
        >
          <Plus />
        </button>
      </div>

      {/* Status */}
      <div className="flex justify-between text-xs uppercase opacity-40">
        <span>Market Assets</span>
        <span className="flex items-center gap-2">
          <RefreshCw
            size={12}
            className={status === 'Syncing' ? 'animate-spin' : ''}
          />
          {status}
        </span>
      </div>

      {/* List */}
      <div className="space-y-6">
        {watchlist.map(symbol => {
          const data = marketData[symbol];
          return (
            <div
              key={symbol}
              className="flex justify-between items-center"
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleRemove(symbol)}
                  className="text-red-500/40"
                >
                  <Trash2 />
                </button>
                <div>
                  <div className="text-3xl font-black">{symbol}</div>
                  <div className="text-xs opacity-40">REAL-TIME DATA</div>
                </div>
              </div>

              <div className="text-right font-mono text-4xl font-bold">
                {typeof data?.price === 'string'
                  ? `$${data.price}`
                  : data?.error || 'Syncing...'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
