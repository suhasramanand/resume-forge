'use client';

import React, { forwardRef, useMemo } from 'react';
import { FormattedLine } from '@/lib/resumeFormatter';
import { LinkRenderer } from './LinkRenderer';

interface PreviewPanelProps {
  lines: FormattedLine[];
}

export const PreviewPanel = forwardRef<HTMLDivElement, PreviewPanelProps>(({ lines }, ref) => {
  // Memoize the expensive rendering logic
  const renderedContent = useMemo(() => {
          const filteredLines = lines.filter(l => l.type !== 'separator');
          const result: React.ReactNode[] = [];
          let i = 0;
          
          while (i < filteredLines.length) {
            const line = filteredLines[i];
            const nextLine = filteredLines[i + 1];
            
            const isTitle = line.type === 'content' && 
              (line.metadata?.section === 'projects' || line.metadata?.section === 'experience') &&
              nextLine && 
              nextLine.type === 'bullet';
            
            const isContactInfo = i > 0 && filteredLines[i - 1]?.type === 'header';
            
            const isSkillCategory = line.metadata?.section === 'skills' && line.metadata?.field === 'category';
            
            // Check if this is a section heading
            if (line.type === 'section') {
              result.push(
                <div key={line.id} className="mb-0.5">
                  <div className="text-xs font-bold mt-3 mb-2 uppercase border-b border-black pb-1">{line.content}</div>
                </div>
              );
              i++;
              continue;
            }
            
            // Check if this is an education entry
            const isEducationEntry = line.metadata?.section === 'education' && 
                                     line.metadata?.field === 'institution' &&
                                     line.metadata?.educationIndex !== undefined;
            
            if (isEducationEntry && line.metadata) {
              // Group all education fields for this entry
              const educationIndex = line.metadata.educationIndex;
              const educationFields: typeof filteredLines = [];
              let j = i;
              while (j < filteredLines.length) {
                const eduLine = filteredLines[j];
                if (eduLine.metadata?.section === 'education' && 
                    eduLine.metadata?.educationIndex === educationIndex) {
                  educationFields.push(eduLine);
                  j++;
                } else if (eduLine.metadata?.section === 'education' && 
                          eduLine.metadata?.educationIndex !== educationIndex) {
                  break;
                } else if (eduLine.metadata?.section !== 'education') {
                  break;
                } else {
                  j++;
                }
              }
              
              // Extract fields
              const institution = educationFields.find(f => f.metadata?.field === 'institution')?.content || '';
              const degree = educationFields.find(f => f.metadata?.field === 'degree')?.content || '';
              const gpa = educationFields.find(f => f.metadata?.field === 'gpa')?.content || '';
              const dates = educationFields.find(f => f.metadata?.field === 'dates')?.content || '';
              
              // Build the education line - combine institution, degree, and GPA on left, dates on right
              const educationParts: string[] = [];
              if (institution) educationParts.push(institution);
              if (degree) educationParts.push(degree);
              if (gpa) educationParts.push(gpa); // GPA already includes "GPA: " prefix from formatter
              
              result.push(
                <div key={line.id} className="mb-1 flex justify-between items-center text-xs">
                  <div className="flex-1">
                    {educationParts.join(' | ')}
                  </div>
                  {dates && (
                    <div className="text-right ml-4 flex-shrink-0">
                      {dates}
                    </div>
                  )}
                </div>
              );
              
              i = j;
              continue;
            }

            // Check if this is an experience entry
            const isExperienceEntry = line.metadata?.section === 'experience' && 
                                     line.metadata?.field === 'company' &&
                                     line.metadata?.experienceIndex !== undefined;
            
            if (isExperienceEntry && line.metadata) {
              // Group all experience fields for this entry
              const experienceIndex = line.metadata.experienceIndex;
              const experienceFields: typeof filteredLines = [];
              let j = i;
              while (j < filteredLines.length) {
                const expLine = filteredLines[j];
                if (expLine.metadata?.section === 'experience' && 
                    expLine.metadata?.experienceIndex === experienceIndex) {
                  experienceFields.push(expLine);
                  j++;
                } else if (expLine.metadata?.section === 'experience' && 
                          expLine.metadata?.experienceIndex !== experienceIndex) {
                  break;
                } else if (expLine.metadata?.section !== 'experience') {
                  break;
                } else {
                  j++;
                }
              }
              
                // Extract fields
                const company = experienceFields.find(f => f.metadata?.field === 'company')?.content || '';
                const role = experienceFields.find(f => f.metadata?.field === 'role')?.content || '';
                const location = experienceFields.find(f => f.metadata?.field === 'location')?.content || '';
                const dates = experienceFields.find(f => f.metadata?.field === 'dates')?.content || '';
                const bullets = experienceFields.filter(f => f.type === 'bullet');
                
                // Build the experience header - combine company, role, location on left
                const experienceParts: string[] = [];
                if (company) experienceParts.push(company);
                if (role) experienceParts.push(role);
                if (location) experienceParts.push(location);
                
                result.push(
                  <div key={line.id}>
                    <div className="mb-1 flex justify-between items-center text-xs">
                      <div className="flex-1 font-bold">
                        {experienceParts.join(' | ')}
                      </div>
                      {dates && (
                        <div className="text-right ml-4 flex-shrink-0">
                          {dates}
                        </div>
                      )}
                    </div>
                    {bullets.map((bulletLine) => (
                      <div key={bulletLine.id} className="text-xs ml-5 mb-1 pl-2 relative">
                        <span className="absolute left-0 text-black">•</span>
                        {bulletLine.content}
                      </div>
                    ))}
                  </div>
                );
              
              i = j;
              continue;
            }

            // Check if this is a project entry
            const isProjectEntry = line.metadata?.section === 'projects' && 
                                  line.metadata?.field === 'name' &&
                                  line.metadata?.projectIndex !== undefined;
            
            if (isProjectEntry && line.metadata) {
              // Group all project fields for this entry
              const projectIndex = line.metadata.projectIndex;
              const projectFields: typeof filteredLines = [];
              let j = i;
              while (j < filteredLines.length) {
                const projLine = filteredLines[j];
                if (projLine.metadata?.section === 'projects' && 
                    projLine.metadata?.projectIndex === projectIndex) {
                  projectFields.push(projLine);
                  j++;
                } else if (projLine.metadata?.section === 'projects' && 
                          projLine.metadata?.projectIndex !== projectIndex) {
                  break;
                } else if (projLine.metadata?.section !== 'projects') {
                  break;
                } else {
                  j++;
                }
              }
              
                // Extract fields
                const name = projectFields.find(f => f.metadata?.field === 'name')?.content || '';
                const techStack = projectFields.find(f => f.metadata?.field === 'techStack')?.content || '';
                const location = projectFields.find(f => f.metadata?.field === 'location')?.content || '';
                const dates = projectFields.find(f => f.metadata?.field === 'dates')?.content || '';
                const bullets = projectFields.filter(f => f.type === 'bullet');
                
                // Build the project header - combine name, techStack, location on left
                const projectParts: string[] = [];
                if (name) projectParts.push(name);
                if (techStack) projectParts.push(techStack);
                if (location) projectParts.push(location);
                
                result.push(
                  <div key={line.id}>
                    <div className="mb-1 flex justify-between items-center text-xs">
                      <div className="flex-1 font-bold">
                        {projectParts.join(' | ')}
                      </div>
                      {dates && (
                        <div className="text-right ml-4 flex-shrink-0">
                          {dates}
                        </div>
                      )}
                    </div>
                    {bullets.map((bulletLine) => (
                      <div key={bulletLine.id} className="text-xs ml-5 mb-1 pl-2 relative">
                        <span className="absolute left-0 text-black">•</span>
                        {bulletLine.content}
                      </div>
                    ))}
                  </div>
                );
              
              i = j;
              continue;
            }
            
            if (isSkillCategory) {
              const categorySkills: typeof filteredLines = [];
              let j = i + 1;
              while (j < filteredLines.length) {
                const skillLine = filteredLines[j];
                if (skillLine.metadata?.section === 'skills' && skillLine.metadata?.field === 'skill') {
                  categorySkills.push(skillLine);
                  j++;
                } else if (skillLine.metadata?.section === 'skills' && skillLine.metadata?.field === 'category') {
                  break;
                } else {
                  break;
                }
              }
              
              result.push(
                <div key={line.id} className="mt-2 mb-2 text-xs">
                  <span className="font-bold">{line.content || 'Category'}:</span>
                  {' '}
                  {categorySkills.map((skillLine, skillIdx) => (
                    <span key={skillLine.id} className="inline">
                      {skillIdx > 0 && ', '}
                      <LinkRenderer text={skillLine.content} />
                    </span>
                  ))}
                </div>
              );
              
              i = j;
              continue;
            }
            
            result.push(
              <div key={line.id} className="mb-0.5">
                {line.type === 'header' && <div className="text-lg font-bold text-center mb-2">{line.content}</div>}
                {line.type === 'bullet' && (
                  <div className="text-xs ml-5 mb-1 pl-2 relative">
                    <span className="absolute left-0 text-black">•</span>
                    {line.content}
                  </div>
                )}
                {line.type === 'content' && (
                  <div className={`text-xs my-1 break-words ${
                    isTitle ? 'font-bold mb-1' : ''
                  } ${
                    isContactInfo ? 'flex items-center justify-center flex-wrap gap-2 text-center mb-2' : ''
                  } ${
                    line.metadata?.align === 'right' ? 'text-right' : ''
                  }`}>
                    <LinkRenderer text={line.content} />
                  </div>
                )}
              </div>
            );
            
            i++;
          }
          
          return result;
        }, [lines]);

  return (
    <div className="flex flex-col bg-background overflow-hidden min-w-[300px] max-w-[800px] flex-shrink-0 border border-border rounded-lg shadow-sm h-[calc(100vh-2rem)]" style={{ width: '50%' }}>
      <div className="sticky top-0 z-10 px-6 py-4 border-b border-border bg-background flex-shrink-0 rounded-t-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground m-0">Live Preview</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Real-time resume preview</p>
          </div>
        </div>
      </div>
      <div ref={ref} className="flex-1 overflow-y-auto px-6 py-6 bg-background font-sans print-content">
        {renderedContent}
      </div>
    </div>
  );
});

PreviewPanel.displayName = 'PreviewPanel';

