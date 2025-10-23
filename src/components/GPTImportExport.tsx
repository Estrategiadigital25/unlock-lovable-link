// Ahora tiene 3 pestañas en lugar de 2:
<TabsList className="grid w-full grid-cols-3">
  <TabsTrigger value="file">Archivo</TabsTrigger>
  <TabsTrigger value="text">Texto JSON</TabsTrigger>
  <TabsTrigger value="url">URL/Vínculo</TabsTrigger> {/* NUEVO */}
</TabsList>

// Nueva función para importar desde URL
const handleImportFromUrl = async () => {
  // Descarga el JSON desde la URL
  const response = await fetch(importUrl);
  const data = await response.json();
  // Lo carga en el campo de texto para revisarlo
  setImportText(JSON.stringify(data, null, 2));
};
