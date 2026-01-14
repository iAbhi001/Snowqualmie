import React from 'react';
import { Linkedin, ExternalLink, Share2, Users } from 'lucide-react';

export default function LinkedInCard() {
  return (
    /* Glassmorphism: backdrop-blur + low opacity background */
    <div className="relative group w-full max-w-[1200px] overflow-hidden rounded-[2.5rem] md:rounded-[4rem] border border-white/10 bg-white/[0.03] backdrop-blur-[40px] p-8 md:p-16 shadow-[0_24px_80px_rgba(0,0,0,0.5)] transition-all duration-700 hover:border-blue-500/30">
      
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_400px] items-center gap-12">
        <div className="space-y-8 text-left">
          <div className="flex items-center gap-3">
             <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
             </div>
             <span className="font-mono text-[10px] md:text-[12px] uppercase tracking-[0.5em] text-blue-500 font-black italic">Professional_Uplink</span>
          </div>

          <h2 className="text-5xl md:text-8xl font-black italic uppercase text-white tracking-tighter leading-[0.85]">
            Digital<br/>
            <span className="text-blue-500 drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]">Network</span>
          </h2>

          <p className="max-w-xl text-sm md:text-base text-white/40 font-mono leading-relaxed uppercase tracking-tight">
            Synchronizing at the intersection of Cloud Engineering and Scalable Architecture.
          </p>
        </div>

        <div className="relative flex items-center justify-center">
          {/* Frosted Icon Container */}
          <div className="relative z-20 bg-white/[0.05] p-10 rounded-[2.5rem] border border-white/10 backdrop-blur-md shadow-2xl transition-all duration-700 group-hover:border-blue-500/50">
            <Linkedin 
              size={100} 
              fill="#3b82f6" 
              stroke="none" 
              className="drop-shadow-[0_0_15px_rgba(59,130,246,0.9)] animate-pulse" 
            />
          </div>
        </div>
      </div>

      <div className="mt-12 flex justify-start">
        <a 
          href="https://linkedin.com/in/YOUR_PROFILE" 
          target="_blank"
          className="flex items-center gap-4 bg-blue-600 px-10 py-5 rounded-2xl text-white font-black uppercase tracking-widest hover:bg-blue-500 transition-all active:scale-95"
        >
          Sync Profile <ExternalLink size={18} />
        </a>
      </div>
    </div>
  );
}