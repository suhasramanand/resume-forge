import { jsPDF } from 'jspdf';
import { FormattedLine } from './resumeFormatter';

export function generatePDF(lines: FormattedLine[]): Blob {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'letter',
    compress: true,
  });

  const pageWidth = 612; // Letter width in points
  const margin = 50;
  const maxWidth = pageWidth - (margin * 2);
  let yPos = margin;
  const lineHeight = 14;
  const sectionSpacing = 8;
  const bulletIndent = 20;

  const addText = (text: string, fontSize: number, isBold: boolean = false, x: number = margin, maxW: number = maxWidth) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    const lines = doc.splitTextToSize(text, maxW);
    lines.forEach((line: string) => {
      if (yPos > 750) { // New page if needed (but we want one page)
        // Don't add new page, just truncate
        return;
      }
      doc.text(line, x, yPos);
      yPos += lineHeight;
    });
    return lines.length;
  };

  lines.forEach((line, index) => {
    // Stop if we exceed one page (we want single page only)
    if (yPos > 750) {
      return;
    }

    switch (line.type) {
      case 'header':
        yPos += 5; // Extra space before name
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        const headerText = line.content.toUpperCase();
        doc.text(headerText, pageWidth / 2, yPos, { align: 'center' });
        yPos += lineHeight + 4;
        break;

      case 'section':
        yPos += sectionSpacing;
        addText(line.content, 11, true);
        yPos += 4;
        break;

      case 'separator':
        // Skip separators in PDF
        break;

      case 'bullet':
        // Preserve line breaks in bullet text
        const bulletContent = line.content;
        const bulletLines = bulletContent.split('\n').filter(l => l.trim());
        bulletLines.forEach((bulletLine: string) => {
          if (yPos > 750) return;
          doc.setFontSize(9.5);
          doc.setFont('helvetica', 'normal');
          const wrappedLines = doc.splitTextToSize('• ' + bulletLine.trim(), maxWidth - bulletIndent);
          wrappedLines.forEach((wrappedLine: string) => {
            if (yPos > 750) return;
            doc.text(wrappedLine, margin + bulletIndent, yPos);
            yPos += lineHeight - 2;
          });
        });
        break;

      case 'content':
        // Check if this is contact info (first content line after header)
        const isContactInfo = index > 0 && lines[index - 1]?.type === 'header';
        // Check if this is education field (starts with University:, Course:, GPA:, Dates:, Coursework:)
        const isEducationField = line.content.match(/^(University|Course|GPA|Dates|Coursework):/);
        
        let contentText = line.content;
        // Convert link format: TEXT|url to just Text (url) for PDF
        contentText = contentText.replace(/(LINKEDIN|GITHUB)\|([^\s|]+)/g, (match, type, url) => {
          const text = type === 'LINKEDIN' ? 'LinkedIn' : 'Github';
          return `${text} (${url})`;
        });
        
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'normal');
        
        if (isContactInfo) {
          // Center align contact info and split by | for line breaks
          const contactParts = contentText.split('|').map(p => p.trim()).filter(p => p);
          contactParts.forEach((part: string) => {
            if (yPos > 750) return;
            const wrappedLines = doc.splitTextToSize(part, maxWidth);
            wrappedLines.forEach((wrappedLine: string) => {
              if (yPos > 750) return;
              doc.text(wrappedLine, pageWidth / 2, yPos, { align: 'center' });
              yPos += lineHeight - 2;
            });
          });
        } else {
          // Check if this should be right-aligned (dates)
          const isRightAligned = line.metadata?.align === 'right' || line.metadata?.field === 'dates';
          
          // Regular content - preserve line breaks
          const contentLines = contentText.split('\n').filter(l => l.trim());
          contentLines.forEach((contentLine: string) => {
            if (yPos > 750) return;
            const wrappedLines = doc.splitTextToSize(contentLine.trim(), maxWidth);
            wrappedLines.forEach((wrappedLine: string) => {
              if (yPos > 750) return;
              if (isRightAligned) {
                doc.text(wrappedLine, pageWidth - margin, yPos, { align: 'right' });
              } else {
                doc.text(wrappedLine, margin, yPos);
              }
              yPos += lineHeight - 2;
            });
          });
        }
        break;
    }
  });

  return doc.output('blob');
}

