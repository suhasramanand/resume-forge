'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle2 size={18} className="text-green-600" />,
    error: <XCircle size={18} className="text-red-600" />,
    info: <Info size={18} className="text-blue-600" />,
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${bgColors[type]} animate-in slide-in-from-bottom-5`}>
      {icons[type]}
      <span className="text-sm font-medium text-foreground">{message}</span>
      <button
        className="ml-2 p-1 hover:bg-white/50 rounded transition-colors"
        onClick={onClose}
        aria-label="Close"
      >
        <X size={14} />
      </button>
    </div>
  );
}

