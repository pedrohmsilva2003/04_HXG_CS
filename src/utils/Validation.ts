
import type { TravelRequestData } from '../types';

export type ValidationError = Record<string, string>;

export const validateForm = (data: TravelRequestData): ValidationError => {
  const errors: ValidationError = {};

  // Validação Básica
  if (!data.reason) errors.reason = "Selecione o motivo da viagem.";
  if (!data.client) errors.client = "Informe o Cliente ou Projeto.";
  if (!data.product) errors.product = "Informe o Produto.";
  if (!data.area) errors.area = "Informe a Área/Centro de Custo.";
  if (!data.requesterEmail) errors.requesterEmail = "Informe o e-mail do solicitante.";
  
  if (!data.startDate) errors.startDate = "Data de início obrigatória.";
  if (!data.endDate) errors.endDate = "Data de fim obrigatória.";
  if (!data.origin) errors.origin = "Origem obrigatória.";
  if (!data.destination) errors.destination = "Destino obrigatório.";

  // Validação de Gestor
  if (!data.managerName) errors.managerName = "Selecione o Gestor Imediato.";

  // Validação de Passageiros
  data.passengers.forEach((p) => {
    if (!p.name) errors[`passenger_name_${p.id}`] = "Nome obrigatório.";
  });

  // Validação de Serviços (pelo menos um deve ser selecionado?)
  // Opcional, mas se selecionar um serviço, validar os campos dele.

  if (data.services.includes("Transporte Aéreo")) {
      if (!data.flightOrigin) errors.flightOrigin = "Origem do voo obrigatória.";
      if (!data.flightDestination) errors.flightDestination = "Destino do voo obrigatório.";
      if (!data.departureDate) errors.departureDate = "Data de ida obrigatória.";
      if (!data.returnDate) errors.returnDate = "Data de volta obrigatória.";
  }

  if (data.services.includes("Hospedagem")) {
      if (!data.hotelCity) errors.hotelCity = "Cidade do hotel obrigatória.";
      if (!data.checkIn) errors.checkIn = "Data de Check-in obrigatória.";
      if (!data.checkOut) errors.checkOut = "Data de Check-out obrigatória.";
  }

  if (data.services.includes("Locação de Veículo")) {
      if (!data.carPickupLocation) errors.carPickupLocation = "Local de retirada obrigatório.";
      if (!data.carPickupDate) errors.carPickupDate = "Data de retirada obrigatória.";
      if (!data.carReturnDate) errors.carReturnDate = "Data de devolução obrigatória.";
  }

  if (data.services.includes("Transporte Terrestre")) {
      if (!data.busOrigin) errors.busOrigin = "Origem obrigatória.";
      if (!data.busDestination) errors.busDestination = "Destino obrigatório.";
      if (!data.busDepartureDate) errors.busDepartureDate = "Data de ida obrigatória.";
      if (!data.busReturnDate) errors.busReturnDate = "Data de volta obrigatória.";
  }

  return errors;
};
