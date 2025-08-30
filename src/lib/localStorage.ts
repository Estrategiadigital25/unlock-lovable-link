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

// Custom GPTs management
export interface CustomGPT {
  id: string;
  name: string;
  description: string;
  instructions: string;
  icon: string;
  isDefault?: boolean;
}

export const getCustomGPTs = (): CustomGPT[] => {
  try {
    const data = localStorage.getItem('ingtec_custom_gpts');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading custom GPTs:', error);
    return [];
  }
};

export const saveCustomGPT = (gpt: CustomGPT): void => {
  try {
    const gpts = getCustomGPTs();
    const existingIndex = gpts.findIndex(g => g.id === gpt.id);
    
    if (existingIndex >= 0) {
      gpts[existingIndex] = gpt;
    } else {
      gpts.push(gpt);
    }
    
    localStorage.setItem('ingtec_custom_gpts', JSON.stringify(gpts));
  } catch (error) {
    console.error('Error saving custom GPT:', error);
  }
};

export const deleteCustomGPT = (id: string): void => {
  try {
    const gpts = getCustomGPTs().filter(g => g.id !== id);
    localStorage.setItem('ingtec_custom_gpts', JSON.stringify(gpts));
  } catch (error) {
    console.error('Error deleting custom GPT:', error);
  }
};