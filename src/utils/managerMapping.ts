import { MANAGERS_DATA } from '../constants';

// Regra fixa de mapeamento departamento -> nome do gestor (conforme solicitado)
const DEPT_TO_MANAGER_NAME: Record<string, string> = {
  administrativo: 'Carla Eiras',
  suporte: 'Pedro Silva',
  suporte_tecnico: 'Pedro Silva',
  centro_servico: 'Pedro Silva',
  comercial: 'Renata Brasil',
  diretores: 'Ivan Gjurovic',
  bu_diretores: 'Ivan Gjurovic'
};

// Mapeamento departamento -> aprovador
const DEPT_TO_APPROVER: Record<string, { name: string, email: string }> = {
  administrativo: { name: 'Jaime Nogueira', email: 'jaime.nogueira@leica-geosystems.com' },
  suporte: { name: 'Francisco Tapia', email: 'francisco.tapia@leica-geosystems.com' },
  suporte_tecnico: { name: 'Francisco Tapia', email: 'francisco.tapia@leica-geosystems.com' },
  centro_servico: { name: 'Francisco Tapia', email: 'francisco.tapia@leica-geosystems.com' },
  comercial: { name: 'Patricio Romero', email: 'patricio.romero@leica-geosystems.com' },
  diretores: { name: 'Ivan Gjurovic', email: 'ivan.gjurovic@leica-geosystems.com' },
  bu_diretores: { name: 'Ivan Gjurovic', email: 'ivan.gjurovic@leica-geosystems.com' }
};

export const resolveManagerFor = (dept?: string | undefined) => {
  const managerName = dept ? (DEPT_TO_MANAGER_NAME[dept] || 'Pedro Silva') : 'Pedro Silva';
  return MANAGERS_DATA.find(m => m.name === managerName) || MANAGERS_DATA[0];
};

export const resolveApproverFor = (dept?: string | undefined) => {
  if (!dept) return { name: 'Jaime Nogueira', email: 'jaime.nogueira@leica-geosystems.com' };
  return DEPT_TO_APPROVER[dept] || { name: 'Jaime Nogueira', email: 'jaime.nogueira@leica-geosystems.com' };
};

export default resolveManagerFor;
