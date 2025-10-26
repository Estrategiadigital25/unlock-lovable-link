import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Loader2 } from "lucide-react";

interface LoginScreenProps {
  onLogin: () => void;
}

// Lista de emails autorizados - solo estos pueden registrarse
export const AUTHORIZED_EMAILS = [
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
  'operaciones@iespecialidades.com',
  'laboratorio5@iespecialidades.com',
  'powerbi@iespecialidades.com',
  'powerbi2@iespecialidades.com',
  'practicante@iespecialidades.com',
  'laboratorio8@iespecialidades.com',
  'auxiliaradministrativa@iespecialidades.com',
  'wilmer.pinzon@iespecialidades.com',
  'liderformuladores@iespecialidades.com',
  'lorena.hurtado@iespecialidades.com',
  'prueba@iespecialidades.com',
  'angie.loaiza@iespecialidades.com',
  'catalina.ospina@iespecialidades.com',


];

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAuth = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!trimmedEmail || !password) {
      toast({
        title: "Campos incompletos",
        description: "Por favor ingresa tu email y contraseña.",
        variant: "destructive"
      });
      return;
    }

    // Validar que sea email de iespecialidades.com
    if (!trimmedEmail.endsWith('@iespecialidades.com')) {
      toast({
        title: "Acceso denegado",
        description: "Solo correos @iespecialidades.com están permitidos.",
        variant: "destructive"
      });
      return;
    }

    // Validar que esté en la lista de autorizados
    if (!AUTHORIZED_EMAILS.includes(trimmedEmail)) {
      toast({
        title: "Acceso denegado",
        description: "Tu email no está autorizado para usar esta aplicación.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      if (isRegistering) {
        // REGISTRO: Crear nueva cuenta
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: password,
          options: {
            data: {
              full_name: trimmedEmail.split('@')[0],
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          toast({
            title: "Cuenta creada exitosamente",
            description: "Por favor verifica tu email para activar tu cuenta. Revisa también tu carpeta de spam.",
          });
          setIsRegistering(false);
          setPassword('');
        }
      } else {
        // LOGIN: Iniciar sesión
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Email o contraseña incorrectos');
          }
          if (error.message.includes('Email not confirmed')) {
            throw new Error('Por favor verifica tu email antes de iniciar sesión');
          }
          throw error;
        }

        if (data.user) {
          toast({
            title: "¡Bienvenido!",
            description: `Acceso autorizado para ${trimmedEmail}`,
          });
          onLogin();
        }
      }
    } catch (error: any) {
      toast({
        title: isRegistering ? "Error al crear cuenta" : "Error al iniciar sesión",
        description: error.message || "Intenta de nuevo o contacta al administrador.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
            <div className="mx-auto">
              <img src="/lovable-uploads/4c7e0a4b-080a-437a-b8e8-bb34ebe70495.png" alt="Ingtec Logo" className="w-20 h-20" />
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
                Respaldado por la última versión de ChatGPT
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-0">
            <div className="border rounded-lg p-4" style={{ backgroundColor: '#a7db74' + '10', borderColor: '#a7db74' + '40' }}>
              <CardDescription className="text-center leading-relaxed text-sm" style={{ color: '#a7db74' }}>
                <span className="inline-block mr-2">🔐</span>
                <strong>Acceso seguro con autenticación</strong><br/>
                Solo cuentas @iespecialidades.com autorizadas.<br/>
                {isRegistering ? 'Crea tu cuenta por primera vez.' : 'Inicia sesión con tu contraseña.'}
              </CardDescription>
            </div>
            
            <div className="space-y-3">
              <Input
                type="email"
                placeholder="tu.email@iespecialidades.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-center"
                disabled={loading}
              />
              
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={isRegistering ? "Crea una contraseña (mín. 6 caracteres)" : "Tu contraseña"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-center pr-10"
                  onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              <Button 
                onClick={handleAuth}
                disabled={loading}
                className="w-full h-14 rounded-[20px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {isRegistering ? 'Creando cuenta...' : 'Validando...'}
                  </>
                ) : (
                  <>
                    <span className="mr-2">✓</span>
                    {isRegistering ? 'Crear cuenta' : 'Validar identidad y acceder'}
                  </>
                )}
              </Button>

              <button
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setPassword('');
                }}
                className="w-full text-sm text-gray-600 hover:text-gray-800 transition-colors"
                disabled={loading}
              >
                {isRegistering ? (
                  <>¿Ya tienes cuenta? <span className="font-semibold" style={{ color: '#a7db74' }}>Inicia sesión aquí</span></>
                ) : (
                  <>¿Primera vez? <span className="font-semibold" style={{ color: '#a7db74' }}>Crea tu cuenta aquí</span></>
                )}
              </button>
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


