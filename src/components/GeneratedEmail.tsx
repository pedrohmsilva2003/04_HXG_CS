
import React, { useState } from 'react';
import type { GeneratedEmailResponse } from '../types';
import { Copy, Check, Sparkles, Eye, Info } from 'lucide-react';
import LoadingSkeleton from './LoadingSkeleton';

interface Props {
  data: GeneratedEmailResponse;
  onReset?: () => void;
  isPreview?: boolean;
  isLoading?: boolean;
}

const GeneratedEmail: React.FC<Props> = ({ data, onReset, isPreview = false, isLoading = false }) => {
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  if (isLoading) {
      return <LoadingSkeleton />;
  }

  const copyToClipboard = (text: string, isSubject: boolean) => {
    navigator.clipboard.writeText(text);
    if (isSubject) {
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 2000);
    } else {
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2000);
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-xl border flex flex-col min-h-full transition-colors duration-300 ${isPreview ? 'border-slate-200 shadow-slate-200/50' : 'border-hex-sky shadow-hex-sky/20'}`}>
      
      {/* Header */}
      <div className={`p-4 flex items-center justify-between border-b rounded-t-2xl ${isPreview ? 'bg-slate-50 border-slate-200' : 'bg-hex-sky-dark border-hex-sky-dark text-white'}`}>
        <h2 className={`font-bold flex items-center gap-2 ${isPreview ? 'text-slate-600' : 'text-white'}`}>
          {isPreview ? (
            <><Eye className="w-5 h-5 text-slate-400" /> Visualização</>
          ) : (
            <><Sparkles className="w-5 h-5 text-hex-sea" /> E-mail Gerado</>
          )}
        </h2>
        
        {!isPreview && onReset && (
            <button 
                onClick={onReset}
                className="text-sm text-hex-sea hover:text-white underline"
            >
                Voltar e Editar
            </button>
        )}
        
        {isPreview && (
            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-600 rounded uppercase tracking-wider">Rascunho</span>
        )}
      </div>

      {/* Preview Info Banner */}
      {isPreview && (
        <div className="bg-hex-sea/10 border-b border-hex-sea/20 p-3 flex items-start gap-2 text-xs text-hex-sea-dark leading-snug">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-hex-sea-dark" />
            <p>
                Este é um rascunho em tempo real. Edite o formulário à esquerda e clique no botão <strong>"Abrir no Outlook"</strong> quando estiver pronto.
            </p>
        </div>
      )}

      {/* Content Container - No internal scroll, allows page scroll */}
      <div className="p-6 flex-1 flex flex-col space-y-6">
        
        {/* Subject */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assunto</span>
            <button
              onClick={() => copyToClipboard(data.subject, true)}
              className="text-hex-sky hover:text-hex-sky-dark text-xs font-medium flex items-center gap-1 transition-colors"
            >
              {copiedSubject ? <Check className="w-3 h-3 text-hex-land" /> : <Copy className="w-3 h-3" />}
              {copiedSubject ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
          <div className={`p-3 rounded-lg border font-medium select-all ${isPreview ? 'bg-slate-50/50 border-slate-100 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
            {data.subject}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Corpo do E-mail</span>
            <button
              onClick={() => copyToClipboard(data.body, false)}
              className="text-hex-sky hover:text-hex-sky-dark text-xs font-medium flex items-center gap-1 transition-colors"
            >
               {copiedBody ? <Check className="w-3 h-3 text-hex-land" /> : <Copy className="w-3 h-3" />}
               {copiedBody ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
          <div
            className={`w-full flex-1 p-4 rounded-lg border font-mono text-sm leading-relaxed whitespace-pre-wrap ${isPreview ? 'bg-slate-50/50 border-slate-100 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
          >
            {data.body}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratedEmail;
