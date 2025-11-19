'use client';

import React from 'react';
import { FormattedLine } from '@/lib/resumeFormatter';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';

interface SkillTagProps {
  line: FormattedLine;
  editingId: string | null;
  editValue: string;
  onEditChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onStartEdit: () => void;
  onRemove: () => void;
}

export function SkillTag({
  line,
  editingId,
  editValue,
  onEditChange,
  onSave,
  onCancel,
  onStartEdit,
  onRemove,
}: SkillTagProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: line.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted border border-border rounded-md text-xs group hover:border-foreground/30 hover:shadow-sm transition-all"
    >
      <div 
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground flex-shrink-0 p-0.5 rounded hover:bg-background transition-colors" 
        {...attributes} 
        {...listeners}
        title="Drag to reorder"
        aria-label="Drag handle"
      >
        <GripVertical size={12} />
      </div>
      {editingId === line.id ? (
        <input
          type="text"
          className="flex-1 min-w-[60px] px-1.5 py-0.5 border-2 border-foreground rounded text-xs font-mono outline-none bg-background text-foreground focus:ring-2 focus:ring-foreground/20 transition-all"
          value={editValue}
          onChange={(e) => onEditChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSave();
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              onCancel();
            }
          }}
          onBlur={onSave}
          autoFocus
          placeholder="Skill name..."
        />
      ) : (
        <span 
          className="cursor-text text-foreground px-1 rounded hover:bg-background/50 transition-colors"
          onClick={onStartEdit}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onStartEdit();
            }
          }}
          aria-label="Click to edit skill"
        >
          {line.content || <span className="text-muted-foreground italic">Skill name...</span>}
        </span>
      )}
      <button
        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-50 rounded transition-all focus:outline-none focus:ring-2 focus:ring-red-200"
        onClick={onRemove}
        title="Remove skill"
        aria-label="Remove skill"
      >
        <X size={12} className="text-red-600" />
      </button>
    </div>
  );
}

