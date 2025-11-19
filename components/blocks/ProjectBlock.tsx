'use client';

import React from 'react';
import { FormattedLine } from '@/lib/resumeFormatter';
import { SortableLine } from '../SortableLine';
import { Plus } from 'lucide-react';

interface ProjectBlockProps {
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

export function ProjectBlock({
  blockLines,
  editingId,
  editValue,
  onEditChange,
  onSave,
  onCancel,
  onStartEdit,
  onAddLine,
  onRemoveLine,
}: ProjectBlockProps) {
  const nameLine = blockLines.find(l => l.metadata?.field === 'name');
  const techStackLine = blockLines.find(l => l.metadata?.field === 'techStack');
  const locationLine = blockLines.find(l => l.metadata?.field === 'location');
  const datesLine = blockLines.find(l => l.metadata?.field === 'dates');
  const bulletLines = blockLines.filter(l => l.type === 'bullet');
  const otherLines = blockLines.filter(l => 
    l.metadata?.field !== 'name' && 
    l.metadata?.field !== 'techStack' && 
    l.metadata?.field !== 'location' && 
    l.metadata?.field !== 'dates' && 
    l.type !== 'bullet'
  );

  const handleAddBullet = () => {
    const lastBullet = bulletLines[bulletLines.length - 1];
    if (lastBullet) {
      onAddLine(lastBullet.id);
    } else {
      const datesLine = blockLines.find(l => l.metadata?.field === 'dates');
      const locationLine = blockLines.find(l => l.metadata?.field === 'location');
      const targetLine = datesLine || locationLine || blockLines[blockLines.length - 1];
      if (targetLine) {
        onAddLine(targetLine.id);
      }
    }
  };

  return (
    <>
      {nameLine && (
        <div className="mb-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 px-1">Project Name / Title</div>
          <SortableLine
            key={nameLine.id}
            line={nameLine}
            editingId={editingId}
            editValue={editValue}
            onEditChange={onEditChange}
            onSave={onSave}
            onCancel={onCancel}
            onStartEdit={() => onStartEdit(nameLine)}
            onAddLine={() => onAddLine(nameLine.id)}
            onRemoveLine={() => onRemoveLine(nameLine.id)}
            onMoveUp={() => {}}
            onMoveDown={() => {}}
            isFirst={true}
            isLast={false}
          />
        </div>
      )}
      {techStackLine && (
        <div className="mb-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 px-1">Tech Stack</div>
          <SortableLine
            key={techStackLine.id}
            line={techStackLine}
            editingId={editingId}
            editValue={editValue}
            onEditChange={onEditChange}
            onSave={onSave}
            onCancel={onCancel}
            onStartEdit={() => onStartEdit(techStackLine)}
            onAddLine={() => onAddLine(techStackLine.id)}
            onRemoveLine={() => onRemoveLine(techStackLine.id)}
            onMoveUp={() => {}}
            onMoveDown={() => {}}
            isFirst={true}
            isLast={false}
          />
        </div>
      )}
      {locationLine && (
        <div className="mb-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 px-1">Location</div>
          <SortableLine
            key={locationLine.id}
            line={locationLine}
            editingId={editingId}
            editValue={editValue}
            onEditChange={onEditChange}
            onSave={onSave}
            onCancel={onCancel}
            onStartEdit={() => onStartEdit(locationLine)}
            onAddLine={() => onAddLine(locationLine.id)}
            onRemoveLine={() => onRemoveLine(locationLine.id)}
            onMoveUp={() => {}}
            onMoveDown={() => {}}
            isFirst={true}
            isLast={false}
          />
        </div>
      )}
      {datesLine && (
        <div className="mb-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 px-1">Dates</div>
          <SortableLine
            key={datesLine.id}
            line={datesLine}
            editingId={editingId}
            editValue={editValue}
            onEditChange={onEditChange}
            onSave={onSave}
            onCancel={onCancel}
            onStartEdit={() => onStartEdit(datesLine)}
            onAddLine={() => onAddLine(datesLine.id)}
            onRemoveLine={() => onRemoveLine(datesLine.id)}
            onMoveUp={() => {}}
            onMoveDown={() => {}}
            isFirst={true}
            isLast={false}
          />
        </div>
      )}
      <div className="mb-3">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">Bullets</div>
        {bulletLines.length > 0 && (
          <>
            {bulletLines.map((line, bulletIdx) => {
              const isFirst = bulletIdx === 0;
              const isLast = bulletIdx === bulletLines.length - 1;
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
        )}
        {bulletLines.length === 0 && (
          <div className="text-xs text-muted-foreground italic px-2 py-2 border border-dashed border-border rounded bg-muted/30 text-center mb-2">
            No bullets yet.
          </div>
        )}
        <button
          className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-2 text-xs border border-border rounded-md bg-background hover:bg-secondary hover:border-foreground/20 transition-all focus:outline-none focus:ring-2 focus:ring-foreground/20 text-muted-foreground hover:text-foreground"
          onClick={handleAddBullet}
          title="Add bullet point"
        >
          <Plus size={14} />
          <span>Bullet Points</span>
        </button>
      </div>
      {otherLines.map((line) => {
        const lineIdx = otherLines.findIndex(l => l.id === line.id);
        const isFirst = lineIdx === 0;
        const isLast = lineIdx === otherLines.length - 1;
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

