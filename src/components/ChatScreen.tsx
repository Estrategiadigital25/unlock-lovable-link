import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Download, Copy, Edit, Settings } from "lucide-react";

interface ChatScreenProps {
  onAdminPanel: () => void;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ChatScreen = ({ onAdminPanel }: ChatScreenProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [inputValue, setInputValue] = useState('');
  
  const historialBusquedas = [
    "¿Qué biosurfactante puedo usar en fórmula lavaloza con pH neutro?",
    "Comparación entre detergente enzimático y tradicional",
    "¿Cómo afecta el uso de EDTA en superficies con residuos proteicos?"
  ];

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');

    // Simular respuesta del asistente
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Esta es una respuesta simulada del sistema GPT. En un entorno real, aquí se mostraría la respuesta generada por el modelo de inteligencia artificial especializado en formulación, limpieza, alimentos y laboratorio.',
        timestamp: new Date()
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
        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="space-y-2">
            {historialBusquedas.map((busqueda, index) => (
              <Card key={index} className="p-3 cursor-pointer hover:bg-accent/50 transition-colors">
                <p className="text-sm text-muted-foreground line-clamp-3">{busqueda}</p>
              </Card>
            ))}
          </div>
        </ScrollArea>
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
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <Card className={`max-w-[80%] ${message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                  <CardContent className="p-4">
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

            {/* Campo de entrada */}
            <div className="flex gap-4">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Haz tu pregunta aquí... Ej: ¿Qué enzima es mejor para desmanchar grasa en superficies hospitalarias?"
                className="flex-1 h-12 rounded-[20px] bg-input"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button 
                onClick={handleSendMessage}
                className="h-12 px-8 rounded-[20px] bg-primary hover:bg-primary/90"
              >
                Enviar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;