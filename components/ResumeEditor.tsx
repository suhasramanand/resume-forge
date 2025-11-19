'use client';

import React, { useEffect, useRef } from 'react';
import { FormattedLine } from '@/lib/resumeFormatter';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableLine } from './SortableLine';
import { SectionMenu } from './SectionMenu';
import { LinkRenderer } from './LinkRenderer';
import { ExportPreviewModal } from './ExportPreviewModal';
import { Sidebar } from './Sidebar';
import { EditorContent } from './EditorContent';
import { PreviewPanel } from './PreviewPanel';
import { 
  FileText, User, Briefcase, Download, ChevronRight, ChevronDown, Rocket, Trophy,
  X, Menu, GripVertical, Trash2
} from 'lucide-react';
import { useResumeEditor } from '@/hooks/useResumeEditor';

interface ResumeEditorProps {
  lines: FormattedLine[];
  onUpdate: (lines: FormattedLine[]) => void;
  onExport?: (() => void) | undefined;
}

export function ResumeEditor({ lines, onUpdate, onExport }: ResumeEditorProps) {
  const previewContentRef = useRef<HTMLDivElement>(null);
  
  const {
    editingId,
    editValue,
    expandedSections,
    sectionOrder,
    isResizing,
    sidebarOpen,
    showExportPreview,
    setEditingId,
    setEditValue,
    setExpandedSections,
    setSectionOrder,
    setIsResizing,
    setSidebarOpen,
    setShowExportPreview,
    sections,
    sectionMenuItems,
    toggleSection,
    startEdit,
    saveEdit,
    cancelEdit,
    addLine,
    removeLine,
    handleLineDragEnd,
    handleSectionReorder,
    handleSectionDragEnd,
    handleExportClick,
    handleFinalize,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useResumeEditor(lines, onUpdate, previewContentRef);

  // Sensors should be created directly, not memoized (hooks must be called unconditionally)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + B: Toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
      // Ctrl/Cmd + P: Export (but don't prevent default browser print)
      if ((e.ctrlKey || e.metaKey) && e.key === 'p' && !e.shiftKey) {
        // Let browser handle Ctrl+P for print, we'll use our export button
      }
      // Escape: Close modals
      if (e.key === 'Escape') {
        if (showExportPreview) {
          setShowExportPreview(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSidebarOpen, showExportPreview, setShowExportPreview]);

  return (
    <div className="flex h-screen w-full overflow-hidden relative p-4 gap-4">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sections={sections}
        expandedSections={expandedSections}
        toggleSection={toggleSection}
      />

      {!sidebarOpen && (
        <button 
          className="fixed left-6 top-6 z-20 p-2.5 bg-background border border-border rounded-lg shadow-lg hover:bg-secondary hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-foreground/20"
          onClick={() => setSidebarOpen(true)}
          title="Open Sidebar (Ctrl+B)"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>
      )}

      <EditorContent
        lines={lines}
        sections={sections}
        sectionOrder={sectionOrder}
        expandedSections={expandedSections}
        editingId={editingId}
        editValue={editValue}
        sensors={sensors}
        onEditChange={setEditValue}
        onSave={saveEdit}
        onCancel={cancelEdit}
        onStartEdit={startEdit}
        onAddLine={addLine}
        onRemoveLine={removeLine}
        onLineDragEnd={handleLineDragEnd}
        onSectionDragEnd={handleSectionDragEnd}
        onExport={handleExportClick}
      />

      <div 
        className="w-1.5 bg-border cursor-col-resize hover:bg-foreground/30 transition-colors flex-shrink-0 rounded group relative"
        onMouseDown={handleMouseDown}
        title="Drag to resize preview"
        aria-label="Resize preview panel"
      >
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 h-12 bg-foreground/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>

      <PreviewPanel ref={previewContentRef} lines={lines} />

      <SectionMenu
        sections={sectionMenuItems}
        onReorder={handleSectionReorder}
        onSectionClick={(sectionId) => toggleSection(sectionId)}
      />

      <ExportPreviewModal
        isOpen={showExportPreview}
        onClose={() => setShowExportPreview(false)}
        onExport={handleFinalize}
        lines={lines}
      />
    </div>
  );
}

