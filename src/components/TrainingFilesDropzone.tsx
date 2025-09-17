import { useState, useCallback, useRef } from "react";
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";

interface UploadedFile {
  url: string;
  name: string;
  key: string;
  type: string;
  size: number;
}

interface TrainingFilesDropzoneProps {
  presignEndpoint: string;
  onChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  userEmail?: string;
  gptId?: string;
}

const TrainingFilesDropzone = ({ 
  presignEndpoint, 
  onChange, 
  maxFiles = 10, 
  maxSizeMB = 25,
  userEmail,
  gptId
}: TrainingFilesDropzoneProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState<string[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const supportedTypes = [
    'image/png', 'image/jpeg', 'image/webp', 'image/gif',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('presentation')) return '📊';
    if (type.includes('spreadsheet')) return '📈';
    return '📄';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadFile = async (file: File): Promise<UploadedFile | null> => {
    const fileId = `${Date.now()}-${file.name}`;
    
    try {
      setUploading(prev => [...prev, fileId]);
      setProgress(prev => ({ ...prev, [fileId]: 0 }));

      // Handle mock mode (no presign endpoint)
      if (!presignEndpoint || presignEndpoint.trim() === '') {
        console.log('Mock mode upload for file:', file.name);
        
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        setProgress(prev => ({ ...prev, [fileId]: 50 }));
        await new Promise(resolve => setTimeout(resolve, 500));
        setProgress(prev => ({ ...prev, [fileId]: 100 }));

        // Create mock file reference
        const mockFileUrl = `mock://${fileId}/${file.name}`;
        const mockKey = `mock/${fileId}/${file.name}`;

        console.log('Mock upload completed for:', file.name);

        return {
          url: mockFileUrl,
          name: file.name,
          key: mockKey,
          type: file.type,
          size: file.size
        };
      }

      // Real S3 upload flow
      setProgress(prev => ({ ...prev, [fileId]: 10 }));

      // 1. Get presigned URL from Lambda function
      const presignResponse = await fetch(presignEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          userEmail: userEmail,
          gptId: gptId
        })
      });

      if (!presignResponse.ok) {
        const errorData = await presignResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${presignResponse.status}`);
      }

      const { uploadUrl, accessUrl, fileKey } = await presignResponse.json();
      setProgress(prev => ({ ...prev, [fileId]: 30 }));

      // 2. Upload file to S3 using presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 
          'Content-Type': file.type,
          'Content-Length': file.size.toString()
        },
        body: file
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }

      setProgress(prev => ({ ...prev, [fileId]: 100 }));

      return {
        url: accessUrl,
        name: file.name,
        key: fileKey,
        type: file.type,
        size: file.size
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error de subida",
        description: `Error subiendo ${file.name}: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(prev => prev.filter(id => id !== fileId));
      setProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[fileId];
        return newProgress;
      });
    }
  };

  const handleFiles = async (files: FileList) => {
    const fileArray = Array.from(files);
    console.log('handleFiles called with:', fileArray.length, 'files');
    console.log('presignEndpoint:', presignEndpoint);
    
    // Validaciones
    if (uploadedFiles.length + fileArray.length > maxFiles) {
      toast({
        title: "Límite excedido",
        description: `Máximo ${maxFiles} archivos permitidos`,
        variant: "destructive"
      });
      return;
    }

    const maxBytes = maxSizeMB * 1024 * 1024;
    const invalidFiles = fileArray.filter(file => 
      !supportedTypes.includes(file.type) || file.size > maxBytes
    );

    console.log('Invalid files:', invalidFiles);
    console.log('File types:', fileArray.map(f => f.type));

    if (invalidFiles.length > 0) {
      toast({
        title: "Archivos no válidos",
        description: `${invalidFiles.length} archivo(s) no son válidos (tipo no soportado o muy grandes)`,
        variant: "destructive"
      });
    }

    const validFiles = fileArray.filter(file => 
      supportedTypes.includes(file.type) && file.size <= maxBytes
    );

    if (validFiles.length === 0) return;

    // Subir archivos
    const uploadPromises = validFiles.map(uploadFile);
    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter((result): result is UploadedFile => result !== null);

    console.log('Upload results:', results);
    console.log('Successful uploads:', successfulUploads);

    if (successfulUploads.length > 0) {
      const newFiles = [...uploadedFiles, ...successfulUploads];
      setUploadedFiles(newFiles);
      onChange(newFiles);
      
      const isMockMode = !presignEndpoint || presignEndpoint.trim() === '';
      console.log('isMockMode:', isMockMode, 'presignEndpoint:', presignEndpoint);
      
      toast({
        title: isMockMode ? "Archivos simulados" : "Archivos subidos",
        description: isMockMode 
          ? `${successfulUploads.length} archivo(s) simulado(s) - Configura VITE_PRESIGN_ENDPOINT para subida real`
          : `${successfulUploads.length} archivo(s) subido(s) exitosamente a S3`
      });
    }
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    onChange(newFiles);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [uploadedFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  return (
    <div className="w-full space-y-4">
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'}
          ${uploading.length > 0 ? 'pointer-events-none opacity-50' : 'hover:border-primary/50'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <div className="space-y-2">
          <p className="text-lg font-medium">
            Arrastra archivos aquí o{' '}
            <Button
              variant="link"
              className="p-0 h-auto text-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading.length > 0}
            >
              selecciona archivos
            </Button>
          </p>
          <p className="text-sm text-muted-foreground">
            Máximo {maxFiles} archivos, {maxSizeMB}MB cada uno
          </p>
          <p className="text-xs text-muted-foreground">
            Soporta: PDF, Word, PowerPoint, Excel, imágenes, texto
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept={supportedTypes.join(',')}
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {/* Progress bars para uploads activos */}
      {uploading.length > 0 && (
        <div className="space-y-2">
          {uploading.map(fileId => (
            <div key={fileId} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Subiendo...</span>
                <span>{progress[fileId] || 0}%</span>
              </div>
              <Progress value={progress[fileId] || 0} className="w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Lista de archivos subidos */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Archivos de entrenamiento ({uploadedFiles.length})</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getFileIcon(file.type)}</span>
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingFilesDropzone;