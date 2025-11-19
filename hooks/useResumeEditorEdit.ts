import { useCallback } from 'react';
import { FormattedLine } from '@/lib/resumeFormatter';

export function useResumeEditorEdit(
  lines: FormattedLine[],
  onUpdate: (lines: FormattedLine[]) => void,
  editingId: string | null,
  editValue: string,
  setEditingId: (id: string | null) => void,
  setEditValue: (value: string) => void
) {
  const startEdit = useCallback((line: FormattedLine) => {
    setEditingId(line.id);
    setEditValue(line.content);
  }, [setEditingId, setEditValue]);

  const saveEdit = useCallback(() => {
    if (editingId) {
      const updated = lines.map(l =>
        l.id === editingId ? { ...l, content: editValue } : l
      );
      onUpdate(updated);
      setEditingId(null);
      setEditValue('');
    }
  }, [editingId, editValue, lines, onUpdate, setEditingId, setEditValue]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditValue('');
  }, [setEditingId, setEditValue]);

  return {
    startEdit,
    saveEdit,
    cancelEdit,
  };
}

