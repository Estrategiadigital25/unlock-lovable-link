import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 font-montserrat">
      {/* Fondo con franjas verdes corporativas */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-green-100">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-400/5 to-green-600/15"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-0 left-0 w-64 h-64 bg-green-400/20 rounded-full blur-3xl transform -translate-x-32 -translate-y-32"></div>
          <div className="absolute top-1/3 right-0 w-96 h-96 bg-emerald-300/15 rounded-full blur-3xl transform translate-x-48"></div>
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-green-500/20 rounded-full blur-3xl transform translate-y-40"></div>
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
            
            <Button 
              onClick={onLogin}
              className="w-full h-14 rounded-[20px] bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <span className="mr-2">🚀</span>
              Iniciar sesión con mi cuenta corporativa
            </Button>
            
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