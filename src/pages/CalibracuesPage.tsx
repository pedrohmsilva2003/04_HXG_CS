import React from 'react';
import { useEffect } from 'react';
import { getAuthToken } from '../utils/authGuard';

const CalibracuesPage: React.FC = () => {
  useEffect(() => {
    // Obtém o token de autenticação
    const token = getAuthToken();
    
    // Cria a URL com o token codificado para passar entre domínios
    let calibracaoUrl = 'https://hexagon-calibracao.vercel.app/';
    
    if (token) {
      // Codifica o token em base64 para passar via URL
      const tokenData = encodeURIComponent(btoa(JSON.stringify(token)));
      calibracaoUrl += `?auth=${tokenData}`;
    }
    
    // Abre a app de calibração em uma nova aba com o token
    window.open(calibracaoUrl, '_blank');
    // Retorna para o portal
    window.history.back();
  }, []);

  return null;
};

export default CalibracuesPage;

