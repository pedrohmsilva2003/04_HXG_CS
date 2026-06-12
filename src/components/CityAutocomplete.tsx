
import React, { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { searchCities } from '../services/cityDatabase';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const CityAutocomplete: React.FC<Props> = ({ value, onChange, placeholder, className, disabled }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1); // Controle do item destacado
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fecha a lista se clicar fora
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    const results = searchCities(newValue);
    setSuggestions(results);
    setSelectedIndex(-1); // Reseta a seleção ao digitar
    setShowSuggestions(results.length > 0);
  };

  const handleSelect = (city: string) => {
    onChange(city);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelect(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          className={className}
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          onFocus={() => {
             if (disabled) return;
             const results = searchCities(value);
             if (results.length > 0) {
                 setSuggestions(results);
                 setShowSuggestions(true);
             }
          }}
        />
        {/* Ícone sutil indicando que é um local */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
             {showSuggestions ? <MapPin className="w-4 h-4 text-hex-sky animate-bounce" /> : <MapPin className="w-4 h-4" />}
        </div>
      </div>

      {showSuggestions && !disabled && (
        <ul className="absolute z-50 w-full bg-white border border-slate-200 mt-1 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-fade-in">
          {suggestions.map((city, index) => (
            <li
              key={city}
              className={`px-4 py-3 cursor-pointer text-sm border-b border-slate-50 last:border-none transition-colors ${
                index === selectedIndex 
                  ? 'bg-hex-sky/10 text-hex-sky-dark font-medium' 
                  : 'text-slate-700 hover:bg-hex-sky/5 hover:text-hex-sky-dark'
              }`}
              onMouseDown={(e) => {
                e.preventDefault(); // Evita perder o foco antes do click
                handleSelect(city);
              }}
              onMouseEnter={() => setSelectedIndex(index)} // Sincroniza mouse com teclado
            >
              {city}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CityAutocomplete;
