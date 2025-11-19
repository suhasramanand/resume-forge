import { useCallback } from 'react';

export function useResumeEditorResize(
  isResizing: boolean,
  setIsResizing: (resizing: boolean) => void,
  sidebarOpen: boolean
) {
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsResizing(true);
  }, [setIsResizing]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    // Use requestAnimationFrame for smoother performance
    requestAnimationFrame(() => {
      const container = document.querySelector('.flex.h-screen') as HTMLElement;
      if (!container) return;
      
      const children = Array.from(container.children) as HTMLElement[];
      const editorMain = children.find(el => el.classList.contains('flex-1') && el.classList.contains('flex') && el.classList.contains('flex-col') && !el.classList.contains('min-w-[300px]')) as HTMLElement;
      const editorPreview = children.find(el => el.classList.contains('min-w-[300px]') || el.classList.contains('max-w-[800px]')) as HTMLElement;
      if (!editorMain || !editorPreview) return;
      
      const containerRect = container.getBoundingClientRect();
      const sidebarWidth = sidebarOpen ? 280 : 0;
      const resizeHandleWidth = 4;
      const availableWidth = containerRect.width - sidebarWidth - resizeHandleWidth;
      const mouseX = e.clientX - containerRect.left - sidebarWidth;
      
      const editorPercent = (mouseX / availableWidth) * 100;
      const previewPercent = 100 - editorPercent;
      
      const constrainedEditorPercent = Math.max(30, Math.min(70, editorPercent));
      const constrainedPreviewPercent = 100 - constrainedEditorPercent;
      
      editorMain.style.flex = `1 1 ${constrainedEditorPercent}%`;
      editorPreview.style.width = `${constrainedPreviewPercent}%`;
      editorPreview.style.flex = `0 0 ${constrainedPreviewPercent}%`;
    });
  }, [isResizing, sidebarOpen]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, [setIsResizing]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}

