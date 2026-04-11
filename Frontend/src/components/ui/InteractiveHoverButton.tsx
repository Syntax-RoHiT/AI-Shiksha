import React, { useState, useRef } from "react";

export const InteractiveHoverButton = ({ children, className = "", onClick }: any) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    buttonRef.current.style.setProperty('--mouse-x', `${x}%`);
    buttonRef.current.style.setProperty('--mouse-y', `${y}%`);
  };

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative overflow-hidden rounded-full border border-gray-200 bg-white transition-all duration-300 transform active:scale-95 shadow-sm text-text-main hover:shadow-md ${className}`}
    >
      <div 
        className="absolute inset-0 z-0 transition-opacity duration-300 pointer-events-none"
        style={{
          opacity: hovered ? 1 : 0,
          background: "radial-gradient(150% 150% at var(--mouse-x, 50%) var(--mouse-y, 50%), #e0f2fe 0%, #fed7aa 60%, transparent 100%)"
        }}
      />
      <span className="relative z-10 flex items-center justify-center gap-2 font-medium">{children}</span>
    </button>
  );
};
