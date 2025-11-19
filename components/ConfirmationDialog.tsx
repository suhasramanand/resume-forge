'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div 
        className="bg-background rounded-lg shadow-2xl max-w-md w-full border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors"
              onClick={onCancel}
            >
              {cancelText}
            </button>
            <button
              className="px-4 py-2 text-sm font-medium text-background bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

