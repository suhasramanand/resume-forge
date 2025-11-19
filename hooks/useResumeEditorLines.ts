import { useCallback } from 'react';
import { FormattedLine } from '@/lib/resumeFormatter';

export function useResumeEditorLines(
  lines: FormattedLine[],
  onUpdate: (lines: FormattedLine[]) => void
) {
  const addLine = useCallback((afterId: string) => {
    const index = lines.findIndex(l => l.id === afterId);
    if (index < 0) return;

    const line = lines[index];
    const section = line.metadata?.section;
    
    // If adding after a bullet, create another bullet within the same block
    if (line.type === 'bullet' && line.metadata?.section) {
      const bulletSection = line.metadata.section;
      const experienceIndex = line.metadata.experienceIndex;
      const projectIndex = line.metadata.projectIndex;
      
      if ((bulletSection === 'experience' && experienceIndex !== undefined) || 
          (bulletSection === 'projects' && projectIndex !== undefined)) {
        // Find the highest bulletIndex for this entry
        const existingBullets = lines.filter(l => 
          l.type === 'bullet' && 
          l.metadata?.section === bulletSection &&
          ((bulletSection === 'experience' && l.metadata?.experienceIndex === experienceIndex) ||
           (bulletSection === 'projects' && l.metadata?.projectIndex === projectIndex))
        );
        const maxBulletIndex = existingBullets.reduce((max, b) => {
          const idx = b.metadata?.bulletIndex ?? -1;
          return idx > max ? idx : max;
        }, -1);
        
        // Find the correct insertion point - after the current bullet but within the same block
        let insertIndex = index + 1;
        for (let i = index + 1; i < lines.length; i++) {
          const nextLine = lines[i];
          // If we hit a different section, stop
          if (nextLine.metadata?.section !== bulletSection) {
            insertIndex = i;
            break;
          }
          // If we hit a different block (different experienceIndex/projectIndex), stop
          if (bulletSection === 'experience' && 
              nextLine.metadata?.experienceIndex !== undefined &&
              nextLine.metadata.experienceIndex !== experienceIndex) {
            insertIndex = i;
            break;
          }
          if (bulletSection === 'projects' && 
              nextLine.metadata?.projectIndex !== undefined &&
              nextLine.metadata.projectIndex !== projectIndex) {
            insertIndex = i;
            break;
          }
          // If we hit a non-bullet line that's not part of this block, stop
          // (e.g., dates line from a different block, or section heading)
          if (nextLine.type !== 'bullet' && 
              ((bulletSection === 'experience' && nextLine.metadata?.experienceIndex !== experienceIndex) ||
               (bulletSection === 'projects' && nextLine.metadata?.projectIndex !== projectIndex))) {
            insertIndex = i;
            break;
          }
          // If we hit the section heading, stop
          if (nextLine.type === 'section') {
            insertIndex = i;
            break;
          }
          // If we hit a dates line from the same block, insert before it (bullets come before dates)
          if (nextLine.metadata?.field === 'dates' && 
              ((bulletSection === 'experience' && nextLine.metadata?.experienceIndex === experienceIndex) ||
               (bulletSection === 'projects' && nextLine.metadata?.projectIndex === projectIndex))) {
            insertIndex = i;
            break;
          }
          // Otherwise, continue - we're still in the same block's bullets
          insertIndex = i + 1;
        }
        
        const newBullet: FormattedLine = {
          id: `line-${Date.now()}-${Math.random()}`,
          type: 'bullet',
          content: '',
          metadata: {
            section: bulletSection,
            ...(bulletSection === 'experience' ? { experienceIndex } : { projectIndex }),
            field: 'bullet',
            bulletIndex: maxBulletIndex + 1,
          },
        };
        const updated = [...lines];
        updated.splice(insertIndex, 0, newBullet);
        onUpdate(updated);
        return;
      }
    }

    // If adding after dates/location in experience/projects section, always create a bullet (not a new block)
    if ((line.metadata?.field === 'dates' || line.metadata?.field === 'location') && 
        (line.metadata?.section === 'experience' || line.metadata?.section === 'projects')) {
      const bulletSection = line.metadata.section;
      const experienceIndex = line.metadata.experienceIndex;
      const projectIndex = line.metadata.projectIndex;
      
      // Check if there are any bullets for this entry
      const existingBullets = lines.filter(l => 
        l.type === 'bullet' && 
        l.metadata?.section === bulletSection &&
        ((bulletSection === 'experience' && l.metadata?.experienceIndex === experienceIndex) ||
         (bulletSection === 'projects' && l.metadata?.projectIndex === projectIndex))
      );
      
      // Find the highest bulletIndex for this entry
      const maxBulletIndex = existingBullets.length > 0 
        ? existingBullets.reduce((max, b) => {
            const idx = b.metadata?.bulletIndex ?? -1;
            return idx > max ? idx : max;
          }, -1)
        : -1;
      
      // Find the correct insertion point - after dates but within the same block
      // Find where the current block ends (next block starts or section ends)
      let insertIndex = index + 1;
      for (let i = index + 1; i < lines.length; i++) {
        const nextLine = lines[i];
        // If we hit a different section, stop
        if (nextLine.metadata?.section !== bulletSection) {
          insertIndex = i;
          break;
        }
        // If we hit a different block (different experienceIndex/projectIndex), stop
        if (bulletSection === 'experience' && 
            nextLine.metadata?.experienceIndex !== undefined &&
            nextLine.metadata.experienceIndex !== experienceIndex) {
          insertIndex = i;
          break;
        }
        if (bulletSection === 'projects' && 
            nextLine.metadata?.projectIndex !== undefined &&
            nextLine.metadata.projectIndex !== projectIndex) {
          insertIndex = i;
          break;
        }
        // If we hit the section heading of the same section, stop
        if (nextLine.type === 'section' && nextLine.metadata?.section === bulletSection) {
          insertIndex = i;
          break;
        }
        // Otherwise, continue - we're still in the same block
        insertIndex = i + 1;
      }
      
      // Always create a bullet when adding after dates/location
      const newBullet: FormattedLine = {
        id: `line-${Date.now()}-${Math.random()}`,
        type: 'bullet',
        content: '',
        metadata: {
          section: bulletSection,
          ...(bulletSection === 'experience' ? { experienceIndex } : { projectIndex }),
          field: 'bullet',
          bulletIndex: maxBulletIndex + 1,
        },
      };
      const updated = [...lines];
      updated.splice(insertIndex, 0, newBullet);
      onUpdate(updated);
      return;
    }
    
    if (section === 'education') {
      const educationIndex = line.metadata?.educationIndex !== undefined 
        ? line.metadata.educationIndex + 1 
        : (lines.filter(l => l.metadata?.section === 'education' && l.metadata?.educationIndex !== undefined).length);
      
      const newEducationLines: FormattedLine[] = [
        {
          id: `line-${Date.now()}-${Math.random()}`,
          type: 'content',
          content: '',
          metadata: { section: 'education', educationIndex, field: 'institution' },
        },
        {
          id: `line-${Date.now()}-${Math.random()}-2`,
          type: 'content',
          content: '',
          metadata: { section: 'education', educationIndex, field: 'degree' },
        },
        {
          id: `line-${Date.now()}-${Math.random()}-3`,
          type: 'content',
          content: '',
          metadata: { section: 'education', educationIndex, field: 'gpa' },
        },
        {
          id: `line-${Date.now()}-${Math.random()}-4`,
          type: 'content',
          content: '',
          metadata: { section: 'education', educationIndex, field: 'dates', align: 'right' },
        },
      ];
      
      let insertIndex = index + 1;
      for (let i = index + 1; i < lines.length; i++) {
        const nextLine = lines[i];
        if (nextLine.metadata?.section !== 'education' || 
            (nextLine.metadata?.educationIndex !== undefined && 
             nextLine.metadata.educationIndex !== line.metadata?.educationIndex)) {
          insertIndex = i;
          break;
        }
        insertIndex = i + 1;
      }
      
      const updated = [...lines];
      updated.splice(insertIndex, 0, ...newEducationLines);
      onUpdate(updated);
      return;
    }

    if (section === 'experience') {
      // Don't create a new experience block if we're adding within an existing block
      // Only create a new block if we're adding after the section heading or after the last line of a block
      const currentExperienceIndex = line.metadata?.experienceIndex;
      if (currentExperienceIndex !== undefined) {
        // We're within an existing experience block - don't create a new block
        // This should have been handled by bullet/dates/location checks above
        // If we get here, just create a regular content line
        const newLine: FormattedLine = {
          id: `line-${Date.now()}-${Math.random()}`,
          type: 'content',
          content: '',
          metadata: line.metadata,
        };
        const updated = [...lines];
        updated.splice(index + 1, 0, newLine);
        onUpdate(updated);
        return;
      }
      
      // This is a section heading or end of section - create new experience block
      const experienceIndex = line.metadata?.experienceIndex !== undefined 
        ? line.metadata.experienceIndex + 1 
        : (lines.filter(l => l.metadata?.section === 'experience' && l.metadata?.experienceIndex !== undefined).length);
      
      const newExperienceLines: FormattedLine[] = [
        {
          id: `line-${Date.now()}-${Math.random()}`,
          type: 'content',
          content: '',
          metadata: { section: 'experience', experienceIndex, field: 'company' },
        },
        {
          id: `line-${Date.now()}-${Math.random()}-2`,
          type: 'content',
          content: '',
          metadata: { section: 'experience', experienceIndex, field: 'role' },
        },
        {
          id: `line-${Date.now()}-${Math.random()}-3`,
          type: 'content',
          content: '',
          metadata: { section: 'experience', experienceIndex, field: 'location' },
        },
        {
          id: `line-${Date.now()}-${Math.random()}-4`,
          type: 'bullet',
          content: '',
          metadata: { section: 'experience', experienceIndex, field: 'bullet', bulletIndex: 0 },
        },
        {
          id: `line-${Date.now()}-${Math.random()}-5`,
          type: 'content',
          content: '',
          metadata: { section: 'experience', experienceIndex, field: 'dates', align: 'right' },
        },
      ];
      
      let insertIndex = index + 1;
      for (let i = index + 1; i < lines.length; i++) {
        const nextLine = lines[i];
        if (nextLine.metadata?.section !== 'experience' || 
            (nextLine.metadata?.experienceIndex !== undefined && 
             nextLine.metadata.experienceIndex !== line.metadata?.experienceIndex)) {
          insertIndex = i;
          break;
        }
        insertIndex = i + 1;
      }
      
      const updated = [...lines];
      updated.splice(insertIndex, 0, ...newExperienceLines);
      onUpdate(updated);
      return;
    }

    if (section === 'projects') {
      // Don't create a new project block if we're adding within an existing block
      const currentProjectIndex = line.metadata?.projectIndex;
      if (currentProjectIndex !== undefined) {
        // We're within an existing project block - don't create a new block
        // This should have been handled by bullet/dates/location checks above
        // If we get here, just create a regular content line
        const newLine: FormattedLine = {
          id: `line-${Date.now()}-${Math.random()}`,
          type: 'content',
          content: '',
          metadata: line.metadata,
        };
        const updated = [...lines];
        updated.splice(index + 1, 0, newLine);
        onUpdate(updated);
        return;
      }
      
      // This is a section heading or end of section - create new project block
      const projectIndex = line.metadata?.projectIndex !== undefined 
        ? line.metadata.projectIndex + 1 
        : (lines.filter(l => l.metadata?.section === 'projects' && l.metadata?.projectIndex !== undefined).length);
      
      const newProjectLines: FormattedLine[] = [
        {
          id: `line-${Date.now()}-${Math.random()}`,
          type: 'content',
          content: '',
          metadata: { section: 'projects', projectIndex, field: 'name' },
        },
        {
          id: `line-${Date.now()}-${Math.random()}-2`,
          type: 'content',
          content: '',
          metadata: { section: 'projects', projectIndex, field: 'techStack' },
        },
        {
          id: `line-${Date.now()}-${Math.random()}-3`,
          type: 'content',
          content: '',
          metadata: { section: 'projects', projectIndex, field: 'location' },
        },
        {
          id: `line-${Date.now()}-${Math.random()}-4`,
          type: 'bullet',
          content: '',
          metadata: { section: 'projects', projectIndex, field: 'bullet', bulletIndex: 0 },
        },
        {
          id: `line-${Date.now()}-${Math.random()}-5`,
          type: 'content',
          content: '',
          metadata: { section: 'projects', projectIndex, field: 'dates', align: 'right' },
        },
      ];
      
      let insertIndex = index + 1;
      for (let i = index + 1; i < lines.length; i++) {
        const nextLine = lines[i];
        if (nextLine.metadata?.section !== 'projects' || 
            (nextLine.metadata?.projectIndex !== undefined && 
             nextLine.metadata.projectIndex !== line.metadata?.projectIndex)) {
          insertIndex = i;
          break;
        }
        insertIndex = i + 1;
      }
      
      const updated = [...lines];
      updated.splice(insertIndex, 0, ...newProjectLines);
      onUpdate(updated);
      return;
    }

    // If adding to skills section
    if (section === 'skills') {
      // If adding after a category, create a new skill
      if (line.metadata?.field === 'category') {
        const newSkill: FormattedLine = {
          id: `line-${Date.now()}-${Math.random()}`,
          type: 'content',
          content: '',
          metadata: { section: 'skills', field: 'skill' },
        };
        const updated = [...lines];
        updated.splice(index + 1, 0, newSkill);
        onUpdate(updated);
        return;
      }
      // If adding after a skill, create another skill in the same category
      if (line.metadata?.field === 'skill') {
        const newSkill: FormattedLine = {
          id: `line-${Date.now()}-${Math.random()}`,
          type: 'content',
          content: '',
          metadata: { section: 'skills', field: 'skill' },
        };
        const updated = [...lines];
        updated.splice(index + 1, 0, newSkill);
        onUpdate(updated);
        return;
      }
    }
    
    const newLine: FormattedLine = {
      id: `line-${Date.now()}-${Math.random()}`,
      type: 'content',
      content: 'New line',
      metadata: line.metadata,
    };
    const updated = [...lines];
    updated.splice(index + 1, 0, newLine);
    onUpdate(updated);
  }, [lines, onUpdate]);

  const removeLine = useCallback((id: string) => {
    const line = lines.find(l => l.id === id);
    if (!line) return;

    const section = line?.metadata?.section;
    const educationIndex = line?.metadata?.educationIndex;
    const experienceIndex = line?.metadata?.experienceIndex;
    const projectIndex = line?.metadata?.projectIndex;
    
    // If it's a bullet, just remove that bullet (not the whole block)
    if (line.type === 'bullet') {
      const updated = lines.filter(l => l.id !== id);
      onUpdate(updated);
      return;
    }
    
    // Only delete entire blocks for non-bullet lines that are the first field of a block
    const isFirstField = 
      (section === 'education' && line.metadata?.field === 'institution') ||
      (section === 'experience' && line.metadata?.field === 'company') ||
      (section === 'projects' && line.metadata?.field === 'name');
    
    if (section === 'education' && educationIndex !== undefined && isFirstField) {
      const updated = lines.filter(l => 
        !(l.metadata?.section === 'education' && l.metadata?.educationIndex === educationIndex)
      );
      onUpdate(updated);
      return;
    }

    if (section === 'experience' && experienceIndex !== undefined && isFirstField) {
      const updated = lines.filter(l => 
        !(l.metadata?.section === 'experience' && l.metadata?.experienceIndex === experienceIndex)
      );
      onUpdate(updated);
      return;
    }

    if (section === 'projects' && projectIndex !== undefined && isFirstField) {
      const updated = lines.filter(l => 
        !(l.metadata?.section === 'projects' && l.metadata?.projectIndex === projectIndex)
      );
      onUpdate(updated);
      return;
    }

    // If removing a skill category, remove all skills in that category
    if (section === 'skills' && line.metadata?.field === 'category') {
      const categoryName = line.content;
      // Find all skills that belong to this category (skills that come after this category until next category)
      const categoryIndex = lines.findIndex(l => l.id === id);
      const skillsToRemove: string[] = [id];
      
      // Find all skills after this category until we hit another category or end of skills section
      for (let i = categoryIndex + 1; i < lines.length; i++) {
        const nextLine = lines[i];
        if (nextLine.metadata?.section !== 'skills') break;
        if (nextLine.metadata?.field === 'category') break; // Hit next category
        if (nextLine.metadata?.field === 'skill') {
          skillsToRemove.push(nextLine.id);
        }
      }
      
      const updated = lines.filter(l => !skillsToRemove.includes(l.id));
      onUpdate(updated);
      return;
    }
    
    const updated = lines.filter(l => l.id !== id);
    onUpdate(updated);
  }, [lines, onUpdate]);

  return {
    addLine,
    removeLine,
  };
}

