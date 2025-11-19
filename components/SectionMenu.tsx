import { useState, useMemo } from 'react';
import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit, Trash2, X, Menu } from 'lucide-react';

interface Section {
  id: string;
  name: string;
  icon: React.ReactNode;
}

interface SortableSectionItemProps {
  section: Section;
  onDelete: () => void;
  onEdit: () => void;
}

const SortableSectionItem = React.memo(function SortableSectionItem({ section, onDelete, onEdit }: SortableSectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }), [transform, transition, isDragging]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg hover:bg-secondary transition-colors"
    >
      <div 
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted transition-colors" 
        {...attributes} 
        {...listeners}
        title="Drag to reorder"
        aria-label="Drag handle"
      >
        <GripVertical size={16} />
      </div>
      <span className="flex items-center text-muted-foreground">{section.icon}</span>
      <span className="flex-1 text-sm font-medium text-foreground">{section.name}</span>
      <button 
        className="p-1.5 border border-border rounded bg-background hover:bg-secondary hover:border-foreground/20 transition-all focus:outline-none focus:ring-2 focus:ring-foreground/20" 
        onClick={onEdit} 
        title="Edit section name"
        aria-label="Edit section"
      >
        <Edit size={14} />
      </button>
      <button 
        className="p-1.5 border border-border rounded bg-background hover:bg-red-50 hover:border-red-300 transition-all focus:outline-none focus:ring-2 focus:ring-red-200" 
        onClick={onDelete} 
        title="Delete section"
        aria-label="Delete section"
      >
        <Trash2 size={14} className="text-red-600" />
      </button>
    </div>
  );
});

interface SectionMenuProps {
  sections: Array<{ id: string; name: string; icon: React.ReactNode }>;
  onReorder: (newOrder: Array<{ id: string; name: string; icon: React.ReactNode }>) => void;
  onSectionClick: (sectionId: string) => void;
}

export function SectionMenu({ sections, onReorder, onSectionClick }: SectionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Sensors should be created directly (hooks must be called unconditionally)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Memoize section IDs for SortableContext
  const sectionIds = useMemo(
    () => sections.map(s => s.id),
    [sections]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      const newOrder = arrayMove(sections, oldIndex, newIndex);
      onReorder(newOrder);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 bg-background border border-border rounded-lg shadow-2xl z-50 max-h-[calc(100vh-8rem)] flex flex-col animate-in slide-in-from-bottom-5">
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
            <div>
              <h3 className="text-sm font-semibold text-foreground m-0">Edit Resume Layout</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Drag sections to reorder</p>
            </div>
            <button
              className="p-1.5 hover:bg-secondary rounded transition-colors focus:outline-none focus:ring-2 focus:ring-foreground/20"
              onClick={() => setIsOpen(false)}
              title="Close (Esc)"
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sectionIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[400px]">
                {sections.map((section) => (
                  <SortableSectionItem 
                    key={section.id} 
                    section={section}
                    onDelete={() => {}}
                    onEdit={() => onSectionClick(section.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <div className="p-3 border-t border-border bg-muted/30">
            <button 
              className="w-full px-4 py-2 bg-background border-2 border-dashed border-border rounded-md text-sm font-medium text-foreground hover:bg-secondary hover:border-foreground/30 transition-all focus:outline-none focus:ring-2 focus:ring-foreground/20"
              title="Add a new section to your resume"
            >
              + Add New Section
            </button>
          </div>
        </div>
      )}
      
      <button
        className="fixed bottom-6 right-6 w-14 h-14 bg-foreground text-background rounded-full shadow-xl flex items-center justify-center hover:bg-foreground/90 hover:shadow-2xl transition-all focus:outline-none focus:ring-4 focus:ring-foreground/20 z-40"
        onClick={() => setIsOpen(!isOpen)}
        title="Edit Resume Layout (Ctrl+M)"
        aria-label="Toggle section menu"
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
    </>
  );
}

