import { useState, useEffect, useCallback } from 'react';

export interface ResumeSettings {
  fontSize: number;
  lineSpacing: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
}

const DEFAULT_SETTINGS: ResumeSettings = {
  fontSize: 11,
  lineSpacing: 1.2,
  marginTop: 0.5,
  marginBottom: 0.5,
  marginLeft: 0.5,
  marginRight: 0.5,
};

export function useResumeSettings() {
  const [settings, setSettings] = useState<ResumeSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('resume-forge-settings');
      if (saved) {
        try {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        } catch {
          return DEFAULT_SETTINGS;
        }
      }
    }
    return DEFAULT_SETTINGS;
  });

  const updateSettings = useCallback((newSettings: Partial<ResumeSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      if (typeof window !== 'undefined') {
        localStorage.setItem('resume-forge-settings', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('resume-forge-settings');
    }
  }, []);

  return {
    settings,
    updateSettings,
    resetSettings,
  };
}

