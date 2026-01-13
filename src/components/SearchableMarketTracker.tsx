import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2, Search, RefreshCw, AlertCircle } from 'lucide-react';

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

  const syncingRef = useRef(false);

  // Load Watchlist
  useEffect(() => {
    const saved = localStorage.getItem('alpha-watchlist');
    if (saved) setWatchlist(JSON.parse(saved));
  }, []);

  // Save Watchlist
  useEffect(() => {
    localStorage.setItem('alpha-watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const fetchSingleSymbol = async (symbol: string) => {
    try {
      const res = await fetch(`/api/market?symbol=${symbol}`);
      const json = await res.json();
      setMarketData(prev => ({ ...prev, [symbol]: json }));
    } catch {
      setMarketData(prev => ({
        ...prev,
        [symbol]: { price: null, error: 'NETWORK ERROR' }
      }));
    }
  };

  const syncAll = useCallback(async () => {
    if (syncingRef.current || watchlist.length === 0) return;
    syncingRef.current = true;
    setStatus('Syncing');

    for (let i = 0; i < watchlist.length; i++) {
      await fetchSingleSymbol(watchlist[i]);
      // Wait 12-15 seconds to respect free tier (5 requests per minute)
      if (i < watchlist.length - 1) {
        await new Promise(r => setTimeout(r, 13000));
      }
    }

    setStatus('Updated');
    syncingRef.current = false;
  }, [watchlist]);

  const handleAdd = async () => {
    const symbol = query.trim().toUpperCase();
    if (!symbol || watchlist.includes(symbol)) return;

    setWatchlist(prev => [...prev, symbol]);
    setQuery('');
    
    // Fetch the new one immediately
    await fetchSingleSymbol(symbol);
  };

  const handleRemove = (symbol: string) => {
    setWatchlist(prev => prev.filter(s => s !== symbol));
    setMarketData(prev => {
      const copy = { ...prev };
      delete copy[symbol];
      return copy;
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-[#0a0c10] text-white rounded-3xl p-6 shadow-2xl border border-white/5">
      {/* Header & Search */}
      <div className="flex gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20" size={18} />
          <input
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-blue-500 outline-none transition-all"
            placeholder="Search Symbol (e.g. BTC, NVDA)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <button 
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-500 px-6 rounded-2xl transition-colors"
        >
          <Plus />
        </button>
      </div>

      {/* Market Status Bar */}
      <div className="flex justify-between items-center mb-6 px-2 text-[10px] font-bold tracking-widest uppercase opacity-40">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${status === 'Syncing' ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
          {watchlist.length} Assets Tracked
        </div>
        <button onClick={syncAll} className="flex items-center gap-2 hover:opacity-100 transition-opacity">
          <RefreshCw size={12} className={status === 'Syncing' ? 'animate-spin' : ''} />
          {status}
        </button>
      </div>

      {/* Stock List */}
      <div className="space-y-4">
        {watchlist.map(symbol => {
          const data = marketData[symbol];
          const isNeg = data?.changePercent?.includes('-');
          
          return (
            <div key={symbol} className="group flex justify-between items-center p-4 rounded-2xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5">
              <div className="flex items-center gap-4">
                <button onClick={() => handleRemove(symbol)} className="text-white/10 hover:text-red-500 transition-colors">
                  <Trash2 size={18} />
                </button>
                <div>
                  <h3 className="text-2xl font-black tracking-tighter">{symbol}</h3>
                  <p className="text-[10px] opacity-30 font-bold uppercase">Equity · Real Time</p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-mono font-bold">
                  {data?.price ? `$${parseFloat(data.price).toLocaleString(undefined, {minimumFractionDigits: 2})}` : (
                    <span className="text-sm opacity-20 animate-pulse">{data?.error || 'Loading...'}</span>
                  )}
                </div>
                {data?.changePercent && (
                  <div className={`text-xs font-bold ${isNeg ? 'text-red-500' : 'text-green-500'}`}>
                    {isNeg ? '' : '+'}{data.changePercent}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {watchlist.length === 0 && (
          <div className="py-20 text-center opacity-20">
            <AlertCircle className="mx-auto mb-2" />
            <p>Your watchlist is empty</p>
          </div>
        )}
      </div>
    </div>
  );
}