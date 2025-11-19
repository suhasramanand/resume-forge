'use client';

import React, { useState } from 'react';
import { FormattedLine } from '@/lib/resumeFormatter';
import { Clock, Download, Trash2, Plus, Check } from 'lucide-react';

interface ResumeVersion {
  id: string;
  name: string;
  lines: FormattedLine[];
  timestamp: Date;
}

interface VersionsTabProps {
  versions: ResumeVersion[];
  currentVersionId: string | null;
  onSaveVersion: (lines: FormattedLine[], name?: string) => string;
  onLoadVersion: (versionId: string) => FormattedLine[] | null;
  onDeleteVersion: (versionId: string) => void;
  currentLines: FormattedLine[];
  onLoad: (lines: FormattedLine[]) => void;
}

export function VersionsTab({
  versions,
  currentVersionId,
  onSaveVersion,
  onLoadVersion,
  onDeleteVersion,
  currentLines,
  onLoad,
}: VersionsTabProps) {
  const [newVersionName, setNewVersionName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSave = () => {
    if (newVersionName.trim()) {
      onSaveVersion(currentLines, newVersionName.trim());
      setNewVersionName('');
      setShowNameInput(false);
    } else {
      onSaveVersion(currentLines);
      setShowNameInput(false);
    }
  };

  const handleLoad = (versionId: string) => {
    const lines = onLoadVersion(versionId);
    if (lines) {
      onLoad(lines);
    }
  };

  const handleDelete = (versionId: string) => {
    if (deletingId === versionId) {
      onDeleteVersion(versionId);
      setDeletingId(null);
    } else {
      setDeletingId(versionId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Resume Versions</h3>
        {!showNameInput ? (
          <button
            onClick={() => setShowNameInput(true)}
            className="p-1.5 hover:bg-secondary rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-foreground/20 active:scale-95"
            title="Save current version"
            aria-label="Save version"
          >
            <Plus size={16} className="text-muted-foreground" />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={handleSave}
              className="p-1.5 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-200 active:scale-95"
              title="Save"
              aria-label="Save"
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => {
                setShowNameInput(false);
                setNewVersionName('');
              }}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-foreground/20 active:scale-95"
              title="Cancel"
              aria-label="Cancel"
            >
              <span className="text-xs">×</span>
            </button>
          </div>
        )}
      </div>

      {showNameInput && (
        <input
          type="text"
          value={newVersionName}
          onChange={(e) => setNewVersionName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') {
              setShowNameInput(false);
              setNewVersionName('');
            }
          }}
          placeholder="Version name (optional)"
          className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20"
          autoFocus
        />
      )}

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {versions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <p>No versions saved</p>
            <p className="text-xs mt-2">Save a version to create snapshots</p>
          </div>
        ) : (
          versions.map((version) => (
            <div
              key={version.id}
              className={`p-3 rounded-lg border transition-all ${
                currentVersionId === version.id
                  ? 'bg-secondary border-foreground/20'
                  : 'bg-background border-border hover:bg-secondary/50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={14} className="text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground truncate">
                      {version.name}
                    </span>
                    {currentVersionId === version.id && (
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {version.timestamp.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {version.lines.length} lines
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {deletingId === version.id ? (
                    <>
                      <button
                        onClick={() => handleDelete(version.id)}
                        className="p-1.5 hover:bg-green-50 hover:text-green-600 rounded transition-colors"
                        title="Confirm delete"
                        aria-label="Confirm delete"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="p-1.5 hover:bg-muted rounded transition-colors"
                        title="Cancel"
                        aria-label="Cancel"
                      >
                        <span className="text-xs">×</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleLoad(version.id)}
                        className="p-1.5 hover:bg-secondary rounded transition-colors"
                        title="Load this version"
                        aria-label="Load version"
                      >
                        <Download size={14} className="text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleDelete(version.id)}
                        className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
                        title="Delete version"
                        aria-label="Delete version"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

