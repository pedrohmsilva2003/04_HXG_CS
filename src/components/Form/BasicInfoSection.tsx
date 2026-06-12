
import React, { useState, useEffect } from 'react';
import type { TravelRequestData } from '../../types';
import { REASON_OPTIONS, COST_CENTER_OPTIONS, PRODUCT_OPTIONS } from '../../constants';
import type { ValidationError } from '../../utils/Validation';
import { ChevronDown, Globe, Map } from 'lucide-react';
import Autocomplete from '../Autocomplete';
import CityAutocomplete from '../CityAutocomplete';
import CustomDatePicker from '../CustomDatePicker';

interface Props {
  data: TravelRequestData;
  onChange: (field: keyof TravelRequestData, value: any) => void;
  errors: ValidationError;
  disabled?: boolean;
  isManager?: boolean;
}

const BasicInfoSection: React.FC<Props> = ({ data, onChange, errors, disabled, isManager }) => {
  const [isOtherReason, setIsOtherReason] = useState(false);
  const [durationDays, setDurationDays] = useState<number | null>(null);

  // Sincroniza o estado visual "Outro" com o dado real
  useEffect(() => {
    if (data.reason && !REASON_OPTIONS.includes(data.reason)) {
      setIsOtherReason(true);
    } else if (REASON_OPTIONS.includes(data.reason)) {
      setIsOtherReason(false);
    }
  }, [data.reason]);

  // Cálculo de dias
  useEffect(() => {
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      setDurationDays(diffDays);
    } else {
      setDurationDays(null);
    }
  }, [data.startDate, data.endDate]);

  const handleReasonSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'Outro') {
      setIsOtherReason(true);
      onChange('reason', '');
    } else {
      setIsOtherReason(false);
      onChange('reason', value);
    }
  };

  const getErrorClass = (field: string) => errors[field] ? 'border-red-500 focus:border-red-500 ring-red-100' : 'border-slate-200 focus:border-hex-sky';
  const inputClass = `w-full rounded-lg transition-colors p-2.5 border bg-white text-slate-700 placeholder:text-slate-400 focus:ring-1 focus:outline-none ${disabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : ''}`;
  const labelClass = "block text-sm font-medium text-slate-700 mb-1";

  // Campo de email é travado se não for gerente
  const isEmailLocked = !isManager; 
  const emailInputClass = isEmailLocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : '';

  return (
    <div className={`space-y-4 ${disabled ? 'pointer-events-none opacity-80' : ''}`}>
        
        {/* Switch Nacional / Internacional */}
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100 mb-2">
            <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                {data.isInternational ? <Globe className="w-4 h-4 text-hex-sky" /> : <Map className="w-4 h-4 text-hex-land" />}
                {data.isInternational ? 'Viagem Internacional' : 'Viagem Nacional'}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
                <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={!!data.isInternational}
                    onChange={(e) => onChange('isInternational', e.target.checked)}
                    disabled={disabled}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-hex-sky"></div>
            </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Motivo */}
            <div className="md:col-span-2">
                <label className={labelClass}>Motivo da Viagem <span className="text-red-500">*</span></label>
                <div className="space-y-2">
                <div className="relative">
                    <select
                        className={`${inputClass} ${getErrorClass('reason')} appearance-none pr-10`}
                        value={isOtherReason ? 'Outro' : data.reason}
                        onChange={handleReasonSelectChange}
                        disabled={disabled}
                    >
                        <option value="" disabled>Selecione um motivo...</option>
                        {REASON_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                        ))}
                        <option value="Outro">Outro</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                
                {isOtherReason && (
                    <input
                    type="text"
                    className={`${inputClass} ${getErrorClass('reason')} animate-fade-in`}
                    placeholder="Digite o motivo específico..."
                    value={data.reason}
                    onChange={(e) => onChange('reason', e.target.value)}
                    autoFocus={!disabled}
                    disabled={disabled}
                    />
                )}
                {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason}</p>}
                </div>
            </div>

            {/* Cliente / Projeto */}
            <div className="md:col-span-2">
                <label className={labelClass}>Cliente / Projeto <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    className={`${inputClass} ${getErrorClass('client')}`}
                    placeholder="Ex: Layher do Brasil"
                    value={data.client}
                    onChange={(e) => onChange('client', e.target.value)}
                    disabled={disabled}
                />
                {errors.client && <p className="text-xs text-red-500 mt-1">{errors.client}</p>}
            </div>

            {/* Produto e Área */}
            <div>
                <label className={labelClass}>Produto <span className="text-red-500">*</span></label>
                <Autocomplete
                    options={PRODUCT_OPTIONS}
                    className={`${inputClass} ${getErrorClass('product')}`}
                    placeholder="Selecione ou digite..."
                    value={data.product}
                    onChange={(val) => onChange('product', val)}
                    disabled={disabled}
                />
                {errors.product && <p className="text-xs text-red-500 mt-1">{errors.product}</p>}
            </div>
            <div>
                <label className={labelClass}>Área / Centro de Custo <span className="text-red-500">*</span></label>
                <Autocomplete
                    options={COST_CENTER_OPTIONS}
                    className={`${inputClass} ${getErrorClass('area')}`}
                    placeholder="Selecione ou digite..."
                    value={data.area}
                    onChange={(val) => onChange('area', val)}
                    disabled={disabled}
                />
                {errors.area && <p className="text-xs text-red-500 mt-1">{errors.area}</p>}
            </div>

            {/* E-mail do Solicitante */}
            <div className="md:col-span-2">
                <label className={labelClass}>E-mail do Solicitante / Viajante <span className="text-red-500">*</span></label>
                <input
                type="email"
                className={`w-full rounded-lg transition-colors p-2.5 border text-slate-700 placeholder:text-slate-400 focus:ring-1 focus:outline-none ${getErrorClass('requesterEmail')} ${emailInputClass}`}
                placeholder="seu.email@leica-geosystems.com"
                value={data.requesterEmail}
                onChange={(e) => onChange('requesterEmail', e.target.value)}
                disabled={disabled}
                readOnly={isEmailLocked}
                title={isEmailLocked ? "Preenchido automaticamente com seu login (Acesso Restrito)" : ""}
                />
                {errors.requesterEmail && <p className="text-xs text-red-500 mt-1">{errors.requesterEmail}</p>}
            </div>

            {/* Datas */}
            <div>
                <label className={labelClass}>Data de Início <span className="text-red-500">*</span></label>
                <CustomDatePicker
                    value={data.startDate || ''}
                    onChange={(val) => onChange('startDate', val)}
                    placeholder="Selecione a data"
                    className={`${inputClass} ${getErrorClass('startDate')}`}
                    disabled={disabled}
                />
                {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
            </div>
            <div>
                <label className={labelClass}>Data de Fim <span className="text-red-500">*</span></label>
                <CustomDatePicker
                    value={data.endDate || ''}
                    onChange={(val) => onChange('endDate', val)}
                    minDate={data.startDate} 
                    rangeStartDate={data.startDate}
                    isEndDate={true}
                    placeholder="Selecione a data"
                    className={`${inputClass} ${getErrorClass('endDate')}`}
                    disabled={disabled}
                />
                {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
                {durationDays !== null && durationDays >= 0 && !errors.endDate && (
                    <div className="mt-1 text-xs text-hex-sky font-medium flex items-center gap-1 animate-fade-in">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-hex-sky"></span>
                        {durationDays === 0 ? '1 dia (Bate e volta)' : `${durationDays} noites / ${durationDays + 1} dias`}
                    </div>
                )}
            </div>

            {/* Origem / Destino */}
            <div>
                <label className={labelClass}>Origem (Geral) <span className="text-red-500">*</span></label>
                <CityAutocomplete
                    className={`${inputClass} ${getErrorClass('origin')}`}
                    placeholder="Cidade/Estado"
                    value={data.origin}
                    onChange={(val) => onChange('origin', val)}
                    disabled={disabled}
                />
                {errors.origin && <p className="text-xs text-red-500 mt-1">{errors.origin}</p>}
            </div>
            <div>
                <label className={labelClass}>Destino (Geral) <span className="text-red-500">*</span></label>
                <CityAutocomplete
                    className={`${inputClass} ${getErrorClass('destination')}`}
                    placeholder="Cidade/Estado"
                    value={data.destination}
                    onChange={(val) => onChange('destination', val)}
                    disabled={disabled}
                />
                {errors.destination && <p className="text-xs text-red-500 mt-1">{errors.destination}</p>}
            </div>
        </div>
    </div>
  );
};

export default BasicInfoSection;
