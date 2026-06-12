
import React from 'react';
import { CheckCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ApproveModal: React.FC<Props> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 border border-white/20">
        <div className="bg-green-50 p-6 flex flex-col items-center justify-center text-center border-b border-green-100">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <CheckCircle className="w-8 h-8 text-green-600" strokeWidth={2.5} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Aprovar e Emitir?</h3>
        </div>
        <div className="p-6">
          <p className="text-slate-600 text-center text-sm leading-relaxed">
            Deseja marcar esta solicitação como <strong>Concluída/Emitida</strong>?
            <br/><br/>
            Isso irá alterar o status para "Aprovado" e bloqueará novas edições neste protocolo.
          </p>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-3">
          <button 
            onClick={onClose} 
            className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm} 
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors shadow-lg shadow-green-200"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApproveModal;
