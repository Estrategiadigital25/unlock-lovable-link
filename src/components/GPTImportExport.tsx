import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, FileText, Package, AlertCircle, CheckCircle, X, File, Link as LinkIcon } from 'lucide-react';
import { 
  CustomGPT, 
  exportCustomGPT, 
  exportAllCustomGPTs, 
  validateGPTImportData, 
  validateGPTsCollectionData,
  importCustomGPT,
  importCustomGPTs,
  downloadFile,
  getCustomGPTs
} from '@/lib/localStorage';

interface GPTImportExportProps {
  customGPTs: CustomGPT[];
  onGPTsUpdated: (gpts: CustomGPT[]) => void;
}

interface ImportResult {
  success: boolean;
  message: string;
  type: 'success' | 'error' | 'warning';
}

const GPTImportExport: React.FC<GPTImportExportProps> = ({ customGPTs, onGPTsUpdated }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Export states
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedGPTsForExport, setSelectedGPTsForExport] = useState<string[]>([]);
  
  // Import states
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);

  // Export single GPT
  const handleExportSingleGPT = (gpt: CustomGPT) => {
    try {
      const exportData = exportCustomGPT(gpt);
      const filename = `${gpt.name.replace(/[^a-zA-Z0-9]/g, '_')}_gpt_export.json`;
      downloadFile(exportData, filename);
      
      toast({
        title: "GPT exportado",
        description: `Se ha descargado "${gpt.name}" como archivo JSON`,
      });
    } catch (error) {
      toast({
        title: "Error al exportar",
        description: "No se pudo exportar el GPT",
        variant: "destructive"
      });
    }
  };

  // Export all GPTs
  const handleExportAllGPTs = () => {
    try {
      if (customGPTs.length === 0) {
        toast({
          title: "No hay GPTs para exportar",
          description: "Primero crea algunos GPTs personalizados",
          variant: "destructive"
        });
        return;
      }

      const exportData = exportAllCustomGPTs();
      const filename = `custom_gpts_backup_${new Date().toISOString().split('T')[0]}.json`;
      downloadFile(exportData, filename);
      
      toast({
        title: "Colección exportada",
        description: `Se han exportado ${customGPTs.length} GPTs como respaldo`,
      });
      setIsExportOpen(false);
    } catch (error) {
      toast({
        title: "Error al exportar",
        description: "No se pudo exportar la colección de GPTs",
        variant: "destructive"
      });
    }
  };

  // Export selected GPTs
  const handleExportSelectedGPTs = () => {
    try {
      if (selectedGPTsForExport.length === 0) {
        toast({
          title: "Selecciona GPTs",
          description: "Selecciona al menos un GPT para exportar",
          variant: "destructive"
        });
        return;
      }

      const selectedGPTs = customGPTs.filter(gpt => selectedGPTsForExport.includes(gpt.id));
      const exportData = {
        gpts: selectedGPTs,
        exportDate: new Date().toISOString(),
        version: '1.0',
        type: 'custom-gpts-collection-export',
        count: selectedGPTs.length
      };

      const filename = `selected_gpts_${selectedGPTs.length}_export.json`;
      downloadFile(JSON.stringify(exportData, null, 2), filename);
      
      toast({
        title: "GPTs exportados",
        description: `Se han exportado ${selectedGPTs.length} GPTs seleccionados`,
      });
      setSelectedGPTsForExport([]);
      setIsExportOpen(false);
    } catch (error) {
      toast({
        title: "Error al exportar",
        description: "No se pudo exportar los GPTs seleccionados",
        variant: "destructive"
      });
    }
  };

  // Handle file import
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportText(content);
    };
    reader.readAsText(file);
  };

  // Import from URL
  const handleImportFromUrl = async () => {
    if (!importUrl.trim()) {
      toast({
        title: "URL requerida",
        description: "Ingresa una URL válida",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    setImportResults([]);
    setImportProgress(0);

    try {
      const response = await fetch(importUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setImportText(JSON.stringify(data, null, 2));
      setImportProgress(100);
      
      toast({
        title: "Datos descargados",
        description: "Ahora haz clic en 'Importar GPTs' para continuar",
      });
    } catch (error) {
      setImportResults([{
        success: false,
        message: `Error al descargar desde URL: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        type: 'error'
      }]);
      toast({
        title: "Error al importar",
        description: "No se pudo descargar desde la URL",
        variant: "destructive"
      });
    }
    
    setIsImporting(false);
  };

  // Import from text/file
  const handleImport = async () => {
    if (!importText.trim()) {
      toast({
        title: "No hay datos para importar",
        description: "Ingresa datos JSON, selecciona un archivo o descarga desde URL",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    setImportResults([]);
    setImportProgress(0);

    try {
      const data = JSON.parse(importText);
      
      // Try single GPT import first
      const singleGPTValidation = validateGPTImportData(data);
      if (singleGPTValidation.isValid && singleGPTValidation.gpt) {
        const result = importCustomGPT(singleGPTValidation.gpt, allowDuplicates);
        
        if (result.success) {
          setImportResults([{
            success: true,
            message: `GPT "${singleGPTValidation.gpt.name}" importado exitosamente`,
            type: 'success'
          }]);
          onGPTsUpdated(getCustomGPTs());
          toast({
            title: "GPT importado",
            description: `"${singleGPTValidation.gpt.name}" se agregó correctamente`,
          });
        } else {
          setImportResults([{
            success: false,
            message: result.error || 'Error desconocido',
            type: result.error?.includes('already exists') ? 'warning' : 'error'
          }]);
        }
        setImportProgress(100);
        setIsImporting(false);
        return;
      }

      // Try collection import
      const collectionValidation = validateGPTsCollectionData(data);
      if (collectionValidation.isValid && collectionValidation.gpts) {
        const totalGPTs = collectionValidation.gpts.length;
        const results: ImportResult[] = [];
        
        for (let i = 0; i < totalGPTs; i++) {
          const gpt = collectionValidation.gpts[i];
          const result = importCustomGPT(gpt, allowDuplicates);
          
          if (result.success) {
            results.push({
              success: true,
              message: `"${gpt.name}" - ${result.action === 'updated' ? 'actualizado' : 'importado'}`,
              type: 'success'
            });
          } else {
            results.push({
              success: false,
              message: `"${gpt.name}" - ${result.error}`,
              type: result.error?.includes('already exists') ? 'warning' : 'error'
            });
          }
          
          setImportProgress(((i + 1) / totalGPTs) * 100);
          setImportResults([...results]);
          
          // Small delay to show progress
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        onGPTsUpdated(getCustomGPTs());
        const successCount = results.filter(r => r.success).length;
        
        toast({
          title: "Importación completada",
          description: `${successCount} de ${totalGPTs} GPTs importados exitosamente`,
        });
        
        setIsImporting(false);
        return;
      }
      
      // If neither validation worked
      setImportResults([{
        success: false,
        message: 'El formato JSON no es válido. Debe ser un GPT individual o una colección de GPTs.',
        type: 'error'
      }]);
      
    } catch (error) {
      setImportResults([{
        success: false,
        message: 'Error al procesar el archivo JSON. Verifica que el formato sea correcto.',
        type: 'error'
      }]);
    }
    
    setImportProgress(100);
    setIsImporting(false);
  };

  // Clear import data
  const clearImportData = () => {
    setImportText('');
    setImportUrl('');
    setImportResults([]);
    setImportProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex gap-2">
      {/* Export Dialog */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Exportar GPTs</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">Exportar Todos</TabsTrigger>
              <TabsTrigger value="selected">Seleccionar GPTs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-blue-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">Exportar toda la colección</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Descarga todos tus GPTs personalizados ({customGPTs.length}) como un archivo de respaldo
                </p>
                <Button onClick={handleExportAllGPTs} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar respaldo completo
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="selected" className="space-y-4">
              <div className="space-y-3">
                <Label>Selecciona los GPTs a exportar:</Label>
                <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-3">
                  {customGPTs.map(gpt => (
                    <div key={gpt.id} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={`export-${gpt.id}`}
                        checked={selectedGPTsForExport.includes(gpt.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGPTsForExport([...selectedGPTsForExport, gpt.id]);
                          } else {
                            setSelectedGPTsForExport(selectedGPTsForExport.filter(id => id !== gpt.id));
                          }
                        }}
                        className="rounded"
                      />
                      <label htmlFor={`export-${gpt.id}`} className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span>{gpt.icon}</span>
                          <div>
                            <div className="font-medium text-sm">{gpt.name}</div>
                            <div className="text-xs text-muted-foreground">{gpt.description}</div>
                          </div>
                        </div>
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExportSingleGPT(gpt)}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                {selectedGPTsForExport.length > 0 && (
                  <Button onClick={handleExportSelectedGPTs} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar {selectedGPTsForExport.length} GPTs seleccionados
                  </Button>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar GPTs</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="file" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="file">Archivo</TabsTrigger>
              <TabsTrigger value="text">Texto JSON</TabsTrigger>
              <TabsTrigger value="url">URL/Vínculo</TabsTrigger>
            </TabsList>
            
            {/* File Upload Tab */}
            <TabsContent value="file" className="space-y-4">
              <div className="space-y-2">
                <Label>Subir archivo JSON</Label>
                <div className="flex gap-2">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <File className="h-4 w-4 mr-2" />
                    Seleccionar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Selecciona un archivo JSON exportado previamente
                </p>
              </div>
            </TabsContent>

            {/* Text Input Tab */}
            <TabsContent value="text" className="space-y-4">
              <div className="space-y-2">
                <Label>Pegar código JSON</Label>
                <Textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Pega aquí el contenido JSON de tus GPTs..."
                  rows={10}
                  className="resize-none font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Copia y pega el código JSON completo aquí
                </p>
              </div>
            </TabsContent>

            {/* URL Import Tab */}
            <TabsContent value="url" className="space-y-4">
              <div className="space-y-2">
                <Label>Importar desde URL o vínculo</Label>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    placeholder="https://ejemplo.com/gpt-config.json"
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    onClick={handleImportFromUrl}
                    disabled={!importUrl.trim() || isImporting}
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ingresa la URL de un archivo JSON público (debe tener acceso CORS habilitado)
                </p>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Después de descargar, revisa el contenido en la pestaña "Texto JSON" y luego haz clic en "Importar GPTs"
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>

          {/* Common import options and results */}
          <div className="space-y-4 border-t pt-4">
            {/* Options */}
            <div className="flex items-center space-x-2">
              <Switch
                id="allow-duplicates"
                checked={allowDuplicates}
                onCheckedChange={setAllowDuplicates}
              />
              <Label htmlFor="allow-duplicates" className="text-sm">
                Permitir sobrescribir GPTs existentes
              </Label>
            </div>

            {/* Import Progress */}
            {isImporting && (
              <div className="space-y-2">
                <Label>Progreso de importación</Label>
                <Progress value={importProgress} className="w-full" />
              </div>
            )}

            {/* Import Results */}
            {importResults.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                <Label>Resultados de importación</Label>
                <div className="space-y-1">
                  {importResults.map((result, index) => (
                    <Alert key={index} className={`py-2 ${
                      result.type === 'success' ? 'border-green-200 bg-green-50' :
                      result.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                      'border-red-200 bg-red-50'
                    }`}>
                      <div className="flex items-center gap-2">
                        {result.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {result.type === 'warning' && <AlertCircle className="h-4 w-4 text-yellow-600" />}
                        {result.type === 'error' && <X className="h-4 w-4 text-red-600" />}
                        <AlertDescription className="text-sm">
                          {result.message}
                        </AlertDescription>
                      </div>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={clearImportData}
                className="flex-1"
                disabled={isImporting}
              >
                Limpiar
              </Button>
              <Button 
                onClick={handleImport} 
                className="flex-1"
                disabled={!importText.trim() || isImporting}
              >
                {isImporting ? 'Importando...' : 'Importar GPTs'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GPTImportExport;
