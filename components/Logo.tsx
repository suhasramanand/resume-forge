'use client';

import React from 'react';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-foreground"
      >
        {/* Document/Resume icon with forge/hammer accent */}
        <rect x="6" y="4" width="20" height="26" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
        <line x1="10" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="10" y1="14" x2="20" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="10" y1="18" x2="18" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        {/* Forge/Hammer accent */}
        <path d="M24 8 L28 6 L30 10 L26 12 Z" fill="currentColor" opacity="0.8" />
        <circle cx="28" cy="8" r="1.5" fill="currentColor" />
      </svg>
      <span className="text-3xl font-bold text-foreground tracking-tight">ResumeForge</span>
    </div>
  );
}

