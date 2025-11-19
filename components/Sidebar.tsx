'use client';

import React, { useMemo, useState } from 'react';
import { FormattedLine } from '@/lib/resumeFormatter';
import { ChevronRight, ChevronDown, X, PanelLeft, List, Eye, Clock, Settings, HelpCircle, FileText } from 'lucide-react';
import { getSectionWordCount, getTotalWordCount } from '@/lib/utils/wordCount';
import { VersionsTab } from './sidebar/VersionsTab';
import { VisibilityTab } from './sidebar/VisibilityTab';
import { HistoryTab } from './sidebar/HistoryTab';
import { SettingsTab } from './sidebar/SettingsTab';
import { HelpTab } from './sidebar/HelpTab';
import { useResumeVersions } from '@/hooks/useResumeVersions';
import { useResumeSettings, ResumeSettings, DEFAULT_SETTINGS } from '@/hooks/useResumeSettings';

type SidebarTab = 'sections' | 'versions' | 'visibility' | 'history' | 'settings' | 'help';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sections: Record<string, FormattedLine[]>;
  expandedSections: Set<string>;
  toggleSection: (sectionKey: string) => void;
  lines: FormattedLine[];
  onLinesChange?: (lines: FormattedLine[]) => void;
  undoRedo?: {
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    historyLength: number;
    currentIndex: number;
  };
  visibleSections?: Set<string>;
  onVisibleSectionsChange?: (sections: Set<string>) => void;
  settings?: ResumeSettings;
  onSettingsChange?: (settings: Partial<ResumeSettings>) => void;
}

export function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  sections,
  expandedSections,
  toggleSection,
  lines,
  onLinesChange,
  undoRedo,
  visibleSections: externalVisibleSections,
  onVisibleSectionsChange,
  settings: externalSettings,
  onSettingsChange,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('sections');
  const [internalVisibleSections, setInternalVisibleSections] = useState<Set<string>>(() => 
    new Set(Object.keys(sections))
  );
  const visibleSections = externalVisibleSections ?? internalVisibleSections;
  const setVisibleSections = onVisibleSectionsChange 
    ? (newSet: Set<string>) => onVisibleSectionsChange(newSet)
    : setInternalVisibleSections;

  // Update visible sections when sections change
  React.useEffect(() => {
    const currentSectionKeys = Object.keys(sections);
    setVisibleSections(prev => {
      const newSet = new Set(prev);
      // Add new sections
      currentSectionKeys.forEach(key => {
        if (!newSet.has(key)) {
          newSet.add(key);
        }
      });
      // Remove deleted sections
      Array.from(newSet).forEach(key => {
        if (!currentSectionKeys.includes(key)) {
          newSet.delete(key);
        }
      });
      return newSet;
    });
  }, [sections]);

  // All hooks must be called unconditionally at the top level
  const totalWordCount = useMemo(() => getTotalWordCount(lines), [lines]);
  
  const sectionItems = useMemo(() => 
    Object.entries(sections).map(([sectionKey, sectionLines]) => {
      const sectionName = sectionLines.find(l => l.type === 'section')?.content || 
                        sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1);
      const isExpanded = expandedSections.has(sectionKey);
      const lineCount = sectionLines.filter(l => l.type !== 'section' && l.type !== 'separator').length;
      
      return {
        sectionKey,
        sectionName,
        isExpanded,
        lineCount,
        sectionLines,
      };
    }), [sections, expandedSections]);

  // Versions
  const { versions, currentVersionId, saveVersion, loadVersion, deleteVersion } = useResumeVersions(lines);
  
  // Settings
  const internalSettings = useResumeSettings();
  const settings = externalSettings ?? internalSettings.settings;
  const updateSettings = onSettingsChange 
    ? (newSettings: Partial<ResumeSettings>) => onSettingsChange(newSettings)
    : internalSettings.updateSettings;
  const resetSettings = externalSettings 
    ? () => onSettingsChange?.(DEFAULT_SETTINGS)
    : internalSettings.resetSettings;

  const handleLoadVersion = (versionId: string) => {
    const loadedLines = loadVersion(versionId);
    if (loadedLines && onLinesChange) {
      onLinesChange(loadedLines);
    }
  };

  const toggleSectionVisibility = (sectionKey: string) => {
    setVisibleSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
      }
      return newSet;
    });
  };

  const tabs: Array<{ id: SidebarTab; label: string; icon: React.ReactNode }> = [
    { id: 'sections', label: 'Sections', icon: <List size={16} /> },
    { id: 'versions', label: 'Versions', icon: <FileText size={16} /> },
    { id: 'visibility', label: 'Visibility', icon: <Eye size={16} /> },
    { id: 'history', label: 'History', icon: <Clock size={16} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
    { id: 'help', label: 'Help', icon: <HelpCircle size={16} /> },
  ];
          
          return (
    <>
      {/* Slide-in sidebar - overlaps editor, no backdrop */}
      <div 
        className={`fixed left-0 top-0 h-full w-[320px] max-w-[85vw] bg-background border-r border-border z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/80 flex-shrink-0 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-foreground text-background text-xs font-bold flex items-center justify-center shadow-sm">
              RF
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground block">Resume Editor</span>
              <span className="text-xs text-muted-foreground">Navigation</span>
            </div>
          </div>
          <button 
            className="p-1.5 hover:bg-muted rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-foreground/20 active:scale-95"
            onClick={() => setSidebarOpen(false)}
            title="Close Sidebar (Ctrl+B or Cmd+B)"
            aria-label="Close sidebar"
          >
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>
        {/* Tab Navigation */}
        <div className="border-b border-border/80 bg-muted/30 px-2 py-1 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/50'
              }`}
              title={tab.label}
              aria-label={tab.label}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'sections' && (
            <>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">Resume Sections</div>
              {sectionItems.map(({ sectionKey, sectionName, isExpanded, lineCount, sectionLines }) => (
                <div key={sectionKey} className="mb-1">
                  <button
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-secondary/80 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-foreground/20 active:scale-[0.98] group"
                    onClick={() => toggleSection(sectionKey)}
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${sectionName} section`}
                  >
                    {isExpanded ? (
                      <ChevronDown size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                    ) : (
                      <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                    )}
                    <span className="flex-1 text-left font-medium">{sectionName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground bg-muted/80 px-2.5 py-1 rounded-full border border-border/50">
                        {getSectionWordCount(sectionLines)} words
                      </span>
                      <span className="text-xs font-medium text-muted-foreground bg-muted/80 px-2.5 py-1 rounded-full border border-border/50">
                        {lineCount}
                      </span>
                    </div>
                  </button>
                </div>
              ))}
              {Object.keys(sections).length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <p>No sections available</p>
                  <p className="text-xs mt-2">Upload a resume to get started</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'versions' && (
            <VersionsTab
              versions={versions}
              currentVersionId={currentVersionId}
              onSaveVersion={saveVersion}
              onLoadVersion={loadVersion}
              onDeleteVersion={deleteVersion}
              currentLines={lines}
              onLoad={onLinesChange || (() => {})}
            />
          )}

          {activeTab === 'visibility' && (
            <VisibilityTab
              sections={sections}
              visibleSections={visibleSections}
              toggleSectionVisibility={toggleSectionVisibility}
            />
          )}

          {activeTab === 'history' && undoRedo && (
            <HistoryTab
              canUndo={undoRedo.canUndo}
              canRedo={undoRedo.canRedo}
              onUndo={undoRedo.onUndo}
              onRedo={undoRedo.onRedo}
              historyLength={undoRedo.historyLength}
              currentIndex={undoRedo.currentIndex}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              settings={settings}
              onUpdate={updateSettings}
              onReset={resetSettings}
            />
          )}

          {activeTab === 'help' && <HelpTab />}
        </div>

        {/* Statistics Footer (only show on sections tab) */}
        {activeTab === 'sections' && (
          <div className="border-t border-border/80 p-4 bg-muted/30">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Statistics</div>
            <div className="px-2 py-2 text-sm text-foreground">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Words:</span>
                <span className="font-semibold">{totalWordCount}</span>
              </div>
            </div>
          </div>
        )}
    </div>
      
      {/* Toggle button - only show when sidebar is closed */}
      {!sidebarOpen && (
        <button
          className="fixed left-4 top-20 z-30 w-12 h-12 bg-background/95 backdrop-blur-sm border border-border rounded-xl shadow-lg flex items-center justify-center hover:bg-secondary hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-foreground/20"
          onClick={() => setSidebarOpen(true)}
          title="Open Sidebar (Ctrl+B or Cmd+B)"
          aria-label="Open sidebar"
        >
          <PanelLeft size={20} className="text-foreground" />
        </button>
      )}
    </>
  );
}

