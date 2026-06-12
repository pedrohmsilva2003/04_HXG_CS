
export const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export const WEEK_DAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

export const getDaysInMonth = (month: number, year: number) => {
  return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (month: number, year: number) => {
  return new Date(year, month, 1).getDay();
};

export const formatDateISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseDateISO = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  // Date constructor uses month index 0-11
  return new Date(year, month - 1, day);
};

// Converte "DD/MM/AAAA" para Date object com validação estrita
export const parseDisplayDate = (displayStr: string): Date | null => {
    if (!displayStr || displayStr.length !== 10) return null;
    
    const parts = displayStr.split('/');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    
    // Validação básica de limites numéricos
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    if (year < 1900 || year > 2100) return null; // Limite razoável

    const date = new Date(year, month - 1, day);
    
    // VALIDAÇÃO ESTRITA: Verifica se o JS não fez "rollover" de data (ex: 31/02 virar 03/03)
    // Se os componentes da data criada forem diferentes dos inputs, a data não existe.
    if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
        return null;
    }

    return date;
};

export const isSameDay = (d1: Date, d2: Date): boolean => {
  return d1.getDate() === d2.getDate() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getFullYear() === d2.getFullYear();
};

export const isAfter = (d1: Date, d2: Date): boolean => {
  return d1.getTime() > d2.getTime();
};

export const isBefore = (d1: Date, d2: Date): boolean => {
  return d1.getTime() < d2.getTime();
};
