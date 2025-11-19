'use client';

import React from 'react';
import { FormattedLine } from '@/lib/resumeFormatter';
import { Eye, EyeOff } from 'lucide-react';

interface VisibilityTabProps {
  sections: Record<string, FormattedLine[]>;
  visibleSections: Set<string>;
  toggleSectionVisibility: (sectionKey: string) => void;
}

export function VisibilityTab({
  sections,
  visibleSections,
  toggleSectionVisibility,
}: VisibilityTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">Section Visibility</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Toggle sections on/off for export. Hidden sections won't appear in the final PDF.
        </p>
      </div>

      <div className="space-y-2">
        {Object.entries(sections).map(([sectionKey, sectionLines]) => {
          const sectionName = sectionLines.find(l => l.type === 'section')?.content || 
                            sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1);
          const isVisible = visibleSections.has(sectionKey);

          return (
            <button
              key={sectionKey}
              onClick={() => toggleSectionVisibility(sectionKey)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                isVisible
                  ? 'bg-background border-border hover:bg-secondary/50'
                  : 'bg-muted/50 border-border/50 opacity-60'
              }`}
            >
              <span className="text-sm font-medium text-foreground">{sectionName}</span>
              {isVisible ? (
                <Eye size={16} className="text-muted-foreground" />
              ) : (
                <EyeOff size={16} className="text-muted-foreground" />
              )}
            </button>
          );
        })}
      </div>

      {Object.keys(sections).length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <p>No sections available</p>
        </div>
      )}
    </div>
  );
}

