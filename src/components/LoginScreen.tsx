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
      {/* Fondo inspirado en la plantilla de marca con franjas dinámicas */}
      <div className="absolute inset-0 bg-white">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-[#a7db74]/20 via-[#a7db74]/10 to-transparent transform -rotate-12 origin-top-left"></div>
          <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-bl from-gray-200/30 via-white/20 to-transparent rounded-full transform rotate-45"></div>
          <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-tr from-[#a7db74]/15 via-transparent to-gray-100/30 transform skew-x-12"></div>
          <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-[#a7db74]/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-1/3 left-1/4 w-48 h-48 bg-gray-200/20 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-radial from-[#a7db74]/5 to-transparent rounded-full"></div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-6 pb-8">
            {/* Logo principal con el símbolo de hoja de Ingtec */}
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-[#a7db74] to-[#a7db74] rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" viewBox="0 0 100 100" fill="currentColor">
                <circle cx="50" cy="50" r="45" fill="currentColor" opacity="0.1"/>
                <path d="M50 15 C35 20, 25 35, 25 50 C25 65, 35 80, 50 85 C65 80, 75 65, 75 50 C75 35, 65 20, 50 15 Z" fill="currentColor"/>
                <path d="M50 25 L45 35 L35 40 L45 45 L50 55 L55 45 L65 40 L55 35 Z" fill="white" opacity="0.8"/>
                <path d="M30 45 Q50 35, 70 45" stroke="white" strokeWidth="2" fill="none" opacity="0.6"/>
                <path d="M30 55 Q50 65, 70 55" stroke="white" strokeWidth="2" fill="none" opacity="0.6"/>
              </svg>
            </div>
            
            {/* Título principal */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-800 leading-tight">
                Buscador GPT
              </h1>
              <h2 className="text-lg font-semibold" style={{ color: '#a7db74' }}>
                Ingtec Especialidades
              </h2>
              <p className="text-sm text-gray-600 font-medium">
                Potenciado por ChatGPT 4.0
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-0">
            <div className="border rounded-lg p-4" style={{ backgroundColor: '#a7db74' + '10', borderColor: '#a7db74' + '40' }}>
              <CardDescription className="text-center leading-relaxed text-sm" style={{ color: '#a7db74' }}>
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
                className="w-full h-14 rounded-[20px] bg-gradient-to-r from-[#a7db74] to-[#a7db74] hover:from-[#a7db74]/80 hover:to-[#a7db74]/80 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
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