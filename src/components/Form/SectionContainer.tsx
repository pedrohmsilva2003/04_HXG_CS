
import React from 'react';
import { ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  icon: LucideIcon;
  isOpen: boolean;
  isCompleted?: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  hasError?: boolean;
}

const SectionContainer: React.FC<Props> = ({ 
  title, 
  icon: Icon, 
  isOpen, 
  isCompleted, 
  onToggle, 
  children,
  hasError 
}) => {
  return (
    <div className={`rounded-xl border transition-all duration-300 ${isOpen ? 'bg-white border-hex-sky ring-1 ring-hex-sky/20 shadow-md' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
      <button 
        type="button"
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors ${isOpen ? 'bg-hex-sky text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="text-left">
                <h3 className={`font-bold transition-colors ${isOpen ? 'text-hex-sky-dark' : 'text-slate-700'}`}>
                    {title}
                </h3>
                {!isOpen && isCompleted && !hasError && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Preenchido
                    </span>
                )}
                 {!isOpen && hasError && (
                    <span className="text-xs text-red-500 font-medium">
                        Campos obrigatórios pendentes
                    </span>
                )}
            </div>
        </div>
        <div className="text-slate-400">
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>
      
      {isOpen && (
        <div className="p-4 pt-0 animate-fade-in border-t border-slate-50/50 mt-2">
            {children}
        </div>
      )}
    </div>
  );
};

export default SectionContainer;
