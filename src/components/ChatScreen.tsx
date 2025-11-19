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
import { Download, Copy, Edit, Settings, Plus, Paperclip, Image, FileText, Trash2, Bot, User, LogOut } from "lucide-react";
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { useToast } from "@/components/ui/use-toast";
import { detectMode, type Mode } from "@/lib/promptOptimizer";
import { askChat, type ChatMessage } from "@/lib/api";
import { getUserEmail } from "@/lib/localStorage";
import TrainingFilesDropzone from "@/components/TrainingFilesDropzone";
import GPTImportExport from "@/components/GPTImportExport";

interface ChatScreenProps {
  onAdminPanel: () => void;
  onLogout: () => void;
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
  fileKey?: string;
}

interface CustomGPT {
  id: string;
  name: string;
  description: string;
  instructions: string;
  icon: string;
  isDefault?: boolean;
  trainingFiles?: UploadedFile[];
}

interface UploadedFile {
  url: string;
  name: string;
  key: string;
  type: string;
  size: number;
}

const ChatScreen = ({ onAdminPanel, onLogout }: ChatScreenProps) => {
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
  
  const userEmail = getUserEmail();
  const [newGPTName, setNewGPTName] = useState('');
  const [newGPTDescription, setNewGPTDescription] = useState('');
  const [newGPTInstructions, setNewGPTInstructions] = useState('');
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [trainingFiles, setTrainingFiles] = useState<UploadedFile[]>([]);
  
  const [mode, setMode] = useState<Mode>('AUTO');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  useEffect(() => {
    const savedConversations = localStorage.getItem('conversations');
    const savedGPTs = localStorage.getItem('custom_gpts');

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

    if (savedGPTs) {
      try {
        setCustomGPTs(JSON.parse(savedGPTs));
      } catch (error) {
        console.error('Error loading GPTs:', error);
      }
    }

    try {
      const hist = JSON.parse(localStorage.getItem('historialGPT') || '[]');
      setHistorialBusquedas(Array.isArray(hist) ? hist.map((i: any) => i.pregunta) : []);
    } catch {
      setHistorialBusquedas([]);
    }
  }, []);

  const generateAutoTitle = (firstMessage: string): string => {
    const words = firstMessage.trim().split(' ').slice(0, 6);
    return words.join(' ') + (firstMessage.split(' ').length > 6 ? '...' : '');
  };

  const saveCurrentConversation = () => {
    if (messages.length === 0) return;

    const now = new Date();
    let conversation: Conversation;

    if (currentConversationId) {
      conversation = {
        id: currentConversationId,
        title: conversations.find(c => c.id === currentConversationId)?.title || generateAutoTitle(messages[0]?.content || ''),
        messages: messages,
        createdAt: conversations.find(c => c.id === currentConversationId)?.createdAt || now,
        updatedAt: now
      };
    } else {
      conversation = {
        id: Date.now().toString(),
        title: generateAutoTitle(messages[0]?.content || 'Nueva conversación'),
        messages: messages,
        createdAt: now,
        updatedAt: now
      };
      setCurrentConversationId(conversation.id);
    }

    const updatedConversations = conversations.filter(c => c.id !== conversation.id);
    updatedConversations.unshift(conversation);
    setConversations(updatedConversations);
    localStorage.setItem('conversations', JSON.stringify(updatedConversations));
  };

  const handleNewSearch = () => {
    if (messages.length > 0) {
      saveCurrentConversation();
    }

    setMessages([]);
    setAttachments([]);
    setInputValue('');
    setMode('AUTO');
    setCurrentConversationId(null);
    setIsNewChatOpen(false);
    
    toast({
      title: "Nueva búsqueda iniciada",
      description: "El chat ha sido limpiado para empezar una nueva conversación.",
    });
  };

  const loadConversation = (conversationId: string) => {
    if (messages.length > 0 && currentConversationId !== conversationId) {
      saveCurrentConversation();
    }

    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setMessages(conversation.messages);
      setCurrentConversationId(conversationId);
      setAttachments([]);
      setInputValue('');
      
      toast({
        title: "Conversación cargada",
        description: `Se ha cargado la conversación: ${conversation.title}`,
      });
    }
  };

  const deleteConversation = (conversationId: string) => {
    const updatedConversations = conversations.filter(c => c.id !== conversationId);
    setConversations(updatedConversations);
    localStorage.setItem('conversations', JSON.stringify(updatedConversations));
    
    if (currentConversationId === conversationId) {
      setMessages([]);
      setCurrentConversationId(null);
    }
    
    toast({
      title: "Conversación eliminada",
      description: "La conversación ha sido eliminada del historial.",
    });
  };

  const startEditingTitle = (conversationId: string, currentTitle: string) => {
    setEditingTitleId(conversationId);
    setEditingTitleValue(currentTitle);
  };

  const saveEditedTitle = () => {
    if (!editingTitleId || !editingTitleValue.trim()) {
      setEditingTitleId(null);
      return;
    }

    const updatedConversations = conversations.map(conv =>
      conv.id === editingTitleId
        ? { ...conv, title: editingTitleValue.trim() }
        : conv
    );

    setConversations(updatedConversations);
    localStorage.setItem('conversations', JSON.stringify(updatedConversations));
    setEditingTitleId(null);
    
    toast({
      title: "Título actualizado",
      description: "El título de la conversación ha sido modificado.",
    });
  };

  const cancelEditingTitle = () => {
    setEditingTitleId(null);
    setEditingTitleValue('');
  };

  const clearHistory = () => {
    setConversations([]);
    setHistorialBusquedas([]);
    localStorage.removeItem('conversations');
    localStorage.removeItem('historialGPT');
    
    setMessages([]);
    setCurrentConversationId(null);
    
    toast({
      title: "Historial limpiado",
      description: "Todo el historial de conversaciones ha sido eliminado.",
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const PRESIGNED_URL_ENDPOINT = import.meta.env.VITE_PRESIGNED_URL_ENDPOINT;
    
    if (!PRESIGNED_URL_ENDPOINT) {
      toast({
        title: "Error de configuración",
        description: "No se ha configurado el endpoint para subir archivos",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Subiendo archivos",
      description: `Subiendo ${files.length} archivo(s)...`,
    });

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const response = await fetch(PRESIGNED_URL_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            userEmail: userEmail || 'anonymous',
          }),
        });

        if (!response.ok) {
          throw new Error(`Error al obtener URL de subida: ${response.statusText}`);
        }

        const { uploadUrl, fileKey, accessUrl } = await response.json();

        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Error al subir archivo: ${uploadResponse.statusText}`);
        }

        return {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' as const :
                file.type === 'application/pdf' ? 'pdf' as const : 'document' as const,
          url: accessUrl,
          size: file.size,
          fileKey: fileKey,
        };
      });

      const uploadedAttachments = await Promise.all(uploadPromises);
      setAttachments([...attachments, ...uploadedAttachments]);

      toast({
        title: "Archivos subidos",
        description: `Se han subido ${uploadedAttachments.length} archivo(s) correctamente`,
      });

    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Error al subir archivos",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments(attachments.filter(att => att.id !== attachmentId));
  };

  const copyConversation = () => {
    const conversationText = messages.map(msg =>
      `${msg.type === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`
    ).join('\n\n');

    navigator.clipboard.writeText(conversationText);
    toast({
      title: "Copiado",
      description: "La conversación ha sido copiada al portapapeles",
    });
  };

  const downloadConversation = async (format: 'txt' | 'docx' | 'pdf') => {
    const conversationData = {
      fecha: new Date().toLocaleDateString('es-ES'),
      gptUsado: selectedGPT === 'gpt4' ? 'ChatGPT — Buscador Principal' : 
                customGPTs.find(g => g.id === selectedGPT)?.name || 'GPT Desconocido',
      titulo: currentConversationId 
        ? conversations.find(c => c.id === currentConversationId)?.title || 'Sin título'
        : 'Conversación actual'
    };

    if (format === 'txt') {
      const content = `
Conversación - ${conversationData.fecha}
GPT: ${conversationData.gptUsado}
Título: ${conversationData.titulo}

${'='.repeat(50)}

${messages.map(msg => 
  `${msg.type === 'user' ? 'Usuario' : 'Asistente'}:\n${msg.content}\n`
).join('\n')}
      `.trim();

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversacion_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Descarga completada",
        description: "La conversación se ha descargado como archivo .txt",
      });
    } else if (format === 'docx') {
      try {
        const children = [
          new Paragraph({
            children: [
              new TextRun({ text: `Conversación - ${conversationData.fecha}`, bold: true, size: 28 }),
            ],
          }),
          new Paragraph({
            children: [new TextRun({ text: "" })],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Fecha: ${conversationData.fecha}`, bold: true }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `GPT: ${conversationData.gptUsado}`, bold: true }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Título: ${conversationData.titulo}`, bold: true }),
            ],
          }),
          new Paragraph({
            children: [new TextRun({ text: "" })],
          }),
          new Paragraph({
            children: [new TextRun({ text: "=".repeat(50) })],
          }),
          new Paragraph({
            children: [new TextRun({ text: "" })],
          }),
          ...messages.flatMap((msg, index) => [
            new Paragraph({
              children: [
                new TextRun({ 
                  text: `${msg.type === 'user' ? 'Usuario' : 'Asistente'}:`, 
                  bold: true 
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: msg.content }),
              ],
            }),
            new Paragraph({
              children: [new TextRun({ text: "" })],
            }),
          ])
        ];

        const doc = new Document({
          sections: [{
            properties: {},
            children: children,
          }],
        });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversacion_${new Date().toISOString().split('T')[0]}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "Descarga completada",
          description: "La conversación se ha descargado como archivo .docx",
        });
      } catch (error) {
        console.error('Error generando .docx:', error);
        toast({
          title: "Error",
          description: `Error al generar .docx: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          variant: "destructive"
        });
      }
    } else if (format === 'pdf') {
      try {
        const pdf = new jsPDF();
        let yPosition = 20;
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Conversación - ${conversationData.fecha}`, 10, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(12);
        pdf.text(`GPT: ${conversationData.gptUsado}`, 10, yPosition);
        yPosition += 10;
        
        pdf.text(`Título: ${conversationData.titulo}`, 10, yPosition);
        yPosition += 20;
        
        pdf.text(''.padEnd(50, '='), 10, yPosition);
        yPosition += 15;
        
        messages.forEach((msg, index) => {
          if (yPosition > 260) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${msg.type === 'user' ? 'Usuario' : 'Asistente'}:`, 10, yPosition);
          yPosition += 10;
          
          pdf.setFont('helvetica', 'normal');
          const lines = pdf.splitTextToSize(msg.content, 180);
          pdf.text(lines, 10, yPosition);
          yPosition += lines.length * 7 + 10;
        });
        
        pdf.save(`conversacion_${new Date().toISOString().split('T')[0]}.pdf`);
        
        toast({
          title: "Descarga completada",
          description: "La conversación se ha descargado como archivo .pdf",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo generar el archivo .pdf",
          variant: "destructive"
        });
      }
    }
  };

  const createCustomGPT = () => {
    if (!newGPTName.trim() || !newGPTInstructions.trim()) {
      toast({
        title: "Error",
        description: "El nombre y las instrucciones son obligatorios.",
        variant: "destructive"
      });
      return;
    }

    const newGPT: CustomGPT = {
      id: Date.now().toString(),
      name: newGPTName,
      description: newGPTDescription || 'GPT personalizado',
      instructions: newGPTInstructions,
      icon: '🤖',
      trainingFiles: trainingFiles.length > 0 ? [...trainingFiles] : undefined
    };

    const updatedGPTs = [...customGPTs, newGPT];
    setCustomGPTs(updatedGPTs);
    localStorage.setItem('custom_gpts', JSON.stringify(updatedGPTs));
    
    setNewGPTName('');
    setNewGPTDescription('');
    setNewGPTInstructions('');
    setTestInput('');
    setTestOutput('');
    setTrainingFiles([]);
    setIsCreatingGPT(false);

    toast({
      title: "GPT creado",
      description: `Se ha creado el GPT "${newGPT.name}" exitosamente.`,
    });
  };

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

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    const currentAttachments = [...attachments];
    
    setInputValue('');
    setAttachments([]);

    const finalMode = mode === 'AUTO' ? detectMode(userMessage.content) : mode;

    const historyForApi: ChatMessage[] = updatedMessages.map((m) => {
      const chatMsg: ChatMessage = {
        role: m.type === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      };

      if (m.attachments && m.attachments.length > 0) {
        chatMsg.attachments = m.attachments.map(att => ({
          fileName: att.name,
          fileType: att.type,
          fileKey: (att as any).fileKey || '',
        }));
      }

      return chatMsg;
    });

    try {
      const response = await askChat(historyForApi);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.reply,
        timestamp: new Date(),
        gptUsed: finalMode === 'SIN ASISTENTE' ? 'ChatGPT' : 'Asistente Ingtec'
      };

      setMessages((prev) => [...prev, assistantMessage]);

      setTimeout(() => {
        saveCurrentConversation();
      }, 100);

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({
        title: 'Error',
        description: `No se pudo enviar el mensaje: ${msg}`,
        variant: 'destructive',
      });

      setAttachments(currentAttachments);
    }
  };

  return (
    <div className="min-h-screen bg-background font-montserrat flex">
      <div className="w-80 bg-card border-r border-border p-4 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-foreground">Historial</h3>
          <div className="flex gap-2">
            <Button
              onClick={onAdminPanel}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              onClick={onLogout}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[calc(50vh-120px)] flex-shrink-0">
          <div className="space-y-2">
            {conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay conversaciones guardadas aún
              </p>
            ) : (
              conversations.map((conversation) => (
                <Card 
                  key={conversation.id} 
                  className={`p-3 cursor-pointer hover:bg-accent/50 transition-colors ${
                    currentConversationId === conversation.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => loadConversation(conversation.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {editingTitleId === conversation.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editingTitleValue}
                            onChange={(e) => setEditingTitleValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditedTitle();
                              if (e.key === 'Escape') cancelEditingTitle();
                            }}
                            onBlur={saveEditedTitle}
                            className="h-6 text-sm"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium line-clamp-2 mb-1">{conversation.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {conversation.updatedAt.toLocaleDateString('es-ES')} • {conversation.messages.length} mensajes
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditingTitle(conversation.id, conversation.title);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conversation.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
        
        {customGPTs.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-foreground mb-2">Mis GPTs</h4>
            <div className="space-y-2">
              {customGPTs.map((gpt) => (
                <div key={gpt.id} className="flex items-center gap-2">
                  <Button
                    variant={selectedGPT === gpt.id ? "default" : "outline"}
                    size="sm"
                    className="flex-1 justify-start text-left"
                    onClick={() => setSelectedGPT(gpt.id)}
                  >
                    <span className="mr-2">{gpt.icon}</span>
                    <div className="text-left">
                      <div className="font-medium text-xs">{gpt.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{gpt.description}</div>
                    </div>
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Editar GPT</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Nombre</label>
                          <Input 
                            defaultValue={gpt.name}
                            onChange={(e) => {
                              const updatedGPTs = customGPTs.map(g => 
                                g.id === gpt.id ? { ...g, name: e.target.value } : g
                              );
                              setCustomGPTs(updatedGPTs);
                              localStorage.setItem('custom_gpts', JSON.stringify(updatedGPTs));
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Descripción</label>
                          <Input 
                            defaultValue={gpt.description}
                            onChange={(e) => {
                              const updatedGPTs = customGPTs.map(g => 
                                g.id === gpt.id ? { ...g, description: e.target.value } : g
                              );
                              setCustomGPTs(updatedGPTs);
                              localStorage.setItem('custom_gpts', JSON.stringify(updatedGPTs));
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Instrucciones</label>
                          <Textarea 
                            defaultValue={gpt.instructions}
                            onChange={(e) => {
                              const updatedGPTs = customGPTs.map(g => 
                                g.id === gpt.id ? { ...g, instructions: e.target.value } : g
                              );
                              setCustomGPTs(updatedGPTs);
                              localStorage.setItem('custom_gpts', JSON.stringify(updatedGPTs));
                            }}
                            rows={5}
                          />
                        </div>
                        <Button 
                          variant="destructive" 
                          onClick={() => {
                            const updatedGPTs = customGPTs.filter(g => g.id !== gpt.id);
                            setCustomGPTs(updatedGPTs);
                            localStorage.setItem('custom_gpts', JSON.stringify(updatedGPTs));
                            if (selectedGPT === gpt.id) {
                              setSelectedGPT('gpt4');
                            }
                            toast({
                              title: "GPT eliminado",
                              description: `Se ha eliminado el GPT "${gpt.name}".`,
                            });
                          }}
                          className="w-full"
                        >
                          Eliminar GPT
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator className="my-4" />

        <Button
          onClick={clearHistory}
          variant="outline"
          size="sm"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Limpiar Historial
        </Button>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-card border-b border-border p-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src="/logo-ingtec.svg" alt="Logo" className="h-8" />
            <h1 className="text-2xl font-bold text-primary">
              Buscador GPT
            </h1>
          </div>
          <div className="mb-2">
            <Badge variant="secondary">Respaldado por la última versión de ChatGPT</Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Límite por usuario: 35 búsquedas diarias • 1.8MB de espacio • Las búsquedas se pueden guardar para no perder el historial
          </p>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  ¡Hola! Soy tu asistente especializado
                </p>
                <p className="text-sm text-muted-foreground">
                  Pregúntame sobre formulación, productos de limpieza, alimentos y laboratorio
                </p>
              </div>
            )}
            
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <Card className={`max-w-[80%] ${message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                  <CardContent className="p-4">
                    {message.gptUsed && (
                      <div className="flex items-center gap-2 mb-2 opacity-75">
                        {message.type === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                        <span className="text-xs">{message.gptUsed}</span>
                      </div>
                    )}
                    
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
                    
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="bg-card border-t border-border p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Select value={selectedGPT} onValueChange={setSelectedGPT}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un GPT" />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultGPTs.map((gpt) => (
                      <SelectItem key={gpt.id} value={gpt.id}>
                        <div className="flex items-center gap-2">
                          <span>{gpt.icon}</span>
                          <div>
                            <div className="font-medium">{gpt.name}</div>
                            <div className="text-sm text-muted-foreground">{gpt.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                    {customGPTs.map((gpt) => (
                      <SelectItem key={gpt.id} value={gpt.id}>
                        <div className="flex items-center gap-2">
                          <span>{gpt.icon}</span>
                          <div>
                            <div className="font-medium">{gpt.name}</div>
                            <div className="text-sm text-muted-foreground">{gpt.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Dialog open={isCreatingGPT} onOpenChange={setIsCreatingGPT}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="rounded-[20px]">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear GPT
                  </Button>
                </DialogTrigger>
                
              <GPTImportExport 
                customGPTs={customGPTs} 
                onGPTsUpdated={setCustomGPTs} 
              />
                <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Crear GPT Personalizado</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-medium text-lg">Configuración</h3>
                      <div>
                        <label className="text-sm font-medium">Nombre *</label>
                        <Input
                          value={newGPTName}
                          onChange={(e) => setNewGPTName(e.target.value)}
                          placeholder="Ej: Experto en Cosméticos"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Descripción</label>
                        <Input
                          value={newGPTDescription}
                          onChange={(e) => setNewGPTDescription(e.target.value)}
                          placeholder="Breve descripción del GPT"
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
                      
                      <div>
                        <label className="text-sm font-medium">Archivos de entrenamiento</label>
                        <TrainingFilesDropzone
                          presignEndpoint={import.meta.env.VITE_PRESIGN_ENDPOINT || ""}
                          onChange={setTrainingFiles}
                          maxFiles={10}
                          maxSizeMB={25}
                          userEmail={userEmail || undefined}
                          gptId={newGPTName ? `new-${newGPTName.toLowerCase().replace(/\s+/g, '-')}` : undefined}
                        />
                        {!import.meta.env.VITE_PRESIGN_ENDPOINT && (
                          <p className="text-xs text-amber-600 mt-2">
                            ⚠️ VITE_PRESIGN_ENDPOINT no configurado. Los archivos no se subirán.
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => {
                          setNewGPTName('');
                          setNewGPTDescription('');
                          setNewGPTInstructions('');
                          setTestInput('');
                          setTestOutput('');
                          setTrainingFiles([]);
                          setIsCreatingGPT(false);
                        }} className="flex-1">
                          Cancelar
                        </Button>
                        <Button onClick={createCustomGPT} className="flex-1">
                          Crear GPT
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="font-medium text-lg">Probar funcionalidad</h3>
                      <div>
                        <label className="text-sm font-medium">Pregunta de prueba</label>
                        <Textarea
                          value={testInput}
                          onChange={(e) => setTestInput(e.target.value)}
                          placeholder="Escribe una pregunta para probar cómo respondería tu GPT..."
                          rows={3}
                        />
                        <Button 
                          size="sm" 
                          className="mt-2 w-full"
                          onClick={() => {
                            if (testInput.trim() && newGPTInstructions.trim()) {
                              setTestOutput(`GPT responde basado en: "${newGPTInstructions}"\n\nPregunta: ${testInput}\n\nRespuesta simulada: Esta sería la respuesta de tu GPT personalizado. En el entorno real, utilizaría las instrucciones proporcionadas para generar una respuesta especializada.`);
                            } else {
                              toast({
                                title: "Error",
                                description: "Agrega instrucciones y una pregunta de prueba",
                                variant: "destructive"
                              });
                            }
                          }}
                        >
                          Probar respuesta
                        </Button>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Vista previa de respuesta</label>
                        <Textarea
                          value={testOutput}
                          readOnly
                          placeholder="Aquí aparecerá la respuesta de prueba de tu GPT..."
                          rows={8}
                          className="bg-muted/50"
                        />
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                          💡 <strong>Consejo:</strong> Refina las instrucciones hasta que las respuestas de prueba sean las que esperas.
                        </p>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <label className="text-sm font-medium">Modo</label>
                <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Modo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUTO">AUTO</SelectItem>
                    <SelectItem value="CON ASISTENTE BÁSICO">Con asistente básico</SelectItem>
                    <SelectItem value="CON ASISTENTE DETALLADO">Con asistente detallado</SelectItem>
                    <SelectItem value="SIN ASISTENTE">Sin asistente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

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

            <div className="flex flex-wrap gap-2 justify-center">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-[20px]"
                onClick={copyConversation}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-[20px]"
                onClick={() => downloadConversation('txt')}
              >
                <Download className="h-4 w-4 mr-2" />
                Guardar como .txt
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-[20px]"
                onClick={() => downloadConversation('docx')}
              >
                <Download className="h-4 w-4 mr-2" />
                Guardar como .docx
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-[20px]"
                onClick={() => downloadConversation('pdf')}
              >
                <Download className="h-4 w-4 mr-2" />
                Guardar como .pdf
              </Button>
            </div>

            <Separator />

            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewSearch}
                className="flex items-center gap-2 rounded-[20px]"
              >
                <Plus className="h-4 w-4" />
                Nueva búsqueda
              </Button>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-[20px] shrink-0"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="h-5 w-5" />
              </Button>
              
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Haz tu pregunta aquí... Ej: ¿Qué enzima es mejor para desmanchar grasa en superficies hospitalarias?"
                className="flex-1 h-12 rounded-[20px] bg-input"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              
              <Button 
                onClick={handleSendMessage}
                className="h-12 px-8 rounded-[20px] bg-primary hover:bg-primary/90 shrink-0"
                disabled={!inputValue.trim()}
              >
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

