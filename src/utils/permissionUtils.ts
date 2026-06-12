import type { User, ManagerPermission, UserDepartment, TravelRequestHistoryItem } from '../types';

/**
 * Filtra solicitações de viagem baseado nas permissões do usuário
 */
export const filterTravelRequests = (
  requests: TravelRequestHistoryItem[],
  currentUser: User
): TravelRequestHistoryItem[] => {
  // Colaboradores normais só veem suas próprias solicitações
  if (currentUser.role === 'employee') {
    return requests.filter(
      (req) => (req.requesterEmail || '').toLowerCase() === currentUser.email.toLowerCase()
    );
  }

  // Managers têm permissões diferentes baseado em seu nível
  const managerPermission = currentUser.permissions || 'own';

  switch (managerPermission) {
    case 'all':
      // Admin total - vê tudo
      return requests;

    case 'department':
      // Vê solicitações do seu departamento
      return requests.filter((req) => {
        // Encontra o usuário solicitante para comparar departamento
        return (req as any).requesterDepartment === currentUser.department;
      });

    case 'own':
    default:
      // Vê só suas próprias solicitações
      return requests.filter(
        (req) => (req.requesterEmail || '').toLowerCase() === currentUser.email.toLowerCase()
      );
  }
};

/**
 * Retorna uma descrição da permissão do manager
 */
export const getPermissionLabel = (permission: ManagerPermission): string => {
  switch (permission) {
    case 'all':
      return 'Administrador Total';
    case 'department':
      return 'Gerente de Departamento';
    case 'own':
      return 'Visualização Própria';
    default:
      return 'Desconhecido';
  }
};

/**
 * Retorna uma descrição de quem o manager pode ver
 */
export const getPermissionDescription = (permission: ManagerPermission, department?: UserDepartment): string => {
  switch (permission) {
    case 'all':
      return 'Pode ver todas as solicitações de viagem';
    case 'department':
      return `Pode ver solicitações do departamento: ${department || 'desconhecido'}`;
    case 'own':
      return 'Pode ver apenas suas próprias solicitações';
    default:
      return 'Sem descrição';
  }
};
