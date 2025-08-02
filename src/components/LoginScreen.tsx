import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  // Lista de emails autorizados
  const authorizedEmails = [
    'liderdesarrollo@iespecialidades.com',
    'estrategiadigital@iespecialidades.com',
    'lideralimentos@iespecialidades.com',
    'contabilidad2@iespecialidades.com',
    'cesar.ospina@iespecialidades.com',
    'contabilidad@iespecialidades.com',
    'juan.espejo@iespecialidades.com',
    'servicioalcliente@iespecialidades.com',
    'factura@iespecialidades.com',
    'janeth.gomez@iespecialidades.com',
    'jimena.porras@iespecialidades.com',
    'compras@iespecialidades.com',
    'lidercontable@iespecialidades.com',
    'procesos@iespecialidades.com',
    'gear@iespecialidades.com',
    'laboratorio3@iespecialidades.com',
    'laboratorio9@iespecialidades.com',
    'laboratorio6@iespecialidades.com',
    'martin.correa@iespecialidades.com',
    'operaciones@iespecialidades.com',
    'laboratorio5@iespecialidades.com',
    'powerbi@iespecialidades.com',
    'powerbi2@iespecialidades.com',
    'practicante@iespecialidades.com',
    'laboratorio8@iespecialidades.com',
    'auxiliaradministrativa@iespecialidades.com',
    'wilmer.pinzon@iespecialidades.com',
    'liderformuladores@iespecialidades.com'
  ];

  const handleLogin = () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu email corporativo.",
        variant: "destructive"
      });
      return;
    }

    if (!authorizedEmails.includes(email.toLowerCase())) {
      toast({
        title: "Acceso denegado",
        description: "Tu email no está autorizado. Solo cuentas @iespecialidades.com registradas pueden acceder.",
        variant: "destructive"
      });
      return;
    }

    // Guardar email en localStorage para futuras referencias
    localStorage.setItem('userEmail', email);
    onLogin();
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 font-montserrat">
      {/* Fondo blanco con franjas verdes y grises */}
      <div className="absolute inset-0 bg-white">
        {/* Franjas curvas verdes y grises */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-full blur-3xl transform -translate-x-48 -translate-y-48"></div>
          <div className="absolute top-1/4 right-0 w-80 h-80 bg-gradient-to-bl from-gray-300/30 to-gray-400/10 rounded-full blur-2xl transform translate-x-40"></div>
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-gradient-to-tr from-green-400/25 to-emerald-500/15 rounded-full blur-3xl transform translate-y-36"></div>
          <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-gradient-to-tl from-gray-200/40 to-green-300/20 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-0 w-56 h-56 bg-gradient-to-r from-green-600/15 to-transparent rounded-full blur-2xl transform -translate-x-28"></div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-6 pb-8">
            {/* Logo principal */}
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-3xl font-bold text-white">🔍</span>
            </div>
            
            {/* Título principal */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-800 leading-tight">
                Buscador GPT
              </h1>
              <h2 className="text-lg font-semibold text-green-700">
                Ingtec Especialidades
              </h2>
              <p className="text-sm text-gray-600 font-medium">
                Potenciado por ChatGPT 4.0
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-0">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <CardDescription className="text-center text-green-800 leading-relaxed text-sm">
                <span className="inline-block mr-2">🔐</span>
                <strong>Acceso exclusivo para colaboradores</strong><br/>
                Solo cuentas @iespecialidades.com autorizadas.<br/>
                Tu actividad es registrada para seguridad y trazabilidad.
              </CardDescription>
            </div>
            
            <div className="space-y-3">
              <Input
                type="email"
                placeholder="tu.email@iespecialidades.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-center"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
              
              <Button 
                onClick={handleLogin}
                className="w-full h-14 rounded-[20px] bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <span className="mr-2">✓</span>
                Validar identidad y acceder
              </Button>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-gray-500">
                ¿Problemas de acceso? Contacta a estrategiadigital@iespecialidades.com
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginScreen;