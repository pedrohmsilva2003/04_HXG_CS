
// @ts-ignore - Optional dependency for AI features
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import type { GeneratedEmailResponse, TravelRequestData } from "../types";

declare const process: any;

export const generateTravelEmail = async (data: TravelRequestData): Promise<GeneratedEmailResponse> => {
  // Inicializa o cliente apenas quando a função é chamada (Lazy Initialization)
  const apiKey = typeof process !== 'undefined' ? process.env?.API_KEY : undefined;
  
  if (!apiKey) {
    // Lança erro para ser capturado pelo componente e exibido como Toast
    // Removemos o alert() para não bloquear a UI de forma intrusiva
    throw new Error("API_KEY_MISSING");
  }
  
  const ai = new GoogleGenAI({ apiKey });

  // Format the input data into a readable string for the LLM
  const passengerList = data.passengers
    .map((p) => `- ${p.name}`)
    .join('\n');

  const servicesList = data.services.length > 0 ? data.services.join(', ') : '(Nenhum selecionado)';

  // Determine period string
  const periodString = (data.startDate && data.endDate) 
    ? `${data.startDate} a ${data.endDate}` 
    : (data.period || '(Não informado)');

  const depShift = data.departureShift ? ` (${data.departureShift})` : '';
  const retShift = data.returnShift ? ` (${data.returnShift})` : '';

  const busDepShift = data.busDepartureShift ? ` (${data.busDepartureShift})` : '';
  const busRetShift = data.busReturnShift ? ` (${data.busReturnShift})` : '';

  const promptContent = `
    Por favor, gere o e-mail com base nos seguintes dados brutos, seguindo estritamente o modelo de bullets (•) do system instruction:

    MOTIVO: ${data.reason}
    CLIENTE/PROJETO: ${data.client}
    PRODUTO: ${data.product}
    ÁREA: ${data.area}
    PERÍODO GERAL: ${periodString}
    ORIGEM GERAL: ${data.origin}
    DESTINO GERAL: ${data.destination}

    GESTOR:
    Nome: ${data.managerName}
    Email: ${data.managerEmail}

    RESPONSÁVEL PELA APROVAÇÃO:
    Nome: ${data.approverName}
    Email: ${data.approverEmail}

    PASSAGEIROS:
    ${passengerList}

    SERVIÇOS SOLICITADOS: ${servicesList}

    DADOS DO VOO:
    Origem: ${data.flightOrigin}
    Destino: ${data.flightDestination}
    Ida: ${data.departureDate}${depShift}
    Volta: ${data.returnDate}${retShift}
    Bagagem Despachada: ${data.hasBaggage ? 'Sim' : 'Não'}

    DADOS DO TRANSPORTE TERRESTRE (ÔNIBUS):
    Origem: ${data.busOrigin}
    Destino: ${data.busDestination}
    Ida: ${data.busDepartureDate}${busDepShift}
    Volta: ${data.busReturnDate}${busRetShift}

    DADOS DA HOSPEDAGEM:
    Cidade: ${data.hotelCity}
    Check-in: ${data.checkIn}
    Check-out: ${data.checkOut}
    Preferências: ${data.hotelPreferences}

    DADOS DO VEÍCULO:
    Local: ${data.carPickupLocation}
    Retirada: ${data.carPickupDate} às ${data.carPickupTime}
    Devolução: ${data.carReturnDate} às ${data.carReturnTime}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptContent,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            body: { type: Type.STRING },
          },
          required: ['subject', 'body'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('No response from Gemini');
    }

    return JSON.parse(text) as GeneratedEmailResponse;
  } catch (error) {
    console.error("Error generating email:", error);
    throw error;
  }
};
