'use client';

import React, { useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';

interface PrintHandlerProps {
  previewContentRef: React.RefObject<HTMLDivElement>;
}

export function usePrintHandler(previewContentRef: React.RefObject<HTMLDivElement>) {
  // Calculate dynamic scale based on content height
  const calculateScale = useCallback(() => {
    const content = previewContentRef.current;
    if (!content) return 1;

    // Get the actual content height
    const contentHeight = content.scrollHeight;
    
    // Available print height: 11in (letter) - 0.2in (top + bottom margins) = 10.8in
    // Convert to pixels: 1in = 96px at 96dpi
    const availableHeight = 10.8 * 96; // ~1036.8px
    
    // Calculate scale factor
    let scale = 1;
    if (contentHeight > availableHeight) {
      scale = availableHeight / contentHeight;
      // Add a small buffer (2%) to ensure it fits
      scale = scale * 0.98;
    }
    
    // Clamp scale between 0.5 and 1.0 for readability
    scale = Math.max(0.5, Math.min(1.0, scale));
    
    return scale;
  }, [previewContentRef]);

  // Generate print styles with dynamic scale
  const getPrintStyles = useCallback((scale: number) => {
    const inverseScale = 1 / scale;
    
    return `
      @page {
        margin: 0.1in;
        size: letter;
      }
      @media print {
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html, body {
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          color: #000;
          background: #fff;
          padding: 0.1in;
          font-size: 7.5pt;
          line-height: 1.1;
          margin: 0;
          max-height: 10.7in;
          height: 10.7in;
        }
        .print-content {
          transform: scale(${scale});
          transform-origin: top left;
          width: ${inverseScale * 100}%;
          height: ${inverseScale * 100}%;
          max-height: ${10.7 * inverseScale}in;
        }
        div {
          margin-top: 0.5pt !important;
          margin-bottom: 0.5pt !important;
        }
        h1, h2, h3, h4, h5, h6 {
          margin-top: 2pt !important;
          margin-bottom: 1pt !important;
        }
        ul, ol {
          margin-top: 0.5pt !important;
          margin-bottom: 0.5pt !important;
          padding-left: 10pt !important;
        }
        li {
          margin-bottom: 0.25pt !important;
          line-height: 1.1 !important;
        }
        div.relative {
          display: flex !important;
          align-items: flex-start !important;
        }
        span.absolute {
          position: relative !important;
          left: auto !important;
          margin-right: 4pt !important;
          flex-shrink: 0 !important;
          display: inline-block !important;
        }
        div.relative > *:not(span.absolute) {
          flex: 1 !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          min-width: 0 !important;
        }
        p {
          margin-top: 0.5pt !important;
          margin-bottom: 0.5pt !important;
        }
        * {
          page-break-inside: avoid !important;
          page-break-after: avoid !important;
          page-break-before: avoid !important;
        }
        div, p, li, span {
          page-break-inside: avoid !important;
        }
        a {
          color: #000;
          text-decoration: underline;
        }
        .no-print {
          display: none !important;
        }
      }
    `;
  }, []);

  // Create print handler at top level (hooks must be called unconditionally)
  const triggerPrint = useReactToPrint({
    contentRef: previewContentRef,
    documentTitle: 'Resume - ResumeForge',
    pageStyle: getPrintStyles(1), // Will be dynamically updated
    onPrintError: (errorLocation, error) => {
      console.error(`Print error at ${errorLocation}:`, error);
      // You could show a user-friendly error message here
    },
    suppressErrors: false, // Keep errors visible for debugging
  });

  // Wrapper function that calculates scale dynamically before printing
  const handlePrint = useCallback(() => {
    try {
      // Check if content ref is available
      if (!previewContentRef.current) {
        console.error('Print error: Preview content ref is not available');
        return;
      }

      // Calculate scale based on current content size
      const scale = calculateScale();
      
      // Inject dynamic print styles with calculated scale
      const styleId = 'resume-forge-print-styles';
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;
      
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.setAttribute('media', 'print');
        document.head.appendChild(styleElement);
      }
      
      // Update styles with calculated scale
      styleElement.textContent = getPrintStyles(scale);
      
      // Trigger the print
      triggerPrint();
      
      // Clean up style element after printing
      setTimeout(() => {
        const element = document.getElementById(styleId);
        if (element && element.parentNode === document.head) {
          try {
            document.head.removeChild(element);
          } catch (e) {
            // Element might have been removed already, ignore
          }
        }
      }, 2000);
    } catch (error) {
      console.error('Error in handlePrint:', error);
      // Re-throw to let react-to-print handle it
      throw error;
    }
  }, [calculateScale, getPrintStyles, triggerPrint, previewContentRef]);

  return { handlePrint };
}
