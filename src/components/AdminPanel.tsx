import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Copy, Download, User, MessageSquare, Calendar, Database, LogOut } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getAppMode } from "@/lib/appMode";
import { getLegacyHistory, getChatHistory, getUserEmail, type MockHistory, type ChatMessage } from "@/lib/localStorage";

interface AdminPanelProps {
  onBack: () => void;
  onLogout: () => void; // ✅ AGREGADA: Prop para cerrar sesión
}

const AdminPanel = ({ onBack, onLogout }: AdminPanelProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'logs'>('overview');
  const [legacyHistory, setLegacyHistory] = useState<MockHistory[]>([]);
  const [currentChat, setCurrentChat] = useState<ChatMessage[]>([]);
  const { toast } = useToast();
  const appMode = getAppMode();
  const userEmail = getUserEmail();

  useEffect(() => {
    // Cargar datos del localStorage
    const history = getLegacyHistory();
    const chat = getChatHistory();
    setLegacyHistory(history);
    setCurrentChat(chat);
  }, []);

  const copyAllLogs = () => {
    const allData = {
      appMode,
      userEmail,
      timestamp: new Date().toISOString(),
      currentSession: {
        messages: currentChat,
        messageCount: currentChat.length
      },
      legacyHistory: legacyHistory,
      historyCount: legacyHistory.length
    };

    const logText = JSON.stringify(allData, null, 2);
    
    navigator.clipboard.writeText(logText).then(() => {
      toast({
        title: "Logs copiados",
        description: `Se han copiado ${legacyHistory.length} registros del historial al portapapeles`,
      });
    }).catch(() => {
      toast({
        title: "Error",
        description: "No se pudieron copiar los logs",
        variant: "destructive"
      });
    });
  };

  const downloadLogs = () => {
    const allData = {
      appMode,
      userEmail,
      exportDate: new Date().toISOString(),
      currentSession: currentChat,
      legacyHistory: legacyHistory
    };

    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ingtec-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Descarga iniciada",
      description: "Los logs se están descargando como archivo JSON",
    });
  };

  return (
    <div className="min-h-screen bg-background p-6 font-montserrat">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button onClick={onBack} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Chat
            </Button>
            <div className="flex items-center space-x-3">
              <img src="/lovable-uploads/4c7e0a4b-080a-437a-b8e8-bb34ebe70495.png" alt="Ingtec" className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Panel de Administración</h1>
                <p className="text-muted-foreground">Gestión y monitoreo del Buscador GPT</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={appMode === 'mock' ? 'secondary' : 'default'}>
              {appMode === 'mock' ? 'MODO MOCK' : 'MODO PROD'}
            </Badge>
            <Badge variant="outline">
              {userEmail}
            </Badge>
            {/* ✅ BOTÓN DE LOGOUT AGREGADO */}
            <Button
              onClick={onLogout}
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6 bg-muted rounded-lg p-1">
          {[
            { id: 'overview', label: 'Resumen', icon: Database },
            { id: 'sessions', label: 'Historial', icon: MessageSquare },
            { id: 'logs', label: 'Logs Técnicos', icon: Calendar }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                onClick={() => setActiveTab(tab.id as any)}
                className="flex-1"
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sesión Actual</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentChat.length}</div>
                <p className="text-xs text-muted-foreground">mensajes intercambiados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Historial Total</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{legacyHistory.length}</div>
                <p className="text-xs text-muted-foreground">consultas guardadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuario Activo</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold truncate">{userEmail.split('@')[0]}</div>
                <p className="text-xs text-muted-foreground">@iespecialidades.com</p>
              </CardContent>
            </Card>

            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Estado del Sistema</CardTitle>
                <CardDescription>
                  Información técnica y configuración actual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="font-medium">Modo de Operación</p>
                    <p className="text-muted-foreground">{appMode.toUpperCase()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">Estado Backend</p>
                    <p className="text-muted-foreground">
                      {appMode === 'mock' ? 'Simulado' : 'Conectado'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">Almacenamiento</p>
                    <p className="text-muted-foreground">localStorage</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">Última Actividad</p>
                    <p className="text-muted-foreground">
                      {currentChat.length > 0 
                        ? new Date(currentChat[currentChat.length - 1].timestamp).toLocaleTimeString()
                        : 'Sin actividad'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'sessions' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Historial de Consultas</CardTitle>
                <CardDescription>
                  Registro completo de preguntas y respuestas ({legacyHistory.length} entradas)
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button onClick={copyAllLogs} variant="outline" size="sm">
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar todo
                </Button>
                <Button onClick={downloadLogs} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Descargar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {legacyHistory.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No hay historial de consultas guardado
                    </p>
                  ) : (
                    legacyHistory.map((entry, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{entry.fecha}</Badge>
                          <Badge variant="secondary">{entry.gptUsado}</Badge>
                        </div>
                        <div>
                          <p className="font-medium text-sm">Pregunta:</p>
                          <p className="text-sm text-muted-foreground">{entry.pregunta}</p>
                        </div>
                        <Separator />
                        <div>
                          <p className="font-medium text-sm">Respuesta:</p>
                          <p className="text-sm text-muted-foreground line-clamp-3">{entry.respuesta}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {activeTab === 'logs' && (
          <Card>
            <CardHeader>
              <CardTitle>Logs Técnicos</CardTitle>
              <CardDescription>
                Información detallada del sistema y sesión actual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Sesión Actual</h3>
                  <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                    <pre>{JSON.stringify({
                      usuario: userEmail,
                      modo: appMode,
                      mensajes: currentChat.length,
                      ultimaActividad: currentChat.length > 0 
                        ? new Date(currentChat[currentChat.length - 1].timestamp).toISOString()
                        : null
                    }, null, 2)}</pre>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Estadísticas</h3>
                  <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                    <pre>{JSON.stringify({
                      totalConsultas: legacyHistory.length,
                      sesionActual: currentChat.length,
                      promedioMensajesPorConsulta: legacyHistory.length > 0 
                        ? Math.round(currentChat.length / Math.max(1, legacyHistory.length) * 100) / 100
                        : 0,
                      timestamp: new Date().toISOString()
                    }, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;

