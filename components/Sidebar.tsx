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
    <div className="w-[280px] bg-background border border-border rounded-lg flex flex-col h-[calc(100vh-2rem)] flex-shrink-0 z-10 shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-foreground text-background text-xs font-bold flex items-center justify-center">J</div>
          <span className="text-sm font-semibold text-foreground">Resume Editor</span>
        </div>
        <button 
          className="p-1 hover:bg-muted rounded transition-colors"
          onClick={() => setSidebarOpen(false)}
          title="Close Sidebar"
        >
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1">Resume Sections</div>
        {useMemo(() => Object.entries(sections).map(([sectionKey, sectionLines]) => {
          const sectionName = sectionLines.find(l => l.type === 'section')?.content || 
                            sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1);
          const isExpanded = expandedSections.has(sectionKey);
          const lineCount = sectionLines.filter(l => l.type !== 'section' && l.type !== 'separator').length;
          
          return (
            <div key={sectionKey} className="mb-1">
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-foreground/20 active:bg-muted"
                onClick={() => toggleSection(sectionKey)}
                aria-expanded={isExpanded}
                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${sectionName} section`}
              >
                {isExpanded ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
                <span className="flex-1 text-left font-medium">{sectionName}</span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{lineCount}</span>
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

