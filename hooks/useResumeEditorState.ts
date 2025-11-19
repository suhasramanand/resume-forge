import { useState } from 'react';

export function useResumeEditorState() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['header', 'education', 'skills', 'experience', 'projects'])
  );
  const [sectionOrder, setSectionOrder] = useState<string[]>([]);
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showExportPreview, setShowExportPreview] = useState(false);

  return {
    editingId,
    setEditingId,
    editValue,
    setEditValue,
    expandedSections,
    setExpandedSections,
    sectionOrder,
    setSectionOrder,
    isResizing,
    setIsResizing,
    sidebarOpen,
    setSidebarOpen,
    showExportPreview,
    setShowExportPreview,
  };
}

