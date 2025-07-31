import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Download } from "lucide-react";

interface AdminPanelProps {
  onBack: () => void;
}

const AdminPanel = ({ onBack }: AdminPanelProps) => {
  const registros = [
    {
      usuario: "juan@iespecialidades.com",
      fecha: "28/07/2025",
      horaEntrada: "09:05",
      horaSalida: "09:54",
      tiempoActivo: "00:49",
      ip: "181.55.34.98",
      busquedas: 6
    },
    {
      usuario: "maria@iespecialidades.com",
      fecha: "28/07/2025",
      horaEntrada: "10:15",
      horaSalida: "11:30",
      tiempoActivo: "01:15",
      ip: "181.55.34.102",
      busquedas: 12
    },
    {
      usuario: "carlos@iespecialidades.com",
      fecha: "28/07/2025",
      horaEntrada: "08:30",
      horaSalida: "12:45",
      tiempoActivo: "04:15",
      ip: "181.55.34.85",
      busquedas: 28
    }
  ];

  const handleDownloadReport = () => {
    // Simular descarga de reporte
    console.log("Descargando reporte .xlsx del día");
  };

  return (
    <div className="min-h-screen bg-background font-montserrat p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={onBack}
            variant="outline"
            size="sm"
            className="rounded-[20px]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Chat
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Panel de monitoreo – Administrador</h1>
            <p className="text-muted-foreground mt-1">
              Aquí puedes consultar los registros de ingreso, duración de sesión, IP y cantidad de búsquedas por usuario.
            </p>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-semibold">Registros de Actividad</CardTitle>
            <Button 
              onClick={handleDownloadReport}
              className="rounded-[20px] bg-primary hover:bg-primary/90"
            >
              <Download className="h-4 w-4 mr-2" />
              📥 Descargar reporte .xlsx del día
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora de entrada</TableHead>
                  <TableHead>Hora de salida</TableHead>
                  <TableHead>Tiempo activo</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead className="text-right">Búsquedas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registros.map((registro, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{registro.usuario}</TableCell>
                    <TableCell>{registro.fecha}</TableCell>
                    <TableCell>{registro.horaEntrada}</TableCell>
                    <TableCell>{registro.horaSalida}</TableCell>
                    <TableCell>{registro.tiempoActivo}</TableCell>
                    <TableCell className="font-mono text-sm">{registro.ip}</TableCell>
                    <TableCell className="text-right font-semibold">{registro.busquedas}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-accent/20 rounded-lg border border-accent">
          <p className="text-sm text-muted-foreground">
            <strong>Nota:</strong> Los datos mostrados se actualizan en tiempo real. 
            Los reportes incluyen información detallada de todas las sesiones del día seleccionado.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;