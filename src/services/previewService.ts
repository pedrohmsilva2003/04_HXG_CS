
import type { TravelRequestData, GeneratedEmailResponse } from '../types';

export const generatePreview = (data: TravelRequestData): GeneratedEmailResponse => {
  const formatPassenger = (p: any) => `• Nome: ${p.name || '(Nome do Passageiro)'}`;

  const passengerList = data.passengers && data.passengers.length > 0
    ? data.passengers.map(formatPassenger).join('\n')
    : '(Nenhum passageiro)';

  const getServiceIcon = (s: string) => {
    if (s.includes('Aéreo')) return '✈️';
    if (s.includes('Hospedagem')) return '🏨';
    if (s.includes('Veículo')) return '🚗';
    if (s.includes('Terrestre')) return '🚌';
    return '📦';
  };

  const servicesList = data.services.length > 0 
    ? data.services.map(s => `• ${getServiceIcon(s)} ${s}`).join('\n')
    : '(Nenhum serviço selecionado)';
  
  // Format dates for display (expecting YYYY-MM-DD from input type="date")
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const periodString = (data.startDate && data.endDate) 
    ? `${formatDate(data.startDate)} a ${formatDate(data.endDate)}`
    : (data.period || '(Período)');

  // Saudação Dinâmica
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite'; // 18:00 as 05:00
  };

  const greeting = getGreeting();
  const protocolDisplay = data.protocol ? `(Protocolo: ${data.protocol})` : '';

  // Construção do corpo do e-mail (Rascunho atualizado com bullets)
  let body = `${greeting}, @Kelly - Turismo Dklassen

Tudo bem?

Segue a solicitação de viagem com os seguintes detalhes:

📋 INFORMAÇÕES BÁSICAS
- Motivo: ${data.reason ? data.reason.toUpperCase() : '(MOTIVO)'}
- Cliente/Projeto: ${data.client ? data.client.toUpperCase() : '(CLIENTE)'}
- Produto: ${data.product ? data.product.toUpperCase() : '(PRODUTO)'}
- Área: ${data.area || '(Área)'}
- Período: ${periodString}
- Origem: ${data.origin || '(Origem)'}
- Destino: ${data.destination || '(Destino)'}

👤 GESTOR RESPONSÁVEL
- Nome: ${data.managerName || '(Nome do Gestor)'}
- E-mail: ${data.managerEmail || '(Email do Gestor)'}

✅ RESPONSÁVEL PELA APROVAÇÃO
- Nome: ${data.approverName || '(Nome do Aprovador)'}
- E-mail: ${data.approverEmail || '(Email do Aprovador)'}

👨‍💼 PASSAGEIRO(S)
${passengerList}

📦 SERVIÇOS SOLICITADOS
${servicesList}
`;

  if (data.services.includes('Transporte Aéreo')) {
    const depShift = data.departureShift ? ` - ${data.departureShift}` : '';
    const retShift = data.returnShift ? ` - ${data.returnShift}` : '';
    const depDateDisplay = data.departureDate ? `${formatDate(data.departureDate)}${depShift}` : '(Data Ida)';
    const retDateDisplay = data.returnDate ? `${formatDate(data.returnDate)}${retShift}` : '(Data Volta)';

    body += `
✈️ PASSAGENS AÉREAS
- Origem: ${data.flightOrigin || '(Origem do Voo)'}
- Destino: ${data.flightDestination || '(Destino do Voo)'}
- Data de Saída: ${depDateDisplay}
- Data de Regresso: ${retDateDisplay}
- Bagagem: ${data.hasBaggage ? 'Sim' : 'Não'}
`;
  }

  if (data.services.includes('Transporte Terrestre')) {
    const depShift = data.busDepartureShift ? ` - ${data.busDepartureShift}` : '';
    const retShift = data.busReturnShift ? ` - ${data.busReturnShift}` : '';
    const depDateDisplay = data.busDepartureDate ? `${formatDate(data.busDepartureDate)}${depShift}` : '(Data Ida)';
    const retDateDisplay = data.busReturnDate ? `${formatDate(data.busReturnDate)}${retShift}` : '(Data Volta)';

    body += `
🚌 TRANSPORTE TERRESTRE
- Origem: ${data.busOrigin || '(Origem)'}
- Destino: ${data.busDestination || '(Destino)'}
- Data de Saída: ${depDateDisplay}
- Data de Regresso: ${retDateDisplay}
`;
  }

  if (data.services.includes('Hospedagem')) {
    body += `
🏨 HOSPEDAGEM
- Cidade: ${data.hotelCity || '(Cidade Hotel)'}
- Check-in: ${formatDate(data.checkIn) || '(Data Check-in)'}
- Check-out: ${formatDate(data.checkOut) || '(Data Check-out)'}
- Preferência: ${data.hotelPreferences || '(Sem preferências informadas)'}
`;
  }

  if (data.services.includes('Locação de Veículo')) {
    const pickupDisplay = data.carPickupDate 
        ? `${formatDate(data.carPickupDate)} - ${data.carPickupTime || '(Horário)'}` 
        : '(Data/Hora Retirada)';
    const returnDisplay = data.carReturnDate 
        ? `${formatDate(data.carReturnDate)} - ${data.carReturnTime || '(Horário)'}` 
        : '(Data/Hora Devolução)';

    body += `
🚗 LOCAÇÃO DE VEÍCULO
- Local de Retirada: ${data.carPickupLocation || '(Local de Retirada)'}
- Retirada: ${pickupDisplay}
- Devolução: ${returnDisplay}
`;
  }

  body += `\nQualquer dúvida, estamos à disposição para mais informações.\n\nAtenciosamente,`;

  const subject = `Solicitação de Viagem – ${data.reason || '(Motivo)'} – ${data.client || '(Cliente)'} – ${periodString} ${protocolDisplay}`;

  return { subject, body };
};
