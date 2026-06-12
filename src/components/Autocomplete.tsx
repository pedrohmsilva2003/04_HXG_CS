
import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

interface Props {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const Autocomplete: React.FC<Props> = ({ options, value, onChange, placeholder, className, disabled }) => {
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedIndex(-1);
    
    if (newValue.length > 0) {
      const results = options.filter(opt => 
        opt.toLowerCase().includes(newValue.toLowerCase())
      );
      setFilteredOptions(results);
      setShowOptions(true);
    } else {
      setFilteredOptions(options);
      setShowOptions(true);
    }
  };

  const handleSelect = (option: string) => {
    onChange(option);
    setShowOptions(false);
    setSelectedIndex(-1);
  };

  const handleFocus = () => {
    if (disabled) return;
    if (value) {
        const results = options.filter(opt => 
            opt.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredOptions(results);
    } else {
        setFilteredOptions(options);
    }
    setShowOptions(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showOptions || filteredOptions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowOptions(false);
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
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
             <Search className="w-4 h-4" />
        </div>
      </div>

      {showOptions && filteredOptions.length > 0 && !disabled && (
        <ul className="absolute z-50 w-full bg-white border border-slate-200 mt-1 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-fade-in">
          {filteredOptions.map((option, index) => (
            <li
              key={option}
              className={`px-4 py-2 cursor-pointer text-sm border-b border-slate-50 last:border-none transition-colors ${
                index === selectedIndex
                  ? 'bg-hex-sky/10 text-hex-sky-dark font-medium'
                  : 'text-slate-700 hover:bg-hex-sky/5 hover:text-hex-sky-dark'
              }`}
              onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(option);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Autocomplete;
