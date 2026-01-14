// src/components/CertificationGrid.tsx
import React, { useEffect, useState } from 'react';
import { ExternalLink, Zap, Loader2 } from 'lucide-react';

export default function CertificationGrid() {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/credly')
      .then(res => res.json())
      .then(data => {
        setBadges(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center gap-4 py-20">
      <Loader2 className="animate-spin text-blue-500" size={40} />
      <span className="font-mono text-[10px] text-blue-400 uppercase tracking-[0.5em]">Syncing_Credly_Ledger...</span>
    </div>
  );

  return (
    <div className="w-full space-y-16">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
           <Zap size={16} className="text-blue-500 animate-pulse" />
           <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-blue-500 font-black">Verified_Skills_Ledger</span>
        </div>
        <h2 className="text-5xl md:text-8xl font-black italic uppercase text-white tracking-tighter">
          Field <span className="text-blue-500 text-glow">Credentials</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {badges.map((badge, index) => (
          <a 
            key={index}
            href={badge.link}
            target="_blank"
            className="group relative overflow-hidden rounded-[3rem] border border-white/10 bg-white/[0.02] backdrop-blur-3xl p-10 transition-all hover:border-blue-500/40 hover:-translate-y-2 duration-500"
          >
            <div className="relative z-10 flex flex-col items-center text-center space-y-8">
              <div className="relative p-4 rounded-3xl bg-white/5 border border-white/5 group-hover:border-blue-500/30 transition-all">
                <img src={badge.image} alt={badge.title} className="w-28 h-28 relative z-10 grayscale group-hover:grayscale-0 transition-all duration-700" />
              </div>
              
              <div className="space-y-2">
                <h4 className="text-xl font-black text-white uppercase tracking-tight leading-tight">{badge.title}</h4>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em]">{badge.issuer} // {badge.date}</p>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-mono text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase font-black tracking-widest">
                Verify_Protocol <ExternalLink size={14} />
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}