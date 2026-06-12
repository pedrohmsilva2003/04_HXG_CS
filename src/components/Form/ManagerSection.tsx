
import React from 'react';
import type { TravelRequestData } from '../../types';
import { MANAGERS_DATA } from '../../constants';
import type { ValidationError } from '../../utils/Validation';
import { User, UserCheck, ChevronDown } from 'lucide-react';

interface Props {
  data: TravelRequestData;
  onChange: (updates: Partial<TravelRequestData>) => void;
  errors: ValidationError;
  disabled?: boolean;
}

const ManagerSection: React.FC<Props> = ({ data, onChange, errors, disabled }) => {
  
  // Encontra o índice do gestor selecionado atualmente
  const currentManagerIndex = MANAGERS_DATA.findIndex(m => m.name === data.managerName);
  const selectValue = currentManagerIndex >= 0 ? currentManagerIndex : "";

  const handleManagerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIndex = parseInt(e.target.value, 10);
    
    // Validação de segurança
    if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < MANAGERS_DATA.length) {
        const managerData = MANAGERS_DATA[selectedIndex];
        
        onChange({
            managerName: managerData.name,
            managerEmail: managerData.email,
            approverName: managerData.approverName,
            approverEmail: managerData.approverEmail
        });
    }
  };

  const inputClass = `w-full rounded-lg transition-colors p-2.5 border bg-white text-slate-700 placeholder:text-slate-400 focus:ring-1 focus:outline-none focus:border-hex-sky ${disabled ? 'bg-slate-100 cursor-not-allowed opacity-70' : ''}`;
  const labelClass = "block text-sm font-medium text-slate-700 mb-1";
  const getErrorClass = (field: string) => errors[field] ? 'border-red-500 focus:border-red-500 ring-red-100' : 'border-slate-200';

  return (
    <div className={`space-y-6 ${disabled ? 'pointer-events-none' : ''}`}>
        {/* Gestor Imediato */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative group transition-colors hover:border-slate-200">
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <User className="w-4 h-4" /> Gestor Responsável <span className="text-red-500">*</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>Nome Completo</label>
                    <div className="relative">
                        <select 
                            className={`${inputClass} ${getErrorClass('managerName')} appearance-none pr-10`}
                            onChange={handleManagerSelect}
                            value={selectValue}
                            disabled={disabled}
                        >
                            <option value="" disabled>Selecionar Gestor...</option>
                            {MANAGERS_DATA.map((m, idx) => (
                                <option key={idx} value={idx}>{m.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    {errors.managerName && <p className="text-xs text-red-500 mt-1">{errors.managerName}</p>}
                </div>
                <div>
                    <label className={labelClass}>E-mail Corporativo</label>
                    <input
                    type="email"
                    className={`${inputClass} bg-slate-100 cursor-not-allowed border-slate-200`}
                    value={data.managerEmail}
                    readOnly
                        placeholder="email@hexagon.com"
                    />
                </div>
            </div>
        </div>

        {/* Responsável Aprovação */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative group transition-colors hover:border-slate-200">
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <UserCheck className="w-4 h-4" /> Responsável pela Aprovação
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>Nome Completo</label>
                    <input
                    type="text"
                    className={`${inputClass} bg-slate-100 cursor-not-allowed border-slate-200`}
                    value={data.approverName}
                    readOnly
                    placeholder="Nome de quem aprova"
                    />
                </div>
                <div>
                    <label className={labelClass}>E-mail Corporativo</label>
                    <input
                    type="email"
                    className={`${inputClass} bg-slate-100 cursor-not-allowed border-slate-200`}
                    value={data.approverEmail}
                    readOnly
                    placeholder="email@hexagon.com"
                    />
                </div>
            </div>
            <div className="mt-2 text-[10px] text-slate-400 text-right italic">
                *Preenchido automaticamente com base no Gestor selecionado
            </div>
        </div>
    </div>
  );
};

export default ManagerSection;
