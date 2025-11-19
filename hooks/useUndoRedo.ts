import { useState, useCallback, useRef } from 'react';
import { FormattedLine } from '@/lib/resumeFormatter';

const MAX_HISTORY = 50;

export function useUndoRedo(initialLines: FormattedLine[], onUpdate: (lines: FormattedLine[]) => void) {
  const [history, setHistory] = useState<FormattedLine[][]>([JSON.parse(JSON.stringify(initialLines))]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoingRef = useRef(false);

  const addToHistory = useCallback((lines: FormattedLine[]) => {
    if (isUndoingRef.current) {
      isUndoingRef.current = false;
      return;
    }
    
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(lines))); // Deep clone
      return newHistory.slice(-MAX_HISTORY); // Keep last MAX_HISTORY states
    });
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoingRef.current = true;
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onUpdate(JSON.parse(JSON.stringify(history[newIndex]))); // Deep clone
    }
  }, [history, historyIndex, onUpdate]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoingRef.current = true;
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onUpdate(JSON.parse(JSON.stringify(history[newIndex]))); // Deep clone
    }
  }, [history, historyIndex, onUpdate]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return {
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    historyLength: history.length,
    currentIndex: historyIndex,
  };
}

