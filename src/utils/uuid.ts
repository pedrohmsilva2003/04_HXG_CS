
export const generateUUID = (): string => {
  // Tenta usar crypto nativo se disponível e seguro (HTTPS/Localhost)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Falha silenciosa (ex: contexto inseguro), vai para o fallback
    }
  }
  
  // Fallback robusto (algoritmo padrão UUID v4)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
