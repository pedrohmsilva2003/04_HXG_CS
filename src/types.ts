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
