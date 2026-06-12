interface ClientPrincipal {
  identityProvider: string;
  userId: string;
  userDetails: string; // Geralmente é o e-mail no Azure AD
  userRoles: string[];
}

export const getUserInfo = async (): Promise<ClientPrincipal | null> => {
  // Simulação para ambiente local (Vite)
  // Verifica de forma segura se import.meta.env existe antes de acessar .DEV
  // O uso de variaveis intermediarias previne o erro "Cannot read properties of undefined"
  const meta = import.meta as any;
  const isDev = meta && meta.env && meta.env.DEV;

  if (isDev) {
    console.log("Ambiente Local: Usando usuário simulado.");
    return {
      identityProvider: "local",
      userId: "dev-user",
      userDetails: "seu.email@leica-geosystems.com", // Você pode alterar este valor se quiser
      userRoles: ["authenticated", "anonymous"]
    };
  }

  try {
    const response = await fetch('/.auth/me');
    if (!response.ok) {
      return null;
    }
    const payload = await response.json();
    const { clientPrincipal } = payload;
    return clientPrincipal || null;
  } catch (error) {
    console.warn("Não foi possível buscar informações do usuário.");
    return null;
  }
};