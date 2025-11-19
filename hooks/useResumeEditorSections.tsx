import { useMemo, useCallback } from 'react';
import { FormattedLine } from '@/lib/resumeFormatter';
import { FileText, User, Briefcase, Rocket, Trophy } from 'lucide-react';
import React from 'react';

export function useResumeEditorSections(
  lines: FormattedLine[],
  sectionOrder: string[],
  setSectionOrder: (order: string[]) => void
) {
  const sections = useMemo(() => {
    const sectionsMap: Record<string, FormattedLine[]> = {};
    let currentSection = 'header';
    
    lines.forEach(line => {
      if (line.type === 'section') {
        currentSection = line.metadata?.section || line.content.toLowerCase().replace(/\s+/g, '-');
        if (!sectionsMap[currentSection]) {
          sectionsMap[currentSection] = [];
        }
        sectionsMap[currentSection].push(line);
      } else if (line.type !== 'separator') {
        if (!sectionsMap[currentSection]) {
          sectionsMap[currentSection] = [];
        }
        sectionsMap[currentSection].push(line);
      }
    });
    
    return sectionsMap;
  }, [lines]);

  // Initialize section order separately to avoid useMemo dependency issues
  React.useEffect(() => {
    // Only set order if it's empty and we have sections
    if (sectionOrder.length === 0) {
      const sectionKeys = Object.keys(sections);
      if (sectionKeys.length > 0) {
        setSectionOrder(sectionKeys);
      }
    }
    // Only depend on sections to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  const sectionMenuItems = useMemo(() => {
    return Object.entries(sections).map(([sectionKey, sectionLines]) => {
      const sectionName = sectionLines.find(l => l.type === 'section')?.content || 
                        sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1);
      const icons: Record<string, React.ReactNode> = {
        'header': <User size={16} />,
        'education': <FileText size={16} />,
        'skills': <Briefcase size={16} />,
        'experience': <Briefcase size={16} />,
        'projects': <Rocket size={16} />,
        'certifications': <Trophy size={16} />,
      };
      return {
        id: sectionKey,
        name: sectionName,
        icon: icons[sectionKey] || <FileText size={16} />,
      };
    });
  }, [sections]);

  const createToggleSection = useCallback((setExpandedSections: React.Dispatch<React.SetStateAction<Set<string>>>) => {
    return (sectionKey: string) => {
      setExpandedSections(prev => {
        const newExpanded = new Set(prev);
        if (newExpanded.has(sectionKey)) {
          newExpanded.delete(sectionKey);
        } else {
          newExpanded.add(sectionKey);
        }
        return newExpanded;
      });
    };
  }, []);

  return {
    sections,
    sectionMenuItems,
    createToggleSection,
  };
}

