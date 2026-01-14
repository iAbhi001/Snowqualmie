import React, { useEffect, useState } from 'react';
import { ExternalLink, Zap, Loader2 } from 'lucide-react';

interface Badge {
  title: string;
  issuer: string;
  image: string;
  link: string;
  date: string;
}

export default function CertificationGrid() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/credly')
      .then(res => res.json())
      .then(data => {
        setBadges(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center gap-4 py-20">
      <Loader2 className="animate-spin text-blue-500" size={40} />
      <span className="font-mono text-[10px] text-blue-400 uppercase tracking-[0.5em]">Syncing_Credly...</span>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {badges.map((badge, index) => (
        /* FIXED: Unique Key Prop */
        <a 
          key={`${badge.title}-${index}`} 
          href={badge.link}
          target="_blank"
          className="group relative overflow-hidden rounded-[3rem] border border-white/10 bg-white/[0.02] backdrop-blur-3xl p-10 transition-all hover:border-blue-500/40 hover:-translate-y-2 duration-500"
        >
          <div className="relative z-10 flex flex-col items-center text-center space-y-6">
            <img src={badge.image} alt={badge.title} className="w-24 h-24 grayscale group-hover:grayscale-0 transition-all" />
            <div>
              <h4 className="text-lg font-bold text-white uppercase tracking-tight">{badge.title}</h4>
              <p className="text-[10px] font-mono text-white/30 uppercase mt-1">{badge.issuer} // {badge.date}</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase font-black">
              Verify_Uplink <ExternalLink size={12} />
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}