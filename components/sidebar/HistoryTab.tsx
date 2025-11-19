'use client';

import React from 'react';
import { RotateCcw, RotateCw, Clock } from 'lucide-react';

interface HistoryTabProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  historyLength: number;
  currentIndex: number;
}

export function HistoryTab({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  historyLength,
  currentIndex,
}: HistoryTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">Recent Changes</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Undo or redo your recent edits. Changes are tracked automatically.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
            canUndo
              ? 'bg-background border-border hover:bg-secondary hover:border-foreground/20 active:scale-95'
              : 'bg-muted/50 border-border/50 opacity-50 cursor-not-allowed'
          }`}
          title={canUndo ? 'Undo (Ctrl+Z or Cmd+Z)' : 'Nothing to undo'}
          aria-label="Undo"
        >
          <RotateCcw size={16} className={canUndo ? 'text-foreground' : 'text-muted-foreground'} />
          <span className="text-sm font-medium">Undo</span>
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
            canRedo
              ? 'bg-background border-border hover:bg-secondary hover:border-foreground/20 active:scale-95'
              : 'bg-muted/50 border-border/50 opacity-50 cursor-not-allowed'
          }`}
          title={canRedo ? 'Redo (Ctrl+Shift+Z or Cmd+Shift+Z)' : 'Nothing to redo'}
          aria-label="Redo"
        >
          <RotateCw size={16} className={canRedo ? 'text-foreground' : 'text-muted-foreground'} />
          <span className="text-sm font-medium">Redo</span>
        </button>
      </div>

      <div className="pt-4 border-t border-border/80">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock size={14} />
          <span>
            {currentIndex + 1} of {historyLength} changes
          </span>
        </div>
      </div>
    </div>
  );
}

