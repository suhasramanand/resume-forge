'use client';

import React, { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormattedLine } from '@/lib/resumeFormatter';
import { GripVertical } from 'lucide-react';
import { BlockRenderer } from './BlockRenderer';

interface SortableSectionProps {
  sectionKey: string;
  sectionLines: FormattedLine[];
  editingId: string | null;
  editValue: string;
  onEditChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onStartEdit: (line: FormattedLine) => void;
  onAddLine: (lineId: string) => void;
  onRemoveLine: (lineId: string) => void;
}

export function SortableSection({
  sectionKey,
  sectionLines,
  editingId,
  editValue,
  onEditChange,
  onSave,
  onCancel,
  onStartEdit,
  onAddLine,
  onRemoveLine,
}: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sectionKey });

  // Memoize style object
  const style = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }), [transform, transition, isDragging]);

  return (
    <div ref={setNodeRef} style={style} className="mb-6">
      <BlockRenderer
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
        dragHandleAttributes={attributes}
        dragHandleListeners={listeners}
      />
    </div>
  );
}

