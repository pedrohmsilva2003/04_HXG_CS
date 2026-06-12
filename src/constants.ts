
import type { RequestStatus, TravelRequestData } from "./types";

export const REASON_OPTIONS = [
  "Visita Técnica",
  "Reunião Comercial",
  "Instalação de Equipamento",
  "Treinamento / Curso",
  "Evento / Feira",
  "Prospecção",
  "Manutenção",
  "Administrativo"
];

export const PRODUCT_OPTIONS = [
  "Leica RTC360",
  "Leica BLK360",
  "Leica BLK2GO",
  "Leica BLK2FLY",
  "Leica BLK ARC",
  "Leica ScanStation P-Series",
  "Leica Nova MS60",
  "Leica TS16 / TS13",
  "Leica GS18 T / I",
  "Leica AP20 AutoPole",
  "Leica DD Series",
  "Leica Lino",
  "Leica Disto",
  "Cyclone REGISTER 360",
  "Cyclone 3DR",
  "Cyclone ENTERPRISE",
  "CloudWorx",
  "Infinity",
  "Captivate",
  "HxDR",
  "Reality Cloud Studio",
  "SmartNet",
  "Outros / Vários"
];

export const SERVICES_OPTIONS = [
  "Transporte Aéreo",
  "Hospedagem",
  "Locação de Veículo",
  "Transporte Terrestre"
];

export const COST_CENTER_OPTIONS = [
  "Comercial PR",
  "Comercial SP",
  "Comercial MG",
  "Suporte Técnico PR",
  "Suporte Técnico MG",
  "Centro de Serviço PR",
  "Administrativo PR"
];

export const CAR_LOCATION_OPTIONS = [
  "Aeroporto de Destino",
  "Aeroporto de Origem",
  "Rodoviária",
  "Escritório Leica/Hexagon",
  "Hotel",
  "Cliente"
];

export const CAR_TIME_OPTIONS = [
  "Mesmo horário do voo",
  "Acompanhar horário do voo",
  "Após desembarque",
  "2h antes do voo",
  "08:00",
  "09:00",
  "10:00",
  "12:00",
  "14:00",
  "18:00",
  "Manhã",
  "Tarde"
];

export const DEPARTMENTS = [
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'suporte_tecnico', label: 'Suporte Técnico' },
  { value: 'centro_servico', label: 'Centro de Serviço' },
  { value: 'bu_diretores', label: 'BU e Diretores' }
];

export const MANAGERS_DATA = [
  {
    name: "Renata Brasil",
    email: "renata.brasil@leica-geosystems.com",
    approverName: "Patricio Romero",
    approverEmail: "patricio.romero@leica-geosystems.com",
    department: "comercial" as const,
    permissions: "department" as const // Ver só departamento comercial
  },
  {
    name: "Carla Eiras",
    email: "carla.eiras@leica-geosystems.com",
    approverName: "Patricio Romero",
    approverEmail: "patricio.romero@leica-geosystems.com",
    department: "administrativo" as const,
    permissions: "department" as const // Ver só departamento administrativo
  },
  {
    name: "Pedro Silva",
    email: "pedro.silva@leica-geosystems.com",
    approverName: "Francisco Tapia",
    approverEmail: "francisco.tapia@leica-geosystems.com",
    department: "suporte_tecnico" as const,
    permissions: "all" as const, // Admin total - pode ver e editar tudo, incluindo dados de todos os usuários
    canDeleteApproved: true // Permissão especial para deletar solicitações aprovadas/emitidas
  }
  ,
  {
    name: "Ivan Gjurovic",
    email: "ivan.gjurovic@leica-geosystems.com",
    approverName: "Ivan Gjurovic",
    approverEmail: "ivan.gjurovic@leica-geosystems.com",
    department: "bu_diretores" as const,
    permissions: "department" as const // Gestor para Diretores/BU
  }
];

// Configuração Visual dos Status
export const STATUS_CONFIG: Record<RequestStatus, { label: string, color: string, bg: string, border: string }> = {
    draft: { label: 'Rascunho', color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200' },
    requested: { label: 'Solicitado', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    options_received: { label: 'Cotação Recebida', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    approval_requested: { label: 'Aprovação Pendente', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    approved: { label: 'Aprovado / Emitido', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    cancelled: { label: 'Cancelado', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
};

export const SYSTEM_INSTRUCTION = `
Você é um assistente responsável por gerar E-MAILS PADRONIZADOS de SOLICITAÇÃO DE VIAGEM para envio ao time de turismo (Kelly Klassen).

REGRAS GERAIS:
- Responda SEMPRE em português do Brasil.
- Sempre gere:
  1) Assunto do e-mail
  2) Corpo do e-mail completo.
- Use estritamente o formato de lista com marcadores (•) conforme o modelo abaixo.
- Use apenas as informações fornecidas. Se algo não for informado, escreva "(não informado)".
- Novos campos obrigatórios: Cliente/Projeto e Produto.
- O PROTOCOLO da solicitação deve constar no assunto.

MODELO DE OUTPUT:

[ASSUNTO DO E-MAIL]
Solicitação de Viagem – {{motivo_resumido}} – {{mês/ano_viagem}} (Prot: {{protocolo}})

[CORPO DO E-MAIL]
Bom dia, @Kelly - Turismo Dklassen

Tudo bem?

Segue a solicitação de viagem com os seguintes detalhes:

📋 INFORMAÇÕES BÁSICAS
- Motivo: {{motivo_completo}}
- Cliente/Projeto: {{cliente_projeto}}
- Produto: {{produto}}
- Área: {{área_responsável}}
- Período: {{período_completo}}
- Origem: {{origem}}
- Destino: {{destino}}

👤 GESTOR RESPONSÁVEL
- Nome: {{nome_gestor}}
- E-mail: {{email_gestor}}

✅ RESPONSÁVEL PELA APROVAÇÃO
- Nome: {{nome_aprovador}}
- E-mail: {{email_aprovador}}

👨‍💼 PASSAGEIRO(S)
{{lista_de_passageiros_com_bullets_apenas_nome}}
(Exemplo formato passageiro:
- Nome: Fulano de Tal)

📦 SERVIÇOS SOLICITADOS
{{lista_de_servicos_com_bullets_e_icones}}
(Exemplo:
- ✈️ Transporte Aéreo
- 🏨 Hospedagem)

✈️ PASSAGENS AÉREAS
- Origem: {{origem_voo}}
- Destino: {{destino_voo}}
- Data de Saída: {{data_saida}}
- Data de Regresso: {{data_regresso}}
- Bagagem: {{sim_ou_não}}

🚌 TRANSPORTE TERRESTRE
- Origem: {{origem_onibus}}
- Destino: {{destino_onibus}}
- Data de Saída: {{data_saida_onibus}}
- Data de Regresso: {{data_regresso_onibus}}

🏨 HOSPEDAGEM
- Cidade: {{cidade_hotel}}
- Check-in: {{checkin}}
- Check-out: {{checkout}}
- Preferência: {{preferencias}}

🚗 LOCAÇÃO DE VEÍCULO
- Local de Retirada: {{local_retirada}}
- Retirada: {{data_hora_retirada}}
- Devolução: {{data_hora_devolucao}}

Qualquer dúvida, estamos à disposição para mais informações.

Atenciosamente,
{{nome_do_gestor}}

FORMATO DE RESPOSTA DO LLM:
Retorne APENAS um objeto JSON válido:
{
  "subject": "Texto do Assunto",
  "body": "Texto do Corpo do E-mail (com quebras de linha \\n)"
}
`;

export const INITIAL_DATA: TravelRequestData = {
  protocol: '', 
  isInternational: false,
  status: 'draft',
  reason: '',
  client: '',
  product: '',
  area: '',
  requesterEmail: '',
  period: '',
  startDate: '',
  endDate: '',
  origin: '',
  destination: '',
  managerName: '',
  managerEmail: '',
  approverName: '',
  approverEmail: '',
  passengers: [{ id: '1', name: '' }],
  services: [],
  flightOrigin: '',
  flightDestination: '',
  departureDate: '',
  departureShift: '',
  returnDate: '',
  returnShift: '',
  hasBaggage: true,
  hotelCity: '',
  checkIn: '',
  checkOut: '',
  hotelPreferences: '',
  carPickupLocation: '',
  carPickupDate: '',
  carPickupTime: '',
  carReturnDate: '',
  carReturnTime: '',
  busOrigin: '',
  busDestination: '',
  busDepartureDate: '',
  busDepartureShift: '',
  busReturnDate: '',
  busReturnShift: '',
};
