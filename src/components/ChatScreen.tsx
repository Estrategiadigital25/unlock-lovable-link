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
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
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
  const [selectedGPT, setSelectedGPT] = useState<string>('gpt4');
  const [customGPTs, setCustomGPTs] = useState<CustomGPT[]>([]);
  const [isCreatingGPT, setIsCreatingGPT] = useState(false);
  const [newGPTName, setNewGPTName] = useState('');
  const [newGPTDescription, setNewGPTDescription] = useState('');
  const [newGPTInstructions, setNewGPTInstructions] = useState('');
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // GPT principal para todas las búsquedas
  const defaultGPTs: CustomGPT[] = [
    {
      id: 'gpt4',
      name: 'ChatGPT 4.0 - Buscador Principal',
      description: 'Buscador inteligente con ChatGPT 4.0 para consultas especializadas',
      instructions: 'Eres un asistente especializado con acceso a ChatGPT 4.0. Respondes consultas técnicas y especializadas de manera precisa y profesional.',
      icon: '🔍',
      isDefault: true
    }
  ];

  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const historialCompleto = localStorage.getItem("historialGPT");
    const savedGPTs = localStorage.getItem('custom_gpts');
    
    if (historialCompleto) {
      try {
        const historial = JSON.parse(historialCompleto);
        setHistorialBusquedas(historial.map((item: any) => item.pregunta || item));
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

  // Guardar historial en localStorage con estructura mejorada
  const saveToHistory = (query: string, response?: string) => {
    let historial = JSON.parse(localStorage.getItem("historialGPT") || "[]");
    
    // Estructura mejorada con validación
    const nuevaBusqueda = {
      id: Date.now().toString(),
      fecha: new Date().toLocaleString('es-ES'),
      pregunta: query.trim(),
      respuesta: response || "Pendiente...",
      gptUsado: [...defaultGPTs, ...customGPTs].find(gpt => gpt.id === selectedGPT)?.name || 'GPT Base'
    };
    
    // Agregar al inicio y limitar a 50 elementos para no sobrecargar localStorage
    historial.unshift(nuevaBusqueda);
    historial = historial.slice(0, 50);
    
    localStorage.setItem("historialGPT", JSON.stringify(historial));
    setHistorialBusquedas(historial.map(item => item.pregunta));
  };

  // Limpiar historial
  const clearHistory = () => {
    setHistorialBusquedas([]);
    localStorage.removeItem("historialGPT");
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

  // Función para copiar conversación
  const copyConversation = () => {
    const conversationText = messages.map(msg => 
      `${msg.type === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`
    ).join('\n\n');
    
    navigator.clipboard.writeText(conversationText).then(() => {
      toast({
        title: "Copiado",
        description: "La conversación se ha copiado al portapapeles.",
      });
    }).catch(() => {
      toast({
        title: "Error",
        description: "No se pudo copiar la conversación.",
        variant: "destructive"
      });
    });
  };

  // Función para descargar historial
  const downloadHistory = async (format: 'txt' | 'docx' | 'pdf') => {
    const historial = JSON.parse(localStorage.getItem("historialGPT") || "[]");
    
    if (format === 'txt') {
      const content = historial.map((item: any) => 
        `Fecha: ${item.fecha}\nGPT: ${item.gptUsado}\nPregunta: ${item.pregunta}\nRespuesta: ${item.respuesta}\n\n${'='.repeat(50)}\n\n`
      ).join('');
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historial_gpt_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Descarga completada",
        description: "El historial se ha descargado como archivo .txt",
      });
    } else if (format === 'docx') {
      try {
        const children = historial.flatMap((item: any) => [
          new Paragraph({
            children: [
              new TextRun({ text: `Fecha: ${item.fecha}`, bold: true }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `GPT: ${item.gptUsado}`, bold: true }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Pregunta: ${item.pregunta}` }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Respuesta: ${item.respuesta}` }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "".padEnd(50, "=") }),
          new Paragraph({ text: "" }),
        ]);

        const doc = new Document({
          sections: [{
            properties: {},
            children: children,
          }],
        });

        const buffer = await Packer.toBuffer(doc);
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `historial_gpt_${new Date().toISOString().split('T')[0]}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "Descarga completada",
          description: "El historial se ha descargado como archivo .docx",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo generar el archivo .docx",
          variant: "destructive"
        });
      }
    } else if (format === 'pdf') {
      try {
        const pdf = new jsPDF();
        let yPosition = 20;
        
        historial.forEach((item: any, index: number) => {
          if (yPosition > 280) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`Fecha: ${item.fecha}`, 10, yPosition);
          yPosition += 10;
          
          pdf.text(`GPT: ${item.gptUsado}`, 10, yPosition);
          yPosition += 10;
          
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Pregunta: ${item.pregunta}`, 10, yPosition);
          yPosition += 10;
          
          pdf.text(`Respuesta: ${item.respuesta}`, 10, yPosition);
          yPosition += 20;
          
          if (index < historial.length - 1) {
            pdf.text(''.padEnd(50, '='), 10, yPosition);
            yPosition += 10;
          }
        });
        
        pdf.save(`historial_gpt_${new Date().toISOString().split('T')[0]}.pdf`);
        
        toast({
          title: "Descarga completada",
          description: "El historial se ha descargado como archivo .pdf",
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
    setTestInput('');
    setTestOutput('');
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
      <div className="w-80 bg-card border-r border-border p-4 flex flex-col">
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
        <ScrollArea className="h-[calc(50vh-120px)] flex-shrink-0">
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
        
        {/* GPTs Personalizados */}
        {customGPTs.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-foreground mb-2">Mis GPTs</h4>
            <div className="space-y-2">
              {customGPTs.map((gpt) => (
                <Button
                  key={gpt.id}
                  variant={selectedGPT === gpt.id ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-start text-left"
                  onClick={() => setSelectedGPT(gpt.id)}
                >
                  <span className="mr-2">{gpt.icon}</span>
                  <div className="text-left">
                    <div className="font-medium text-xs">{gpt.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{gpt.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Botón limpiar historial */}
        <div className="mt-4 pt-4 border-t border-border">
          <Button
            onClick={clearHistory}
            variant="outline"
            size="sm"
            className="w-full bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800 hover:border-green-300"
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
        <div className="bg-card border-b border-border p-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <span className="text-2xl">🔍</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Buscador GPT
            </h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Potenciado por ChatGPT 4.0 • Cuenta AWS: 1000 búsquedas diarias • 50MB de espacio • Historial local seguro
          </p>
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
                      
                      {/* Área de archivos */}
                      <div>
                        <label className="text-sm font-medium">Archivos de entrenamiento</label>
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                          <Paperclip className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Arrastra archivos aquí o haz clic para subir
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Soporta: PDF, DOC, TXT, imágenes
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => {
                          setNewGPTName('');
                          setNewGPTDescription('');
                          setNewGPTInstructions('');
                          setTestInput('');
                          setTestOutput('');
                          setIsCreatingGPT(false);
                        }} className="flex-1">
                          Cancelar
                        </Button>
                        <Button onClick={createCustomGPT} className="flex-1">
                          Crear GPT
                        </Button>
                      </div>
                    </div>
                    
                    {/* Panel de pruebas */}
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
                onClick={() => downloadHistory('txt')}
              >
                <Download className="h-4 w-4 mr-2" />
                Guardar como .txt
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-[20px]"
                onClick={() => downloadHistory('docx')}
              >
                <Download className="h-4 w-4 mr-2" />
                Guardar como .docx
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-[20px]"
                onClick={() => downloadHistory('pdf')}
              >
                <Download className="h-4 w-4 mr-2" />
                Guardar como .pdf
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