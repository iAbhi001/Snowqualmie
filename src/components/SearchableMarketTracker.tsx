import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2, Search, RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

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
  
  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4; // Optimized for your dashboard height

  const syncingRef = useRef(false);

  // Logic to calculate pagination indices
  const totalPages = Math.ceil(watchlist.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = watchlist.slice(startIndex, startIndex + itemsPerPage);

  // Auto-adjust page if items are deleted
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [watchlist.length, totalPages, currentPage]);

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
    
    // Move to the last page where the new item will appear
    const newTotalPages = Math.ceil((watchlist.length + 1) / itemsPerPage);
    setCurrentPage(newTotalPages);
    
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
    <div className="w-full max-w-2xl mx-auto bg-[#0a0c10]/80 backdrop-blur-xl text-white rounded-[2.5rem] p-8 shadow-2xl border border-white/10 flex flex-col min-h-[580px]">
      {/* Header & Search */}
      <div className="flex gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20" size={18} />
          <input
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-blue-500 outline-none transition-all placeholder:text-white/10"
            placeholder="Add Asset (e.g. BTC, NVDA)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <button 
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-500 px-6 rounded-2xl transition-all active:scale-95"
        >
          <Plus />
        </button>
      </div>

      {/* Market Status Bar */}
      <div className="flex justify-between items-center mb-8 px-2 text-[10px] font-bold tracking-widest uppercase">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${status === 'Syncing' ? 'bg-yellow-500 animate-pulse shadow-[0_0_10px_#eab308]' : 'bg-green-500 shadow-[0_0_10px_#22c55e]'}`} />
          <span className="opacity-40">{watchlist.length} Assets Synchronized</span>
        </div>
        <button onClick={syncAll} className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity text-blue-400">
          <RefreshCw size={12} className={status === 'Syncing' ? 'animate-spin' : ''} />
          {status}
        </button>
      </div>

      {/* Stock List */}
      <div className="space-y-4 flex-1">
        {currentItems.map(symbol => {
          const data = marketData[symbol];
          const isNeg = data?.changePercent?.includes('-');
          
          return (
            <div key={symbol} className="group flex justify-between items-center p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-blue-500/30 transition-all duration-500 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-5">
                <button onClick={() => handleRemove(symbol)} className="opacity-0 group-hover:opacity-100 text-red-500/50 hover:text-red-500 transition-all">
                  <Trash2 size={18} />
                </button>
                <div>
                  <h3 className="text-2xl font-black tracking-tighter group-hover:text-blue-400 transition-colors">{symbol}</h3>
                  <p className="text-[9px] opacity-20 font-bold uppercase tracking-widest">Equity · Market_Data</p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-mono font-bold">
                  {data?.price ? `$${parseFloat(data.price).toLocaleString(undefined, {minimumFractionDigits: 2})}` : (
                    <span className="text-sm opacity-20 animate-pulse">{data?.error || 'Awaiting...'}</span>
                  )}
                </div>
                {data?.changePercent && (
                  <div className={`text-[11px] font-black font-mono px-2 py-0.5 rounded-lg inline-block ${isNeg ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                    {isNeg ? '▼' : '▲'} {data.changePercent}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {watchlist.length === 0 && (
          <div className="py-20 text-center opacity-10">
            <AlertCircle className="mx-auto mb-4" size={48} />
            <p className="font-mono text-sm uppercase tracking-widest">No Active Signal Streams</p>
          </div>
        )}
      </div>

      {/* TERMINAL PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-between border-t border-white/5 pt-8">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-3 rounded-full bg-white/5 border border-white/10 hover:border-blue-500/50 disabled:opacity-10 transition-all text-blue-400"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <div 
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${currentPage === i + 1 ? 'w-8 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'w-2 bg-white/10'}`}
              />
            ))}
          </div>

          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-3 rounded-full bg-white/5 border border-white/10 hover:border-blue-500/50 disabled:opacity-10 transition-all text-blue-400"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}