'use client';

import React from 'react';
import { FormattedLine } from '@/lib/resumeFormatter';
import { useResumeEditorState } from './useResumeEditorState';
import { useResumeEditorSections } from './useResumeEditorSections';
import { useResumeEditorEdit } from './useResumeEditorEdit';
import { useResumeEditorLines } from './useResumeEditorLines';
import { useResumeEditorDrag } from './useResumeEditorDrag';
import { useResumeEditorExport } from './useResumeEditorExport';
import { useResumeEditorResize } from './useResumeEditorResize';

export function useResumeEditor(
  lines: FormattedLine[], 
  onUpdate: (lines: FormattedLine[]) => void,
  previewContentRef?: React.RefObject<HTMLDivElement>
) {
  // State management
  const state = useResumeEditorState();

  // Section management
  const { sections, sectionMenuItems, createToggleSection } = useResumeEditorSections(
    lines,
    state.sectionOrder,
    state.setSectionOrder
  );

  // Edit operations
  const { startEdit, saveEdit, cancelEdit } = useResumeEditorEdit(
    lines,
    onUpdate,
    state.editingId,
    state.editValue,
    state.setEditingId,
    state.setEditValue
  );

  // Line operations
  const { addLine, removeLine } = useResumeEditorLines(lines, onUpdate);

  // Drag and drop
  const { handleLineDragEnd, handleSectionReorder, handleSectionDragEnd } = useResumeEditorDrag(
    lines,
    onUpdate,
    sections,
    state.sectionOrder,
    state.setSectionOrder
  );

  // Export/Print
  const { handleExportClick, handleFinalize } = useResumeEditorExport(
    lines,
    state.setShowExportPreview,
    previewContentRef || { current: null }
  );

  // Resize handlers
  const { handleMouseDown, handleMouseMove, handleMouseUp } = useResumeEditorResize(
    state.isResizing,
    state.setIsResizing,
    state.sidebarOpen
  );

  // Create toggleSection with state
  const toggleSection = createToggleSection(state.setExpandedSections);

  return {
    // State
    editingId: state.editingId,
    editValue: state.editValue,
    expandedSections: state.expandedSections,
    sectionOrder: state.sectionOrder,
    isResizing: state.isResizing,
    sidebarOpen: state.sidebarOpen,
    showExportPreview: state.showExportPreview,
    // State setters
    setEditingId: state.setEditingId,
    setEditValue: state.setEditValue,
    setExpandedSections: state.setExpandedSections,
    setSectionOrder: state.setSectionOrder,
    setIsResizing: state.setIsResizing,
    setSidebarOpen: state.setSidebarOpen,
    setShowExportPreview: state.setShowExportPreview,
    // Sections
    sections,
    sectionMenuItems,
    toggleSection,
    // Edit
    startEdit,
    saveEdit,
    cancelEdit,
    // Lines
    addLine,
    removeLine,
    // Drag
    handleLineDragEnd,
    handleSectionReorder,
    handleSectionDragEnd,
    // Export
    handleExportClick,
    handleFinalize,
    // Resize
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
