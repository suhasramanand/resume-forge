'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { FormattedLine } from '@/lib/resumeFormatter';
import { ResumeEditor } from '@/components/ResumeEditor';
import { Logo } from '@/components/Logo';

export default function Home() {
  const [resume, setResume] = useState<{ lines: FormattedLine[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showShimmer, setShowShimmer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Show shimmer after a delay (only for slower loads)
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setShowShimmer(true);
      }, 500); // Show shimmer after 500ms delay
      
      return () => {
        clearTimeout(timer);
        setShowShimmer(false);
      };
    } else {
      setShowShimmer(false);
    }
  }, [loading]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setLoading(true);
    setError(null);
    setShowShimmer(false);

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
      <div className="px-6 sm:px-12 lg:px-16 pt-8 sm:pt-10 lg:pt-12 pb-6 sm:pb-8">
        <Logo />
      </div>

      <div className="max-w-4xl mx-auto px-6 sm:px-12 lg:px-16">
        <div
          {...getRootProps()}
          className={`relative p-12 sm:p-16 border-2 border-dashed rounded-xl text-center bg-background cursor-pointer transition-all duration-200 ${
            isDragActive 
              ? 'border-foreground/60 bg-secondary/50 shadow-xl scale-[1.01] ring-2 ring-foreground/10' 
              : 'border-border hover:border-foreground/40 hover:bg-secondary/30 hover:shadow-lg'
          }`}
        >
          <input {...getInputProps()} aria-label="Upload resume file" />
          <div className="flex flex-col items-center gap-5">
            <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-200 ${
              isDragActive 
                ? 'bg-foreground/10 scale-110' 
                : 'bg-muted group-hover:bg-foreground/5'
            }`}>
              <svg className={`w-10 h-10 text-foreground transition-transform duration-200 ${
                isDragActive ? 'scale-110' : ''
              }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                {isDragActive
                  ? 'Drop your resume here'
                  : 'Upload your resume'}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                {isDragActive
                  ? 'Release to upload and start editing'
                  : 'Drag & drop a file here, or click to browse'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <span className="text-xs font-medium text-muted-foreground bg-muted/80 px-3 py-1.5 rounded-full border border-border/50">
                  PDF
                </span>
                <span className="text-xs font-medium text-muted-foreground bg-muted/80 px-3 py-1.5 rounded-full border border-border/50">
                  DOCX
                </span>
                <span className="text-xs font-medium text-muted-foreground bg-muted/80 px-3 py-1.5 rounded-full border border-border/50">
                  DOC
                </span>
                <span className="text-xs font-medium text-muted-foreground bg-muted/80 px-3 py-1.5 rounded-full border border-border/50">
                  TXT
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="max-w-4xl mx-auto px-6 sm:px-12 lg:px-16 mb-8">
          <div className="p-6 sm:p-8 bg-background border border-border rounded-xl text-foreground text-center shadow-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-8 h-8 border-[3px] border-foreground/20 border-t-foreground rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-8 h-8 border-[3px] border-transparent border-r-foreground/40 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
              <div>
                <p className="text-base font-semibold text-foreground mb-1">Processing your resume...</p>
                <p className="text-sm text-muted-foreground">Parsing and formatting content. This may take a few seconds.</p>
              </div>
            </div>
          </div>
          
          {/* Shimmer skeleton loader - only shown after delay */}
          {showShimmer && (
            <div className="mt-8 space-y-6 animate-in">
              {/* Header skeleton */}
              <div className="space-y-3">
                <div className="h-8 shimmer rounded-lg w-1/3"></div>
                <div className="h-4 shimmer rounded-lg w-2/3"></div>
              </div>
              
              {/* Section skeletons */}
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="h-6 shimmer rounded-lg w-1/4"></div>
                  <div className="space-y-2 pl-4">
                    <div className="h-4 shimmer rounded w-full"></div>
                    <div className="h-4 shimmer rounded w-5/6"></div>
                    <div className="h-4 shimmer rounded w-4/6"></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="max-w-4xl mx-auto px-6 sm:px-12 lg:px-16 mb-8">
          <div className="p-6 sm:p-8 bg-red-50/80 border-2 border-red-200/80 rounded-xl text-center shadow-sm backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-red-900 mb-1">Unable to process resume</h3>
                <p className="text-sm text-red-700/90 max-w-md">{error}</p>
                <p className="text-xs text-red-600/80 mt-2">Please ensure your file is a valid PDF, DOCX, DOC, or TXT format.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {resume && (
        <ResumeEditor lines={resume.lines} onUpdate={handleUpdate} onExport={handleFinalize} />
      )}
    </div>
  );
}
