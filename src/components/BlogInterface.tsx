import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';

export default function BlogInterface({ initialPosts = [] }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const postsPerPage = 4;

  // FIX: Added optional chaining (?.) and fallbacks ('') to prevent toLowerCase() crashes
  const filtered = initialPosts.filter(p => 
    p?.title?.toLowerCase().includes(search.toLowerCase()) ||
    p?.category?.toLowerCase().includes(search.toLowerCase()) ||
    p?.excerpt?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / postsPerPage);
  const displayedPosts = filtered.slice((page - 1) * postsPerPage, page * postsPerPage);

  return (
    <div className="space-y-12">
      <div className="relative max-w-2xl">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-500/50" size={20} />
        <input 
          type="text"
          placeholder="FILTER_ARCHIVES..."
          className="w-full bg-white/[0.03] border border-white/10 rounded-full py-5 pl-16 pr-8 text-white font-mono focus:border-blue-500/50 outline-none transition-all backdrop-blur-xl"
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {displayedPosts.map((post, idx) => (
          <a key={idx} href={post.slug} className="group relative p-10 rounded-[3rem] border border-white/5 bg-white/[0.02] backdrop-blur-3xl hover:bg-white/[0.05] hover:border-blue-500/30 transition-all duration-500">
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20 uppercase tracking-widest font-black italic">
                {post.category || 'GENERAL'}
              </span>
              <ArrowUpRight className="text-white/20 group-hover:text-blue-400 transition-all" />
            </div>
            <h3 className="text-3xl font-bold text-white uppercase italic leading-tight mb-4 group-hover:text-blue-400">
              {post.title || 'Untitled Transmission'}
            </h3>
            <p className="text-white/40 font-mono text-xs uppercase leading-relaxed line-clamp-2">
              {post.excerpt || 'No description available.'}
            </p>
          </a>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-6 pt-10">
          <button onClick={() => setPage(p => Math.max(1, p-1))} className="p-4 rounded-full border border-white/10 text-white hover:border-blue-500 transition-all disabled:opacity-10" disabled={page === 1}>
            <ChevronLeft size={20} />
          </button>
          <span className="font-mono text-blue-400 font-bold tracking-widest">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p+1))} className="p-4 rounded-full border border-white/10 text-white hover:border-blue-500 transition-all disabled:opacity-10" disabled={page === totalPages}>
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}