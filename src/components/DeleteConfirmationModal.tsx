
import React from 'react';
import { Trash2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmationModal: React.FC<Props> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 border border-white/20">
        
        {/* Header */}
        <div className="bg-red-50 p-6 flex flex-col items-center justify-center text-center border-b border-red-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <Trash2 className="w-8 h-8 text-red-600" strokeWidth={2.5} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Remover Solicitação?</h3>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-slate-600 text-center text-sm leading-relaxed">
            Tem certeza que deseja remover esta solicitação do histórico? <br/>
            <span className="font-semibold text-red-500">Esta ação não pode ser desfeita.</span>
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors shadow-lg shadow-red-200"
          >
            Sim, remover
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
