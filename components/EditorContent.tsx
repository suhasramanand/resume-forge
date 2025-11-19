'use client';

import React, { useMemo, useRef, useEffect } from 'react';
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
import { Download, FileText, Copy, Check } from 'lucide-react';
import { getResumeAsText } from '@/lib/utils/resumeText';
import { useState } from 'react';

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
  onCopy?: () => void;
  editorScrollRef?: React.RefObject<HTMLDivElement>;
  previewScrollRef?: React.RefObject<HTMLDivElement>;
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
  onCopy,
  editorScrollRef,
  previewScrollRef,
}: EditorContentProps) {
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const scrollRef = editorScrollRef || internalScrollRef;
  const isScrollingRef = useRef(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const resumeText = getResumeAsText(lines);
      await navigator.clipboard.writeText(resumeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (onCopy) onCopy();
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Memoize ordered sections and filtered lines
  const orderedSections = useMemo(
    () => sectionOrder.length > 0 ? sectionOrder : Object.keys(sections),
    [sectionOrder, sections]
  );

  const sortableItems = useMemo(
    () => [...orderedSections, ...lines.filter(l => l.type !== 'section').map(l => l.id)],
    [orderedSections, lines]
  );

  // Sync scroll with preview
  useEffect(() => {
    const editorElement = scrollRef.current;
    const previewElement = previewScrollRef?.current;

    if (!editorElement || !previewElement) return;

    const handleScroll = () => {
      if (isScrollingRef.current) return;
      
      isScrollingRef.current = true;
      
      const editorScrollTop = editorElement.scrollTop;
      const editorScrollHeight = editorElement.scrollHeight - editorElement.clientHeight;
      const editorScrollPercent = editorScrollHeight > 0 ? editorScrollTop / editorScrollHeight : 0;
      
      const previewScrollHeight = previewElement.scrollHeight - previewElement.clientHeight;
      const targetPreviewScroll = previewScrollHeight * editorScrollPercent;
      
      previewElement.scrollTop = targetPreviewScroll;
      
      requestAnimationFrame(() => {
        isScrollingRef.current = false;
      });
    };

    editorElement.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      editorElement.removeEventListener('scroll', handleScroll);
    };
  }, [scrollRef, previewScrollRef]);

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden min-w-0 border border-border rounded-xl shadow-sm h-[calc(100vh-2rem)]">
      <div className="sticky top-0 z-10 px-6 sm:px-8 py-4 sm:py-5 border-b border-border/80 bg-background/95 backdrop-blur-sm flex items-center justify-between flex-shrink-0 rounded-t-xl shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground m-0 tracking-tight">Resume Editor</h1>
          <p className="text-xs text-muted-foreground mt-1.5">Click any field to edit • Drag to reorder</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-background border border-border text-foreground rounded-lg text-sm font-medium hover:bg-secondary hover:shadow-md active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:ring-offset-2 shadow-sm"
            onClick={handleCopy}
            title="Copy to clipboard"
            aria-label="Copy resume to clipboard"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
            <span className="sm:hidden">{copied ? '✓' : 'Copy'}</span>
          </button>
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:bg-foreground/90 hover:shadow-md active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:ring-offset-2 shadow-sm"
            onClick={onExport}
            title="Export to PDF (Ctrl+P or Cmd+P)"
            aria-label="Export resume to PDF"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export PDF</span>
            <span className="sm:hidden">Export</span>
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
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 pb-32">
            {orderedSections.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16 px-4">
                <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-6 border border-border/50">
                  <FileText size={32} className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No sections available</h3>
                <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                  Upload a resume file to get started. The editor will automatically parse and organize your content into editable sections.
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

