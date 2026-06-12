
import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import type { ToastMessage } from '../../types';

interface Props {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const ToastContainer: React.FC<Props> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: () => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, 5000); // Auto close after 5s

    return () => clearTimeout(timer);
  }, [onRemove]);

  const styles = {
    success: 'bg-white border-l-4 border-green-500 text-slate-700 shadow-lg shadow-green-500/10',
    error: 'bg-white border-l-4 border-red-500 text-slate-700 shadow-lg shadow-red-500/10',
    info: 'bg-white border-l-4 border-hex-sky text-slate-700 shadow-lg shadow-hex-sky/10'
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-hex-sky" />
  };

  return (
    <div className={`${styles[toast.type]} p-4 rounded-r-lg flex items-start gap-3 transform transition-all animate-fade-in pointer-events-auto border border-slate-100`}>
      <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 text-sm font-medium">{toast.message}</div>
      <button 
        onClick={onRemove}
        className="text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ToastContainer;
