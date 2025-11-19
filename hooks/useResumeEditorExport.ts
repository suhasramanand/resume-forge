import { useCallback } from 'react';
import { FormattedLine } from '@/lib/resumeFormatter';
import { usePrintHandler } from '@/components/PrintHandler';

export function useResumeEditorExport(
  lines: FormattedLine[],
  setShowExportPreview: (show: boolean) => void,
  previewContentRef: React.RefObject<HTMLDivElement>
) {
  const { handlePrint } = usePrintHandler(previewContentRef);

  const handleExportClick = useCallback(() => {
    setShowExportPreview(true);
  }, [setShowExportPreview]);

  const handleFinalize = useCallback(() => {
    setShowExportPreview(false);
    handlePrint();
  }, [setShowExportPreview, handlePrint]);

  return {
    handleExportClick,
    handleFinalize,
  };
}

