import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Photo {
  url: string;
  title: string;
  description?: string;
}

export default function PhotoGallery({ photos }: { photos: Photo[] }) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  // Close lightbox on 'Escape' key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPhoto(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative">
      {/* Grid Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {photos.map((photo, index) => (
          <div 
            key={index}
            onClick={() => setSelectedPhoto(photo)}
            className="group relative overflow-hidden rounded-2xl bg-[#0a0c10] border border-white/5 cursor-pointer transition-all hover:border-white/20 shadow-lg"
          >
            <img 
              src={photo.url} 
              alt={photo.title || "Gallery image"} 
              className="w-full h-80 object-cover opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105"
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
              <h3 className="text-white font-bold text-lg">{photo.title}</h3>
              {photo.description && <p className="text-white/60 text-sm mt-1">{photo.description}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300"
          onClick={() => setSelectedPhoto(null)} // Close when clicking background
        >
          {/* Close Button */}
          <button 
            className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors z-[110]"
            onClick={() => setSelectedPhoto(null)}
          >
            <X size={40} />
          </button>

          <div 
            className="max-w-5xl w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image
          >
            <img 
              src={selectedPhoto.url} 
              alt={selectedPhoto.title}
              className="max-h-[85vh] w-auto rounded-lg shadow-2xl border border-white/10"
            />
            <div className="mt-6 text-center">
              <h2 className="text-3xl font-bold text-white tracking-tighter italic uppercase">
                {selectedPhoto.title}
              </h2>
              {selectedPhoto.description && (
                <p className="text-white/60 mt-2 text-lg">{selectedPhoto.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}