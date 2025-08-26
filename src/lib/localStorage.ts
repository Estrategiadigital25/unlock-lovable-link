// LocalStorage utilities for mock mode
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface MockUpload {
  key: string;
  name: string;
  type: string;
  size: number;
  timestamp: number;
}

export interface MockHistory {
  fecha: string;
  gptUsado: string;
  pregunta: string;
  respuesta: string;
}

// Chat history management
export const getChatHistory = (): ChatMessage[] => {
  try {
    const data = localStorage.getItem('ingtec_chat_history');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveChatHistory = (messages: ChatMessage[]): void => {
  try {
    localStorage.setItem('ingtec_chat_history', JSON.stringify(messages));
  } catch (error) {
    console.error('Error saving chat history:', error);
  }
};

export const clearChatHistory = (): void => {
  localStorage.removeItem('ingtec_chat_history');
};

// Upload management
export const getMockUploads = (): MockUpload[] => {
  try {
    const data = localStorage.getItem('ingtec_uploads_mock');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveMockUpload = (upload: MockUpload): void => {
  try {
    const uploads = getMockUploads();
    uploads.push(upload);
    localStorage.setItem('ingtec_uploads_mock', JSON.stringify(uploads));
  } catch (error) {
    console.error('Error saving mock upload:', error);
  }
};

// Legacy history (for compatibility)
export const getLegacyHistory = (): MockHistory[] => {
  try {
    const data = localStorage.getItem('historialGPT');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveLegacyHistory = (item: MockHistory): void => {
  try {
    const history = getLegacyHistory();
    history.unshift(item);
    localStorage.setItem('historialGPT', JSON.stringify(history));
  } catch (error) {
    console.error('Error saving legacy history:', error);
  }
};

// User session
export const getUserEmail = (): string => {
  return localStorage.getItem('userEmail') || '';
};

export const saveUserEmail = (email: string): void => {
  localStorage.setItem('userEmail', email);
};

export const clearUserSession = (): void => {
  localStorage.removeItem('userEmail');
};