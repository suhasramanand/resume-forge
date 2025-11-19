'use client';

import React from 'react';
import { Keyboard, Lightbulb } from 'lucide-react';

export function HelpTab() {
  const shortcuts = [
    { keys: ['Ctrl', 'B'], description: 'Toggle sidebar' },
    { keys: ['Ctrl', 'S'], description: 'Save resume' },
    { keys: ['Ctrl', 'Z'], description: 'Undo' },
    { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
    { keys: ['Enter'], description: 'Save edit' },
    { keys: ['Escape'], description: 'Cancel edit / Close modals' },
  ];

  const tips = [
    'Click any text to edit it inline - no save button needed',
    'Drag sections or lines to reorder them',
    'Use section visibility to hide sections from export',
    'Save versions to create snapshots of your resume',
    'Adjust settings to fit more content on one page',
    'The preview updates in real-time as you edit',
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <Keyboard size={16} />
          Keyboard Shortcuts
        </h3>
      </div>

      <div className="space-y-2">
        {shortcuts.map((shortcut, idx) => (
          <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50">
            <span className="text-xs text-muted-foreground">{shortcut.description}</span>
            <div className="flex items-center gap-1">
              {shortcut.keys.map((key, keyIdx) => (
                <React.Fragment key={keyIdx}>
                  <kbd className="px-2 py-1 text-xs font-medium bg-background border border-border rounded shadow-sm">
                    {key}
                  </kbd>
                  {keyIdx < shortcut.keys.length - 1 && (
                    <span className="text-xs text-muted-foreground">+</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-border/80">
        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <Lightbulb size={16} />
          Tips & Tricks
        </h3>
        <ul className="space-y-2 mt-3">
          {tips.map((tip, idx) => (
            <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
              <span className="text-foreground/40 mt-0.5">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

