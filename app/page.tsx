'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FormattedLine } from '@/lib/resumeFormatter';
import { ResumeEditor } from '@/components/ResumeEditor';
import { Logo } from '@/components/Logo';

export default function Home() {
  const [resume, setResume] = useState<{ lines: FormattedLine[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMsg = data.error || `Server error: ${response.status}`;
        const details = data.details ? `\n\nDetails: ${data.details}` : '';
        throw new Error(errorMsg + details);
      }

      const data = await response.json();
      if (!data.formatted || !data.formatted.lines) {
        throw new Error('Invalid response from server');
      }
      setResume(data.formatted);
    } catch (err: any) {
      // Log error in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('Error processing resume:', err);
      }
      setError(err.message || 'Failed to process resume');
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
    },
  });

  const handleUpdate = (updatedLines: FormattedLine[]) => {
    if (resume) {
      setResume({ lines: updatedLines });
    }
  };

  const handleFinalize = () => {
    // This will be handled by the ResumeEditor component's handleFinalize
    // The onExport prop is optional and used for external triggers if needed
  };

  return (
    <div className="min-h-screen w-full">
      <div className="px-16 pt-12 pb-8">
        <Logo />
      </div>

      <div
        {...getRootProps()}
        className={`mx-16 mb-16 p-16 border-2 border-dashed rounded-lg text-center bg-background cursor-pointer transition-all ${
          isDragActive 
            ? 'border-foreground/50 bg-secondary shadow-lg scale-[1.02]' 
            : 'border-border hover:border-foreground/30 hover:shadow-md'
        }`}
      >
        <input {...getInputProps()} aria-label="Upload resume file" />
        <div className="flex flex-col items-center gap-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
            isDragActive ? 'bg-foreground/10' : 'bg-muted'
          }`}>
            <svg className="w-8 h-8 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground mb-1">
              {isDragActive
                ? 'Drop your resume here'
                : 'Upload your resume'}
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              {isDragActive
                ? 'Release to upload'
                : 'Drag & drop a file here, or click to browse'}
            </p>
            <p className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full inline-block">
              Supported: PDF, DOCX, DOC, TXT
            </p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="mx-16 mb-8 p-6 bg-muted border border-border rounded-lg text-foreground text-center shadow-sm">
          <div className="flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">Processing resume...</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">This may take a few seconds</p>
        </div>
      )}

      {error && (
        <div className="mx-16 mb-8 p-6 bg-red-50 border-2 border-red-200 rounded-lg text-foreground text-center shadow-sm">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold text-red-800">Error</span>
          </div>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {resume && (
        <ResumeEditor lines={resume.lines} onUpdate={handleUpdate} onExport={handleFinalize} />
      )}
    </div>
  );
}
