
import React from 'react';
import type { TravelRequestData } from '../../types';
import { SERVICES_OPTIONS, CAR_LOCATION_OPTIONS, CAR_TIME_OPTIONS } from '../../constants';
import type { ValidationError } from '../../utils/Validation';
import { Plane, Hotel, Car, Bus, RefreshCw } from 'lucide-react';
import CityAutocomplete from '../CityAutocomplete';
import CustomDatePicker from '../CustomDatePicker';
import Autocomplete from '../Autocomplete';

interface Props {
  data: TravelRequestData;
  onChange: (data: TravelRequestData) => void;
  errors: ValidationError;
  disabled?: boolean;
}

const ServicesSection: React.FC<Props> = ({ data, onChange, errors, disabled }) => {
  
  const handleChange = (field: keyof TravelRequestData, value: any) => {
      onChange({ ...data, [field]: value });
  };

  const toggleService = (service: string) => {
    if (disabled) return;
    const current = data.services;
    let newServices = [];
    if (current.includes(service)) {
        newServices = current.filter((s) => s !== service);
    } else {
        newServices = [...current, service];
    }
    onChange({ ...data, services: newServices });
  };

  // Sincroniza dados do carro com o voo
  const syncCarWithFlight = () => {
      if (disabled) return;
      let updates: Partial<TravelRequestData> = {};
      if (data.departureDate) updates.carPickupDate = data.departureDate;
      if (data.returnDate) updates.carReturnDate = data.returnDate;
      updates.carPickupTime = "Acompanhar horário do voo";
      updates.carReturnTime = "2h antes do voo";
      if (data.flightDestination || data.destination) {
          const dest = data.flightDestination || data.destination;
          updates.carPickupLocation = `Aeroporto de ${dest}`;
      }
      onChange({ ...data, ...updates });
  };

  const inputClass = `w-full rounded-lg transition-colors p-2.5 border bg-white text-slate-700 placeholder:text-slate-400 focus:ring-1 focus:outline-none focus:border-hex-sky ${disabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : ''}`;
  const labelClass = "block text-sm font-medium text-slate-700 mb-1";
  const getErrorClass = (field: string) => errors[field] ? 'border-red-500 focus:border-red-500 ring-red-100' : 'border-slate-200';

  return (
    <div className={`space-y-6 ${disabled ? 'pointer-events-none opacity-90' : ''}`}>
        {/* Seletor de Serviços */}
        <div className="flex flex-wrap gap-3">
            {SERVICES_OPTIONS.map((service) => (
              <button
                key={service}
                type="button"
                onClick={() => toggleService(service)}
                disabled={disabled}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
                  data.services.includes(service)
                    ? 'bg-hex-sky text-white border-hex-sky shadow-md shadow-hex-sky/30'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-hex-sky hover:text-hex-sky'
                } ${disabled ? 'opacity-70 cursor-not-allowed hover:border-slate-200 hover:text-slate-600' : ''}`}
              >
                {service}
              </button>
            ))}
        </div>

        {/* Flights */}
        {data.services.includes('Transporte Aéreo') && (
          <section className="bg-sky-50/50 p-5 rounded-xl border border-sky-100 animate-fade-in">
              <h3 className="text-lg font-bold text-hex-sky-dark flex items-center gap-2 mb-4">
                <Plane className="w-5 h-5 text-hex-sky" /> Passagens Aéreas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={labelClass}>Origem <span className="text-red-500">*</span></label>
                  <CityAutocomplete
                    className={`${inputClass} ${getErrorClass('flightOrigin')}`}
                    value={data.flightOrigin}
                    onChange={(val) => handleChange('flightOrigin', val)}
                    disabled={disabled}
                  />
                </div>
                <div>
                  <label className={labelClass}>Destino <span className="text-red-500">*</span></label>
                  <CityAutocomplete
                    className={`${inputClass} ${getErrorClass('flightDestination')}`}
                    value={data.flightDestination}
                    onChange={(val) => handleChange('flightDestination', val)}
                    disabled={disabled}
                  />
                </div>
                <div>
                  <label className={labelClass}>Data Saída <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <div className="flex-[2]">
                        <CustomDatePicker
                            value={data.departureDate}
                            onChange={(val) => handleChange('departureDate', val)}
                            placeholder="Data da Ida"
                            className={`${inputClass} ${getErrorClass('departureDate')}`}
                            disabled={disabled}
                        />
                    </div>
                    <div className="flex-1 min-w-[100px]">
                        <select 
                            className={`${inputClass} border-slate-200`}
                            value={data.departureShift || ''}
                            onChange={(e) => handleChange('departureShift', e.target.value)}
                            disabled={disabled}
                        >
                            <option value="">Turno...</option>
                            <option value="Manhã">Manhã</option>
                            <option value="Tarde">Tarde</option>
                            <option value="Noite">Noite</option>
                            <option value="Madrugada">Madrugada</option>
                        </select>
                    </div>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Data Retorno <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <div className="flex-[2]">
                        <CustomDatePicker
                            value={data.returnDate}
                            onChange={(val) => handleChange('returnDate', val)}
                            placeholder="Data da Volta"
                            className={`${inputClass} ${getErrorClass('returnDate')}`}
                            minDate={data.departureDate}
                            rangeStartDate={data.departureDate} 
                            isEndDate={true} 
                            disabled={disabled}
                        />
                    </div>
                    <div className="flex-1 min-w-[100px]">
                         <select 
                            className={`${inputClass} border-slate-200`}
                            value={data.returnShift || ''}
                            onChange={(e) => handleChange('returnShift', e.target.value)}
                            disabled={disabled}
                        >
                            <option value="">Turno...</option>
                            <option value="Manhã">Manhã</option>
                            <option value="Tarde">Tarde</option>
                            <option value="Noite">Noite</option>
                            <option value="Madrugada">Madrugada</option>
                        </select>
                    </div>
                  </div>
                </div>
              </div>
               <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    id="baggage"
                    className="w-4 h-4 text-hex-sky rounded border-gray-300 focus:ring-hex-sky"
                    checked={data.hasBaggage}
                    onChange={(e) => handleChange('hasBaggage', e.target.checked)}
                    disabled={disabled}
                  />
                  <label htmlFor="baggage" className="text-sm text-slate-700">Incluir bagagem despachada?</label>
              </div>
          </section>
        )}

        {/* Hotel */}
        {data.services.includes('Hospedagem') && (
            <section className="bg-green-50/50 p-5 rounded-xl border border-green-100 animate-fade-in">
              <h3 className="text-lg font-bold text-hex-land-dark flex items-center gap-2 mb-4">
                <Hotel className="w-5 h-5 text-hex-land" /> Hospedagem
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className={labelClass}>Cidade <span className="text-red-500">*</span></label>
                  <CityAutocomplete
                    className={`${inputClass} ${getErrorClass('hotelCity')}`}
                    value={data.hotelCity}
                    onChange={(val) => handleChange('hotelCity', val)}
                    disabled={disabled}
                  />
                </div>
                <div>
                  <label className={labelClass}>Check-in <span className="text-red-500">*</span></label>
                  <CustomDatePicker
                        value={data.checkIn}
                        onChange={(val) => handleChange('checkIn', val)}
                        placeholder="Data de Entrada"
                        className={`${inputClass} ${getErrorClass('checkIn')}`}
                        disabled={disabled}
                  />
                </div>
                <div>
                  <label className={labelClass}>Check-out <span className="text-red-500">*</span></label>
                  <CustomDatePicker
                        value={data.checkOut}
                        onChange={(val) => handleChange('checkOut', val)}
                        placeholder="Data de Saída"
                        className={`${inputClass} ${getErrorClass('checkOut')}`}
                        minDate={data.checkIn} 
                        rangeStartDate={data.checkIn}
                        isEndDate={true}
                        disabled={disabled}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Preferências de Localização/Hotel</label>
                  <input
                    type="text"
                    className={`${inputClass} border-slate-200`}
                    placeholder="Ex: Próximo ao escritório na Rua X..."
                    value={data.hotelPreferences}
                    onChange={(e) => handleChange('hotelPreferences', e.target.value)}
                    disabled={disabled}
                  />
                </div>
              </div>
            </section>
        )}

         {/* Locação de Veículo */}
         {data.services.includes('Locação de Veículo') && (
            <section className="bg-slate-100/70 p-5 rounded-xl border border-slate-200 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                    <Car className="w-5 h-5 text-slate-500" /> Locação de Veículo
                  </h3>
                  {!disabled && (
                  <button 
                    type="button"
                    onClick={syncCarWithFlight}
                    className="text-xs bg-white border border-slate-300 hover:border-hex-sky hover:text-hex-sky text-slate-600 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                    title="Preencher com dados do voo"
                  >
                    <RefreshCw className="w-3 h-3" /> Sincronizar com Voo
                  </button>
                  )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className={labelClass}>Local de Retirada <span className="text-red-500">*</span></label>
                   <Autocomplete
                    options={CAR_LOCATION_OPTIONS}
                    className={`${inputClass} ${getErrorClass('carPickupLocation')}`}
                    placeholder="Ex: Aeroporto, Rodoviária, ou endereço..."
                    value={data.carPickupLocation}
                    onChange={(val) => handleChange('carPickupLocation', val)}
                    disabled={disabled}
                  />
                </div>
                
                {/* Data/Hora Retirada */}
                <div>
                  <label className={labelClass}>Data Retirada <span className="text-red-500">*</span></label>
                   <div className="flex gap-2">
                        <div className="flex-[2]">
                            <CustomDatePicker
                                value={data.carPickupDate}
                                onChange={(val) => handleChange('carPickupDate', val)}
                                placeholder="Data Retirada"
                                className={`${inputClass} ${getErrorClass('carPickupDate')}`}
                                disabled={disabled}
                            />
                        </div>
                        <div className="flex-[2]">
                            <Autocomplete 
                                options={CAR_TIME_OPTIONS}
                                className={`${inputClass} border-slate-200`}
                                placeholder="Hora"
                                value={data.carPickupTime}
                                onChange={(val) => handleChange('carPickupTime', val)}
                                disabled={disabled}
                            />
                        </div>
                   </div>
                </div>

                {/* Data/Hora Devolução */}
                <div>
                  <label className={labelClass}>Data Devolução <span className="text-red-500">*</span></label>
                   <div className="flex gap-2">
                        <div className="flex-[2]">
                             <CustomDatePicker
                                value={data.carReturnDate}
                                onChange={(val) => handleChange('carReturnDate', val)}
                                placeholder="Data Devolução"
                                className={`${inputClass} ${getErrorClass('carReturnDate')}`}
                                minDate={data.carPickupDate}
                                rangeStartDate={data.carPickupDate}
                                isEndDate={true}
                                disabled={disabled}
                            />
                        </div>
                        <div className="flex-[2]">
                            <Autocomplete 
                                options={CAR_TIME_OPTIONS}
                                className={`${inputClass} border-slate-200`}
                                placeholder="Hora"
                                value={data.carReturnTime}
                                onChange={(val) => handleChange('carReturnTime', val)}
                                disabled={disabled}
                            />
                        </div>
                   </div>
                </div>
              </div>
            </section>
        )}

        {/* Bus / Transporte Terrestre */}
        {data.services.includes('Transporte Terrestre') && (
            <section className="bg-orange-50/50 p-5 rounded-xl border border-orange-100 animate-fade-in">
              <h3 className="text-lg font-bold text-orange-700 flex items-center gap-2 mb-4">
                <Bus className="w-5 h-5 text-orange-500" /> Transporte Terrestre
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={labelClass}>Origem <span className="text-red-500">*</span></label>
                  <CityAutocomplete
                    className={`${inputClass} ${getErrorClass('busOrigin')}`}
                    value={data.busOrigin || ''}
                    onChange={(val) => handleChange('busOrigin', val)}
                    disabled={disabled}
                  />
                </div>
                <div>
                  <label className={labelClass}>Destino <span className="text-red-500">*</span></label>
                  <CityAutocomplete
                    className={`${inputClass} ${getErrorClass('busDestination')}`}
                    value={data.busDestination || ''}
                    onChange={(val) => handleChange('busDestination', val)}
                    disabled={disabled}
                  />
                </div>
                <div>
                  <label className={labelClass}>Data Saída <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <div className="flex-[2]">
                        <CustomDatePicker
                            value={data.busDepartureDate || ''}
                            onChange={(val) => handleChange('busDepartureDate', val)}
                            placeholder="Data da Ida"
                            className={`${inputClass} ${getErrorClass('busDepartureDate')}`}
                            disabled={disabled}
                        />
                    </div>
                    <div className="flex-1 min-w-[100px]">
                        <select 
                            className={`${inputClass} border-slate-200`}
                            value={data.busDepartureShift || ''}
                            onChange={(e) => handleChange('busDepartureShift', e.target.value)}
                            disabled={disabled}
                        >
                            <option value="">Turno...</option>
                            <option value="Manhã">Manhã</option>
                            <option value="Tarde">Tarde</option>
                            <option value="Noite">Noite</option>
                            <option value="Madrugada">Madrugada</option>
                        </select>
                    </div>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Data Retorno <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <div className="flex-[2]">
                        <CustomDatePicker
                            value={data.busReturnDate || ''}
                            onChange={(val) => handleChange('busReturnDate', val)}
                            placeholder="Data da Volta"
                            className={`${inputClass} ${getErrorClass('busReturnDate')}`}
                            minDate={data.busDepartureDate}
                            rangeStartDate={data.busDepartureDate} 
                            isEndDate={true} 
                            disabled={disabled}
                        />
                    </div>
                    <div className="flex-1 min-w-[100px]">
                         <select 
                            className={`${inputClass} border-slate-200`}
                            value={data.busReturnShift || ''}
                            onChange={(e) => handleChange('busReturnShift', e.target.value)}
                            disabled={disabled}
                        >
                            <option value="">Turno...</option>
                            <option value="Manhã">Manhã</option>
                            <option value="Tarde">Tarde</option>
                            <option value="Noite">Noite</option>
                            <option value="Madrugada">Madrugada</option>
                        </select>
                    </div>
                  </div>
                </div>
              </div>
            </section>
        )}
    </div>
  );
};

export default ServicesSection;
