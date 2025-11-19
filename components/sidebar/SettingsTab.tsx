'use client';

import React from 'react';
import { ResumeSettings } from '@/hooks/useResumeSettings';
import { RotateCcw } from 'lucide-react';

interface SettingsTabProps {
  settings: ResumeSettings;
  onUpdate: (settings: Partial<ResumeSettings>) => void;
  onReset: () => void;
}

export function SettingsTab({ settings, onUpdate, onReset }: SettingsTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">Print Settings</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Adjust formatting for PDF export. Changes apply to the preview and final output.
        </p>
      </div>

      <div className="space-y-4">
        {/* Font Size */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-2">
            Font Size: {settings.fontSize}pt
          </label>
          <input
            type="range"
            min="8"
            max="14"
            step="0.5"
            value={settings.fontSize}
            onChange={(e) => onUpdate({ fontSize: parseFloat(e.target.value) })}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>8pt</span>
            <span>14pt</span>
          </div>
        </div>

        {/* Line Spacing */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-2">
            Line Spacing: {settings.lineSpacing}
          </label>
          <input
            type="range"
            min="1"
            max="2"
            step="0.1"
            value={settings.lineSpacing}
            onChange={(e) => onUpdate({ lineSpacing: parseFloat(e.target.value) })}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>1.0</span>
            <span>2.0</span>
          </div>
        </div>

        {/* Margins */}
        <div className="pt-2 border-t border-border/80">
          <label className="block text-xs font-medium text-foreground mb-3">Margins (inches)</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Top</label>
              <input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={settings.marginTop}
                onChange={(e) => onUpdate({ marginTop: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Bottom</label>
              <input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={settings.marginBottom}
                onChange={(e) => onUpdate({ marginBottom: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Left</label>
              <input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={settings.marginLeft}
                onChange={(e) => onUpdate({ marginLeft: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Right</label>
              <input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={settings.marginRight}
                onChange={(e) => onUpdate({ marginRight: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={onReset}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-secondary transition-all active:scale-95"
      >
        <RotateCcw size={16} />
        <span>Reset to Defaults</span>
      </button>
    </div>
  );
}

