// Tipos para Autenticacao
export type UserRole = 'manager' | 'employee';
export type UserStatus = 'active' | 'pending' | 'blocked';
export type UserDepartment =
  | 'administrativo'
  | 'comercial'
  | 'suporte'
  | 'suporte_tecnico'
  | 'centro_servico'
  | 'diretores'
  | 'bu_diretores';
export type ManagerPermission = 'all' | 'department' | 'own';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  department?: UserDepartment;
  role: UserRole;
  status: UserStatus;
  permissions?: ManagerPermission;
  canDeleteApproved?: boolean;
  mustChangePassword?: boolean;
  createdAt: string;
}

// Tipos para Solicitacoes de Viagem
export interface Passenger {
  id: string;
  name: string;
}

export type RequestStatus = 'draft' | 'requested' | 'options_received' | 'approval_requested' | 'approved' | 'cancelled';

export interface TravelCosts {
  flightPrice?: number;
  hotelPrice?: number;
  carPrice?: number;
  foodPrice?: number;
  otherPrice?: number;
  flightPriceUSD?: number;
  hotelPriceUSD?: number;
  carPriceUSD?: number;
  foodPriceUSD?: number;
  otherPriceUSD?: number;
  currency: 'BRL' | 'USD' | 'EUR';
}

export interface TravelRequestData {
  protocol?: string;
  isInternational?: boolean;
  status?: RequestStatus;
  costs?: TravelCosts;
  reason: string;
  client: string;
  product: string;
  area: string;
  requesterEmail: string;
  requesterDepartment?: UserDepartment;
  period: string;
  startDate?: string;
  endDate?: string;
  origin: string;
  destination: string;
  managerName: string;
  managerEmail: string;
  approverName: string;
  approverEmail: string;
  passengers: Passenger[];
  services: string[];
  flightOrigin: string;
  flightDestination: string;
  departureDate: string;
  departureShift?: string;
  returnDate: string;
  returnShift?: string;
  hasBaggage: boolean;
  hotelCity: string;
  checkIn: string;
  checkOut: string;
  hotelPreferences: string;
  carPickupLocation: string;
  carPickupDate: string;
  carPickupTime: string;
  carReturnDate: string;
  carReturnTime: string;
  busOrigin?: string;
  busDestination?: string;
  busDepartureDate?: string;
  busDepartureShift?: string;
  busReturnDate?: string;
  busReturnShift?: string;
}

export interface TravelRequestHistoryItem extends TravelRequestData {
  id: string;
  createdAt: string;
}

export interface GeneratedEmailResponse {
  subject: string;
  body: string;
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

// ============================================================
// CONTROLE DE HORAS TÉCNICAS
// ============================================================

export interface ServicoCS {
  id: string;
  codigo: string;
  descricao: string;
  tempo_estimado_hrs: number;
  ativo: boolean;
}

export type ApontamentoStatus = 'em_andamento' | 'pausado' | 'finalizado';

export interface PausaAtiva {
  id?: string;
  inicio_pausa: string;
  fim_pausa?: string;
  motivo?: string;
}

export interface ApontamentoAtivo {
  id: string;
  nr_os: string;
  servico_id?: string;
  servico_codigo: string;
  servico_descricao: string;
  familia_equipamento?: string;
  modelo_equipamento?: string;
  clase_equipamento?: string;
  tecnico_id: string;
  tecnico_nome: string;
  tecnico_email: string;
  inicio: string;
  pausas: PausaAtiva[];
  status: 'em_andamento' | 'pausado';
  observacao_inicial?: string;
  osInfo?: OSAdministrativaCS | null;
}

export interface ApontamentoCS {
  id: string;
  nr_os: string;
  tecnico_id: string;
  tecnico_nome: string;
  tecnico_email: string;
  servico_id?: string;
  servico_codigo: string;
  servico_descricao: string;
  familia_equipamento?: string;
  modelo_equipamento?: string;
  clase_equipamento?: string;
  inicio: string;
  fim?: string;
  tempo_produtivo_minutos?: number;
  tempo_pausa_minutos?: number;
  observacao_inicial?: string;
  observacao_final?: string;
  status: ApontamentoStatus;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
  pausas?: PausaApontamentoCS[];
}

export interface PausaApontamentoCS {
  id: string;
  apontamento_id: string;
  inicio_pausa: string;
  fim_pausa?: string;
  motivo?: string;
}

export interface OSAdministrativaCS {
  id: string;
  nr_os: string;
  emp?: string;
  item?: string;       // Coluna B da planilha de OS → referência do equipamento
  descricao?: string;
  nr_serie?: string;
  cod_cliente?: string;
  razao_social?: string;
  tipo?: number;
  tipo_os?: string;
  dt_os?: string;
  encerramento?: string;
  valor?: number;
  situacao?: string;
  estagio?: string;
  familia_equipamento?: string; // resolvida via join com base_equipamentos_cs
}

export interface MetricasDia {
  date: string;
  minutos_produtivos: number;
  minutos_pausa: number;
  qtd_apontamentos: number;
}

export interface MetricasTecnico {
  tecnico_id: string;
  tecnico_nome: string;
  minutos_produtivos_total: number;
  qtd_os_atendidas: number;
  meta_minutos: number;
  por_dia: MetricasDia[];
  por_servico: { servico: string; minutos: number; qtd: number }[];
}

// ── BRM ──────────────────────────────────────────────────────

export type FamiliaEquipamento = 'NOVA series' | 'High End' | 'Manual';

export interface SSPConfig {
  familia: string;
  servico_codigo: string;
  ssp_horas: number;
}

export type BRMAgrupamento = 'familia' | 'clase';

export interface BRMEficienciaRow {
  grupo: string;           // valor do agrupamento (familia ou clase)
  familia?: string;
  modelo?: string;
  clase?: string;
  servico_codigo: string;
  servico_descricao: string;
  count: number;
  avg_horas: number;
  max_horas: number;
  min_horas: number;
  ssp_horas: number;
  eficiencia: number;
}
