import React, { useState, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import { X, ZoomIn } from "lucide-react";

const Lightbox = ({ src, alt, onClose }) => {
  // Use portal to render at document root level
  if (typeof document === "undefined") return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
      >
        <X size={32} />
      </button>

      {/* Image Container */}
      <div 
        className="relative max-w-full max-h-full overflow-auto flex items-center justify-center"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
      >
        <img 
          src={src} 
          alt={alt} 
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
        />
      </div>
    </div>,
    document.body
  );
};

export const ZoomableImage = memo(({ src, alt = "Image", className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <>
      <div 
        className={`relative group cursor-zoom-in overflow-hidden rounded-xl border border-gray-200 bg-gray-50 ${className}`}
        onClick={toggleOpen}
      >
        <img 
          src={src} 
          alt={alt} 
          loading="lazy"
          className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]" 
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-white/90 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm flex items-center gap-2 backdrop-blur-sm transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <ZoomIn size={16} />
            <span>Zoom</span>
          </div>
        </div>
      </div>

      {isOpen && <Lightbox src={src} alt={alt} onClose={() => setIsOpen(false)} />}
    </>
  );
});

ZoomableImage.displayName = "ZoomableImage";

