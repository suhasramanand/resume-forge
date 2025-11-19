import { FormattedLine } from '@/lib/resumeFormatter';

export function getResumeAsText(lines: FormattedLine[]): string {
  const parts: string[] = [];
  
  lines.forEach(line => {
    if (line.type === 'header') {
      parts.push(line.content || '');
      parts.push('\n');
    } else if (line.type === 'section') {
      parts.push('\n');
      parts.push(line.content || '');
      parts.push('\n');
    } else if (line.type === 'bullet') {
      parts.push('• ');
      parts.push(line.content || '');
      parts.push('\n');
    } else if (line.type === 'content') {
      parts.push(line.content || '');
      parts.push('\n');
    }
  });
  
  return parts.join('');
}

