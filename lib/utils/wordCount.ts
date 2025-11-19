import { FormattedLine } from '@/lib/resumeFormatter';

export function countWords(text: string): number {
  if (!text || text.trim() === '') return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

export function getSectionWordCount(sectionLines: FormattedLine[]): number {
  return sectionLines
    .filter(line => line.type === 'content' || line.type === 'bullet')
    .reduce((total, line) => total + countWords(line.content || ''), 0);
}

export function getTotalWordCount(lines: FormattedLine[]): number {
  return lines
    .filter(line => line.type === 'content' || line.type === 'bullet')
    .reduce((total, line) => total + countWords(line.content || ''), 0);
}

export function getSectionWordCounts(lines: FormattedLine[]): Record<string, number> {
  const sectionCounts: Record<string, number> = {};
  let currentSection = '';
  
  lines.forEach(line => {
    if (line.type === 'section') {
      currentSection = line.content || '';
      sectionCounts[currentSection] = 0;
    } else if (currentSection && (line.type === 'content' || line.type === 'bullet')) {
      sectionCounts[currentSection] = (sectionCounts[currentSection] || 0) + countWords(line.content || '');
    }
  });
  
  return sectionCounts;
}

