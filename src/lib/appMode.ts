// Mock/Prod mode detection and utilities
export type AppMode = 'mock' | 'prod';

export const getAppMode = (): AppMode => {
  const mode = import.meta.env.VITE_MODE || 'mock';
  return mode === 'prod' ? 'prod' : 'mock';
};

export const getEnvVars = () => ({
  mode: getAppMode(),
  apiBase: import.meta.env.VITE_API_BASE || '',
  apiPath: import.meta.env.VITE_API_PATH || '/chat',
  presignEndpoint: import.meta.env.VITE_PRESIGN_ENDPOINT || '',
  brandPrimary: import.meta.env.VITE_BRAND_PRIMARY || '#7cb819',
  brandAccent: import.meta.env.VITE_BRAND_ACCENT || '#a7bd74'
});

// Detect if presign endpoint is configured
export const hasPresignEndpoint = (): boolean => {
  const presign = import.meta.env.VITE_PRESIGN_ENDPOINT;
  return !!presign && presign.trim() !== '';
};

// Mock data generators
export const generateMockResponse = (message: string): string => {
  const responses = [
    `🔧 (mock) He recibido tu consulta: "${message}". Como especialista de Ingtec, puedo ayudarte con formulaciones, procesos y análisis técnicos.`,
    `🔬 (mock) Entiendo tu pregunta sobre: "${message}". En base a nuestra experiencia en especialidades químicas, te puedo sugerir varias alternativas.`,
    `📊 (mock) Respecto a: "${message}". Como líder en el sector, Ingtec maneja múltiples soluciones que podrían ser relevantes para tu consulta.`,
    `⚗️ (mock) Tu consulta "${message}" es muy interesante. Te comparto información técnica basada en nuestros años de experiencia.`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
};

export const isValidIngrecEmail = (email: string): boolean => {
  return email.toLowerCase().endsWith('@iespecialidades.com');
};