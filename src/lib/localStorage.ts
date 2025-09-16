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

// Export custom GPT to JSON
export const exportCustomGPT = (gpt: CustomGPT): string => {
  try {
    const exportData = {
      ...gpt,
      exportDate: new Date().toISOString(),
      version: '1.0',
      type: 'custom-gpt-export'
    };
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Error exporting custom GPT:', error);
    throw new Error('Failed to export GPT');
  }
};

// Export all custom GPTs to JSON
export const exportAllCustomGPTs = (): string => {
  try {
    const gpts = getCustomGPTs();
    const exportData = {
      gpts,
      exportDate: new Date().toISOString(),
      version: '1.0',
      type: 'custom-gpts-collection-export',
      count: gpts.length
    };
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Error exporting all custom GPTs:', error);
    throw new Error('Failed to export GPTs collection');
  }
};

// Validate GPT import data
export const validateGPTImportData = (data: any): { isValid: boolean; error?: string; gpt?: CustomGPT } => {
  try {
    // Handle single GPT export format
    if (data.type === 'custom-gpt-export' && data.name && data.instructions) {
      const gpt: CustomGPT = {
        id: data.id || crypto.randomUUID(),
        name: data.name,
        description: data.description || '',
        instructions: data.instructions,
        icon: data.icon || '🤖',
        isDefault: false
      };
      return { isValid: true, gpt };
    }
    
    // Handle legacy format (just GPT object)
    if (data.name && data.instructions && !data.type) {
      const gpt: CustomGPT = {
        id: data.id || crypto.randomUUID(),
        name: data.name,
        description: data.description || '',
        instructions: data.instructions,
        icon: data.icon || '🤖',
        isDefault: false
      };
      return { isValid: true, gpt };
    }
    
    return { isValid: false, error: 'Invalid GPT format. Missing required fields: name and instructions' };
  } catch (error) {
    return { isValid: false, error: 'Invalid JSON structure' };
  }
};

// Validate GPTs collection import data
export const validateGPTsCollectionData = (data: any): { isValid: boolean; error?: string; gpts?: CustomGPT[] } => {
  try {
    // Handle collection export format
    if (data.type === 'custom-gpts-collection-export' && Array.isArray(data.gpts)) {
      const validGPTs: CustomGPT[] = [];
      
      for (const gptData of data.gpts) {
        const validation = validateGPTImportData(gptData);
        if (validation.isValid && validation.gpt) {
          validGPTs.push(validation.gpt);
        }
      }
      
      if (validGPTs.length === 0) {
        return { isValid: false, error: 'No valid GPTs found in collection' };
      }
      
      return { isValid: true, gpts: validGPTs };
    }
    
    // Handle array of GPTs (legacy format)
    if (Array.isArray(data)) {
      const validGPTs: CustomGPT[] = [];
      
      for (const gptData of data) {
        const validation = validateGPTImportData(gptData);
        if (validation.isValid && validation.gpt) {
          validGPTs.push(validation.gpt);
        }
      }
      
      if (validGPTs.length === 0) {
        return { isValid: false, error: 'No valid GPTs found in array' };
      }
      
      return { isValid: true, gpts: validGPTs };
    }
    
    return { isValid: false, error: 'Invalid collection format. Expected array of GPTs or collection export format' };
  } catch (error) {
    return { isValid: false, error: 'Invalid JSON structure' };
  }
};

// Import custom GPT with duplicate handling
export const importCustomGPT = (gpt: CustomGPT, allowDuplicates: boolean = false): { success: boolean; error?: string; action?: 'imported' | 'skipped' | 'updated' } => {
  try {
    const existingGPTs = getCustomGPTs();
    const existingGPT = existingGPTs.find(g => g.name === gpt.name);
    
    if (existingGPT && !allowDuplicates) {
      return { success: false, error: `GPT "${gpt.name}" already exists`, action: 'skipped' };
    }
    
    if (existingGPT && allowDuplicates) {
      // Update existing GPT
      const updatedGPTs = existingGPTs.map(g => g.name === gpt.name ? { ...gpt, id: g.id } : g);
      localStorage.setItem('ingtec_custom_gpts', JSON.stringify(updatedGPTs));
      return { success: true, action: 'updated' };
    }
    
    // Add new GPT
    saveCustomGPT(gpt);
    return { success: true, action: 'imported' };
  } catch (error) {
    console.error('Error importing custom GPT:', error);
    return { success: false, error: 'Failed to import GPT' };
  }
};

// Bulk import custom GPTs
export const importCustomGPTs = (gpts: CustomGPT[], allowDuplicates: boolean = false): { 
  success: boolean; 
  results: { imported: number; updated: number; skipped: number; errors: string[] } 
} => {
  const results = { imported: 0, updated: 0, skipped: 0, errors: [] as string[] };
  
  for (const gpt of gpts) {
    const result = importCustomGPT(gpt, allowDuplicates);
    
    if (result.success) {
      switch (result.action) {
        case 'imported':
          results.imported++;
          break;
        case 'updated':
          results.updated++;
          break;
        case 'skipped':
          results.skipped++;
          break;
      }
    } else {
      results.errors.push(result.error || 'Unknown error');
    }
  }
  
  return { success: results.errors.length === 0, results };
};

// Download file utility
export const downloadFile = (content: string, filename: string, mimeType: string = 'application/json'): void => {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw new Error('Failed to download file');
  }
};