
import React, { useState, useEffect } from 'react';
import type { Passenger, TravelRequestData } from '../../types';
import type { ValidationError } from '../../utils/Validation';
import { Plus, Trash2, Save, Star } from 'lucide-react';
import { generateUUID } from '../../utils/uuid';

interface Props {
  data: TravelRequestData;
  onChange: (passengers: Passenger[]) => void;
  errors: ValidationError;
  disabled?: boolean;
}

interface SavedPassenger {
  id: string;
  name: string;
}

const PassengerSection: React.FC<Props> = ({ data, onChange, errors, disabled }) => {
  const [savedPassengers, setSavedPassengers] = useState<SavedPassenger[]>([]);
  const [showSavedList, setShowSavedList] = useState(false);

  // Carregar favoritos do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('favorite_passengers_v2'); // Versão nova sem CPF
    if (saved) {
      try {
        setSavedPassengers(JSON.parse(saved));
      } catch (e) { console.error(e); }
    }
  }, []);

  const savePassengerToFavorites = (passenger: Passenger) => {
    if (!passenger.name) {
        alert("Preencha o Nome para salvar.");
        return;
    }
    
    // Evitar duplicatas por Nome
    const exists = savedPassengers.find(p => p.name.toLowerCase() === passenger.name.toLowerCase());
    if (exists) {
        alert("Passageiro já está nos favoritos.");
        return;
    }

    const newFav = { id: generateUUID(), name: passenger.name };
    const newList = [...savedPassengers, newFav];
    setSavedPassengers(newList);
    localStorage.setItem('favorite_passengers_v2', JSON.stringify(newList));
  };

  const removeFavorite = (id: string) => {
      const newList = savedPassengers.filter(p => p.id !== id);
      setSavedPassengers(newList);
      localStorage.setItem('favorite_passengers_v2', JSON.stringify(newList));
  };

  const loadPassenger = (saved: SavedPassenger) => {
      // Adiciona como novo passageiro
      const newPassenger: Passenger = { id: generateUUID(), name: saved.name };
      
      // Se o único passageiro atual estiver vazio, substitui ele
      if (data.passengers.length === 1 && !data.passengers[0].name) {
          onChange([newPassenger]);
      } else {
          onChange([...data.passengers, newPassenger]);
      }
      setShowSavedList(false);
  };

  const handlePassengerChange = (id: string, field: keyof Passenger, value: string) => {
    const newPassengers = data.passengers.map((p) =>
      p.id === id ? { ...p, [field]: value } : p
    );
    onChange(newPassengers);
  };

  const addPassenger = () => {
    onChange([
      ...data.passengers,
      { id: generateUUID(), name: '' },
    ]);
  };

  const removePassenger = (id: string) => {
    if (data.passengers.length === 1) return;
    onChange(data.passengers.filter((p) => p.id !== id));
  };

  const inputClass = `w-full rounded-lg transition-colors p-2.5 border bg-white text-slate-700 placeholder:text-slate-400 focus:ring-1 focus:outline-none focus:border-hex-sky ${disabled ? 'bg-slate-100 cursor-not-allowed opacity-70' : ''}`;
  const getErrorClass = (key: string) => errors[key] ? 'border-red-500 focus:border-red-500 ring-red-100' : 'border-slate-200';

  return (
    <div className={`space-y-4 ${disabled ? 'pointer-events-none' : ''}`}>
        {/* Toolbar de Favoritos - Escondido se desabilitado */}
        {!disabled && (
        <div className="flex items-center justify-between mb-2">
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setShowSavedList(!showSavedList)}
                    className="text-xs font-bold text-hex-sky flex items-center gap-1 hover:underline"
                >
                    <Star className="w-3 h-3" fill="currentColor" /> Carregar Favorito
                </button>
                
                {showSavedList && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-20 overflow-hidden">
                        <div className="bg-slate-50 p-2 text-xs font-bold text-slate-500 border-b border-slate-100">
                            Passageiros Salvos
                        </div>
                        {savedPassengers.length === 0 ? (
                            <div className="p-4 text-xs text-slate-400 text-center">Nenhum salvo.</div>
                        ) : (
                            <ul className="max-h-48 overflow-y-auto">
                                {savedPassengers.map(fav => (
                                    <li key={fav.id} className="flex items-center justify-between p-2 hover:bg-sky-50 transition-colors group">
                                        <button 
                                            onClick={() => loadPassenger(fav)}
                                            className="text-left text-sm text-slate-700 flex-1 truncate"
                                        >
                                            {fav.name}
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); removeFavorite(fav.id); }}
                                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            <button
              type="button"
              onClick={addPassenger}
              className="text-sm text-hex-sky-dark hover:text-hex-sky font-bold flex items-center gap-1 uppercase tracking-wide"
            >
              <Plus className="w-4 h-4" /> Adicionar Novo
            </button>
        </div>
        )}

        {/* Lista de Inputs */}
        <div className="space-y-3">
            {data.passengers.map((passenger) => (
              <div key={passenger.id} className="flex gap-2 items-start group">
                <div className="flex-1 flex gap-2">
                    <div className="flex-1">
                         <input
                            type="text"
                            placeholder="Nome Completo do Passageiro"
                            className={`${inputClass} ${getErrorClass(`passenger_name_${passenger.id}`)}`}
                            value={passenger.name}
                            onChange={(e) => handlePassengerChange(passenger.id, 'name', e.target.value)}
                            disabled={disabled}
                        />
                    </div>
                    {!disabled && (
                    <button
                        type="button"
                        onClick={() => savePassengerToFavorites(passenger)}
                        className="p-2.5 text-slate-300 hover:text-yellow-500 border border-transparent hover:border-yellow-200 hover:bg-yellow-50 rounded-lg transition-colors"
                        title="Salvar nos favoritos"
                    >
                            <Save className="w-5 h-5" />
                    </button>
                    )}
                </div>
                {!disabled && data.passengers.length > 1 && (
                  <button
                    onClick={() => removePassenger(passenger.id)}
                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-[1px]"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
        </div>
    </div>
  );
};

export default PassengerSection;
