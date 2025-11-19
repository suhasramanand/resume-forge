'use client';

import React, { useMemo, useCallback } from 'react';
import { FormattedLine } from '@/lib/resumeFormatter';
import { SortableLine } from './SortableLine';
import { GripVertical } from 'lucide-react';
import { BlockContainer } from './blocks/BlockContainer';
import { SkillsBlock } from './blocks/SkillsBlock';

interface BlockRendererProps {
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
  dragHandleAttributes?: any;
  dragHandleListeners?: any;
}

export function BlockRenderer({
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
  dragHandleAttributes,
  dragHandleListeners,
}: BlockRendererProps) {
  // Memoize section heading and content lines
  const sectionHeading = useMemo(
    () => sectionLines.find(l => l.type === 'section'),
    [sectionLines]
  );
  const contentLines = useMemo(
    () => sectionLines.filter(l => l.type !== 'section'),
    [sectionLines]
  );

  // Memoize renderBlocks function
  const renderBlocks = useCallback((
    indexKey: 'educationIndex' | 'experienceIndex' | 'projectIndex',
    blockTitle: string,
    getFirstField: (line: FormattedLine) => string | undefined
  ) => {
    const groups = new Map<number, FormattedLine[]>();
    contentLines.forEach(line => {
      const idx = line.metadata?.[indexKey];
      if (idx !== undefined) {
        if (!groups.has(idx)) {
          groups.set(idx, []);
        }
        groups.get(idx)!.push(line);
      }
    });

    return (
      <div className="mb-10 pb-8 border-b border-border/30 last:border-b-0 last:mb-0 last:pb-0">
        {sectionHeading && (
          <div className="flex items-center gap-2 mt-3 mb-4 border-b border-foreground pb-1">
            {dragHandleAttributes && dragHandleListeners && (
              <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground flex-shrink-0" {...dragHandleAttributes} {...dragHandleListeners}>
                <GripVertical size={16} />
              </div>
            )}
            <div className="flex-1">
              <SortableLine
                line={sectionHeading}
                editingId={editingId}
                editValue={editValue}
                onEditChange={onEditChange}
                onSave={onSave}
                onCancel={onCancel}
                onStartEdit={() => onStartEdit(sectionHeading)}
                onAddLine={() => onAddLine(sectionHeading.id)}
                onRemoveLine={() => onRemoveLine(sectionHeading.id)}
                onMoveUp={() => {}}
                onMoveDown={() => {}}
                isFirst={true}
                isLast={false}
                isSectionHeading={true}
              />
            </div>
          </div>
        )}
        {Array.from(groups.entries()).map(([blockIdx, blockLines]) => {
          const firstLine = blockLines[0];
          const firstField = getFirstField(firstLine);
          return (
            <BlockContainer
              key={blockIdx}
              blockIdx={blockIdx}
              blockLines={blockLines}
              blockTitle={blockTitle}
              firstField={firstField}
              indexKey={indexKey}
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
        })}
      </div>
    );
  }, [contentLines, sectionHeading, editingId, editValue, onEditChange, onSave, onCancel, onStartEdit, onAddLine, onRemoveLine, dragHandleAttributes, dragHandleListeners]);

  // Group education lines by educationIndex
  if (sectionKey === 'education') {
    return renderBlocks(
      'educationIndex',
      'Education Entry',
      (line) => line.metadata?.field === 'institution' ? line.content : undefined
    );
  }

  // Group experience lines by experienceIndex
  if (sectionKey === 'experience') {
    return renderBlocks(
      'experienceIndex',
      'Experience Entry',
      (line) => {
        if (line.metadata?.field === 'company') return line.content;
        if (line.metadata?.field === 'role') return line.content;
        return undefined;
      }
    );
  }

  // Group project lines by projectIndex
  if (sectionKey === 'projects') {
    return renderBlocks(
      'projectIndex',
      'Project Entry',
      (line) => line.metadata?.field === 'name' ? line.content : undefined
    );
  }

  // Skills section - render categories with inline skill tags
  if (sectionKey === 'skills') {
    return (
      <div className="mb-10 pb-8 border-b border-border/30 last:border-b-0 last:mb-0 last:pb-0">
        {sectionHeading && (
          <div className="flex items-center gap-2 mt-3 mb-4 border-b border-foreground pb-1">
            {dragHandleAttributes && dragHandleListeners && (
              <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground flex-shrink-0" {...dragHandleAttributes} {...dragHandleListeners}>
                <GripVertical size={16} />
              </div>
            )}
            <div className="flex-1">
              <SortableLine
                line={sectionHeading}
                editingId={editingId}
                editValue={editValue}
                onEditChange={onEditChange}
                onSave={onSave}
                onCancel={onCancel}
                onStartEdit={() => onStartEdit(sectionHeading)}
                onAddLine={() => onAddLine(sectionHeading.id)}
                onRemoveLine={() => onRemoveLine(sectionHeading.id)}
                onMoveUp={() => {}}
                onMoveDown={() => {}}
                isFirst={true}
                isLast={false}
                isSectionHeading={true}
              />
            </div>
          </div>
        )}
        <SkillsBlock
          contentLines={contentLines}
          editingId={editingId}
          editValue={editValue}
          onEditChange={onEditChange}
          onSave={onSave}
          onCancel={onCancel}
          onStartEdit={onStartEdit}
          onAddLine={onAddLine}
          onRemoveLine={onRemoveLine}
        />
      </div>
    );
  }

  // Default: regular section rendering
  return (
    <div className="mb-10 pb-8 border-b border-border/30 last:border-b-0 last:mb-0 last:pb-0">
      {sectionHeading && (
        <div className="flex items-center gap-2 mt-3 mb-4 border-b border-foreground pb-1">
          {dragHandleAttributes && dragHandleListeners && (
            <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground flex-shrink-0" {...dragHandleAttributes} {...dragHandleListeners}>
              <GripVertical size={16} />
            </div>
          )}
          <div className="flex-1">
            <SortableLine
              line={sectionHeading}
              editingId={editingId}
              editValue={editValue}
              onEditChange={onEditChange}
              onSave={onSave}
              onCancel={onCancel}
              onStartEdit={() => onStartEdit(sectionHeading)}
              onAddLine={() => onAddLine(sectionHeading.id)}
              onRemoveLine={() => onRemoveLine(sectionHeading.id)}
              onMoveUp={() => {}}
              onMoveDown={() => {}}
              isFirst={true}
              isLast={false}
              isSectionHeading={true}
            />
          </div>
        </div>
      )}
      {contentLines.map((line, lineIdx) => {
        const isFirst = lineIdx === 0;
        const isLast = lineIdx === contentLines.length - 1;

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
    </div>
  );
}

