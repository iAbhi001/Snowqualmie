import React, { useState, useEffect } from 'react';
import { Activity, ExternalLink } from 'lucide-react';

export default function LeetCodeCard() {
  const [stats, setStats] = useState({ total: 617, easy: 0, medium: 0 });
  const [isSyncing, setIsSyncing] = useState(false);

  const leetcodeUrl = "https://leetcode.com/u/mmulpuri/";

  const fetchStats = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/leetcode');
      const data = await res.json();
      if (!data.error) {
        setStats({
          total: data.totalSolved,
          easy: data.easySolved,
          medium: data.mediumSolved
        });
      }
    } catch (e) {
      console.error("LeetCode Sync Error", e);
    }
    setTimeout(() => setIsSyncing(false), 2000);
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 600000);
    return () => clearInterval(interval);
  }, []);

  return (
    /* Key Changes: 
       1. Changed bg-white/5 to bg-transparent for full transparency.
       2. Kept backdrop-blur-sm to ensure text remains readable over the Earth.
       3. Increased border opacity (border-white/20) so the card shape is visible.
    */
    <div className="relative group overflow-hidden rounded-[3rem] border border-white/20 bg-transparent p-16 backdrop-blur-sm transition-all hover:border-blue-500/40 z-10">
      
      {/* Subtle Dynamic Background Glow - lowered opacity to keep it translucent */}
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-500/5 blur-[150px] transition-all group-hover:bg-blue-500/10"></div>

      <div className="mb-16 flex items-start justify-between">
        <div>
          <h3 className="mb-4 font-mono text-sm uppercase tracking-[0.5em] text-blue-500">Algorithm Command Center</h3>
          <p className="flex items-center gap-3 text-xs uppercase tracking-widest text-white/60">
            <Activity size={14} className={isSyncing ? "animate-pulse text-green-500" : ""} />
            {isSyncing ? "Syncing Global Stats..." : "Data Stream: Stable"}
          </p>
        </div>
        
        <a 
          href={leetcodeUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-4 rounded-full border border-white/10 bg-white/5 px-8 py-4 transition-all hover:bg-blue-600/20"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-blue-500" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.483 0a1.374 1.374 0 0 0-.961.414l-4.377 4.344a1.287 1.287 0 0 0 .192 2.015 1.236 1.236 0 0 0 1.604-.188l3.962-3.94 1.917 1.913-1.42 1.403L15.42 7.04l2.583-2.553a1.353 1.353 0 0 0 0-1.928L15.33.414A1.371 1.371 0 0 0 14.37 0h-.887zm-1.127 8.445-5.273 5.215-2.226-2.21a1.299 1.299 0 1 0-1.84 1.832l2.307 2.295a1.295 1.295 0 0 0 1.839 0l5.66-5.591a1.299 1.299 0 0 0-1.84-1.831h-.627zm4.053 5.176c-.613 0-1.108.497-1.108 1.107 0 .61.495 1.108 1.108 1.108s1.108-.498 1.108-1.108c0-.61-.495-1.107-1.108-1.107zm-7.397 4.29a1.291 1.291 0 0 0-.918.384l-4.332 4.281a1.35 1.35 0 0 0 0 1.922l2.035 2.016a1.375 1.375 0 0 0 1.94 0l4.332-4.28a1.291 1.291 0 0 0-.918-2.203h-2.157z"/>
          </svg>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-white">View Full Profile</span>
          <ExternalLink size={16} className="text-white/40" />
        </a>
      </div>

      <div className="relative flex items-center gap-12">
        <span className="text-[16rem] font-black italic leading-none tracking-tighter text-white drop-shadow-[0_0_60px_rgba(59,130,246,0.25)]">
          {stats.total}
        </span>
        
        <div className="flex flex-col justify-center">
          <span className="text-7xl font-black uppercase text-blue-500 italic tracking-tighter leading-[0.75]">
            Problems
          </span>
          <span className="text-7xl font-black uppercase text-white italic tracking-tighter leading-[0.75]">
            Solved
          </span>
        </div>
      </div>

      <div className="mt-24 grid grid-cols-3 gap-12 border-t border-white/10 pt-12">
        <div className="flex flex-col">
          <span className="font-mono text-4xl font-bold text-green-400">{stats.easy}</span>
          <span className="text-xs font-bold uppercase tracking-widest text-white/50 mt-2">Easy Mastery</span>
        </div>
        <div className="flex flex-col">
          <span className="font-mono text-4xl font-bold text-yellow-400">{stats.medium}</span>
          <span className="text-xs font-bold uppercase tracking-widest text-white/50 mt-2">Medium Solutions</span>
        </div>
        <div className="flex flex-col border-l border-white/10 pl-12">
          <span className="font-mono text-4xl font-bold text-blue-500">{stats.total}</span>
          <span className="text-xs font-bold uppercase tracking-widest text-white/50 mt-2">Total Milestone</span>
        </div>
      </div>
    </div>
  );
}