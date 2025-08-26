import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Copy, Edit, Settings, Plus, Paperclip, Image, FileText, Trash2, Bot, User, Upload, X } from "lucide-react";
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { useToast } from "@/components/ui/use-toast";
import { detectMode, type Mode } from "@/lib/promptOptimizer";
import { askChat, type ChatMessage } from "@/lib/api";
import { supabase } from '@/integrations/supabase/client';

interface ChatScreenProps {
  onAdminPanel: () => void;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
  gptUsed?: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'pdf';
  url: string;
  size: number;
}

interface CustomGPT {
  id: string;
  name: string;
  description: string;
  instructions: string;
  icon: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  isDefault?: boolean;
}

interface TrainingFile {
  id: string;
  gpt_id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  original_url: string | null;
  processed_content: string | null;
  created_at: string;
}

const ChatScreen = ({ onAdminPanel }: ChatScreenProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const [historialBusquedas, setHistorialBusquedas] = useState<string[]>([]);
  const [selectedGPT, setSelectedGPT] = useState<string>('gpt4');
  const [customGPTs, setCustomGPTs] = useState<CustomGPT[]>([]);
  const [isCreatingGPT, setIsCreatingGPT] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newGPTName, setNewGPTName] = useState('');
  const [newGPTDescription, setNewGPTDescription] = useState('');
  const [newGPTInstructions, setNewGPTInstructions] = useState('');
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [currentGPTFiles, setCurrentGPTFiles] = useState<TrainingFile[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [mode, setMode] = useState<Mode>('AUTO');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const trainingFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // GPT principal para todas las búsquedas
  const defaultGPTs: CustomGPT[] = [
    {
      id: 'gpt4',
      name: 'ChatGPT — Buscador Principal',
      description: 'Buscador inteligente con ChatGPT (última versión) para consultas especializadas',
      instructions: 'Eres un asistente especializado con acceso a ChatGPT (última versión). Respondes consultas técnicas y especializadas de manera precisa y profesional.',
      icon: '🔍',
      isDefault: true
    }
  ];

  // Cargar datos y verificar autenticación
  useEffect(() => {
    loadFromLocalStorage();
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
    if (user) {
      loadCustomGPTs();
    }
  };

  const loadFromLocalStorage = () => {
    const savedConversations = localStorage.getItem('conversations');
    
    if (savedConversations) {
      try {
        const parsedConversations = JSON.parse(savedConversations).map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setConversations(parsedConversations);
      } catch (error) {
        console.error('Error loading conversations:', error);
      }
    }
  };

  const loadCustomGPTs = async () => {
    if (!currentUser) return;

    try {
      const { data: gpts, error } = await supabase
        .from('custom_gpts')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomGPTs(gpts || []);
    } catch (error) {
      console.error('Error loading custom GPTs:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los GPTs personalizados.",
        variant: "destructive"
      });
    }
  };

  const loadGPTFiles = async (gptId: string) => {
    if (!currentUser) return;

    try {
      const { data: files, error } = await supabase
        .from('gpt_training_files')
        .select('*')
        .eq('gpt_id', gptId)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCurrentGPTFiles(files || []);
    } catch (error) {
      console.error('Error loading GPT files:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los archivos del GPT.",
        variant: "destructive"
      });
    }
  };

  // Manejar archivos de entrenamiento
  const handleTrainingFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, gptId: string) => {
    const files = event.target.files;
    if (!files || !currentUser) return;

    setIsUploadingFile(true);

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('gptId', gptId);

        const { data: { session } } = await supabase.auth.getSession();
        
        const response = await fetch(`https://lozhxacampqoxmjbnekf.supabase.co/functions/v1/process-file`, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error procesando archivo');
        }

        const result = await response.json();
        
        toast({
          title: "Archivo procesado",
          description: `${file.name} se procesó correctamente (${result.contentLength} caracteres extraídos).`,
        });

        // Recargar archivos
        await loadGPTFiles(gptId);

      } catch (error) {
        console.error('Error uploading file:', error);
        toast({
          title: "Error",
          description: `No se pudo procesar ${file.name}.`,
          variant: "destructive"
        });
      }
    }

    setIsUploadingFile(false);
    // Reset input
    if (trainingFileInputRef.current) {
      trainingFileInputRef.current.value = '';
    }
  };

  const deleteTrainingFile = async (fileId: string) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('gpt_training_files')
        .delete()
        .eq('id', fileId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      toast({
        title: "Archivo eliminado",
        description: "El archivo se eliminó correctamente.",
      });

      // Recargar archivos
      const gptId = currentGPTFiles.find(f => f.id === fileId)?.gpt_id;
      if (gptId) {
        await loadGPTFiles(gptId);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el archivo.",
        variant: "destructive"
      });
    }
  };

  // Manejo de conversaciones
  const generateAutoTitle = (firstMessage: string): string => {
    const words = firstMessage.split(' ').slice(0, 6);
    return words.join(' ') + (firstMessage.split(' ').length > 6 ? '...' : '');
  };

  const saveCurrentConversation = () => {
    if (messages.length === 0) return;

    const conversationToSave = {
      id: currentConversationId || Date.now().toString(),
      title: currentConversationId 
        ? conversations.find(c => c.id === currentConversationId)?.title || generateAutoTitle(messages[0]?.content || '')
        : generateAutoTitle(messages[0]?.content || ''),
      messages: messages,
      createdAt: currentConversationId 
        ? conversations.find(c => c.id === currentConversationId)?.createdAt || new Date()
        : new Date(),
      updatedAt: new Date()
    };

    const updatedConversations = currentConversationId
      ? conversations.map(c => c.id === currentConversationId ? conversationToSave : c)
      : [conversationToSave, ...conversations];

    setConversations(updatedConversations);
    localStorage.setItem('conversations', JSON.stringify(updatedConversations));
    setCurrentConversationId(conversationToSave.id);
  };

  // Crear GPT personalizado
  const createCustomGPT = async () => {
    if (!newGPTName.trim() || !newGPTInstructions.trim() || !currentUser) {
      toast({
        title: "Error",
        description: "El nombre, las instrucciones y la autenticación son obligatorios.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: newGPT, error } = await supabase
        .from('custom_gpts')
        .insert({
          user_id: currentUser.id,
          name: newGPTName,
          description: newGPTDescription || 'GPT personalizado',
          instructions: newGPTInstructions,
          icon: '🤖'
        })
        .select()
        .single();

      if (error) throw error;

      setCustomGPTs(prev => [newGPT, ...prev]);
      
      setNewGPTName('');
      setNewGPTDescription('');
      setNewGPTInstructions('');
      setTestInput('');
      setTestOutput('');
      setIsCreatingGPT(false);

      toast({
        title: "GPT creado",
        description: `Se ha creado el GPT "${newGPT.name}" exitosamente.`,
      });
    } catch (error) {
      console.error('Error creating GPT:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el GPT personalizado.",
        variant: "destructive"
      });
    }
  };

  const deleteCustomGPT = async (gptId: string) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('custom_gpts')
        .delete()
        .eq('id', gptId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      setCustomGPTs(prev => prev.filter(gpt => gpt.id !== gptId));

      toast({
        title: "GPT eliminado",
        description: "El GPT personalizado se eliminó correctamente.",
      });
    } catch (error) {
      console.error('Error deleting GPT:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el GPT.",
        variant: "destructive"
      });
    }
  };

  // Manejar envío de mensajes con contexto de archivos
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
      gptUsed: 'Usuario'
    };

    setMessages(prev => [...prev, userMessage]);

    // limpiar input/adjuntos
    setInputValue('');
    setAttachments([]);

    const finalMode = mode === 'AUTO' ? detectMode(userMessage.content) : mode;
    
    try {
      // Obtener contexto de archivos si hay un GPT personalizado seleccionado
      let contextualizedPrompt = userMessage.content;
      
      if (selectedGPT !== 'gpt4' && currentUser) {
        const selectedCustomGPT = customGPTs.find(gpt => gpt.id === selectedGPT);
        if (selectedCustomGPT) {
          // Obtener archivos de entrenamiento
          const { data: trainingFiles } = await supabase
            .from('gpt_training_files')
            .select('processed_content')
            .eq('gpt_id', selectedGPT)
            .eq('user_id', currentUser.id);

          if (trainingFiles && trainingFiles.length > 0) {
            const trainingContext = trainingFiles
              .map(file => file.processed_content)
              .filter(content => content && content.trim())
              .join('\n\n');

            if (trainingContext) {
              contextualizedPrompt = `Contexto de entrenamiento:\n${trainingContext}\n\nInstrucciones del GPT: ${selectedCustomGPT.instructions}\n\nConsulta del usuario: ${userMessage.content}`;
            } else {
              contextualizedPrompt = `Instrucciones del GPT: ${selectedCustomGPT.instructions}\n\nConsulta del usuario: ${userMessage.content}`;
            }
          } else {
            contextualizedPrompt = `Instrucciones del GPT: ${selectedCustomGPT.instructions}\n\nConsulta del usuario: ${userMessage.content}`;
          }
        }
      }

      const chatMessages: ChatMessage[] = [
        { role: 'user', content: contextualizedPrompt }
      ];

      const respuesta = await askChat(chatMessages);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: respuesta,
        timestamp: new Date(),
        gptUsed: selectedGPT === 'gpt4' ? 'ChatGPT' : customGPTs.find(gpt => gpt.id === selectedGPT)?.name || 'GPT Personalizado'
      };

      setMessages(prev => [...prev, assistantMessage]);
      saveCurrentConversation();
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje. Verifica tu conexión.",
        variant: "destructive"
      });
    }
  };

  // Manejar carga de archivos adjuntos en mensajes
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const attachment: Attachment = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 
              file.type === 'application/pdf' ? 'pdf' : 'document',
        url: URL.createObjectURL(file),
        size: file.size
      };
      setAttachments(prev => [...prev, attachment]);
    });

    toast({
      title: "Archivos adjuntos",
      description: `Se han adjuntado ${files.length} archivo(s) al mensaje.`,
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const allGPTs = [...defaultGPTs, ...customGPTs];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-1/4 border-r border-border bg-card p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Conversaciones</h2>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setMessages([]);
              setCurrentConversationId(null);
              setAttachments([]);
              setInputValue('');
            }}
            className="rounded-[20px]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva
          </Button>
        </div>

        <ScrollArea className="flex-1 mb-4">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-3 rounded-lg cursor-pointer mb-2 transition-colors ${
                currentConversationId === conversation.id 
                  ? 'bg-primary/10 border-primary/20 border' 
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => {
                setMessages(conversation.messages);
                setCurrentConversationId(conversation.id);
                setAttachments([]);
                setInputValue('');
              }}
            >
              <div className="flex items-center justify-between mb-1">
                {editingTitleId === conversation.id ? (
                  <Input
                    value={editingTitleValue}
                    onChange={(e) => setEditingTitleValue(e.target.value)}
                    onBlur={() => {
                      const updatedConversations = conversations.map(c =>
                        c.id === conversation.id ? { ...c, title: editingTitleValue } : c
                      );
                      setConversations(updatedConversations);
                      localStorage.setItem('conversations', JSON.stringify(updatedConversations));
                      setEditingTitleId(null);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const updatedConversations = conversations.map(c =>
                          c.id === conversation.id ? { ...c, title: editingTitleValue } : c
                        );
                        setConversations(updatedConversations);
                        localStorage.setItem('conversations', JSON.stringify(updatedConversations));
                        setEditingTitleId(null);
                      }
                    }}
                    className="text-sm h-6"
                    autoFocus
                  />
                ) : (
                  <span className="font-medium text-sm truncate flex-1">{conversation.title}</span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingTitleId(conversation.id);
                    setEditingTitleValue(conversation.title);
                  }}
                  className="h-6 w-6 p-0"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {conversation.updatedAt.toLocaleDateString()} • {conversation.messages.length} mensajes
              </p>
            </div>
          ))}
        </ScrollArea>

        <Separator className="mb-4" />

        {/* GPTs Personalizados */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">GPTs Personalizados</h3>
            <Dialog open={isCreatingGPT} onOpenChange={setIsCreatingGPT}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-[20px]">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear GPT
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crear GPT Personalizado</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Panel de configuración */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Configuración</h3>
                    <div>
                      <label className="text-sm font-medium">Nombre *</label>
                      <Input
                        value={newGPTName}
                        onChange={(e) => setNewGPTName(e.target.value)}
                        placeholder="Ej: Asistente Contable"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Descripción</label>
                      <Input
                        value={newGPTDescription}
                        onChange={(e) => setNewGPTDescription(e.target.value)}
                        placeholder="Describe para qué sirve este GPT"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Instrucciones *</label>
                      <Textarea
                        value={newGPTInstructions}
                        onChange={(e) => setNewGPTInstructions(e.target.value)}
                        placeholder="Define el comportamiento y especialización del GPT..."
                        rows={6}
                      />
                    </div>
                    
                    {/* Área de archivos de entrenamiento */}
                    {newGPTName && (
                      <div>
                        <label className="text-sm font-medium">Archivos de entrenamiento</label>
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                          <input
                            ref={trainingFileInputRef}
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              // Esta funcionalidad se activará después de crear el GPT
                              toast({
                                title: "Información",
                                description: "Los archivos se pueden subir después de crear el GPT.",
                              });
                            }}
                            className="hidden"
                          />
                          <Paperclip className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Los archivos se subirán después de crear el GPT
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Soporta: PDF, DOC, TXT, JPG, PNG
                          </p>
                        </div>

                        {/* Lista de archivos actuales */}
                        {currentGPTFiles.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <p className="text-sm font-medium">Archivos cargados:</p>
                            <div className="max-h-32 overflow-y-auto space-y-1">
                              {currentGPTFiles.map((file) => (
                                <div key={file.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    <span className="truncate">{file.file_name}</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {(file.file_size / 1024).toFixed(1)}KB
                                    </Badge>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteTrainingFile(file.id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Panel de pruebas */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Acciones</h3>
                    
                    <Button 
                      onClick={createCustomGPT}
                      className="w-full"
                      disabled={!newGPTName.trim() || !newGPTInstructions.trim()}
                    >
                      Crear GPT Personalizado
                    </Button>
                    
                    <div>
                      <label className="text-sm font-medium">Vista previa de instrucciones</label>
                      <div className="border rounded p-3 bg-muted/50 text-sm min-h-[100px]">
                        {newGPTInstructions || "Las instrucciones aparecerán aquí..."}
                      </div>
                    </div>

                    {currentUser && (
                      <div className="text-xs text-muted-foreground p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <strong>💡 Consejos:</strong>
                        <ul className="mt-2 space-y-1">
                          <li>• Sé específico en las instrucciones</li>
                          <li>• Define el tono y estilo de respuesta</li>
                          <li>• Menciona qué tipo de consultas debe manejar</li>
                          <li>• Los archivos de entrenamiento se procesan automáticamente</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <ScrollArea className="max-h-48">
            {customGPTs.map((gpt) => (
              <div key={gpt.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded group">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-lg">{gpt.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{gpt.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{gpt.description}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsCreatingGPT(true);
                      loadGPTFiles(gpt.id);
                      setNewGPTName(gpt.name);
                      setNewGPTDescription(gpt.description);
                      setNewGPTInstructions(gpt.instructions);
                    }}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteCustomGPT(gpt.id)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border p-4 bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">Buscador GPT - Ingtec Especialidades</h1>
              <Select value={selectedGPT} onValueChange={setSelectedGPT}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allGPTs.map((gpt) => (
                    <SelectItem key={gpt.id} value={gpt.id}>
                      <div className="flex items-center gap-2">
                        <span>{gpt.icon}</span>
                        <span>{gpt.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={onAdminPanel}>
              <Settings className="h-4 w-4 mr-2" />
              Admin
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <Card className={`max-w-[80%] ${message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {message.type === 'user' ? (
                          <User className="h-6 w-6" />
                        ) : (
                          <Bot className="h-6 w-6" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {message.gptUsed || (message.type === 'user' ? 'Usuario' : 'Asistente')}
                          </span>
                          <span className="text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mb-3 space-y-2">
                            {message.attachments.map((att) => (
                              <div key={att.id} className="flex items-center gap-2 p-2 bg-background/20 rounded">
                                {att.type === 'image' && <Image className="h-4 w-4" />}
                                {att.type === 'document' && <FileText className="h-4 w-4" />}
                                {att.type === 'pdf' && <FileText className="h-4 w-4" />}
                                <span className="text-sm">{att.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border p-4 bg-card">
          <div className="max-w-4xl mx-auto space-y-3">
            {/* Selected GPT Info */}
            {selectedGPT !== 'gpt4' && (
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                <strong>GPT Activo:</strong> {allGPTs.find(gpt => gpt.id === selectedGPT)?.name}
                {customGPTs.find(gpt => gpt.id === selectedGPT) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const gpt = customGPTs.find(g => g.id === selectedGPT);
                      if (gpt) {
                        setIsCreatingGPT(true);
                        loadGPTFiles(gpt.id);
                        setNewGPTName(gpt.name);
                        setNewGPTDescription(gpt.description);
                        setNewGPTInstructions(gpt.instructions);
                      }
                    }}
                    className="ml-2"
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Subir archivos
                  </Button>
                )}
              </div>
            )}

            {/* Archivos adjuntos */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Archivos adjuntos:</p>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((attachment) => (
                    <Badge key={attachment.id} variant="secondary" className="flex items-center gap-2">
                      {attachment.type === 'image' && <Image className="h-3 w-3" />}
                      {attachment.type === 'document' && <FileText className="h-3 w-3" />}
                      {attachment.type === 'pdf' && <FileText className="h-3 w-3" />}
                      <span className="text-xs">{attachment.name}</span>
                      <button
                        onClick={() => removeAttachment(attachment.id)}
                        className="ml-1 hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <div className="flex-1 flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Escribe tu consulta aquí..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={handleSendMessage} disabled={!inputValue.trim()}>
                Enviar
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;
