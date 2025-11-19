import { useCallback } from 'react';
import { FormattedLine } from '@/lib/resumeFormatter';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import React from 'react';

export function useResumeEditorDrag(
  lines: FormattedLine[],
  onUpdate: (lines: FormattedLine[]) => void,
  sections: Record<string, FormattedLine[]>,
  sectionOrder: string[],
  setSectionOrder: (order: string[]) => void
) {
  const reorderBlocks = useCallback((
    section: string,
    indexKey: 'educationIndex' | 'experienceIndex' | 'projectIndex',
    activeIdx: number,
    overIdx: number
  ) => {
    if (activeIdx === overIdx) return;
    
    const activeBlockLines = lines.filter(l => 
      l.metadata?.section === section && 
      l.metadata?.[indexKey] === activeIdx
    );
    const overBlockLines = lines.filter(l => 
      l.metadata?.section === section && 
      l.metadata?.[indexKey] === overIdx
    );
    
    const withoutBoth = lines.filter(l => 
      !(l.metadata?.section === section && 
        (l.metadata?.[indexKey] === activeIdx || 
         l.metadata?.[indexKey] === overIdx))
    );
    
    const allIndices = new Set<number>();
    lines.forEach(l => {
      if (l.metadata?.section === section && l.metadata[indexKey] !== undefined) {
        allIndices.add(l.metadata[indexKey]!);
      }
    });
    const sortedIndices = Array.from(allIndices).sort((a, b) => {
      const aFirstIdx = lines.findIndex(l => 
        l.metadata?.section === section && l.metadata?.[indexKey] === a
      );
      const bFirstIdx = lines.findIndex(l => 
        l.metadata?.section === section && l.metadata?.[indexKey] === b
      );
      return aFirstIdx - bFirstIdx;
    });
    
    const activePos = sortedIndices.indexOf(activeIdx);
    const overPos = sortedIndices.indexOf(overIdx);
    [sortedIndices[activePos], sortedIndices[overPos]] = [sortedIndices[overPos], sortedIndices[activePos]];
    
    const updated: FormattedLine[] = [];
    
    for (const line of withoutBoth) {
      if (line.metadata?.section === section && line.metadata[indexKey] !== undefined) {
        continue;
      }
      updated.push(line);
    }
    
    for (let i = 0; i < sortedIndices.length; i++) {
      const oldIdx = sortedIndices[i];
      const blockLines = lines.filter(l => 
        l.metadata?.section === section && 
        l.metadata?.[indexKey] === oldIdx
      );
      
      let insertIdx = updated.length;
      
      blockLines.forEach(blockLine => {
        updated.splice(insertIdx, 0, {
          ...blockLine,
          metadata: {
            ...blockLine.metadata,
            [indexKey]: i,
          },
        });
        insertIdx++;
      });
    }
    
    onUpdate(updated);
  }, [lines, onUpdate]);

  const handleLineDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeLine = lines.find(l => l.id === active.id);
    const overLine = lines.find(l => l.id === over.id);
    
    if (activeLine?.metadata?.section === 'education' && 
        overLine?.metadata?.section === 'education' &&
        activeLine.metadata.educationIndex !== undefined &&
        overLine.metadata.educationIndex !== undefined) {
      reorderBlocks('education', 'educationIndex', activeLine.metadata.educationIndex, overLine.metadata.educationIndex);
      return;
    }

    if (activeLine?.metadata?.section === 'experience' && 
        overLine?.metadata?.section === 'experience' &&
        activeLine.metadata.experienceIndex !== undefined &&
        overLine.metadata.experienceIndex !== undefined) {
      reorderBlocks('experience', 'experienceIndex', activeLine.metadata.experienceIndex, overLine.metadata.experienceIndex);
      return;
    }

    if (activeLine?.metadata?.section === 'projects' && 
        overLine?.metadata?.section === 'projects' &&
        activeLine.metadata.projectIndex !== undefined &&
        overLine.metadata.projectIndex !== undefined) {
      reorderBlocks('projects', 'projectIndex', activeLine.metadata.projectIndex, overLine.metadata.projectIndex);
      return;
    }

    const oldIndex = lines.findIndex((l) => l.id === active.id);
    const newIndex = lines.findIndex((l) => l.id === over.id);
    const updated = arrayMove(lines, oldIndex, newIndex);
    onUpdate(updated);
  }, [lines, onUpdate, reorderBlocks]);

  const handleSectionReorder = useCallback((newOrder: Array<{ id: string; name: string; icon: React.ReactNode }>) => {
    setSectionOrder(newOrder.map(s => s.id));
    const sectionLines: FormattedLine[] = [];
    newOrder.forEach(sectionId => {
      const sectionKey = sectionId.id;
      if (sections[sectionKey]) {
        sections[sectionKey].forEach(line => {
          if (!sectionLines.find(l => l.id === line.id)) {
            sectionLines.push(line);
          }
        });
      }
    });
    lines.forEach(line => {
      if (!sectionLines.find(l => l.id === line.id)) {
        sectionLines.push(line);
      }
    });
    onUpdate(sectionLines);
  }, [sections, lines, onUpdate, setSectionOrder]);

  const handleSectionDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeSection = active.id as string;
    const overSection = over.id as string;

    const currentOrder = sectionOrder.length > 0 ? sectionOrder : Object.keys(sections);
    const oldIndex = currentOrder.indexOf(activeSection);
    const newIndex = currentOrder.indexOf(overSection);

    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(currentOrder, oldIndex, newIndex);
    setSectionOrder(newOrder);

    // Reorder the actual lines based on section order
    const sectionLines: FormattedLine[] = [];
    newOrder.forEach(sectionKey => {
      if (sections[sectionKey]) {
        sections[sectionKey].forEach(line => {
          if (!sectionLines.find(l => l.id === line.id)) {
            sectionLines.push(line);
          }
        });
      }
    });
    lines.forEach(line => {
      if (!sectionLines.find(l => l.id === line.id)) {
        sectionLines.push(line);
      }
    });
    onUpdate(sectionLines);
  }, [sectionOrder, sections, lines, onUpdate, setSectionOrder]);

  return {
    handleLineDragEnd,
    handleSectionReorder,
    handleSectionDragEnd,
  };
}

