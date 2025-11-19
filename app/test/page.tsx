'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { FormattedLine } from '@/lib/resumeFormatter';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Upload, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

export default function TestPage() {
  const [resume, setResume] = useState<{ lines: FormattedLine[]; name?: string } | null>(null);
  const [resumeName, setResumeName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const previewRef = useRef<HTMLDivElement>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setLoading(true);
    setError(null);

    const fileName = file.name;
    const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      if (!data.formatted || !data.formatted.lines) {
        throw new Error('Invalid response from server');
      }
      
      const resumeData = {
        ...data.formatted,
        name: fileNameWithoutExt || `Resume ${new Date().toLocaleDateString()}`,
      };
      setResume(resumeData);
      setResumeName(resumeData.name);
    } catch (err: any) {
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
      setResume({ 
        ...resume, 
        lines: updatedLines,
      });
    }
  };

  const startEdit = (line: FormattedLine) => {
    setEditingId(line.id);
    setEditValue(line.content);
  };

  const saveEdit = () => {
    if (editingId && resume) {
      const updated = resume.lines.map(l =>
        l.id === editingId ? { ...l, content: editValue } : l
      );
      handleUpdate(updated);
      setEditingId(null);
      setEditValue('');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelEdit();
      }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        saveEdit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingId, editValue]);

  const handleUploadNew = () => {
    if (resume && !confirm('Upload a new resume? Your current changes will be lost.')) {
      return;
    }
    setResume(null);
    setResumeName('');
    setError(null);
  };

  const handlePrint = useReactToPrint({
    contentRef: previewRef,
    documentTitle: resumeName || 'Resume',
    pageStyle: `
      @page {
        margin: 0.3in;
        size: letter;
      }
      @media print {
        @page {
          margin: 0.3in;
          size: letter;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html, body {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: #fff !important;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          color: #000;
          background: #fff;
          font-size: 9pt;
          line-height: 1.15;
          padding: 0;
          margin: 0;
        }
        .print-content {
          padding: 0 !important;
          margin: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          border: none !important;
          box-shadow: none !important;
          background: #fff !important;
          transform: scale(var(--print-scale, 1));
          transform-origin: top left;
        }
        .no-print,
        .no-print *,
        header,
        nav,
        button:not(.print-content button) {
          display: none !important;
          visibility: hidden !important;
        }
        div {
          margin-top: 0.5pt !important;
          margin-bottom: 0.5pt !important;
        }
        h1, h2, h3, h4, h5, h6 {
          margin-top: 2pt !important;
          margin-bottom: 1pt !important;
        }
        * {
          page-break-inside: avoid !important;
          page-break-after: avoid !important;
          page-break-before: avoid !important;
        }
        a {
          color: #000;
          text-decoration: underline;
        }
      }
    `,
    onBeforeGetContent: () => {
      // Calculate scale to fit on one page
      const content = previewRef.current;
      if (!content) return Promise.resolve();
      
      const contentHeight = content.scrollHeight;
      const availableHeight = 10.4 * 96; // 11in - 0.6in margins = 10.4in at 96dpi
      
      let scale = 1;
      if (contentHeight > availableHeight) {
        scale = availableHeight / contentHeight;
        scale = scale * 0.98; // Small buffer
        scale = Math.max(0.5, Math.min(1.0, scale));
      }
      
      // Apply scale via CSS variable
      if (content) {
        content.style.setProperty('--print-scale', scale.toString());
      }
      
      return Promise.resolve();
    },
  });

  return (
    <div className="min-h-screen w-full">
      <div className={`no-print px-6 sm:px-12 lg:px-16 pt-8 sm:pt-10 lg:pt-12 pb-6 sm:pb-8 flex items-center justify-between ${resume ? 'pb-2' : ''}`}>
        <Logo />
        <div className="flex items-center gap-3">
          {resume && (
            <button
              onClick={handleUploadNew}
              className="flex items-center gap-2 px-4 py-2 bg-background/95 backdrop-blur-sm border border-border rounded-xl shadow-lg hover:bg-secondary hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              title="Upload new resume"
              aria-label="Upload new resume"
            >
              <Upload size={18} className="text-foreground" />
              <span className="text-sm font-medium text-foreground hidden sm:inline">Upload New</span>
            </button>
          )}
          <ThemeToggle />
        </div>
      </div>

      {!resume && (
        <div className="no-print max-w-4xl mx-auto px-6 sm:px-12 lg:px-16">
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
                  {isDragActive ? 'Drop your resume here' : 'Upload your resume'}
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                  {isDragActive ? 'Release to upload and start editing' : 'Drag & drop a file here, or click to browse'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="no-print max-w-4xl mx-auto px-6 sm:px-12 lg:px-16 mb-8">
          <div className="p-6 sm:p-8 bg-background border border-border rounded-xl text-foreground text-center shadow-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-8 h-8 border-[3px] border-foreground/20 border-t-foreground rounded-full animate-spin"></div>
              </div>
              <div>
                <p className="text-base font-semibold text-foreground mb-1">Processing your resume...</p>
                <p className="text-sm text-muted-foreground">Parsing and formatting content. This may take a few seconds.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="no-print max-w-4xl mx-auto px-6 sm:px-12 lg:px-16 mb-8">
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
              </div>
            </div>
          </div>
        </div>
      )}

      {resume && (
        <div className="w-full flex flex-col" style={{ height: 'calc(100vh - 5rem)' }}>
          {/* Resume Header */}
          <div className="no-print w-full px-6 sm:px-12 lg:px-16 mb-4 sm:mb-6">
            <div className="flex items-center justify-between gap-4 p-4 sm:p-5 bg-background/95 backdrop-blur-sm border border-border/80 rounded-xl shadow-sm">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={resumeName}
                  onChange={(e) => {
                    setResumeName(e.target.value);
                    setResume({ ...resume, name: e.target.value });
                  }}
                  placeholder="Resume Name"
                  className="w-full text-base sm:text-lg font-semibold text-foreground bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-muted-foreground/50"
                />
              </div>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-foreground/20 active:scale-95"
                title="Print or save as PDF"
                aria-label="Print resume"
              >
                <Printer size={18} />
                <span className="hidden sm:inline">Print / PDF</span>
              </button>
            </div>
          </div>

          {/* Editable Preview */}
          <div className="flex-1 min-h-0 px-6 sm:px-12 lg:px-16 pb-6">
            <EditablePreview 
              ref={previewRef}
              lines={resume.lines} 
              onUpdate={handleUpdate}
              editingId={editingId}
              editValue={editValue}
              onStartEdit={startEdit}
              onSave={saveEdit}
              onCancel={cancelEdit}
              onEditChange={setEditValue}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface EditablePreviewProps {
  lines: FormattedLine[];
  onUpdate: (lines: FormattedLine[]) => void;
  editingId: string | null;
  editValue: string;
  onStartEdit: (line: FormattedLine) => void;
  onSave: () => void;
  onCancel: () => void;
  onEditChange: (value: string) => void;
}

const EditablePreview = React.forwardRef<HTMLDivElement, EditablePreviewProps>(function EditablePreview({ 
  lines, 
  onUpdate, 
  editingId, 
  editValue, 
  onStartEdit, 
  onSave, 
  onCancel,
  onEditChange 
}, ref) {

  const handleContentClick = (e: React.MouseEvent, line: FormattedLine) => {
    if (editingId === line.id) return;
    e.stopPropagation();
    onStartEdit(line);
  };

  const handleKeyDown = (e: React.KeyboardEvent, line: FormattedLine) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSave();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = () => {
    // Small delay to allow save button clicks
    setTimeout(() => {
      if (editingId) {
        onSave();
      }
    }, 200);
  };

  const renderedContent = React.useMemo(() => {
    const filteredLines = lines.filter(l => l.type !== 'separator');
    const result: React.ReactNode[] = [];
    let i = 0;
    
    while (i < filteredLines.length) {
      const line = filteredLines[i];
      const nextLine = filteredLines[i + 1];
      
      const isTitle = line.type === 'content' && 
        (line.metadata?.section === 'projects' || line.metadata?.section === 'experience') &&
        nextLine && 
        nextLine.type === 'bullet';
      
      const isContactInfo = i > 0 && filteredLines[i - 1]?.type === 'header';
      
      const isSkillCategory = line.metadata?.section === 'skills' && line.metadata?.field === 'category';
      
      // Section heading
      if (line.type === 'section') {
        result.push(
          <div key={line.id} className="mb-0.5">
            {editingId === line.id ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => onEditChange(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, line)}
                onBlur={handleBlur}
                className="w-full text-xs font-bold uppercase border-b border-black pb-1 bg-transparent outline-none focus:ring-2 focus:ring-foreground/20 rounded px-1"
                autoFocus
              />
            ) : (
              <div 
                className="text-xs font-bold mt-3 mb-2 uppercase border-b border-black pb-1 cursor-text hover:bg-secondary/50 rounded px-1 transition-colors"
                onClick={(e) => handleContentClick(e, line)}
              >
                {line.content}
              </div>
            )}
          </div>
        );
        i++;
        continue;
      }
      
      // Education entry
      const isEducationEntry = line.metadata?.section === 'education' && 
                               line.metadata?.field === 'institution' &&
                               line.metadata?.educationIndex !== undefined;
      
      if (isEducationEntry && line.metadata) {
        const educationIndex = line.metadata.educationIndex;
        const educationFields: typeof filteredLines = [];
        let j = i;
        while (j < filteredLines.length) {
          const eduLine = filteredLines[j];
          if (eduLine.metadata?.section === 'education' && 
              eduLine.metadata?.educationIndex === educationIndex) {
            educationFields.push(eduLine);
            j++;
          } else if (eduLine.metadata?.section === 'education' && 
                    eduLine.metadata?.educationIndex !== educationIndex) {
            break;
          } else if (eduLine.metadata?.section !== 'education') {
            break;
          } else {
            j++;
          }
        }
        
        const institution = educationFields.find(f => f.metadata?.field === 'institution');
        const degree = educationFields.find(f => f.metadata?.field === 'degree');
        const gpa = educationFields.find(f => f.metadata?.field === 'gpa');
        const dates = educationFields.find(f => f.metadata?.field === 'dates');
        
        const educationParts: string[] = [];
        if (institution) educationParts.push(institution.content);
        if (degree) educationParts.push(degree.content);
        if (gpa) educationParts.push(gpa.content);
        
        result.push(
          <div key={line.id} className="mb-1 flex justify-between items-center text-xs">
            <div className="flex-1 flex items-center gap-1 flex-wrap">
              {institution && (
                editingId === institution.id ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => onEditChange(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, institution)}
                    onBlur={handleBlur}
                    className="bg-transparent outline-none focus:ring-2 focus:ring-foreground/20 rounded px-1"
                    autoFocus
                  />
                ) : (
                  <span 
                    className="cursor-text hover:bg-secondary/50 rounded px-1 transition-colors"
                    onClick={(e) => handleContentClick(e, institution)}
                  >
                    {institution.content}
                  </span>
                )
              )}
              {institution && (degree || gpa) && <span>|</span>}
              {degree && (
                editingId === degree.id ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => onEditChange(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, degree)}
                    onBlur={handleBlur}
                    className="bg-transparent outline-none focus:ring-2 focus:ring-foreground/20 rounded px-1"
                    autoFocus
                  />
                ) : (
                  <span 
                    className="cursor-text hover:bg-secondary/50 rounded px-1 transition-colors"
                    onClick={(e) => handleContentClick(e, degree)}
                  >
                    {degree.content}
                  </span>
                )
              )}
              {degree && gpa && <span>|</span>}
              {gpa && (
                editingId === gpa.id ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => onEditChange(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, gpa)}
                    onBlur={handleBlur}
                    className="bg-transparent outline-none focus:ring-2 focus:ring-foreground/20 rounded px-1"
                    autoFocus
                  />
                ) : (
                  <span 
                    className="cursor-text hover:bg-secondary/50 rounded px-1 transition-colors"
                    onClick={(e) => handleContentClick(e, gpa)}
                  >
                    {gpa.content}
                  </span>
                )
              )}
            </div>
            {dates && (
              <div className="text-right ml-4 flex-shrink-0">
                {editingId === dates.id ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => onEditChange(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, dates)}
                    onBlur={handleBlur}
                    className="w-32 bg-transparent outline-none focus:ring-2 focus:ring-foreground/20 rounded px-1 text-right"
                    autoFocus
                  />
                ) : (
                  <span 
                    className="cursor-text hover:bg-secondary/50 rounded px-1 transition-colors"
                    onClick={(e) => handleContentClick(e, dates)}
                  >
                    {dates.content}
                  </span>
                )}
              </div>
            )}
          </div>
        );
        
        i = j;
        continue;
      }
      
      // Experience entry
      const isExperienceEntry = line.metadata?.section === 'experience' && 
                               line.metadata?.field === 'company' &&
                               line.metadata?.experienceIndex !== undefined;
      
      if (isExperienceEntry && line.metadata) {
        const experienceIndex = line.metadata.experienceIndex;
        const experienceFields: typeof filteredLines = [];
        let j = i;
        while (j < filteredLines.length) {
          const expLine = filteredLines[j];
          if (expLine.metadata?.section === 'experience' && 
              expLine.metadata?.experienceIndex === experienceIndex) {
            experienceFields.push(expLine);
            j++;
          } else if (expLine.metadata?.section === 'experience' && 
                    expLine.metadata?.experienceIndex !== experienceIndex) {
            break;
          } else if (expLine.metadata?.section !== 'experience') {
            break;
          } else {
            j++;
          }
        }
        
        const company = experienceFields.find(f => f.metadata?.field === 'company');
        const role = experienceFields.find(f => f.metadata?.field === 'role');
        const dates = experienceFields.find(f => f.metadata?.field === 'dates');
        const bullets = experienceFields.filter(f => f.type === 'bullet');
        
        result.push(
          <div key={line.id}>
            <div className="mb-1 flex justify-between items-center text-xs">
              <div className="flex-1 font-bold flex items-center gap-1 flex-wrap">
                {company && (
                  editingId === company.id ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => onEditChange(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, company)}
                      onBlur={handleBlur}
                      className="bg-transparent outline-none focus:ring-2 focus:ring-foreground/20 rounded px-1 font-bold"
                      autoFocus
                    />
                  ) : (
                    <span 
                      className="cursor-text hover:bg-secondary/50 rounded px-1 transition-colors"
                      onClick={(e) => handleContentClick(e, company)}
                    >
                      {company.content}
                    </span>
                  )
                )}
                {company && role && <span>|</span>}
                {role && (
                  editingId === role.id ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => onEditChange(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, role)}
                      onBlur={handleBlur}
                      className="bg-transparent outline-none focus:ring-2 focus:ring-foreground/20 rounded px-1 font-bold"
                      autoFocus
                    />
                  ) : (
                    <span 
                      className="cursor-text hover:bg-secondary/50 rounded px-1 transition-colors"
                      onClick={(e) => handleContentClick(e, role)}
                    >
                      {role.content}
                    </span>
                  )
                )}
              </div>
              {dates && (
                <div className="text-right ml-4 flex-shrink-0">
                  {editingId === dates.id ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => onEditChange(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, dates)}
                      onBlur={handleBlur}
                      className="w-32 bg-transparent outline-none focus:ring-2 focus:ring-foreground/20 rounded px-1 text-right"
                      autoFocus
                    />
                  ) : (
                    <span 
                      className="cursor-text hover:bg-secondary/50 rounded px-1 transition-colors"
                      onClick={(e) => handleContentClick(e, dates)}
                    >
                      {dates.content}
                    </span>
                  )}
                </div>
              )}
            </div>
            {bullets.map((bulletLine) => (
              <div key={bulletLine.id} className="text-xs ml-5 mb-1 pl-2 relative">
                <span className="absolute left-0 text-black">•</span>
                {editingId === bulletLine.id ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => onEditChange(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, bulletLine)}
                    onBlur={handleBlur}
                    className="w-full bg-transparent outline-none focus:ring-2 focus:ring-foreground/20 rounded px-1"
                    autoFocus
                  />
                ) : (
                  <span 
                    className="cursor-text hover:bg-secondary/50 rounded px-1 transition-colors"
                    onClick={(e) => handleContentClick(e, bulletLine)}
                  >
                    {bulletLine.content}
                  </span>
                )}
              </div>
            ))}
          </div>
        );
        
        i = j;
        continue;
      }
      
      // Project entry
      const isProjectEntry = line.metadata?.section === 'projects' && 
                            line.metadata?.field === 'name' &&
                            line.metadata?.projectIndex !== undefined;
      
      if (isProjectEntry && line.metadata) {
        const projectIndex = line.metadata.projectIndex;
        const projectFields: typeof filteredLines = [];
        let j = i;
        while (j < filteredLines.length) {
          const projLine = filteredLines[j];
          if (projLine.metadata?.section === 'projects' && 
              projLine.metadata?.projectIndex === projectIndex) {
            projectFields.push(projLine);
            j++;
          } else if (projLine.metadata?.section === 'projects' && 
                    projLine.metadata?.projectIndex !== projectIndex) {
            break;
          } else if (projLine.metadata?.section !== 'projects') {
            break;
          } else {
            j++;
          }
        }
        
        const name = projectFields.find(f => f.metadata?.field === 'name');
        const techStack = projectFields.find(f => f.metadata?.field === 'techStack');
        const dates = projectFields.find(f => f.metadata?.field === 'dates');
        const bullets = projectFields.filter(f => f.type === 'bullet');
        
        const projectParts: string[] = [];
        if (name) projectParts.push(name.content);
        if (techStack) projectParts.push(techStack.content);
        
        result.push(
          <div key={line.id}>
            <div className="mb-1 flex justify-between items-center text-xs">
              <div className="flex-1 font-bold">
                {editingId === name?.id ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => onEditChange(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, name!)}
                    onBlur={handleBlur}
                    className="w-full bg-transparent outline-none focus:ring-2 focus:ring-foreground/20 rounded px-1 font-bold"
                    autoFocus
                  />
                ) : (
                  <span 
                    className="cursor-text hover:bg-secondary/50 rounded px-1 transition-colors"
                    onClick={(e) => name && handleContentClick(e, name)}
                  >
                    {projectParts.join(' | ')}
                  </span>
                )}
              </div>
              {dates && (
                <div className="text-right ml-4 flex-shrink-0">
                  {editingId === dates.id ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => onEditChange(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, dates)}
                      onBlur={handleBlur}
                      className="w-32 bg-transparent outline-none focus:ring-2 focus:ring-foreground/20 rounded px-1 text-right"
                      autoFocus
                    />
                  ) : (
                    <span 
                      className="cursor-text hover:bg-secondary/50 rounded px-1 transition-colors"
                      onClick={(e) => handleContentClick(e, dates)}
                    >
                      {dates.content}
                    </span>
                  )}
                </div>
              )}
            </div>
            {bullets.map((bulletLine) => (
              <div key={bulletLine.id} className="text-xs ml-5 mb-1 pl-2 relative">
                <span className="absolute left-0 text-black">•</span>
                {editingId === bulletLine.id ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => onEditChange(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, bulletLine)}
                    onBlur={handleBlur}
                    className="w-full bg-transparent outline-none focus:ring-2 focus:ring-foreground/20 rounded px-1"
                    autoFocus
                  />
                ) : (
                  <span 
                    className="cursor-text hover:bg-secondary/50 rounded px-1 transition-colors"
                    onClick={(e) => handleContentClick(e, bulletLine)}
                  >
                    {bulletLine.content}
                  </span>
                )}
              </div>
            ))}
          </div>
        );
        
        i = j;
        continue;
      }
      
      // Skill category
      if (isSkillCategory) {
        const categorySkills: typeof filteredLines = [];
        let j = i + 1;
        while (j < filteredLines.length) {
          const skillLine = filteredLines[j];
          if (skillLine.metadata?.section === 'skills' && skillLine.metadata?.field === 'skill') {
            categorySkills.push(skillLine);
            j++;
          } else if (skillLine.metadata?.section === 'skills' && skillLine.metadata?.field === 'category') {
            break;
          } else {
            break;
          }
        }
        
        result.push(
          <div key={line.id} className="mt-2 mb-2 text-xs">
            {editingId === line.id ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => onEditChange(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, line)}
                onBlur={handleBlur}
                className="w-full bg-transparent outline-none focus:ring-2 focus:ring-foreground/20 rounded px-1 font-bold"
                autoFocus
              />
            ) : (
              <span 
                className="font-bold cursor-text hover:bg-secondary/50 rounded px-1 transition-colors"
                onClick={(e) => handleContentClick(e, line)}
              >
                {line.content || 'Category'}:
              </span>
            )}
            {' '}
            {categorySkills.map((skillLine, skillIdx) => (
              <span key={skillLine.id} className="inline">
                {skillIdx > 0 && ', '}
                {editingId === skillLine.id ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => onEditChange(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, skillLine)}
                    onBlur={handleBlur}
                    className="inline bg-transparent outline-none focus:ring-2 focus:ring-foreground/20 rounded px-1 min-w-[60px]"
                    autoFocus
                  />
                ) : (
                  <span 
                    className="cursor-text hover:bg-secondary/50 rounded px-1 transition-colors"
                    onClick={(e) => handleContentClick(e, skillLine)}
                  >
                    {skillLine.content}
                  </span>
                )}
              </span>
            ))}
          </div>
        );
        
        i = j;
        continue;
      }
      
      // Regular content
      result.push(
        <div key={line.id} className="mb-0.5">
          {line.type === 'header' && (
            <div className="text-lg font-bold text-center mb-2">
              {editingId === line.id ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => onEditChange(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, line)}
                  onBlur={handleBlur}
                  className="w-full text-lg font-bold text-center bg-transparent outline-none focus:ring-2 focus:ring-foreground/20 rounded px-1"
                  autoFocus
                />
              ) : (
                <span 
                  className="cursor-text hover:bg-secondary/50 rounded px-1 transition-colors"
                  onClick={(e) => handleContentClick(e, line)}
                >
                  {line.content}
                </span>
              )}
            </div>
          )}
          {line.type === 'bullet' && (
            <div className="text-xs ml-5 mb-1 pl-2 relative">
              <span className="absolute left-0 text-black">•</span>
              {editingId === line.id ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => onEditChange(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, line)}
                  onBlur={handleBlur}
                  className="w-full bg-transparent outline-none focus:ring-2 focus:ring-foreground/20 rounded px-1"
                  autoFocus
                />
              ) : (
                <span 
                  className="cursor-text hover:bg-secondary/50 rounded px-1 transition-colors"
                  onClick={(e) => handleContentClick(e, line)}
                >
                  {line.content}
                </span>
              )}
            </div>
          )}
          {line.type === 'content' && (
            <div className={`text-xs my-1 break-words ${
              isTitle ? 'font-bold mb-1' : ''
            } ${
              isContactInfo ? 'flex items-center justify-center flex-wrap gap-2 text-center mb-2' : ''
            }`}>
              {editingId === line.id ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => onEditChange(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, line)}
                  onBlur={handleBlur}
                  className="w-full bg-transparent outline-none focus:ring-2 focus:ring-foreground/20 rounded px-1"
                  autoFocus
                />
              ) : (
                <span 
                  className="cursor-text hover:bg-secondary/50 rounded px-1 transition-colors"
                  onClick={(e) => handleContentClick(e, line)}
                >
                  {line.content}
                </span>
              )}
            </div>
          )}
        </div>
      );
      
      i++;
    }
    
    return result;
  }, [lines, editingId, editValue, onStartEdit, onSave, onCancel, onEditChange]);

  return (
    <div 
      ref={ref}
      className="flex-1 overflow-y-auto px-6 py-6 bg-background font-sans print-content max-w-4xl mx-auto border border-border rounded-xl shadow-sm"
      style={{
        fontSize: '11pt',
        lineHeight: '1.2',
      }}
    >
      {renderedContent}
    </div>
  );
});

