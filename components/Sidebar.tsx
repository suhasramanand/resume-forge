'use client';

import React, { useMemo } from 'react';
import { FormattedLine } from '@/lib/resumeFormatter';
import { ChevronRight, ChevronDown, X } from 'lucide-react';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sections: Record<string, FormattedLine[]>;
  expandedSections: Set<string>;
  toggleSection: (sectionKey: string) => void;
}

export function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  sections,
  expandedSections,
  toggleSection,
}: SidebarProps) {
  if (!sidebarOpen) return null;

  return (
    <div className="w-[280px] bg-background/95 backdrop-blur-sm border border-border rounded-xl flex flex-col h-[calc(100vh-2rem)] flex-shrink-0 z-10 shadow-lg">
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/80 flex-shrink-0 bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-foreground text-background text-xs font-bold flex items-center justify-center shadow-sm">
            RF
          </div>
          <div>
            <span className="text-sm font-semibold text-foreground block">Resume Editor</span>
            <span className="text-xs text-muted-foreground">Navigation</span>
          </div>
        </div>
        <button 
          className="p-1.5 hover:bg-muted rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-foreground/20"
          onClick={() => setSidebarOpen(false)}
          title="Close Sidebar (Ctrl+B or Cmd+B)"
          aria-label="Close sidebar"
        >
          <X size={18} className="text-muted-foreground" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">Resume Sections</div>
        {useMemo(() => Object.entries(sections).map(([sectionKey, sectionLines]) => {
          const sectionName = sectionLines.find(l => l.type === 'section')?.content || 
                            sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1);
          const isExpanded = expandedSections.has(sectionKey);
          const lineCount = sectionLines.filter(l => l.type !== 'section' && l.type !== 'separator').length;
          
          return (
            <div key={sectionKey} className="mb-1">
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-secondary/80 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-foreground/20 active:scale-[0.98] group"
                onClick={() => toggleSection(sectionKey)}
                aria-expanded={isExpanded}
                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${sectionName} section`}
              >
                {isExpanded ? (
                  <ChevronDown size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                ) : (
                  <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                )}
                <span className="flex-1 text-left font-medium">{sectionName}</span>
                <span className="text-xs font-medium text-muted-foreground bg-muted/80 px-2.5 py-1 rounded-full border border-border/50">
                  {lineCount}
                </span>
              </button>
            </div>
          );
        }), [sections, expandedSections, toggleSection])}
        {Object.keys(sections).length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <p>No sections available</p>
            <p className="text-xs mt-2">Upload a resume to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

