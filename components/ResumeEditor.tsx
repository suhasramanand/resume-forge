'use client';

import React, { useEffect, useRef, useState } from 'react';
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
  const editorScrollRef = useRef<HTMLDivElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(() => new Set());
  const [settings, setSettings] = useState<any>(null);
  
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
    undo,
    redo,
    canUndo,
    canRedo,
    historyLength,
    currentIndex,
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
      // Ctrl/Cmd + Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      }
      // Ctrl/Cmd + Shift + Z: Redo
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        if (canRedo) redo();
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
  }, [setSidebarOpen, showExportPreview, setShowExportPreview, canUndo, canRedo, undo, redo]);

  return (
    <div className="flex h-full w-full overflow-hidden relative p-3 sm:p-4 gap-3 sm:gap-4">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sections={sections}
        expandedSections={expandedSections}
        toggleSection={toggleSection}
        lines={lines}
        onLinesChange={onUpdate}
        undoRedo={{
          canUndo,
          canRedo,
          onUndo: undo,
          onRedo: redo,
          historyLength,
          currentIndex,
        }}
        visibleSections={visibleSections}
        onVisibleSectionsChange={setVisibleSections}
        settings={settings}
        onSettingsChange={(newSettings) => {
          const updated = { ...settings, ...newSettings };
          setSettings(updated);
          if (typeof window !== 'undefined') {
            localStorage.setItem('resume-forge-settings', JSON.stringify(updated));
          }
        }}
      />

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
        editorScrollRef={editorScrollRef}
        previewScrollRef={previewScrollRef}
      />

      <div 
        className="w-1.5 bg-border cursor-col-resize hover:bg-foreground/30 transition-colors flex-shrink-0 rounded group relative"
        onMouseDown={handleMouseDown}
        title="Drag to resize preview"
        aria-label="Resize preview panel"
      >
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 h-12 bg-foreground/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>

      <PreviewPanel 
        ref={previewContentRef} 
        lines={lines} 
        editorScrollRef={editorScrollRef} 
        previewScrollRef={previewScrollRef}
        visibleSections={visibleSections}
        settings={settings}
      />

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
        visibleSections={visibleSections}
        settings={settings}
      />
    </div>
  );
}

