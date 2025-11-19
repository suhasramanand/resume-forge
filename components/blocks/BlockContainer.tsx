'use client';

import React, { useState } from 'react';
import { FormattedLine } from '@/lib/resumeFormatter';
import { SortableLine } from '../SortableLine';
import { GripVertical, Trash2, Check, X } from 'lucide-react';
import { ExperienceBlock } from './ExperienceBlock';
import { ProjectBlock } from './ProjectBlock';
import { EducationBlock } from './EducationBlock';

interface BlockContainerProps {
  blockIdx: number;
  blockLines: FormattedLine[];
  blockTitle: string;
  firstField: string | undefined;
  indexKey: 'educationIndex' | 'experienceIndex' | 'projectIndex';
  editingId: string | null;
  editValue: string;
  onEditChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onStartEdit: (line: FormattedLine) => void;
  onAddLine: (lineId: string) => void;
  onRemoveLine: (lineId: string) => void;
}

export function BlockContainer({
  blockIdx,
  blockLines,
  blockTitle,
  firstField,
  indexKey,
  editingId,
  editValue,
  onEditChange,
  onSave,
  onCancel,
  onStartEdit,
  onAddLine,
  onRemoveLine,
}: BlockContainerProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const firstLine = blockLines[0];

  const handleDeleteClick = () => {
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = () => {
    if (firstLine) {
      onRemoveLine(firstLine.id);
    }
    setShowConfirmDelete(false);
  };

  const handleCancelDelete = () => {
    setShowConfirmDelete(false);
  };

  const renderBlockContent = () => {
    if (indexKey === 'experienceIndex') {
      return (
        <ExperienceBlock
          blockLines={blockLines}
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
    }

    if (indexKey === 'projectIndex') {
      return (
        <ProjectBlock
          blockLines={blockLines}
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
    }

    if (indexKey === 'educationIndex') {
      return (
        <EducationBlock
          blockLines={blockLines}
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
    }

    // Default rendering
    return blockLines.map((line) => {
      const lineIdx = blockLines.findIndex(l => l.id === line.id);
      const isFirst = lineIdx === 0;
      const isLast = lineIdx === blockLines.length - 1;

      return (
        <SortableLine
          key={line.id}
          line={line}
          editingId={editingId}
          editValue={editValue}
          onEditChange={onEditChange}
          onSave={onSave}
          onCancel={onCancel}
          onStartEdit={() => onStartEdit(line)}
          onAddLine={() => onAddLine(line.id)}
          onRemoveLine={() => onRemoveLine(line.id)}
          onMoveUp={() => {}}
          onMoveDown={() => {}}
          isFirst={isFirst}
          isLast={isLast}
        />
      );
    });
  };

  return (
    <div key={blockIdx} className="border border-border rounded-lg mb-4 bg-background overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted border-b border-border">
        <div className="flex items-center cursor-grab active:cursor-grabbing text-muted-foreground p-1 pointer-events-none">
          <GripVertical size={16} />
        </div>
        <span className="flex-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {blockTitle} {firstField ? `: ${firstField}` : ''}
        </span>
        {showConfirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              className="p-1.5 border border-green-300 rounded bg-green-50 hover:bg-green-100 hover:border-green-400 transition-all focus:outline-none focus:ring-2 focus:ring-green-200"
              onClick={handleConfirmDelete}
              title="Confirm delete"
              aria-label="Confirm delete"
            >
              <Check size={14} className="text-green-700" />
            </button>
            <button
              className="p-1.5 border border-border rounded bg-background hover:bg-secondary hover:border-foreground/20 transition-all focus:outline-none focus:ring-2 focus:ring-foreground/20"
              onClick={handleCancelDelete}
              title="Cancel delete"
              aria-label="Cancel delete"
            >
              <X size={14} className="text-foreground" />
            </button>
          </div>
        ) : (
          <button
            className="p-1.5 border border-border rounded bg-background hover:bg-red-50 hover:border-red-300 transition-all opacity-60 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-200"
            onClick={handleDeleteClick}
            title={`Delete entire ${blockTitle.toLowerCase()} block`}
            aria-label={`Delete ${blockTitle.toLowerCase()}`}
          >
            <Trash2 size={14} className="text-red-600" />
          </button>
        )}
      </div>
      <div className="p-2">
        {renderBlockContent()}
      </div>
    </div>
  );
}

