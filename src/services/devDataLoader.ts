/**
 * Serviço de carregamento inicial de dados para ambiente de desenvolvimento
 * 
 * IMPORTANTE: Este serviço é executado APENAS UMA VEZ ao iniciar o localhost
 * - Carrega dados existentes do Supabase (somente leitura)
 * - NÃO sincroniza em tempo real
 * - NÃO modifica dados de produção
 * - Usado apenas para testes locais
 */

import { getSupabase, isSupabaseEnabled } from './cloudSync';
import type { TravelRequestHistoryItem } from '../types';

/**
 * Carrega dados do Supabase para o localStorage (somente desenvolvimento)
 * Executa apenas uma vez ao iniciar o app
 */
export const loadInitialDataFromSupabase = async (): Promise<{
  history: TravelRequestHistoryItem[];
  success: boolean;
  message: string;
}> => {
  // Verifica se está em desenvolvimento
  const isDev = (import.meta as any).env?.DEV;
  
  if (!isDev) {
    return {
      history: [],
      success: false,
      message: 'Carregamento inicial desabilitado em produção'
    };
  }

  if (!isSupabaseEnabled()) {
    console.warn('[DevDataLoader] Supabase não configurado - usando dados locais');
    return {
      history: [],
      success: false,
      message: 'Supabase não configurado'
    };
  }

  try {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('Cliente Supabase não disponível');
    }

    console.log('[DevDataLoader] 🔄 Carregando dados do Supabase (somente leitura)...');

    // Carrega histórico de solicitações (READ-ONLY)
    // Sem ordenação para evitar erro se a coluna tiver nome diferente
    const { data: historyData, error: historyError } = await supabase
      .from('travel_requests')
      .select('*');

    if (historyError) {
      console.error('[DevDataLoader] Erro Supabase detalhado:', historyError);
      console.error('[DevDataLoader] Código:', historyError.code);
      console.error('[DevDataLoader] Mensagem:', historyError.message);
      console.error('[DevDataLoader] Detalhes:', historyError.details);
      
      // Se a tabela não existe (erro 42P01) ou sem permissão, retorna vazio
      if (historyError.code === '42P01' || historyError.code === 'PGRST116' || historyError.code === '42501') {
        console.warn('[DevDataLoader] ⚠️ Tabela não encontrada ou sem permissão - usando dados locais');
        return {
          history: [],
          success: false,
          message: `Tabela não encontrada no Supabase: ${historyError.message}`
        };
      }
      
      throw new Error(`Supabase Error: ${historyError.message} (${historyError.code})`);
    }

    // Mapeia dados do Supabase para o formato local
    const history: TravelRequestHistoryItem[] = (historyData || []).map((item: any): TravelRequestHistoryItem => ({
      id: item.id || '',
      protocol: item.protocol || '',
      reason: item.reason || '',
      client: item.client || '',
      product: item.product || '',
      area: item.area || '',
      requesterEmail: item.requester_email || item.requesterEmail || '',
      requesterDepartment: item.requester_department || item.requesterDepartment || undefined,
      period: item.period || '',
      startDate: item.start_date || item.startDate || '',
      endDate: item.end_date || item.endDate || '',
      origin: item.origin || '',
      destination: item.destination || '',
      managerName: item.manager_name || item.managerName || '',
      managerEmail: item.manager_email || item.managerEmail || '',
      approverName: item.approver_name || item.approverName || '',
      approverEmail: item.approver_email || item.approverEmail || '',
      passengers: item.passengers || [],
      services: item.services || [],
      flightOrigin: item.flight_origin || item.flightOrigin || '',
      flightDestination: item.flight_destination || item.flightDestination || '',
      departureDate: item.departure_date || item.departureDate || '',
      departureShift: item.departure_shift || item.departureShift || '',
      returnDate: item.return_date || item.returnDate || '',
      returnShift: item.return_shift || item.returnShift || '',
      hasBaggage: item.has_baggage || item.hasBaggage || false,
      hotelCity: item.hotel_city || item.hotelCity || '',
      checkIn: item.check_in || item.checkIn || '',
      checkOut: item.check_out || item.checkOut || '',
      hotelPreferences: item.hotel_preferences || item.hotelPreferences || '',
      carPickupLocation: item.car_pickup_location || item.carPickupLocation || '',
      carPickupDate: item.car_pickup_date || item.carPickupDate || '',
      carPickupTime: item.car_pickup_time || item.carPickupTime || '',
      carReturnDate: item.car_return_date || item.carReturnDate || '',
      carReturnTime: item.car_return_time || item.carReturnTime || '',
      busOrigin: item.bus_origin || item.busOrigin || '',
      busDestination: item.bus_destination || item.busDestination || '',
      busDepartureDate: item.bus_departure_date || item.busDepartureDate || '',
      busDepartureShift: item.bus_departure_shift || item.busDepartureShift || '',
      busReturnDate: item.bus_return_date || item.busReturnDate || '',
      busReturnShift: item.bus_return_shift || item.busReturnShift || '',
      status: item.status as any || 'draft',
      createdAt: item.created_at || item.createdAt || new Date().toISOString(),
      costs: item.costs || undefined,
      isInternational: item.is_international || item.isInternational || false
    }));

    // Salva no localStorage para uso local
    localStorage.setItem('travel_history', JSON.stringify(history));

    // Ordena localmente por createdAt (mais recentes primeiro)
    history.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Decrescente
    });

    console.log(`[DevDataLoader] ✅ ${history.length} registros carregados do Supabase`);
    console.log('[DevDataLoader] 📋 Dados salvos no localStorage para testes');
    console.log('[DevDataLoader] ⚠️  Modo somente leitura - dados de produção preservados');

    return {
      history,
      success: true,
      message: `${history.length} registros carregados com sucesso`
    };

  } catch (error) {
    console.error('[DevDataLoader] ❌ Erro ao carregar dados:', error);
    console.error('[DevDataLoader] Stack trace:', error instanceof Error ? error.stack : 'N/A');
    
    // Log detalhado para debug
    if (error && typeof error === 'object') {
      console.error('[DevDataLoader] Erro completo:', JSON.stringify(error, null, 2));
    }
    
    return {
      history: [],
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
};

/**
 * Verifica se os dados já foram carregados nesta sessão
 */
export const isDataLoadedThisSession = (): boolean => {
  return sessionStorage.getItem('dev_data_loaded') === 'true';
};

/**
 * Marca os dados como carregados nesta sessão
 */
export const markDataAsLoaded = (): void => {
  sessionStorage.setItem('dev_data_loaded', 'true');
};

/**
 * Força recarregamento dos dados (útil para testes)
 */
export const forceReloadData = async (): Promise<void> => {
  sessionStorage.removeItem('dev_data_loaded');
  await loadInitialDataFromSupabase();
};
