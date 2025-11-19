'use client';

import React from 'react';
import { FormattedLine } from '@/lib/resumeFormatter';
import { SortableLine } from '../SortableLine';

interface EducationBlockProps {
  blockLines: FormattedLine[];
  editingId: string | null;
  editValue: string;
  onEditChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onStartEdit: (line: FormattedLine) => void;
  onAddLine: (lineId: string) => void;
  onRemoveLine: (lineId: string) => void;
}

export function EducationBlock({
  blockLines,
  editingId,
  editValue,
  onEditChange,
  onSave,
  onCancel,
  onStartEdit,
  onAddLine,
  onRemoveLine,
}: EducationBlockProps) {
  return (
    <>
      {blockLines.map((line, lineIdx) => {
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
      })}
    </>
  );
}

