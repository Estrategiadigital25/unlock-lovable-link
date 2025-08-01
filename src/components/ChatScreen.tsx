import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Download, Copy, Edit, Settings, Plus, Paperclip, Image, FileText, Trash2, Bot, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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
  isDefault?: boolean;
}

const ChatScreen = ({ onAdminPanel }: ChatScreenProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [historialBusquedas, setHistorialBusquedas] = useState<string[]>([]);
  const [selectedGPT, setSelectedGPT] = useState<string>('default');
  const [customGPTs, setCustomGPTs] = useState<CustomGPT[]>([]);
  const [isCreatingGPT, setIsCreatingGPT] = useState(false);
  const [newGPTName, setNewGPTName] = useState('');
  const [newGPTDescription, setNewGPTDescription] = useState('');
  const [newGPTInstructions, setNewGPTInstructions] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // GPTs predefinidos
  const defaultGPTs: CustomGPT[] = [
    {
      id: 'default',
      name: 'Formulación & Laboratorio',
      description: 'Experto en formulación, limpieza, alimentos y laboratorio',
      instructions: 'Eres un experto en formulación, productos de limpieza, alimentos y análisis de laboratorio.',
      icon: '🧪',
      isDefault: true
    },
    {
      id: 'cleaner',
      name: 'Productos de Limpieza',
      description: 'Especializado en detergentes y productos de limpieza',
      instructions: 'Eres un especialista en productos de limpieza, detergentes, desinfectantes y química del hogar.',
      icon: '🧽'
    },
    {
      id: 'food',
      name: 'Industria Alimentaria',
      description: 'Experto en seguridad alimentaria y procesos',
      instructions: 'Eres un experto en seguridad alimentaria, procesos de conservación y tecnología de alimentos.',
      icon: '🍎'
    }
  ];

  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const savedHistory = localStorage.getItem('chat_history');
    const savedGPTs = localStorage.getItem('custom_gpts');
    
    if (savedHistory) {
      try {
        setHistorialBusquedas(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error loading history:', error);
      }
    }
    
    if (savedGPTs) {
      try {
        setCustomGPTs(JSON.parse(savedGPTs));
      } catch (error) {
        console.error('Error loading GPTs:', error);
      }
    }
  }, []);

  // Guardar historial en localStorage
  const saveToHistory = (query: string) => {
    const updatedHistory = [query, ...historialBusquedas.slice(0, 19)]; // Máximo 20 elementos
    setHistorialBusquedas(updatedHistory);
    localStorage.setItem('chat_history', JSON.stringify(updatedHistory));
  };

  // Limpiar historial
  const clearHistory = () => {
    setHistorialBusquedas([]);
    localStorage.removeItem('chat_history');
    toast({
      title: "Historial limpiado",
      description: "Se ha eliminado todo el historial de búsquedas.",
    });
  };

  // Manejar archivos
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
      title: "Archivos cargados",
      description: `Se han cargado ${files.length} archivo(s) exitosamente.`,
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  // Crear nuevo GPT
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
      icon: '🤖'
    };

    const updatedGPTs = [...customGPTs, newGPT];
    setCustomGPTs(updatedGPTs);
    localStorage.setItem('custom_gpts', JSON.stringify(updatedGPTs));
    
    setNewGPTName('');
    setNewGPTDescription('');
    setNewGPTInstructions('');
    setIsCreatingGPT(false);

    toast({
      title: "GPT creado",
      description: `Se ha creado el GPT "${newGPT.name}" exitosamente.`,
    });
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const currentGPT = [...defaultGPTs, ...customGPTs].find(gpt => gpt.id === selectedGPT);

    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
      gptUsed: currentGPT?.name
    };

    setMessages(prev => [...prev, newMessage]);
    saveToHistory(inputValue);
    setInputValue('');
    setAttachments([]);

    // Simular respuesta del asistente
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Respuesta del ${currentGPT?.name}: ${currentGPT?.instructions || 'Sistema base'}\n\nEsta es una respuesta simulada. En un entorno real, aquí se mostraría la respuesta generada por el modelo especializado.`,
        timestamp: new Date(),
        gptUsed: currentGPT?.name
      };
      setMessages(prev => [...prev, assistantMessage]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background font-montserrat flex">
      {/* Sidebar con historial */}
      <div className="w-80 bg-card border-r border-border p-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-foreground">Historial</h3>
          <Button
            onClick={onAdminPanel}
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="space-y-2">
            {historialBusquedas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay búsquedas guardadas aún
              </p>
            ) : (
              historialBusquedas.map((busqueda, index) => (
                <Card key={index} className="p-3 cursor-pointer hover:bg-accent/50 transition-colors">
                  <p className="text-sm text-muted-foreground line-clamp-3">{busqueda}</p>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
        
        {/* Botón limpiar historial */}
        <div className="mt-4 pt-4 border-t border-border">
          <Button
            onClick={clearHistory}
            variant="outline"
            size="sm"
            className="w-full text-destructive hover:text-destructive"
            disabled={historialBusquedas.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpiar historial local
          </Button>
        </div>
      </div>

      {/* Área principal del chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-card border-b border-border p-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Buscador GPT – Tu copiloto para formulación, limpieza, alimentos y laboratorio
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-lg">🔐</span>
            <p className="text-sm font-semibold">
              Tus búsquedas no se guardan automáticamente. Si deseas conservar esta conversación, debes descargarla.
            </p>
          </div>
        </div>

        {/* Área de mensajes */}
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

        {/* Área de entrada y botones */}
        <div className="bg-card border-t border-border p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Selector de GPT y Crear GPT */}
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
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Crear GPT Personalizado</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
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
                        rows={4}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setIsCreatingGPT(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={createCustomGPT}>
                        Crear GPT
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

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

            {/* Botones de acción */}
            <div className="flex flex-wrap gap-2 justify-center">
              <Button variant="outline" size="sm" className="rounded-[20px]">
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
              <Button variant="outline" size="sm" className="rounded-[20px]">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button variant="outline" size="sm" className="rounded-[20px]">
                <Download className="h-4 w-4 mr-2" />
                Guardar como .txt
              </Button>
              <Button variant="outline" size="sm" className="rounded-[20px]">
                <Download className="h-4 w-4 mr-2" />
                Guardar como .pdf
              </Button>
              <Button variant="outline" size="sm" className="rounded-[20px]">
                <Download className="h-4 w-4 mr-2" />
                Guardar como .docx
              </Button>
              <Button variant="outline" size="sm" className="rounded-[20px]">
                <Download className="h-4 w-4 mr-2" />
                Guardar como .ppt
              </Button>
            </div>

            <Separator />

            {/* Campo de entrada con botón de archivos */}
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