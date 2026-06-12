
import React from 'react';
import { AlertTriangle, ArrowRight, FileInput } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;     // Apenas fecha (Revisar)
  onLoad: () => void;      // Carrega a antiga
  onIgnore: () => void;    // Gera mesmo assim
  protocol: string;
}

const DuplicateWarningModal: React.FC<Props> = ({ isOpen, onClose, onLoad, onIgnore, protocol }) => {

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100 border border-white/20">
        
        {/* Header */}
        <div className="bg-amber-50 p-6 flex flex-col items-center justify-center text-center border-b border-amber-100">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <AlertTriangle className="w-8 h-8 text-amber-600" strokeWidth={2.5} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Solicitação Similar Encontrada</h3>
          <p className="text-sm text-slate-500 mt-1">
            Já existe uma solicitação com estes dados no histórico.
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <p className="text-slate-600 text-center text-sm leading-relaxed">
            Identificamos o protocolo abaixo com o mesmo <strong>Cliente, Motivo e Datas</strong>. 
            Você deseja abrir a solicitação existente para editá-la ou continuar gerando esta nova?
          </p>

          {/* Protocol Box */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 flex items-center justify-between gap-2">
             <span className="text-xs font-bold text-slate-500 uppercase ml-2">Protocolo Antigo:</span>
             <div className="flex items-center gap-2">
                <code className="bg-white border border-slate-200 py-1 px-2 rounded text-sm font-mono font-bold text-slate-700">
                    {protocol}
                </code>
             </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
            
            {/* Opção Principal: Carregar a Antiga */}
            <button
                onClick={onLoad}
                className="w-full bg-hex-sky-dark hover:bg-hex-sky text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-hex-sky/20 flex items-center justify-center gap-2"
            >
                <FileInput className="w-5 h-5" />
                Abrir Solicitação Existente
            </button>

            <div className="grid grid-cols-2 gap-3">
                {/* Opção Secundária: Cancelar/Revisar */}
                <button
                    onClick={onClose}
                    className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-2.5 px-4 rounded-xl transition-colors"
                >
                    Revisar Dados
                </button>

                {/* Opção Terciária: Ignorar e Gerar */}
                <button
                    onClick={onIgnore}
                    className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                    Gerar Nova <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DuplicateWarningModal;
