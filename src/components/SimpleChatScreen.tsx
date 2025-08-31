import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Bot, User, Send, Trash2, Upload, Settings, FileText, Copy, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getAppMode, generateMockResponse, hasPresignEndpoint } from "@/lib/appMode";
import { 
  getChatHistory, 
  saveChatHistory, 
  clearChatHistory, 
  saveLegacyHistory,
  saveMockUpload,
  getUserEmail,
  getCustomGPTs,
  saveCustomGPT,
  type ChatMessage,
  type MockUpload,
  type CustomGPT
} from "@/lib/localStorage";
import TrainingFilesDropzone from "@/components/TrainingFilesDropzone";

interface SimpleChatScreenProps {
  onAdminPanel: () => void;
}

const SimpleChatScreen = ({ onAdminPanel }: SimpleChatScreenProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [trainingFiles, setTrainingFiles] = useState<any[]>([]);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [customGPTs, setCustomGPTs] = useState<CustomGPT[]>([]);
  const [selectedGPT, setSelectedGPT] = useState<string | null>(null);
  const [importGPTText, setImportGPTText] = useState('');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFromURL, setImportFromURL] = useState('');
  const [isURLImportOpen, setIsURLImportOpen] = useState(false);
  const [urlGPTData, setUrlGPTData] = useState({
    name: '',
    description: '',
    instructions: '',
    icon: '🤖'
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const appMode = getAppMode();
  const userEmail = getUserEmail();
  const hasPresign = hasPresignEndpoint();

  // Cargar historial y GPTs al iniciar
  useEffect(() => {
    const history = getChatHistory();
    setMessages(history);
    const gpts = getCustomGPTs();
    setCustomGPTs(gpts);
  }, []);

  // Auto-scroll al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Enviar mensaje
  const sendMessage = async () => {
    const message = inputValue.trim();
    if (!message || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      let assistantResponse: string;

      if (appMode === 'mock') {
        // Simular respuesta en modo mock con contexto de GPT si está seleccionado
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        const currentGPT = selectedGPT ? customGPTs.find(g => g.id === selectedGPT) : null;
        const gptContext = currentGPT ? `[Usando ${currentGPT.name}] ${currentGPT.instructions}` : '';
        assistantResponse = generateMockResponse(message + (gptContext ? ` ${gptContext}` : ''));
      } else {
        // TODO: Llamar a API real en modo prod
        assistantResponse = "API real no implementada aún";
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: assistantResponse,
        timestamp: Date.now()
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);

      // Guardar en historial legacy para compatibilidad
      saveLegacyHistory({
        fecha: new Date().toISOString().split('T')[0],
        gptUsado: appMode === 'mock' ? 'ChatGPT (mock)' : 'ChatGPT',
        pregunta: message,
        respuesta: assistantResponse
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar tu mensaje. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Limpiar historial
  const handleClearHistory = () => {
    clearChatHistory();
    setMessages([]);
    toast({
      title: "Historial limpiado",
      description: "Se ha eliminado todo el historial de conversación.",
    });
  };

  // Importar GPT compartido desde JSON
  const handleImportGPT = () => {
    try {
      const gptData = JSON.parse(importGPTText);
      
      // Validar estructura básica
      if (!gptData.name || !gptData.instructions) {
        throw new Error('GPT inválido: debe tener al menos name e instructions');
      }

      const newGPT: CustomGPT = {
        id: `gpt_${Date.now()}`,
        name: gptData.name,
        description: gptData.description || '',
        instructions: gptData.instructions,
        icon: gptData.icon || '🤖',
        isDefault: false
      };

      saveCustomGPT(newGPT);
      setCustomGPTs(prev => [...prev, newGPT]);
      setImportGPTText('');
      setIsImportDialogOpen(false);

      toast({
        title: "GPT importado",
        description: `${newGPT.name} se ha añadido correctamente`,
      });
    } catch (error) {
      toast({
        title: "Error al importar GPT",
        description: "Verifica que el formato JSON sea correcto",
        variant: "destructive"
      });
    }
  };

  // Procesar URL de ChatGPT
  const handleURLProcess = () => {
    try {
      const url = importFromURL.trim();
      if (!url.includes('chatgpt.com/g/')) {
        throw new Error('URL no válida de ChatGPT');
      }

      // Extraer nombre del GPT de la URL
      const urlParts = url.split('/');
      const gptIdentifier = urlParts[urlParts.length - 1];
      const gptNameFromURL = gptIdentifier.split('-').slice(1).join(' ').toUpperCase();

      setUrlGPTData({
        name: gptNameFromURL || 'GPT Importado',
        description: `GPT importado desde: ${url}`,
        instructions: '',
        icon: '🔗'
      });

      toast({
        title: "URL procesada",
        description: "Completa la información del GPT manualmente",
      });
    } catch (error) {
      toast({
        title: "Error al procesar URL",
        description: "Verifica que sea un enlace válido de ChatGPT",
        variant: "destructive"
      });
    }
  };

  // Importar GPT desde URL (formulario manual)
  const handleImportFromURL = () => {
    if (!urlGPTData.name.trim() || (!urlGPTData.instructions.trim() && !importGPTText.trim())) {
      toast({
        title: "Error",
        description: "Por favor completa el nombre e instrucciones del GPT",
        variant: "destructive"
      });
      return;
    }

    const newGPT: CustomGPT = {
      id: crypto.randomUUID(),
      name: urlGPTData.name,
      description: urlGPTData.description,
      instructions: urlGPTData.instructions || importGPTText,
      icon: urlGPTData.icon || '🤖'
    };

    saveCustomGPT(newGPT);
    setCustomGPTs(prev => [...prev, newGPT]);
    
    // Reset form
    setUrlGPTData({
      name: '',
      description: '',
      instructions: '',
      icon: '🤖'
    });
    setImportFromURL('');
    setImportGPTText('');
    setIsURLImportOpen(false);
    
    toast({
      title: "GPT importado",
      description: `${newGPT.name} se ha añadido a tus GPTs personalizados`
    });
  };

  // Nueva función para pegar rápido desde portapapeles
  const handleQuickPaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      
      // Si es una URL de ChatGPT
      if (clipboardText.includes('chatgpt.com/g/')) {
        setImportFromURL(clipboardText);
        setIsURLImportOpen(true);
        setTimeout(() => handleURLProcess(), 100);
        return;
      }
      
      // Si parece ser JSON
      if (clipboardText.trim().startsWith('{') && clipboardText.trim().endsWith('}')) {
        try {
          JSON.parse(clipboardText);
          setImportGPTText(clipboardText);
          setIsURLImportOpen(true);
        } catch (e) {
          toast({
            title: "Formato incorrecto",
            description: "El texto copiado no es un JSON válido",
            variant: "destructive"
          });
        }
        return;
      }
      
      // Si es texto normal, asumir que son instrucciones
      if (clipboardText.trim().length > 10) {
        setUrlGPTData(prev => ({ 
          ...prev, 
          instructions: clipboardText.trim(),
          name: 'GPT Personalizado'
        }));
        setIsURLImportOpen(true);
        return;
      }
      
      toast({
        title: "Contenido no reconocido",
        description: "No se pudo identificar el formato del contenido copiado",
        variant: "destructive"
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo acceder al portapapeles",
        variant: "destructive"
      });
    }
  };

  // Manejar upload de archivos con guardia de presign
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadStatus('uploading');

    try {
      const file = files[0];
      
      if (!hasPresign) {
        // Fallback: simula subida y guarda referencia local
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const mockKey = `mock/${Date.now()}_${file.name}`;
        const mockUpload: MockUpload = {
          key: mockKey,
          name: file.name,
          type: file.type,
          size: file.size,
          timestamp: Date.now()
        };
        
        saveMockUpload(mockUpload);
        setUploadStatus('done');
        
        toast({
          title: "MODO DEMO: Subida simulada",
          description: `${file.name} - Configura VITE_PRESIGN_ENDPOINT para S3 real`,
          variant: "default"
        });
      } else {
        // TODO: Implementar subida real con presign
        setUploadStatus('error');
        toast({
          title: "Error",
          description: "Subida real con presign no implementada aún",
          variant: "destructive"
        });
      }
    } catch (error) {
      setUploadStatus('error');
      toast({
        title: "Error de subida",
        description: "No se pudo subir el archivo",
        variant: "destructive"
      });
    }
  };

  // Copiar conversación
  const copyConversation = () => {
    const conversationText = messages.map(msg => 
      `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`
    ).join('\n\n');
    
    navigator.clipboard.writeText(conversationText).then(() => {
      toast({
        title: "Copiado",
        description: "La conversación se ha copiado al portapapeles.",
      });
    });
  };

  return (
    <div className="flex h-screen bg-background font-montserrat">
      {/* Panel lateral */}
      <div className="w-80 bg-card border-r border-border flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/lovable-uploads/4c7e0a4b-080a-437a-b8e8-bb34ebe70495.png" alt="Ingtec" className="w-8 h-8" />
              <div>
                <h2 className="font-bold text-lg">Buscador GPT</h2>
                <p className="text-xs text-muted-foreground">Ingtec Especialidades</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              {appMode === 'mock' ? 'MOCK' : 'PROD'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1 space-y-4">
          {/* Info del usuario */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium">Usuario activo:</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>

          {/* Estadísticas */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Sesión actual:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-primary/10 rounded text-center">
                <div className="font-bold">{messages.length}</div>
                <div className="text-muted-foreground">Mensajes</div>
              </div>
              <div className="p-2 bg-secondary/10 rounded text-center">
                <div className="font-bold">{Math.floor(messages.length / 2)}</div>
                <div className="text-muted-foreground">Consultas</div>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="space-y-2">
            <Button
              onClick={handleClearHistory}
              variant="outline"
              size="sm"
              className="w-full justify-start"
              disabled={messages.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpiar historial
            </Button>

            <Button
              onClick={copyConversation}
              variant="outline"
              size="sm"
              className="w-full justify-start"
              disabled={messages.length === 0}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar conversación
            </Button>

            <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Configuración
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Configuración del Sistema</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Variables del Sistema</h3>
                    <div className="space-y-2 text-sm font-mono">
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>VITE_MODE</span>
                        <span>{appMode}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Email</span>
                        <span className="truncate max-w-48">{userEmail}</span>
                      </div>
                    </div>
                  </div>
                  
                  {appMode === 'mock' && (
                    <div>
                      <h3 className="font-medium mb-2">Entrenamiento (Mock)</h3>
                      <TrainingFilesDropzone
                        presignEndpoint=""
                        onChange={setTrainingFiles}
                        maxFiles={5}
                        maxSizeMB={10}
                      />
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Button
              onClick={onAdminPanel}
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              <FileText className="w-4 h-4 mr-2" />
              Panel Admin
            </Button>
          </div>
        </CardContent>
      </div>

      {/* Área de chat */}
      <div className="flex-1 flex flex-col">
        {/* Header del chat */}
        <div className="border-b border-border p-4 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Chat con Asistente IA</h1>
              <p className="text-sm text-muted-foreground">
                Especializado en consultas técnicas de Ingtec
                {selectedGPT && customGPTs.find(g => g.id === selectedGPT) && (
                  <span className="ml-2">| GPT: {customGPTs.find(g => g.id === selectedGPT)?.name}</span>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {!hasPresign && (
                <div className="px-3 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-xs rounded-md">
                  Modo Demo
                </div>
              )}
              
              {/* Función principal de importar GPT */}
              <div className="flex flex-col space-y-2">
                <Dialog open={isURLImportOpen} onOpenChange={setIsURLImportOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default" size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 font-medium">
                      <Plus className="h-4 w-4 mr-2" />
                      Importar GPT Compartido
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Importar GPT Compartido</DialogTitle>
                      <p className="text-sm text-muted-foreground">
                        Pega el enlace de ChatGPT que te compartieron o el código JSON
                      </p>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Enlace de ChatGPT</label>
                        <Input
                          placeholder="https://chatgpt.com/g/g-xxxxx-nombre-gpt"
                          value={importFromURL}
                          onChange={(e) => setImportFromURL(e.target.value)}
                          onPaste={async (e) => {
                            const pastedText = e.clipboardData.getData('text');
                            if (pastedText.includes('chatgpt.com/g/')) {
                              setImportFromURL(pastedText);
                              // Auto-procesar después de un breve delay
                              setTimeout(() => handleURLProcess(), 100);
                            }
                          }}
                        />
                        <Button 
                          onClick={handleURLProcess} 
                          size="sm" 
                          className="mt-2 w-full"
                          disabled={!importFromURL.trim()}
                        >
                          Procesar Enlace
                        </Button>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div>
                        <label className="text-sm font-medium">O pega el código JSON</label>
                        <Textarea
                          placeholder="Pega aquí el JSON del GPT compartido..."
                          value={importGPTText}
                          onChange={(e) => setImportGPTText(e.target.value)}
                          rows={4}
                        />
                        <Button 
                          onClick={handleImportGPT} 
                          size="sm" 
                          className="mt-2 w-full"
                          disabled={!importGPTText.trim()}
                        >
                          Importar desde JSON
                        </Button>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">Nombre</label>
                          <Input
                            placeholder="Nombre del GPT"
                            value={urlGPTData.name}
                            onChange={(e) => setUrlGPTData(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Descripción</label>
                          <Input
                            placeholder="Descripción del GPT"
                            value={urlGPTData.description}
                            onChange={(e) => setUrlGPTData(prev => ({ ...prev, description: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Instrucciones</label>
                          <Textarea
                            placeholder="Instrucciones o prompt del GPT"
                            value={urlGPTData.instructions}
                            onChange={(e) => setUrlGPTData(prev => ({ ...prev, instructions: e.target.value }))}
                            rows={4}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Icono (emoji)</label>
                          <Input
                            placeholder="🤖"
                            value={urlGPTData.icon}
                            onChange={(e) => setUrlGPTData(prev => ({ ...prev, icon: e.target.value }))}
                            maxLength={2}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsURLImportOpen(false)}>
                            Cancelar
                          </Button>
                          <Button 
                            onClick={handleImportFromURL}
                            disabled={!urlGPTData.name.trim() || !urlGPTData.instructions.trim()}
                          >
                            Guardar GPT
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                {/* Botón de acceso rápido para portapapeles */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleQuickPaste}
                  className="text-xs opacity-75 hover:opacity-100"
                >
                  📋 Pegar desde portapapeles
                </Button>
              </div>

              
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
                disabled={uploadStatus === 'uploading'}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadStatus === 'uploading' ? 'Subiendo...' : 'Subir archivo'}
              </Button>
            </div>
          </div>

          {/* GPT Selector */}
          {customGPTs.length > 0 && (
            <div className="px-4 pb-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedGPT === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedGPT(null)}
                >
                  🤖 Por defecto
                </Button>
                {customGPTs.map((gpt) => (
                  <Button
                    key={gpt.id}
                    variant={selectedGPT === gpt.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedGPT(gpt.id)}
                  >
                    {gpt.icon} {gpt.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium">¡Hola! Soy tu asistente de Ingtec</h3>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                  Puedo ayudarte con consultas técnicas, formulaciones, procesos y análisis especializado.
                  {appMode === 'mock' && <span className="block mt-1 text-primary font-medium">(Funcionando en modo simulado)</span>}
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-2xl p-4 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-2">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-secondary" />
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="max-w-2xl p-4 rounded-lg bg-muted">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input de mensaje */}
        <div className="border-t border-border p-4 bg-card">
          <div className="max-w-4xl mx-auto flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Escribe tu consulta técnica aquí..."
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!inputValue.trim() || isLoading}
              className="px-6"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Presiona Enter para enviar • Shift + Enter para nueva línea
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimpleChatScreen;