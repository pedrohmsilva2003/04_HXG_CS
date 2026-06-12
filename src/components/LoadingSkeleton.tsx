
import React from 'react';
import { Sparkles } from 'lucide-react';

const LoadingSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-hex-sky/30 h-full flex flex-col overflow-hidden relative">
        {/* Header Loading */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
            <div className="w-5 h-5 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-5 w-32 bg-slate-200 rounded animate-pulse"></div>
        </div>

        {/* Body Loading */}
        <div className="p-6 space-y-6 flex-1 relative">
            
            {/* Subject Skeleton */}
            <div className="space-y-2">
                <div className="h-3 w-16 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-10 w-full bg-slate-100 rounded animate-pulse border border-slate-50"></div>
            </div>

            {/* Body Text Skeleton */}
            <div className="space-y-3">
                <div className="h-3 w-24 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-4 w-40 bg-slate-100 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-slate-100 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-slate-100 rounded animate-pulse"></div>
                <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse"></div>
                
                <div className="pt-4 space-y-2">
                     <div className="h-4 w-full bg-slate-100 rounded animate-pulse"></div>
                     <div className="h-4 w-full bg-slate-100 rounded animate-pulse"></div>
                     <div className="h-4 w-5/6 bg-slate-100 rounded animate-pulse"></div>
                </div>
            </div>

            {/* Overlay with AI text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[1px] z-10">
                <div className="bg-white p-4 rounded-full shadow-lg border border-hex-sky/20 flex items-center justify-center mb-4 animate-bounce">
                    <Sparkles className="w-8 h-8 text-hex-sky" />
                </div>
                <h3 className="text-hex-sky-dark font-bold text-lg animate-pulse">Gerando E-mail com IA...</h3>
                <p className="text-slate-500 text-sm">Criando texto padronizado</p>
            </div>
        </div>
    </div>
  );
};

export default LoadingSkeleton;
