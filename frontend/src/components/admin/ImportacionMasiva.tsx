import React, { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Download, X, Edit, Save, Plus, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { useImportacion } from '../../hooks/useImportacion';
import API from '../../config/api';
import * as XLSX from 'xlsx';

interface AprendizRecord {
  tipo_documento: string;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
  ficha: string;
  programa_formacion: string;
  ambiente: string;
  jornada: string;
  fecha_inicio: string;
  fecha_fin: string;
  rh: string;
  id_estado?: number;
}

interface FichaAgrupada {
  numero_ficha: string;
  programa_formacion: string;
  ambiente: string;
  jornada: string;
  fecha_inicio: string;
  fecha_fin: string;
  aprendices: AprendizRecord[];
}

export function ImportacionMasiva() {
  const { loading, cargarExcel, guardarMasivo } = useImportacion();
  
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null as File | null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState([] as AprendizRecord[]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState([] as AprendizRecord[]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [estados, setEstados] = useState([] as any[]);
  const [estadoDefault, setEstadoDefault] = useState(null as number | null);

  // Cargar estados de aprendiz al montar y buscar "En Formación" por defecto
  useEffect(() => {
    const fetchEstados = async () => {
      try {
        const response = await API.get('/estados/aprendiz');
        const data = response.data?.estados || [];
        setEstados(data);
        // Buscar el estado "En Formación" (case insensitive)
        const estadoEnFormacion = data.find(
          (e: any) => e.nombre_estado?.toLowerCase().includes('formación') || 
                      e.nombre_estado?.toLowerCase().includes('formacion')
        );
        if (estadoEnFormacion) {
          setEstadoDefault(estadoEnFormacion.id_estado);
        } else if (data.length > 0) {
          setEstadoDefault(data[0].id_estado);
        }
      } catch (err) {
        console.error('Error cargando estados:', err);
      }
    };
    fetchEstados();
  }, []);

  const handleDragOver = (e: any) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.xlsx')) {
      setFile(droppedFile);
      processFile(droppedFile);
    } else {
      toast.error('Por favor seleccione un archivo Excel (.xlsx)');
    }
  };

  const handleFileSelect = (e: any) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFile(selectedFile);
    }
  };

  const processFile = async (fileToProcess: File) => {
    setIsProcessing(true);
    try {
      const result = await cargarExcel(fileToProcess);
      
      if (result.success && result.preview) {
        // Mapear los datos del Excel a nuestro formato
        const mappedData: AprendizRecord[] = result.preview.map((row: any) => ({
          tipo_documento: row['Tipo Documento'] || row['tipo_documento'] || 'CC',
          numero_documento: String(row['Número de documento'] || row['numero_documento'] || row['Documento'] || ''),
          nombres: row['Nombre'] || row['nombres'] || row['Nombres'] || '',
          apellidos: row['Apellidos'] || row['apellidos'] || row['Apellido'] || '',
          telefono: String(row['Celular'] || row['telefono'] || row['Teléfono'] || ''),
          correo: row['Correo electrónico'] || row['correo'] || row['Correo'] || row['Email'] || '',
          ficha: String(row['Ficha'] || row['ficha'] || row['Número Ficha'] || ''),
          programa_formacion: row['Programa de formación'] || row['programa_formacion'] || row['Programa'] || '',
          ambiente: row['Ambiente asignado'] || row['ambiente'] || row['Ambiente'] || '',
          jornada: (row['Jornada'] || row['jornada'] || 'DIURNA').toUpperCase(),
          fecha_inicio: row['Fecha inicio formación'] || row['fecha_inicio'] || row['Fecha Inicio'] || '',
          fecha_fin: row['Fecha fin formación'] || row['fecha_fin'] || row['Fecha Fin'] || '',
          rh: row['RH'] || row['rh'] || '',
          id_estado: estadoDefault || undefined,
        }));

        setPreviewData(mappedData);
        setEditedData(mappedData);
        setShowPreview(true);
        toast.success(`${mappedData.length} registros cargados correctamente`);
      } else {
        toast.error(result.error || 'Error al procesar el archivo');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar el archivo');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditField = (index: number, field: keyof AprendizRecord, value: string | number) => {
    const newData = [...editedData];
    newData[index] = { ...newData[index], [field]: value };
    setEditedData(newData);
  };

  const toggleEditMode = () => {
    if (isEditing) {
      setPreviewData(editedData);
      toast.success('Cambios guardados correctamente');
    }
    setIsEditing(!isEditing);
  };

  // Agrupar aprendices por ficha
  const agruparPorFicha = (): FichaAgrupada[] => {
    const fichasMap = new Map<string, FichaAgrupada>();
    
    editedData.forEach(record => {
      const fichaKey = record.ficha;
      if (!fichasMap.has(fichaKey)) {
        fichasMap.set(fichaKey, {
          numero_ficha: record.ficha,
          programa_formacion: record.programa_formacion,
          ambiente: record.ambiente,
          jornada: record.jornada,
          fecha_inicio: record.fecha_inicio,
          fecha_fin: record.fecha_fin,
          aprendices: [],
        });
      }
      fichasMap.get(fichaKey)?.aprendices.push(record);
    });

    return Array.from(fichasMap.values());
  };

  const handleSaveAll = async () => {
    if (editedData.length === 0) {
      toast.error('No hay registros para guardar.');
      return;
    }

    if (!estadoDefault) {
      toast.error('Debe seleccionar un estado por defecto para los aprendices.');
      return;
    }

    // Verificar duplicados antes de enviar
    const documentosMap = new Map<string, number[]>();
    editedData.forEach((record, index) => {
      const doc = record.numero_documento?.trim();
      if (doc) {
        if (!documentosMap.has(doc)) {
          documentosMap.set(doc, []);
        }
        documentosMap.get(doc)!.push(index + 1);
      }
    });

    const duplicados = Array.from(documentosMap.entries())
      .filter(([_, filas]) => filas.length > 1)
      .map(([doc, filas]) => `${doc} (filas ${filas.join(', ')})`);

    if (duplicados.length > 0) {
      toast.error(`Hay documentos duplicados en el archivo: ${duplicados.slice(0, 3).join('; ')}${duplicados.length > 3 ? ` y ${duplicados.length - 3} más` : ''}`);
      return;
    }

    setIsSaving(true);
    const fichasAgrupadas = agruparPorFicha();
    let exitosos = 0;
    let errores = 0;
    let fichasNuevas = 0;
    let fichasExistentes = 0;
    const erroresDetalle: string[] = [];

    for (const fichaData of fichasAgrupadas) {
      try {
        const fichaPayload = {
          numero_ficha: fichaData.numero_ficha,
          programa_formacion: fichaData.programa_formacion,
          ambiente: fichaData.ambiente || null,
          jornada: fichaData.jornada || 'DIURNA',
          fecha_inicio: fichaData.fecha_inicio || null,
          fecha_fin: fichaData.fecha_fin || null,
        };

        const aprendicesPayload = fichaData.aprendices.map(a => ({
          tipo_documento: a.tipo_documento || 'CC',
          numero_documento: a.numero_documento,
          nombres: a.nombres,
          apellidos: a.apellidos,
          telefono: a.telefono || null,
          correo: a.correo || null,
          rh: a.rh || null,
          id_estado: a.id_estado || estadoDefault,
        }));

        const result = await guardarMasivo(fichaPayload, aprendicesPayload);
        
        if (result.success) {
          exitosos++;
          // Verificar si se usó una ficha existente o se creó una nueva
          if (result.data?.fichaExistente) {
            fichasExistentes++;
          } else {
            fichasNuevas++;
          }
        } else {
          errores++;
          erroresDetalle.push(`Ficha ${fichaData.numero_ficha}: ${result.error}`);
          console.error(`Error en ficha ${fichaData.numero_ficha}:`, result.error);
        }
      } catch (err: any) {
        errores++;
        erroresDetalle.push(`Ficha ${fichaData.numero_ficha}: ${err?.message || 'Error desconocido'}`);
        console.error(`Error guardando ficha ${fichaData.numero_ficha}:`, err);
      }
    }

    setIsSaving(false);

    if (exitosos > 0 && errores === 0) {
      let mensaje = '';
      if (fichasNuevas > 0 && fichasExistentes > 0) {
        mensaje = `${fichasNuevas} ficha(s) creada(s) y ${fichasExistentes} ficha(s) actualizada(s) con ${editedData.length} aprendices`;
      } else if (fichasExistentes > 0) {
        mensaje = `${editedData.length} aprendices agregados a ${fichasExistentes} ficha(s) existente(s)`;
      } else {
        mensaje = `${fichasNuevas} ficha(s) creada(s) con ${editedData.length} aprendices`;
      }
      toast.success(mensaje);
      resetImport();
    } else if (exitosos > 0 && errores > 0) {
      toast.warning(`${exitosos} ficha(s) procesada(s), ${errores} con errores`);
      if (erroresDetalle.length > 0) {
        console.error('Errores de importación:', erroresDetalle);
      }
    } else {
      toast.error(erroresDetalle[0] || 'No se pudo importar ninguna ficha. Revise los datos.');
    }
  };

  const resetImport = () => {
    setFile(null);
    setShowPreview(false);
    setPreviewData([]);
    setEditedData([]);
    setIsEditing(false);
  };

  const downloadTemplate = () => {
    // Crear plantilla Excel usando la librería xlsx
    const templateData = [
      ['Tipo Documento', 'Número de documento', 'Nombre', 'Apellidos', 'Celular', 'Correo electrónico', 'Ficha', 'Programa de formación', 'Ambiente asignado', 'Jornada', 'Fecha inicio formación', 'Fecha fin formación', 'RH'],
      ['CC', '1234567890', 'Juan', 'Pérez García', '3001234567', 'juan.perez@example.com', '2715071', 'Análisis y Desarrollo de Software', 'Ambiente 301', 'DIURNA', '2024-01-15', '2025-12-15', 'O+'],
      ['CC', '9876543210', 'María', 'González López', '3109876543', 'maria.gonzalez@example.com', '2715071', 'Análisis y Desarrollo de Software', 'Ambiente 301', 'DIURNA', '2024-01-15', '2025-12-15', 'A+'],
      ['TI', '1122334455', 'Carlos', 'Rodríguez Martínez', '3201122334', 'carlos.rodriguez@example.com', '2715072', 'Gestión Logística', 'Ambiente 205', 'NOCTURNA', '2024-02-01', '2025-11-30', 'B+'],
    ];

    // Crear libro de Excel
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);

    // Ajustar ancho de columnas
    worksheet['!cols'] = [
      { wch: 15 }, // Tipo Documento
      { wch: 20 }, // Número de documento
      { wch: 15 }, // Nombre
      { wch: 20 }, // Apellidos
      { wch: 15 }, // Celular
      { wch: 30 }, // Correo electrónico
      { wch: 12 }, // Ficha
      { wch: 40 }, // Programa de formación
      { wch: 18 }, // Ambiente asignado
      { wch: 12 }, // Jornada
      { wch: 22 }, // Fecha inicio formación
      { wch: 22 }, // Fecha fin formación
      { wch: 8 },  // RH
    ];

    // Agregar hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Aprendices');

    // Descargar archivo
    XLSX.writeFile(workbook, 'plantilla_importacion_aprendices.xlsx');
    
    toast.success('Plantilla Excel descargada correctamente');
  };

  const fichasAgrupadas = agruparPorFicha();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-[var(--sena-blue)]">Importación Masiva de Aprendices</h2>
        <p className="text-gray-600 mt-1">Importe múltiples aprendices organizados por fichas desde un archivo Excel</p>
      </div>

      {/* Instructions */}
      <Card className="p-6 rounded-2xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-emerald-50">
        <h3 className="font-semibold text-[var(--sena-blue)] mb-3 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Instrucciones para Importación de Fichas
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-[var(--sena-green)] mt-1">•</span>
            <span>El archivo debe ser formato Excel (.xlsx)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--sena-green)] mt-1">•</span>
            <span><strong>Columnas requeridas:</strong> Tipo Documento, Número de documento, Nombre, Apellidos, Celular, Correo electrónico, Ficha, Programa de formación, Ambiente asignado, Jornada, Fecha inicio formación, Fecha fin formación, RH</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--sena-green)] mt-1">•</span>
            <span>Todos los aprendices con el mismo número de ficha serán agrupados automáticamente</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--sena-green)] mt-1">•</span>
            <span>Jornadas válidas: DIURNA, NOCTURNA, MIXTA</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--sena-green)] mt-1">•</span>
            <span>Formato de fechas: AAAA-MM-DD (ejemplo: 2024-01-15)</span>
          </li>
        </ul>
        <div className="mt-4">
          <Button 
            variant="outline" 
            className="h-10 rounded-xl border-2 hover:bg-white transition-all duration-300"
            onClick={downloadTemplate}
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar Plantilla
          </Button>
        </div>
      </Card>

      {/* Estado por defecto - solo informativo */}
      {estadoDefault && (
        <Card className="p-4 rounded-2xl border-0 shadow-md bg-white">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Estado asignado a los aprendices:</span>
            <Badge className="bg-emerald-100 text-emerald-800 rounded-lg px-3 py-1 text-sm">
              En Formación
            </Badge>
          </div>
        </Card>
      )}

      {/* Upload Area */}
      {!showPreview && (
        <Card className="p-8 rounded-2xl border-0 shadow-lg bg-white">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-3 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
              isDragging 
                ? 'border-[var(--sena-green)] bg-emerald-50' 
                : 'border-gray-300 hover:border-[var(--sena-blue)] hover:bg-gray-50'
            }`}
          >
            <div className="flex flex-col items-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${
                isDragging 
                  ? 'bg-[var(--sena-green)] scale-110' 
                  : isProcessing
                  ? 'bg-blue-500'
                  : 'bg-gray-100'
              }`}>
                {isProcessing ? (
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                ) : (
                  <Upload className={`w-10 h-10 ${isDragging ? 'text-white' : 'text-gray-400'}`} />
                )}
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {isProcessing ? 'Procesando archivo...' : file ? file.name : 'Arrastre su archivo Excel aquí'}
              </h3>
              
              <p className="text-gray-600 mb-6">
                {isProcessing ? 'Por favor espere mientras se procesan los datos' : 'o haga clic en el botón para seleccionar'}
              </p>
              
              <input
                type="file"
                id="file-upload"
                accept=".xlsx"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isProcessing}
              />
              
              <Button
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={isProcessing}
                className="h-12 bg-gradient-to-r from-[var(--sena-blue)] to-[#0077A3] hover:from-[#0077A3] hover:to-[#005580] shadow-md hover:shadow-lg transition-all duration-300 rounded-xl disabled:opacity-50"
              >
                <FileSpreadsheet className="w-5 h-5 mr-2" />
                {isProcessing ? 'Procesando...' : 'Importar Archivo Excel'}
              </Button>
              
              <p className="text-sm text-gray-500 mt-4">
                Formato aceptado: Excel (.xlsx) - Máximo 5MB
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Preview */}
      {showPreview && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 rounded-2xl border-0 shadow-md bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Aprendices</p>
                  <p className="text-3xl font-semibold text-[var(--sena-blue)] mt-1">{editedData.length}</p>
                </div>
                <FileSpreadsheet className="w-10 h-10 text-[var(--sena-blue)]" />
              </div>
            </Card>

            <Card className="p-5 rounded-2xl border-0 shadow-md bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Fichas a Crear</p>
                  <p className="text-3xl font-semibold text-[var(--sena-green)] mt-1">
                    {fichasAgrupadas.length}
                  </p>
                </div>
                <Plus className="w-10 h-10 text-[var(--sena-green)]" />
              </div>
            </Card>

            <Card className="p-5 rounded-2xl border-0 shadow-md bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Programas</p>
                  <p className="text-3xl font-semibold text-purple-600 mt-1">
                    {new Set(editedData.map(r => r.programa_formacion)).size}
                  </p>
                </div>
                <CheckCircle className="w-10 h-10 text-purple-600" />
              </div>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-between items-center">
            <div className="flex gap-3">
              <Button
                onClick={toggleEditMode}
                variant="outline"
                className="h-12 rounded-xl border-2 hover:bg-emerald-50 transition-all duration-300"
                disabled={isSaving}
              >
                {isEditing ? (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Campos
                  </>
                )}
              </Button>
              
              <Button
                onClick={resetImport}
                variant="outline"
                className="h-12 rounded-xl border-2 hover:bg-gray-50 transition-all duration-300"
                disabled={isSaving}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>

            <Button
              onClick={handleSaveAll}
              disabled={isEditing || isSaving || editedData.length === 0}
              className="h-12 bg-gradient-to-r from-[var(--sena-green)] to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed px-8"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Importar {fichasAgrupadas.length} Ficha(s)
                </>
              )}
            </Button>
          </div>

          {/* Preview Table with Horizontal Scroll */}
          <Card className="p-6 rounded-2xl border-0 shadow-lg bg-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-[var(--sena-blue)]">Vista Previa - Datos del Excel</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {isEditing ? 'Modo edición activado - Modifique los campos necesarios' : 'Revise los datos antes de guardar'}
                </p>
              </div>
              {isEditing && (
                <Badge className="bg-orange-100 text-orange-800 rounded-lg px-3 py-2">
                  Editando
                </Badge>
              )}
            </div>

            {/* Tabla con scroll horizontal */}
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full min-w-max">
                <thead className="bg-gradient-to-r from-[var(--sena-blue)] to-[#0077A3] text-white">
                  <tr>
                    <th className="text-left p-4 font-semibold whitespace-nowrap min-w-[100px]">Tipo Doc</th>
                    <th className="text-left p-4 font-semibold whitespace-nowrap min-w-[140px]">Documento</th>
                    <th className="text-left p-4 font-semibold whitespace-nowrap min-w-[120px]">Nombres</th>
                    <th className="text-left p-4 font-semibold whitespace-nowrap min-w-[140px]">Apellidos</th>
                    <th className="text-left p-4 font-semibold whitespace-nowrap min-w-[120px]">Teléfono</th>
                    <th className="text-left p-4 font-semibold whitespace-nowrap min-w-[200px]">Correo</th>
                    <th className="text-left p-4 font-semibold whitespace-nowrap min-w-[100px]">Ficha</th>
                    <th className="text-left p-4 font-semibold whitespace-nowrap min-w-[200px]">Programa</th>
                    <th className="text-left p-4 font-semibold whitespace-nowrap min-w-[120px]">Ambiente</th>
                    <th className="text-left p-4 font-semibold whitespace-nowrap min-w-[100px]">Jornada</th>
                    <th className="text-left p-4 font-semibold whitespace-nowrap min-w-[120px]">F. Inicio</th>
                    <th className="text-left p-4 font-semibold whitespace-nowrap min-w-[120px]">F. Fin</th>
                    <th className="text-left p-4 font-semibold whitespace-nowrap min-w-[80px]">RH</th>
                  </tr>
                </thead>
                <tbody>
                  {editedData.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="p-10 text-center text-gray-500">
                        No hay datos para mostrar.
                      </td>
                    </tr>
                  ) : (
                    editedData.map((record, index) => (
                      <tr key={index} className={`border-b border-gray-100 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } hover:bg-emerald-50/30 transition-all duration-200`}>
                        <td className="p-3">
                          {isEditing ? (
                            <Select
                              value={record.tipo_documento}
                              onValueChange={(value) => handleEditField(index, 'tipo_documento', value)}
                            >
                              <SelectTrigger className="h-9 rounded-lg border-gray-300">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="CC">CC</SelectItem>
                                <SelectItem value="TI">TI</SelectItem>
                                <SelectItem value="CE">CE</SelectItem>
                                <SelectItem value="PAS">PAS</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800 rounded-lg">{record.tipo_documento}</Badge>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Input
                              value={record.numero_documento}
                              onChange={(e) => handleEditField(index, 'numero_documento', e.target.value)}
                              className="h-9 rounded-lg border-gray-300 focus:border-[var(--sena-green)]"
                            />
                          ) : (
                            <span className="text-gray-900 font-medium">{record.numero_documento}</span>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Input
                              value={record.nombres}
                              onChange={(e) => handleEditField(index, 'nombres', e.target.value)}
                              className="h-9 rounded-lg border-gray-300 focus:border-[var(--sena-green)]"
                            />
                          ) : (
                            <span className="text-gray-900">{record.nombres}</span>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Input
                              value={record.apellidos}
                              onChange={(e) => handleEditField(index, 'apellidos', e.target.value)}
                              className="h-9 rounded-lg border-gray-300 focus:border-[var(--sena-green)]"
                            />
                          ) : (
                            <span className="text-gray-900">{record.apellidos}</span>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Input
                              value={record.telefono}
                              onChange={(e) => handleEditField(index, 'telefono', e.target.value)}
                              className="h-9 rounded-lg border-gray-300 focus:border-[var(--sena-green)]"
                            />
                          ) : (
                            <span className="text-gray-700">{record.telefono}</span>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Input
                              value={record.correo}
                              onChange={(e) => handleEditField(index, 'correo', e.target.value)}
                              className="h-9 rounded-lg border-gray-300 focus:border-[var(--sena-green)]"
                            />
                          ) : (
                            <span className="text-gray-700 text-sm">{record.correo}</span>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Input
                              value={record.ficha}
                              onChange={(e) => handleEditField(index, 'ficha', e.target.value)}
                              className="h-9 rounded-lg border-gray-300 focus:border-[var(--sena-green)]"
                            />
                          ) : (
                            <Badge className="bg-blue-100 text-blue-800 rounded-lg">{record.ficha}</Badge>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Input
                              value={record.programa_formacion}
                              onChange={(e) => handleEditField(index, 'programa_formacion', e.target.value)}
                              className="h-9 rounded-lg border-gray-300 focus:border-[var(--sena-green)]"
                            />
                          ) : (
                            <span className="text-gray-900 text-sm">{record.programa_formacion}</span>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Input
                              value={record.ambiente}
                              onChange={(e) => handleEditField(index, 'ambiente', e.target.value)}
                              className="h-9 rounded-lg border-gray-300 focus:border-[var(--sena-green)]"
                            />
                          ) : (
                            <Badge className="bg-purple-100 text-purple-800 rounded-lg">{record.ambiente || 'N/A'}</Badge>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Select 
                              value={record.jornada} 
                              onValueChange={(value) => handleEditField(index, 'jornada', value)}
                            >
                              <SelectTrigger className="h-9 rounded-lg border-gray-300">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="DIURNA">DIURNA</SelectItem>
                                <SelectItem value="NOCTURNA">NOCTURNA</SelectItem>
                                <SelectItem value="MIXTA">MIXTA</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-800 rounded-lg">{record.jornada}</Badge>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Input
                              type="date"
                              value={record.fecha_inicio}
                              onChange={(e) => handleEditField(index, 'fecha_inicio', e.target.value)}
                              className="h-9 rounded-lg border-gray-300 focus:border-[var(--sena-green)]"
                            />
                          ) : (
                            <span className="text-gray-700 text-sm">{record.fecha_inicio || '—'}</span>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Input
                              type="date"
                              value={record.fecha_fin}
                              onChange={(e) => handleEditField(index, 'fecha_fin', e.target.value)}
                              className="h-9 rounded-lg border-gray-300 focus:border-[var(--sena-green)]"
                            />
                          ) : (
                            <span className="text-gray-700 text-sm">{record.fecha_fin || '—'}</span>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Input
                              value={record.rh}
                              onChange={(e) => handleEditField(index, 'rh', e.target.value)}
                              className="h-9 rounded-lg border-gray-300 focus:border-[var(--sena-green)]"
                            />
                          ) : (
                            <Badge className="bg-red-100 text-red-800 rounded-lg">{record.rh || '—'}</Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary by Ficha */}
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-semibold text-gray-900 mb-3">Resumen por Ficha ({fichasAgrupadas.length}):</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {fichasAgrupadas.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 border border-dashed border-gray-300 rounded-xl">
                    Aún no hay fichas detectadas en la carga.
                  </div>
                ) : (
                  fichasAgrupadas.map((ficha) => (
                    <div key={ficha.numero_ficha} className="p-4 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-[var(--sena-blue)] text-white rounded-lg px-3 py-1">
                          Ficha {ficha.numero_ficha}
                        </Badge>
                        <span className="text-sm font-semibold text-gray-700">{ficha.aprendices.length} aprendices</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-2 line-clamp-1">{ficha.programa_formacion || 'Programa pendiente'}</p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Badge className="bg-purple-100 text-purple-800 text-xs rounded-lg">
                          {ficha.ambiente || 'Sin ambiente'}
                        </Badge>
                        <Badge className="bg-emerald-100 text-emerald-800 text-xs rounded-lg">
                          {ficha.jornada || 'Sin jornada'}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
