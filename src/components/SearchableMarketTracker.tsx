import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Moon, Search } from 'lucide-react';

export default function SearchableMarketTracker() {
  const [query, setQuery] = useState('');
  const [marketData, setMarketData] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('massive-watchlist');
      
      return saved ? JSON.parse(saved) : [{ symbol: 'AAPL' }, { symbol: 'TSLA' }];
    }
    return [];
  });

  const pullLiveFeed = useCallback(async () => {
    if (watchlist.length === 0) return;
    
    const tickers = watchlist.map((s: any) => s.symbol).join(',');
    
    try {
      const res = await fetch(`/api/market?symbols=${tickers}`);
      const json = await res.json();
      // Massive Snapshot returns the data inside a 'tickers' array
      setMarketData(json.tickers || []);
    } catch (e) {
      console.error("API Update failed - Check console for network errors");
    }
  }, [watchlist]);

  useEffect(() => {
    pullLiveFeed();
    localStorage.setItem('massive-watchlist', JSON.stringify(watchlist));
    // 60s interval stays well within your 5 calls/min individual limit
    const interval = setInterval(pullLiveFeed, 60000); 
    return () => clearInterval(interval);
  }, [watchlist, pullLiveFeed]);

  const handleAdd = () => {
    const upper = query.toUpperCase().trim();
    if (upper && !watchlist.find((s: any) => s.symbol === upper)) {
      setWatchlist([...watchlist, { symbol: upper }]);
      setQuery('');
    }
  };

  return (
    <div className="flex flex-col w-full bg-[#0a0c10]/90 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
      {/* Search Input */}
      <div className="p-6 border-b border-white/10 bg-white/[0.02] flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
          <input 
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white font-mono text-sm outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Add Ticker (e.g. AAPL, BTC, NVDA)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <button onClick={handleAdd} className="bg-blue-600 px-6 rounded-2xl hover:bg-blue-500 transition-all text-white">
          <Plus size={20} />
        </button>
      </div>

      {/* Ticker List with Correct LTP Mapping */}
      <div className="p-8 space-y-8 max-h-[500px] overflow-y-auto custom-scrollbar">
        {watchlist.map((item: any) => {
          // Find the specific ticker data in the API array
          const stats = marketData.find((t: any) => t.ticker === item.symbol);
          
          /** * LTP DATA PATHING
           * 1. min.c (Live minute close)
           * 2. lastTrade.p (Most recent trade price)
           * 3. prevDay.c (Friday's close - The standard LTP for weekends)
           */
          const LTP = stats?.min?.c || stats?.lastTrade?.p || stats?.prevDay?.c || stats?.day?.c;
          
          // Calculate change percentage from prevDay if live data is null
          const change = stats?.todaysChangePerc ?? 0;
          const isClosed = !stats?.min?.c;

          return (
            <div key={item.symbol} className="flex justify-between items-center group animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-5">
                <button 
                  onClick={() => setWatchlist(watchlist.filter((w: any) => w.symbol !== item.symbol))}
                  className="opacity-0 group-hover:opacity-100 text-red-500/50 hover:text-red-500 transition-all"
                >
                  <Trash2 size={16}/>
                </button>
                <div className="flex flex-col text-left">
                  <span className="text-white font-black text-2xl uppercase tracking-tighter leading-none">{item.symbol}</span>
                  {isClosed && (
                    <span className="text-[8px] text-blue-400/50 font-mono uppercase tracking-widest mt-1 flex items-center gap-1">
                      <Moon size={10} /> LTP - Market Closed
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right tabular-nums">
                <p className="text-white font-mono text-3xl tracking-tighter leading-none mb-1">
                  {LTP ? `$${LTP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}
                </p>
                <div className={`text-[10px] font-bold font-mono inline-block px-2 py-0.5 rounded ${change >= 0 ? 'text-green-400 bg-green-400/10' : 'text-red-500 bg-red-500/10'}`}>
                  {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}