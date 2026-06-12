
import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  MONTH_NAMES, 
  WEEK_DAYS, 
  getDaysInMonth, 
  getFirstDayOfMonth, 
  formatDateISO, 
  parseDateISO, 
  parseDisplayDate,
  isSameDay, 
  isAfter, 
  isBefore 
} from '../utils/dateUtils';

interface Props {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  rangeStartDate?: string; // Data de início para calcular o range visual
  placeholder?: string;
  className?: string;
  isEndDate?: boolean; // Indica se é o campo de data final para aplicar o highlight de range
  disabled?: boolean;
}

const CustomDatePicker: React.FC<Props> = ({ 
  label, 
  value, 
  onChange, 
  minDate, 
  rangeStartDate,
  placeholder = "Selecione a data",
  className,
  isEndDate = false,
  disabled
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date()); // Para navegação do calendário
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [inputValue, setInputValue] = useState(""); // Estado local para controle da digitação
  const [hasError, setHasError] = useState(false); // Estado para erro visual imediato
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = parseDateISO(value);
  const minDateObj = minDate ? parseDateISO(minDate) : null;
  const rangeStartObj = rangeStartDate ? parseDateISO(rangeStartDate) : null;

  // Sincroniza o input com a prop value (vinda do pai)
  useEffect(() => {
    if (selectedDate) {
      setInputValue(selectedDate.toLocaleDateString('pt-BR'));
      setHasError(false);
      // Atualiza o calendário visual para o mês da data selecionada
      if (!isOpen) { 
          setCurrentDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
      }
    } else {
      setInputValue("");
      setHasError(false);
    }
  }, [value]);

  // Se abrir o calendário e for range end, foca no start date para facilitar
  useEffect(() => {
      if (isOpen && !selectedDate && rangeStartObj && isEndDate) {
          setCurrentDate(new Date(rangeStartObj.getFullYear(), rangeStartObj.getMonth(), 1));
      }
  }, [isOpen]);


  // Fecha ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [containerRef]);

  // Manipula a digitação com máscara e validação
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let text = e.target.value;
      
      // Remove tudo que não é número
      text = text.replace(/\D/g, "");
      
      // Aplica a máscara DD/MM/AAAA
      if (text.length > 2) text = text.replace(/^(\d{2})(\d)/, "$1/$2");
      if (text.length > 5) text = text.replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");
      
      // Limita a 10 caracteres
      if (text.length > 10) text = text.substring(0, 10);

      setInputValue(text);

      // Lógica de Validação ao Digitar
      if (text.length === 10) {
          const parsed = parseDisplayDate(text);
          if (parsed) {
              // Verifica minDate se existir
              if (minDateObj && isBefore(parsed, minDateObj) && !isSameDay(parsed, minDateObj)) {
                  // Data válida matematicamente, mas inválida pela regra de negócio (passado)
                  setHasError(true);
                  // Opcional: onChange("") se quiser limpar o valor inválido imediatamente no pai
                  return;
              }
              
              setHasError(false);
              onChange(formatDateISO(parsed));
              setCurrentDate(parsed); // Pula o calendário para a data digitada
          } else {
              // Data inválida matematicamente (ex: 31/02)
              setHasError(true);
          }
      } else {
          // Enquanto digita (menos de 10 chars), remove erro e limpa o valor no pai se estava preenchido
          setHasError(false);
          if (text === "") {
              onChange("");
          }
      }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    // Validação de minDate
    if (minDateObj && isBefore(clickedDate, minDateObj) && !isSameDay(clickedDate, minDateObj)) {
      return;
    }

    setHasError(false);
    onChange(formatDateISO(clickedDate));
    setIsOpen(false);
  };

  const renderDays = () => {
    const daysInMonth = getDaysInMonth(currentDate.getMonth(), currentDate.getFullYear());
    const firstDay = getFirstDayOfMonth(currentDate.getMonth(), currentDate.getFullYear());
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isSelected = selectedDate && isSameDay(date, selectedDate);
      const isDisabled = minDateObj ? (isBefore(date, minDateObj) && !isSameDay(date, minDateObj)) : false;
      const isStart = rangeStartObj && isSameDay(date, rangeStartObj);
      
      let isInRange = false;
      let isRangeEnd = false;

      if (isEndDate && rangeStartObj) {
        if (selectedDate) {
           isInRange = isAfter(date, rangeStartObj) && isBefore(date, selectedDate);
           isRangeEnd = isSameDay(date, selectedDate);
        } else if (hoverDate) {
           isInRange = isAfter(date, rangeStartObj) && isBefore(date, hoverDate);
           isRangeEnd = isSameDay(date, hoverDate);
        }
      }

      let dayClass = "h-8 w-8 text-sm flex items-center justify-center rounded-full transition-all cursor-pointer relative z-10 ";
      
      if (isDisabled) {
        dayClass += "text-slate-300 cursor-not-allowed";
      } else if (isSelected || (isEndDate && isRangeEnd)) {
        dayClass += "bg-hex-sky-dark text-white font-bold shadow-md shadow-hex-sky/30 hover:bg-hex-sky";
      } else if (isStart && isEndDate) {
         dayClass += "bg-hex-sky text-white font-bold ring-2 ring-hex-sky-dark";
      } else if (isInRange) {
        dayClass += "bg-hex-sky/20 text-hex-sky-dark font-medium rounded-none";
        if (day === 1) dayClass += " rounded-l-full";
        if (day === daysInMonth) dayClass += " rounded-r-full";
      } else {
        dayClass += "text-slate-700 hover:bg-slate-100";
      }

      days.push(
        <div 
            key={day} 
            className="flex items-center justify-center p-0.5 relative"
            onMouseEnter={() => !isDisabled && setHoverDate(date)}
            onMouseLeave={() => setHoverDate(null)}
        >
            {isInRange && (
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-8 bg-hex-sky/20 z-0" />
            )}
            
            <button
                type="button" 
                onClick={() => !isDisabled && handleDayClick(day)}
                disabled={isDisabled}
                className={dayClass}
            >
                {day}
            </button>
        </div>
      );
    }

    return days;
  };

  // Determina classes dinâmicas para o input baseado no erro ou disable
  const inputFinalClass = `${className} cursor-text ${
      hasError 
        ? 'border-red-500 ring-1 ring-red-100 focus:border-red-500 focus:ring-red-200 text-red-600' 
        : ''
  }`;

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
      
      <div className="relative group">
        <input
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onClick={() => !disabled && setIsOpen(true)}
          inputMode="numeric"
          maxLength={10}
          className={inputFinalClass}
          disabled={disabled}
        />
        <CalendarIcon 
            className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                hasError ? 'text-red-400' : 'text-slate-400'
            } ${disabled ? 'opacity-50' : 'cursor-pointer hover:text-hex-sky'}`}
            onClick={() => !disabled && setIsOpen(!isOpen)}
        />
      </div>

      {/* Mensagem de erro flutuante opcional (se quiser muito destaque) */}
      {hasError && !disabled && inputValue.length === 10 && (
          <div className="absolute top-full right-0 mt-1 text-[10px] text-red-500 font-bold bg-white px-2 py-0.5 rounded shadow border border-red-100 animate-fade-in z-10">
              Data inválida
          </div>
      )}

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-2 p-4 bg-white rounded-xl shadow-xl border border-slate-100 w-72 animate-fade-in left-0 sm:left-auto sm:right-0 md:right-auto">
          <div className="flex items-center justify-between mb-4">
            <button 
                type="button"
                onClick={handlePrevMonth}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-500 hover:text-hex-sky"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="font-bold text-slate-700">
                {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
            </div>
            <button 
                type="button"
                onClick={handleNextMonth}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-500 hover:text-hex-sky"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {WEEK_DAYS.map((day, index) => (
              <div key={index} className="text-xs font-bold text-slate-400 text-center">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {renderDays()}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;
