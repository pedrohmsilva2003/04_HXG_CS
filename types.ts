
export interface Passenger {
  id: string;
  name: string;
}

export type RequestStatus = 'draft' | 'requested' | 'options_received' | 'approval_requested' | 'approved' | 'cancelled';

export interface TravelCosts {
  // Valores em BRL (Padrão)
  flightPrice?: number;
  hotelPrice?: number;
  carPrice?: number;
  foodPrice?: number;
  otherPrice?: number;

  // Valores em USD (Opcional - Internacional)
  flightPriceUSD?: number;
  hotelPriceUSD?: number;
  carPriceUSD?: number;
  foodPriceUSD?: number;
  otherPriceUSD?: number;

  currency: 'BRL' | 'USD' | 'EUR'; // Mantido para compatibilidade
}

export interface TravelRequestData {
  protocol?: string;
  
  // Flag Internacional
  isInternational?: boolean;

  // Status & Costs
  status?: RequestStatus;
  costs?: TravelCosts;

  // Basic Info
  reason: string;
  client: string;
  product: string;
  area: string;
  requesterEmail: string;
  requesterDepartment?: UserDepartment; // Departamento de quem solicitou
  period: string;
  startDate?: string;
  endDate?: string;
  origin: string;
  destination: string;

  // Manager
  managerName: string;
  managerEmail: string;

  // Approver
  approverName: string;
  approverEmail: string;

  // Passengers
  passengers: Passenger[];

  // Services
  services: string[];

  // Flight Details
  flightOrigin: string;
  flightDestination: string;
  departureDate: string;
  departureShift?: string;
  returnDate: string;
  returnShift?: string;
  hasBaggage: boolean;

  // Hotel Details
  hotelCity: string;
  checkIn: string;
  checkOut: string;
  hotelPreferences: string;

  // Car Rental Details
  carPickupLocation: string;
  carPickupDate: string;
  carPickupTime: string;
  carReturnDate: string;
  carReturnTime: string;

  // Bus Details
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

// --- Novos Tipos para Autenticação ---

export type UserRole = 'manager' | 'employee';
export type UserStatus = 'active' | 'pending' | 'blocked';
export type UserDepartment = 'administrativo' | 'comercial' | 'suporte' | 'diretores';
export type ManagerPermission = 'all' | 'department' | 'own'; // all = tudo, department = seu depto, own = só dele

export interface User {
    id: string;
    name: string;
    email: string;
    password: string; // Em produção, isso seria um hash!
    department?: UserDepartment;
    role: UserRole;
    status: UserStatus;
    permissions?: ManagerPermission; // Para managers: quem podem ver
    canDeleteApproved?: boolean; // Permissão especial para deletar solicitações aprovadas/emitidas
    createdAt: string;
}
