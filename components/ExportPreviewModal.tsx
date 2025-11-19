'use client';

import React, { useMemo } from 'react';
import { FormattedLine } from '@/lib/resumeFormatter';
import { LinkRenderer } from './LinkRenderer';

interface ExportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  lines: FormattedLine[];
}

export function ExportPreviewModal({ isOpen, onClose, onExport, lines }: ExportPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-8" onClick={onClose}>
      <div className="bg-background rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0 bg-muted/30">
          <div>
            <h2 className="text-lg font-semibold text-foreground m-0">Export Preview</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Review your resume before printing</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 bg-muted hover:bg-secondary rounded-md text-sm font-medium text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-foreground/20"
              onClick={onClose}
              title="Cancel (Esc)"
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-foreground hover:bg-foreground/90 text-background rounded-md text-sm font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
              onClick={onExport}
              title="Print or save as PDF"
            >
              Print / Save as PDF
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-8 bg-white" style={{ 
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontSize: '9pt',
          lineHeight: '1.2',
          color: '#000',
          background: '#fff'
        }}>
          {useMemo(() => {
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
                  <div key={line.id} style={{ marginBottom: '2pt' }}>
                    <div style={{ fontSize: '10pt', fontWeight: 'bold', marginTop: '6pt', marginBottom: '3pt', textTransform: 'uppercase', borderBottom: '1px solid #000', paddingBottom: '1pt' }}>
                      {line.content}
                    </div>
                  </div>
                );
                i++;
                continue;
              }
              
              // Check if this is an education entry
              const isEducationEntry = line.metadata?.section === 'education' && 
                                       line.metadata?.field === 'institution' &&
                                       line.metadata?.educationIndex !== undefined;
              
              if (isEducationEntry) {
                // Group all education fields for this entry
                const educationIndex = line.metadata?.educationIndex;
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
                  <div key={line.id} style={{ marginBottom: '2pt', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9pt' }}>
                    <div style={{ flex: 1 }}>
                      {educationParts.join(' | ')}
                    </div>
                    {dates && (
                      <div style={{ textAlign: 'right', marginLeft: '16pt', flexShrink: 0 }}>
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
                
                // Build the experience header - combine company, role, location on left, dates on right
                  const experienceParts: string[] = [];
                  if (company) experienceParts.push(company);
                  if (role) experienceParts.push(role);
                  if (location) experienceParts.push(location);
                  
                  result.push(
                    <div key={line.id}>
                      <div style={{ marginBottom: '2pt', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9pt' }}>
                        <div style={{ flex: 1, fontWeight: 'bold' }}>
                          {experienceParts.join(' | ')}
                        </div>
                        {dates && (
                          <div style={{ textAlign: 'right', marginLeft: '16pt', flexShrink: 0 }}>
                            {dates}
                          </div>
                        )}
                      </div>
                      {bullets.map((bulletLine) => (
                        <div key={bulletLine.id} style={{ marginLeft: '12pt', marginBottom: '1.5pt', textIndent: '-6pt', paddingLeft: '6pt', fontSize: '9pt', lineHeight: '1.2' }}>
                          • {bulletLine.content}
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
                
                // Build the project header - combine name, techStack, location on left, dates on right
                  const projectParts: string[] = [];
                  if (name) projectParts.push(name);
                  if (techStack) projectParts.push(techStack);
                  if (location) projectParts.push(location);
                  
                  result.push(
                    <div key={line.id}>
                      <div style={{ marginBottom: '2pt', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9pt' }}>
                        <div style={{ flex: 1, fontWeight: 'bold' }}>
                          {projectParts.join(' | ')}
                        </div>
                        {dates && (
                          <div style={{ textAlign: 'right', marginLeft: '16pt', flexShrink: 0 }}>
                            {dates}
                          </div>
                        )}
                      </div>
                      {bullets.map((bulletLine) => (
                        <div key={bulletLine.id} style={{ marginLeft: '12pt', marginBottom: '1.5pt', textIndent: '-6pt', paddingLeft: '6pt', fontSize: '9pt', lineHeight: '1.2' }}>
                          • {bulletLine.content}
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
                  <div key={line.id} style={{ marginTop: '6pt', marginBottom: '6pt', fontSize: '9pt' }}>
                    <span style={{ fontWeight: 'bold' }}>{line.content || 'Category'}:</span>
                    {' '}
                    {categorySkills.map((skillLine, skillIdx) => (
                      <span key={skillLine.id} style={{ display: 'inline' }}>
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
                <div key={line.id} style={{ marginBottom: '2pt' }}>
                  {line.type === 'header' && (
                    <div style={{ fontSize: '16pt', fontWeight: 'bold', textAlign: 'center', marginBottom: '4pt', marginTop: 0 }}>
                      {line.content}
                    </div>
                  )}
                  {line.type === 'bullet' && (
                    <div style={{ marginLeft: '12pt', marginBottom: '1.5pt', textIndent: '-6pt', paddingLeft: '6pt', fontSize: '9pt', lineHeight: '1.2' }}>
                      • {line.content}
                    </div>
                  )}
                  {line.type === 'content' && (
                    <div style={{
                      marginBottom: '2pt',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      whiteSpace: 'normal',
                      fontSize: '9pt',
                      lineHeight: '1.2',
                      ...(isTitle ? { fontWeight: 'bold' } : {}),
                      ...(isContactInfo ? { textAlign: 'center', marginBottom: '6pt', display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '6px', fontSize: '8.5pt' } : {}),
                      ...(line.metadata?.align === 'right' ? { textAlign: 'right' } : {})
                    }}>
                      <LinkRenderer text={line.content} />
                    </div>
                  )}
                </div>
              );
              
              i++;
            }
            
            return result;
          }, [lines])}
        </div>
      </div>
    </div>
  );
}

