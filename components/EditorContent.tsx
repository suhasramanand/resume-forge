'use client';

import React, { useMemo } from 'react';
import { FormattedLine } from '@/lib/resumeFormatter';
import {
  DndContext,
  closestCenter,
  SensorDescriptor,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableLine } from './SortableLine';
import { BlockRenderer } from './BlockRenderer';
import { SortableSection } from './SortableSection';
import { Download, FileText } from 'lucide-react';

interface EditorContentProps {
  lines: FormattedLine[];
  sections: Record<string, FormattedLine[]>;
  sectionOrder: string[];
  expandedSections: Set<string>;
  editingId: string | null;
  editValue: string;
  sensors: SensorDescriptor<any>[];
  onEditChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onStartEdit: (line: FormattedLine) => void;
  onAddLine: (lineId: string) => void;
  onRemoveLine: (lineId: string) => void;
  onLineDragEnd: (event: DragEndEvent) => void;
  onSectionDragEnd: (event: DragEndEvent) => void;
  onExport: () => void;
}

export function EditorContent({
  lines,
  sections,
  sectionOrder,
  expandedSections,
  editingId,
  editValue,
  sensors,
  onEditChange,
  onSave,
  onCancel,
  onStartEdit,
  onAddLine,
  onRemoveLine,
  onLineDragEnd,
  onSectionDragEnd,
  onExport,
}: EditorContentProps) {
  // Memoize ordered sections and filtered lines
  const orderedSections = useMemo(
    () => sectionOrder.length > 0 ? sectionOrder : Object.keys(sections),
    [sectionOrder, sections]
  );

  const sortableItems = useMemo(
    () => [...orderedSections, ...lines.filter(l => l.type !== 'section').map(l => l.id)],
    [orderedSections, lines]
  );

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden min-w-0 border border-border rounded-lg shadow-sm h-[calc(100vh-2rem)]">
      <div className="sticky top-0 z-10 px-6 py-4 border-b border-border bg-background flex items-center justify-between flex-shrink-0 rounded-t-lg shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-foreground m-0 tracking-tight">Resume Editor</h1>
          <p className="text-xs text-muted-foreground mt-1">Click any field to edit • Drag to reorder</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="flex items-center gap-1.5 px-4 py-2 bg-foreground text-background rounded-md text-sm font-medium hover:bg-foreground/90 transition-colors focus:outline-none focus:ring-2 focus:ring-foreground/20 shadow-sm"
            onClick={onExport}
            title="Export to PDF (Ctrl+P)"
            aria-label="Export resume to PDF"
          >
            <Download size={16} />
            Export PDF
          </button>
        </div>
      </div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(event) => {
          // Check if dragging a section (sectionKey) or a line (line.id)
          const activeId = event.active.id as string;
          const isSectionDrag = orderedSections.includes(activeId);
          
          if (isSectionDrag) {
            onSectionDragEnd(event);
          } else {
            // Check if dragging a section heading line - if so, ignore (section drag handles it)
            const activeLine = lines.find(l => l.id === activeId);
            if (activeLine?.type === 'section') {
              return; // Section heading drags are handled by section drag
            }
            onLineDragEnd(event);
          }
        }}
      >
        <SortableContext
          items={sortableItems}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex-1 overflow-y-auto px-6 py-6 pb-32">
            {orderedSections.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FileText size={24} className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No sections available</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Upload a resume file to get started. The editor will automatically parse and organize your content.
                </p>
              </div>
            ) : (
              orderedSections.map((sectionKey) => {
                const sectionLines = sections[sectionKey];
                if (!sectionLines) return null;
                const isExpanded = expandedSections.has(sectionKey);
                if (!isExpanded) return null;

                return (
                  <SortableSection
                    key={sectionKey}
                    sectionKey={sectionKey}
                    sectionLines={sectionLines}
                    editingId={editingId}
                    editValue={editValue}
                    onEditChange={onEditChange}
                    onSave={onSave}
                    onCancel={onCancel}
                    onStartEdit={onStartEdit}
                    onAddLine={onAddLine}
                    onRemoveLine={onRemoveLine}
                  />
                );
              })
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

