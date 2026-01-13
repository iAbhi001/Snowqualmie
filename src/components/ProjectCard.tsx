import React from 'react';
import { Github, Star, ExternalLink, Code2 } from 'lucide-react';

// 1. Define the Interface
interface ProjectProps {
  title: string;
  description: string;
  tech: string[];
  githubUrl: string;
  demoUrl?: string;
  stars?: number;
}

// 2. IMPORTANT: Use "export default" here
export default function ProjectCard({ title, description, tech, githubUrl, demoUrl, stars }: ProjectProps) {
  return (
    <div className="relative group overflow-hidden rounded-[2rem] border border-white/10 bg-transparent p-8 backdrop-blur-md transition-all hover:border-blue-500/40 z-10">
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
          <Code2 className="text-blue-500" size={24} />
        </div>
        <div className="flex gap-3">
          <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">
            <Github size={20} />
          </a>
          {demoUrl && (
            <a href={demoUrl} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">
              <ExternalLink size={20} />
            </a>
          )}
        </div>
      </div>

      <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-3 group-hover:text-blue-400 transition-colors">
        {title}
      </h3>
      
      <p className="text-white/50 text-xs leading-relaxed mb-6 font-mono">
        {description}
      </p>

      <div className="flex flex-wrap gap-2">
        {tech.map((item) => (
          <span key={item} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-blue-500">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}