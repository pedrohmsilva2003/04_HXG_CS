// Lista das principais cidades para sugestão no autocomplete
// Focada em Brasil (Capitais + Grandes Centros) e Hubs Internacionais comuns

export const POPULAR_CITIES = [
  // --- BRASIL - SUL ---
  "Curitiba - PR",
  "Londrina - PR",
  "Maringá - PR",
  "Foz do Iguaçu - PR",
  "Ponta Grossa - PR",
  "Cascavel - PR",
  "São José dos Pinhais - PR",
  "Florianópolis - SC",
  "Joinville - SC",
  "Blumenau - SC",
  "Chapecó - SC",
  "Porto Alegre - RS",
  "Caxias do Sul - RS",
  "Canoas - RS",

  // --- BRASIL - SUDESTE ---
  "São Paulo - SP",
  "Campinas - SP",
  "Guarulhos - SP",
  "São José dos Campos - SP",
  "Ribeirão Preto - SP",
  "Santos - SP",
  "Sorocaba - SP",
  "Cajamar - SP",
  "Jundiaí - SP",
  "Rio de Janeiro - RJ",
  "Niterói - RJ",
  "Macaé - RJ",
  "Belo Horizonte - MG",
  "Uberlândia - MG",
  "Contagem - MG",
  "Juiz de Fora - MG",
  "Vitória - ES",
  "Vila Velha - ES",

  // --- BRASIL - CENTRO-OESTE ---
  "Brasília - DF",
  "Goiânia - GO",
  "Aparecida de Goiânia - GO",
  "Cuiabá - MT",
  "Campo Grande - MS",

  // --- BRASIL - NORDESTE ---
  "Salvador - BA",
  "Recife - PE",
  "Fortaleza - CE",
  "São Luís - MA",
  "Maceió - AL",
  "Natal - RN",
  "João Pessoa - PB",
  "Teresina - PI",
  "Aracaju - SE",

  // --- BRASIL - NORTE ---
  "Manaus - AM",
  "Belém - PA",
  "Porto Velho - RO",
  "Palmas - TO",
  "Rio Branco - AC",
  "Macapá - AP",
  "Boa Vista - RR",

  // --- INTERNACIONAL (Principais Hubs) ---
  "Heerbrugg - Suíça (Leica HQ)",
  "Zurique - Suíça",
  "Wetzlar - Alemanha",
  "Londres - Reino Unido",
  "Nova York - EUA",
  "Miami - EUA",
  "Houston - EUA",
  "Atlanta - EUA",
  "Santiago - Chile",
  "Buenos Aires - Argentina",
  "Cidade do México - México",
  "Lima - Peru",
  "Bogotá - Colômbia"
];

// Função simples para filtrar
export const searchCities = (query: string): string[] => {
  if (!query || query.length < 2) return [];
  
  const lowerQuery = query.toLowerCase();
  return POPULAR_CITIES.filter(city => 
    city.toLowerCase().includes(lowerQuery)
  ).slice(0, 5); // Retorna no máximo 5 sugestões para não poluir a tela
};