import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-montserrat">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-foreground">🔍</span>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Bienvenida al Buscador GPT Ingtec Especialidades
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <CardDescription className="text-center text-muted-foreground leading-relaxed">
            Este entorno es exclusivo para colaboradores de Ingtec Especialidades. Solo se permite el ingreso con cuentas de correo @iespecialidades.com. Tu actividad será registrada para garantizar la trazabilidad y protección de la información.
          </CardDescription>
          <Button 
            onClick={onLogin}
            className="w-full h-12 rounded-[20px] bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-md"
          >
            Iniciar sesión con mi cuenta corporativa
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginScreen;