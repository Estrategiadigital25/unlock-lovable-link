// src/lib/api.ts

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Array<{
    fileName: string;
    fileType: string;
    fileKey: string;
  }>;
}

export interface ChatResponse {
  reply: string;
  model?: string;
  usage?: any;
}

/**
 * Función principal para enviar mensajes al chat
 * Usa la Lambda configurada en VITE_CHAT_ENDPOINT
 */
export async function chat(messages: ChatMessage[]): Promise<ChatResponse> {
  const CHAT_ENDPOINT = import.meta.env.VITE_CHAT_ENDPOINT;
  
  // Si no hay endpoint configurado, mostrar mensaje de error
  if (!CHAT_ENDPOINT) {
    console.error('VITE_CHAT_ENDPOINT no está configurado');
    throw new Error('Endpoint del chat no configurado. Contacta al administrador.');
  }

  console.log('Enviando mensajes a Lambda:', CHAT_ENDPOINT);
  console.log('Mensajes:', JSON.stringify(messages, null, 2));

  try {
    const response = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model: 'gpt-4o-mini',
        temperature: 0.7,
      })
    });

    const text = await response.text();
    console.log('Respuesta de Lambda (raw):', text);
    
    if (!response.ok) {
      console.error('Error de Lambda:', response.status, text);
      throw new Error(`Error del servidor: ${response.status}`);
    }

    let data: ChatResponse;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Error al parsear JSON:', e);
      console.error('Texto recibido:', text?.slice?.(0, 500));
      throw new Error('Respuesta inválida del servidor');
    }

    console.log('Respuesta procesada:', data);
    return data;

  } catch (error) {
    console.error('Error en función chat():', error);
    throw error;
  }
}

/**
 * Alias de la función chat para compatibilidad con código antiguo
 */
export const askChat = chat;

/**
 * Función para generar presigned URLs para subir archivos a S3
 */
export async function generatePresignedUrl(
  fileName: string,
  fileType: string,
  fileSize: number,
  userEmail?: string,
  gptId?: string
): Promise<{
  uploadUrl: string;
  accessUrl: string;
  fileKey: string;
  bucket: string;
  expires: string;
}> {
  const PRESIGNED_URL_ENDPOINT = import.meta.env.VITE_PRESIGNED_URL_ENDPOINT;
  
  if (!PRESIGNED_URL_ENDPOINT) {
    throw new Error('Endpoint de presigned URLs no configurado');
  }

  console.log('Generando presigned URL para:', fileName);

  const response = await fetch(PRESIGNED_URL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName,
      fileType,
      fileSize,
      userEmail,
      gptId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error generando presigned URL:', errorText);
    throw new Error('Error al generar URL de subida');
  }

  const data = await response.json();
  console.log('Presigned URL generada:', data.fileKey);
  
  return data;
}

/**
 * Función para subir un archivo a S3 usando presigned URL
 */
export async function uploadFileToS3(
  file: File,
  uploadUrl: string
): Promise<void> {
  console.log('Subiendo archivo a S3:', file.name);

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error subiendo archivo a S3:', errorText);
    throw new Error('Error al subir archivo');
  }

  console.log('Archivo subido exitosamente:', file.name);
}
