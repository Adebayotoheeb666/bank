import React from 'react';
import { X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

const toastStyles = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-blue-500 text-white',
  warning: 'bg-yellow-500 text-white',
};

const toastIcons = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  React.useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        onClose(toast.id);
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, toast.id, onClose]);

  return (
    <div
      className={`${toastStyles[toast.type]} rounded-lg shadow-lg px-4 py-3 flex items-center justify-between gap-3 min-w-[300px] animate-in slide-in-from-top-4 duration-300`}
      role="alert"
    >
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold">{toastIcons[toast.type]}</span>
        <span className="text-sm font-medium">{toast.message}</span>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="hover:opacity-70 transition-opacity"
        aria-label="Close"
      >
        <X size={16} />
      </button>
    </div>
  );
};
