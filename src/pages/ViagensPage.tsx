import React from 'react';
import { useEffect } from 'react';
import { getAuthToken } from '../utils/authGuard';

const ViagensPage: React.FC = () => {
  useEffect(() => {
    // Obtém o token de autenticação
    const token = getAuthToken();
    
    // Cria a URL com o token codificado para passar entre domínios
    let viagensUrl = 'https://hexagon-viagens.vercel.app/viagens';
    
    if (token) {
      // Codifica o token em base64 para passar via URL
      const tokenData = encodeURIComponent(btoa(JSON.stringify(token)));
      viagensUrl += `?auth=${tokenData}`;
    }
    
    // Abre a app de viagens em uma nova aba com o token
    window.open(viagensUrl, '_blank');
    // Retorna para o portal
    window.history.back();
  }, []);

  return null;
};

export default ViagensPage;

