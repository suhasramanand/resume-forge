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
      className="flex items-center gap-3 p-3.5 bg-background border border-border rounded-xl hover:bg-secondary/80 transition-all duration-150 active:scale-[0.98]"
    >
      <div 
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors" 
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
        className="p-1.5 border border-border rounded-lg bg-background hover:bg-secondary hover:border-foreground/20 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-foreground/20 active:scale-95" 
        onClick={onEdit} 
        title="Edit section name"
        aria-label="Edit section"
      >
        <Edit size={14} />
      </button>
      <button 
        className="p-1.5 border border-border rounded-lg bg-background hover:bg-red-50 hover:border-red-300 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-200 active:scale-95" 
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
        <div className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-background/95 backdrop-blur-sm border border-border rounded-xl shadow-2xl z-50 max-h-[calc(100vh-8rem)] flex flex-col animate-in slide-in-from-bottom-5">
          <div className="p-4 sm:p-5 border-b border-border/80 flex items-center justify-between bg-muted/30 rounded-t-xl">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-foreground m-0">Edit Resume Layout</h3>
              <p className="text-xs text-muted-foreground mt-1">Drag sections to reorder</p>
            </div>
            <button
              className="p-1.5 hover:bg-secondary rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-foreground/20 active:scale-95"
              onClick={() => setIsOpen(false)}
              title="Close (Esc)"
              aria-label="Close menu"
            >
              <X size={16} className="text-muted-foreground" />
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
              className="w-full px-4 py-2.5 bg-background border-2 border-dashed border-border rounded-lg text-sm font-medium text-foreground hover:bg-secondary hover:border-foreground/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-foreground/20 active:scale-[0.98]"
              title="Add a new section to your resume"
            >
              + Add New Section
            </button>
          </div>
        </div>
      )}
      
      <button
        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 w-14 h-14 bg-foreground text-background rounded-2xl shadow-xl flex items-center justify-center hover:bg-foreground/90 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-foreground/20 focus:ring-offset-2 z-40"
        onClick={() => setIsOpen(!isOpen)}
        title="Edit Resume Layout"
        aria-label="Toggle section menu"
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
    </>
  );
}

