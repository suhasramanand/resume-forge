import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormattedLine } from '@/lib/resumeFormatter';
import { LinkRenderer } from './LinkRenderer';
import { Check, Edit, Trash2, Plus, GripVertical, X, HelpCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import React from 'react';

interface SortableLineProps {
  line: FormattedLine;
  editingId: string | null;
  editValue: string;
  onEditChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onStartEdit: () => void;
  onAddLine: () => void;
  onRemoveLine: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  isSectionHeading?: boolean;
}

export const SortableLine = React.memo(function SortableLine({
  line,
  editingId,
  editValue,
  onEditChange,
  onSave,
  onCancel,
  onStartEdit,
  onAddLine,
  onRemoveLine,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  isSectionHeading = false,
  hideActions = false,
}: SortableLineProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: line.id });

  // Memoize style object to prevent recreation
  const style = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }), [transform, transition, isDragging]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2.5 rounded-lg transition-all duration-150 hover:bg-muted/40 ${
        isDragging ? 'opacity-50 scale-95' : ''
      }`}
    >
      {editingId === line.id ? (
        <div className="flex-1">
          {line.type === 'header' ? (
            <input
              type="text"
              className="w-full px-2 py-1 text-lg font-semibold text-foreground bg-transparent border-none outline-none focus:outline-none focus:ring-0"
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
            />
          ) : line.type === 'section' ? (
            <input
              type="text"
              className="w-full px-2 py-1 text-xs font-bold uppercase tracking-wide text-foreground bg-transparent border-none outline-none focus:outline-none focus:ring-0"
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
            />
          ) : line.type === 'bullet' ? (
            <input
              type="text"
              className="w-full px-2 py-1 pl-5 text-xs font-mono text-foreground bg-transparent border-none outline-none focus:outline-none focus:ring-0"
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
            />
          ) : (
            <input
              type="text"
              className={`w-full px-2 py-1 text-xs font-mono leading-relaxed text-foreground bg-transparent border-none outline-none focus:outline-none focus:ring-0 ${
                !editValue ? 'text-muted-foreground italic' : ''
              }`}
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
              placeholder={
                line.metadata?.field === 'institution' ? 'University name...' :
                line.metadata?.field === 'degree' ? 'Degree/Course...' :
                line.metadata?.field === 'gpa' ? 'GPA...' :
                line.metadata?.field === 'dates' ? 'Dates...' :
                line.metadata?.field === 'location' ? 'Location...' :
                line.metadata?.field === 'company' ? 'Company name...' :
                line.metadata?.field === 'role' ? 'Role/Title...' :
                line.metadata?.field === 'name' ? 'Project name...' :
                line.metadata?.field === 'techStack' ? 'Tech stack...' :
                line.metadata?.field === 'category' ? 'Category name...' :
                line.metadata?.field === 'skill' ? 'Skill name...' :
                'Enter text...'
              }
              autoFocus
            />
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 w-full group">
          {(() => {
            // Section headings should not have individual drag handles (section drag handle is in BlockRenderer)
            if (isSectionHeading) {
              return (
                <div className="invisible flex-shrink-0">
                  <GripVertical size={16} />
                </div>
              );
            }
            
            const section = line.metadata?.section;
            const isFirstField = 
              (section === 'education' && line.metadata?.field === 'institution') ||
              (section === 'experience' && line.metadata?.field === 'company') ||
              (section === 'projects' && line.metadata?.field === 'name');
            
            // Show drag handle for: first fields, bullets, or lines not in block sections
            const isBullet = line.type === 'bullet';
            const shouldShowDragHandle = isFirstField || isBullet || !section || (section !== 'education' && section !== 'experience' && section !== 'projects');
            
            if (shouldShowDragHandle) {
              return (
                <div 
                  className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground flex-shrink-0 transition-colors p-1.5 rounded-lg hover:bg-muted"
                  {...attributes} 
                  {...listeners}
                  title="Drag to reorder"
                  aria-label="Drag handle"
                >
                  <GripVertical size={16} />
                </div>
              );
            } else {
              return (
                <div className="invisible flex-shrink-0">
                  <GripVertical size={16} />
                </div>
              );
            }
          })()}
          <div 
            className="flex-1 cursor-text rounded-lg px-2.5 py-1.5 hover:bg-muted/30 transition-colors" 
            onClick={onStartEdit}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onStartEdit();
              }
            }}
            aria-label="Click to edit"
          >
            {line.type === 'header' && <span className="text-lg font-semibold text-foreground">{line.content}</span>}
            {line.type === 'section' && (
              <span className={`text-xs font-bold uppercase tracking-wide text-foreground ${isSectionHeading ? 'block' : ''}`}>
                {line.content}
              </span>
            )}
            {line.type === 'bullet' && <span className="text-xs font-mono text-foreground pl-5">{line.content}</span>}
            {line.type === 'content' && (
              <span className={`text-xs font-mono leading-relaxed ${!line.content ? 'text-muted-foreground italic' : 'text-foreground'}`}>
                {line.content ? (
                  <LinkRenderer text={line.content} />
                ) : (
                  <span className="text-muted-foreground italic">
                    {line.metadata?.field === 'institution' ? 'University name...' :
                     line.metadata?.field === 'degree' ? 'Degree/Course...' :
                     line.metadata?.field === 'gpa' ? 'GPA...' :
                     line.metadata?.field === 'dates' ? 'Dates...' :
                     line.metadata?.field === 'location' ? 'Location...' :
                     line.metadata?.field === 'company' ? 'Company name...' :
                     line.metadata?.field === 'role' ? 'Role/Title...' :
                     line.metadata?.field === 'name' ? 'Project name...' :
                     line.metadata?.field === 'techStack' ? 'Tech stack...' :
                     line.metadata?.field === 'category' ? 'Category name...' :
                     line.metadata?.field === 'skill' ? 'Skill name...' :
                     'Enter text...'}
                  </span>
                )}
              </span>
            )}
          </div>
          {!hideActions && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
                className="p-1.5 border border-border rounded-lg bg-background hover:bg-secondary hover:border-foreground/20 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-foreground/20 active:scale-95"
              onClick={onAddLine}
              title="Add below (or press Enter to add)"
              aria-label="Add line below"
            >
              <Plus size={14} />
            </button>
            <button
                className="p-1.5 border border-border rounded-lg bg-background hover:bg-red-50 hover:border-red-300 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-200 active:scale-95"
              onClick={onRemoveLine}
              title="Delete (or press Delete key)"
              aria-label="Delete line"
            >
              <Trash2 size={14} className="text-red-600" />
            </button>
          </div>
          )}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  // Return true if props are equal (skip re-render), false if different (re-render)
  const isEqual = (
    prevProps.line.id === nextProps.line.id &&
    prevProps.line.content === nextProps.line.content &&
    prevProps.editingId === nextProps.editingId &&
    prevProps.editValue === nextProps.editValue &&
    prevProps.isFirst === nextProps.isFirst &&
    prevProps.isLast === nextProps.isLast &&
    prevProps.isSectionHeading === nextProps.isSectionHeading
  );
  
  // Also check if callback functions are the same (they should be stable due to useCallback)
  // If any callback changed, we need to re-render
  return isEqual;
});

