import { useState, useCallback } from 'react';
import { FormattedLine } from '@/lib/resumeFormatter';

interface ResumeVersion {
  id: string;
  name: string;
  lines: FormattedLine[];
  timestamp: Date;
}

export function useResumeVersions(initialLines: FormattedLine[]) {
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);

  const saveVersion = useCallback((lines: FormattedLine[], name?: string) => {
    const version: ResumeVersion = {
      id: Date.now().toString(),
      name: name || `Version ${new Date().toLocaleString()}`,
      lines: JSON.parse(JSON.stringify(lines)), // Deep clone
      timestamp: new Date(),
    };
    setVersions(prev => [version, ...prev].slice(0, 20)); // Keep last 20 versions
    setCurrentVersionId(version.id);
    return version.id;
  }, []);

  const loadVersion = useCallback((versionId: string): FormattedLine[] | null => {
    const version = versions.find(v => v.id === versionId);
    if (version) {
      setCurrentVersionId(versionId);
      return JSON.parse(JSON.stringify(version.lines)); // Deep clone
    }
    return null;
  }, [versions]);

  const deleteVersion = useCallback((versionId: string) => {
    setVersions(prev => prev.filter(v => v.id !== versionId));
    if (currentVersionId === versionId) {
      setCurrentVersionId(null);
    }
  }, [currentVersionId]);

  return {
    versions,
    currentVersionId,
    saveVersion,
    loadVersion,
    deleteVersion,
  };
}

