import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Cpu } from 'lucide-react';

export default function PhotoGallery({ photos }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const photosPerPage = 6; // Controls how many items per page

  const totalPages = Math.ceil(photos.length / photosPerPage);
  const currentPhotos = photos.slice((currentPage - 1) * photosPerPage, currentPage * photosPerPage);

  useEffect(() => {
    if (selectedPhoto) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
  }, [selectedPhoto]);

  return (
    <div className="w-full">
      {/* 1. THE MASONRY GRID */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8 mb-20">
        {currentPhotos.map((photo) => (
          <div 
            key={photo.id}
            className="relative cursor-pointer overflow-hidden rounded-[2rem] border border-white/10 bg-black/40 transition-all duration-500 hover:border-blue-500/50 animate-in fade-in"
            onClick={() => setSelectedPhoto(photo)}
          >
            <img src={photo.url} className="w-full h-auto object-cover opacity-80 hover:opacity-100 transition-opacity" alt={photo.title} />
          </div>
        ))}
      </div>

      {/* 2. THE PAGINATION CONTROLS */}
      <div className="flex flex-col items-center gap-6 border-t border-white/5 pt-12">
        <div className="flex items-center gap-6">
          <button 
            disabled={currentPage === 1}
            onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="p-4 rounded-full border border-white/10 text-white/20 hover:text-blue-400 disabled:opacity-0 transition-all"
          >
            <ChevronLeft size={20} />
          </button>

          {/* PAGE INDICATOR */}
          <div className="flex items-center gap-4 px-6 py-2 bg-white/5 rounded-full border border-white/10 font-mono text-[10px]">
            <span className="text-blue-500 font-black">PAGE_{currentPage.toString().padStart(2, '0')}</span>
            <span className="text-white/10">/</span>
            <span className="text-white/40">TOTAL_{totalPages.toString().padStart(2, '0')}</span>
          </div>

          <button 
            disabled={currentPage === totalPages}
            onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="p-4 rounded-full border border-white/10 text-white/20 hover:text-blue-400 disabled:opacity-0 transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.5em] text-white/10">
          <Cpu size={12} />
          <span>Buffer_Status: Optimized // Sector_Sync_Active</span>
        </div>
      </div>

      {/* 3. PHOTO HIGHLIGHT PORTAL */}
      {selectedPhoto && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-6"
          onClick={() => setSelectedPhoto(null)}
        >
          <button className="absolute top-10 right-10 text-white/20 hover:text-blue-500"><X size={40} /></button>
          <img src={selectedPhoto.url} className="max-h-[80vh] w-auto rounded-3xl border border-white/10 shadow-2xl" />
        </div>,
        document.body
      )}
    </div>
  );
}