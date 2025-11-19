'use client';

import React, { useState } from 'react';
import { FormattedLine } from '@/lib/resumeFormatter';
import { SortableLine } from '../SortableLine';
import { SkillTag } from '../SkillTag';
import { Plus, Trash2, Check, X } from 'lucide-react';

interface SkillsBlockProps {
  contentLines: FormattedLine[];
  editingId: string | null;
  editValue: string;
  onEditChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onStartEdit: (line: FormattedLine) => void;
  onAddLine: (lineId: string) => void;
  onRemoveLine: (lineId: string) => void;
}

export function SkillsBlock({
  contentLines,
  editingId,
  editValue,
  onEditChange,
  onSave,
  onCancel,
  onStartEdit,
  onAddLine,
  onRemoveLine,
}: SkillsBlockProps) {
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<string | null>(null);
  
  const categoryGroups = new Map<string, FormattedLine[]>();
  let currentCategory: string | null = null;
  
  contentLines.forEach(line => {
    if (line.metadata?.field === 'category') {
      currentCategory = line.content;
      if (!categoryGroups.has(currentCategory)) {
        categoryGroups.set(currentCategory, []);
      }
    } else if (line.metadata?.field === 'skill' && currentCategory) {
      categoryGroups.get(currentCategory)?.push(line);
    }
  });

  const handleDeleteCategory = (categoryLineId: string) => {
    setConfirmDeleteCategory(categoryLineId);
  };

  const handleConfirmDeleteCategory = (categoryLineId: string) => {
    onRemoveLine(categoryLineId);
    setConfirmDeleteCategory(null);
  };

  const handleCancelDeleteCategory = () => {
    setConfirmDeleteCategory(null);
  };

  return (
    <>
      {Array.from(categoryGroups.entries()).map(([categoryName, skillLines]) => {
        const categoryLine = contentLines.find(l => l.metadata?.field === 'category' && l.content === categoryName);
        
        return (
          <div key={categoryName} className="mb-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md mb-2 group border border-border/50">
              {categoryLine && (
                <div className="flex-1">
                  <SortableLine
                    line={categoryLine}
                    editingId={editingId}
                    editValue={editValue}
                    onEditChange={onEditChange}
                    onSave={onSave}
                    onCancel={onCancel}
                    onStartEdit={() => onStartEdit(categoryLine)}
                    onAddLine={() => onAddLine(categoryLine.id)}
                    onRemoveLine={() => onRemoveLine(categoryLine.id)}
                    onMoveUp={() => {}}
                    onMoveDown={() => {}}
                    isFirst={true}
                    isLast={false}
                  />
                </div>
              )}
              <button
                className="opacity-0 group-hover:opacity-100 p-1.5 border border-border rounded bg-background hover:bg-secondary hover:border-foreground/20 transition-all focus:outline-none focus:ring-2 focus:ring-foreground/20"
                onClick={() => {
                  const lastSkill = skillLines[skillLines.length - 1];
                  if (lastSkill) {
                    onAddLine(lastSkill.id);
                  } else if (categoryLine) {
                    onAddLine(categoryLine.id);
                  }
                }}
                title="Add skill to this category"
                aria-label="Add skill"
              >
                <Plus size={14} />
              </button>
              {confirmDeleteCategory === categoryLine?.id ? (
                <div className="flex items-center gap-1 opacity-100">
                  <button
                    className="p-1.5 border border-green-300 rounded bg-green-50 hover:bg-green-100 hover:border-green-400 transition-all focus:outline-none focus:ring-2 focus:ring-green-200"
                    onClick={() => {
                      if (categoryLine) handleConfirmDeleteCategory(categoryLine.id);
                    }}
                    title="Confirm delete"
                    aria-label="Confirm delete"
                  >
                    <Check size={14} className="text-green-700" />
                  </button>
                  <button
                    className="p-1.5 border border-border rounded bg-background hover:bg-secondary hover:border-foreground/20 transition-all focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    onClick={handleCancelDeleteCategory}
                    title="Cancel delete"
                    aria-label="Cancel delete"
                  >
                    <X size={14} className="text-foreground" />
                  </button>
                </div>
              ) : (
                <button
                  className="opacity-0 group-hover:opacity-100 p-1.5 border border-border rounded bg-background hover:bg-red-50 hover:border-red-300 transition-all focus:outline-none focus:ring-2 focus:ring-red-200"
                  onClick={() => {
                    if (categoryLine) handleDeleteCategory(categoryLine.id);
                  }}
                  title="Delete category and all its skills"
                  aria-label="Delete category"
                >
                  <Trash2 size={14} className="text-red-600" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 ml-4">
              {skillLines.map((skillLine) => (
                <SkillTag
                  key={skillLine.id}
                  line={skillLine}
                  editingId={editingId}
                  editValue={editValue}
                  onEditChange={onEditChange}
                  onSave={onSave}
                  onCancel={onCancel}
                  onStartEdit={() => onStartEdit(skillLine)}
                  onRemove={() => onRemoveLine(skillLine.id)}
                />
              ))}
              {skillLines.length === 0 && (
                <button
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 border border-dashed border-border rounded-md text-xs text-muted-foreground hover:bg-muted hover:text-foreground hover:border-foreground/30 transition-all focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  onClick={() => {
                    if (categoryLine) onAddLine(categoryLine.id);
                  }}
                  title="Add your first skill to this category"
                >
                  <Plus size={12} />
                  Add skill
                </button>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

