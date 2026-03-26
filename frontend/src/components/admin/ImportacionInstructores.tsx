import React, { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, Download, X, Edit, Save, Loader2, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { useImportacion } from '../../hooks/useImportacion';
import API from '../../config/api';
import * as XLSX from 'xlsx';

interface InstructorRecord {
  tipo_documento: string;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
  rh: string;
  id_estado?: number;
}

export function ImportacionInstructores() {
  const { loading, cargarExcel } = useImportacion();
  
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null as File | null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState([] as InstructorRecord[]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState([] as InstructorRecord[]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [estados, setEstados] = useState([] as any[]);
  const [estadoDefault, setEstadoDefault] = useState(null as number | null);

  // Cargar estados de instructor al montar
  useEffect(() => {
    const fetchEstados = async () => {
      try {
        const response = await API.get('/estados/instructor');
        const data = response.data?.estados || [];
        setEstados(data);
        // Buscar el estado "Activo" por defecto
        const estadoActivo = data.find(
          (e: any) => e.nombre_estado?.toLowerCase().includes('activo')
        );
        if (estadoActivo) {
          setEstadoDefault(estadoActivo.id_estado);
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
        // Mapear los datos del Excel a nuestro formato de instructor
        const mappedData: InstructorRecord[] = result.preview.map((row: any) => ({
          tipo_documento: row['Tipo Documento'] || row['tipo_documento'] || 'CC',
          numero_documento: String(row['Número de documento'] || row['numero_documento'] || row['Documento'] || ''),
          nombres: row['Nombre'] || row['nombres'] || row['Nombres'] || '',
          apellidos: row['Apellidos'] || row['apellidos'] || row['Apellido'] || '',
          telefono: String(row['Celular'] || row['telefono'] || row['Teléfono'] || ''),
          correo: row['Correo electrónico'] || row['correo'] || row['Correo'] || row['Email'] || '',
          rh: row['RH'] || row['rh'] || '',
          id_estado: estadoDefault || undefined,
        }));

        setPreviewData(mappedData);
        setEditedData(mappedData);
        setShowPreview(true);
        toast.success(`${mappedData.length} instructores cargados correctamente`);
      } else {
        toast.error(result.error || 'Error al procesar el archivo');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar el archivo');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditField = (index: number, field: keyof InstructorRecord, value: string | number) => {
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

  const handleSaveAll = async () => {
    if (editedData.length === 0) {
      toast.error('No hay instructores para guardar.');
      return;
    }

    if (!estadoDefault) {
      toast.error('Debe seleccionar un estado por defecto para los instructores.');
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

    try {
      const instructoresPayload = editedData.map(i => ({
        tipo_documento: i.tipo_documento || 'CC',
        numero_documento: i.numero_documento,
        nombres: i.nombres,
        apellidos: i.apellidos,
        telefono: i.telefono || null,
        correo: i.correo || null,
        rh: i.rh || null,
        id_estado: i.id_estado || estadoDefault,
      }));

      const response = await API.post('/importacion/guardar-instructores', {
        instructores: instructoresPayload,
        id_estado_default: estadoDefault,
      });

      if (response.data) {
        toast.success(`${editedData.length} instructor(es) importado(s) exitosamente`);
        resetImport();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al guardar instructores';
      toast.error(errorMessage);
      console.error('Error guardando instructores:', err);
    } finally {
      setIsSaving(false);
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
    // Crear plantilla Excel para instructores (sin campos de ficha/ambiente)
    const templateData = [
      ['Tipo Documento', 'Número de documento', 'Nombre', 'Apellidos', 'Celular', 'Correo electrónico', 'RH'],
      ['CC', '1234567890', 'Carlos', 'Ramírez Pérez', '3001234567', 'carlos.ramirez@sena.edu.co', 'O+'],
      ['CC', '9876543210', 'María', 'González López', '3109876543', 'maria.gonzalez@sena.edu.co', 'A+'],
      ['CE', '1122334455', 'Juan', 'Martínez Silva', '3201122334', 'juan.martinez@sena.edu.co', 'B+'],
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
      { wch: 35 }, // Correo electrónico
      { wch: 8 },  // RH
    ];

    // Agregar hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Instructores');

    // Descargar archivo
    XLSX.writeFile(workbook, 'plantilla_importacion_instructores.xlsx');
    
    toast.success('Plantilla Excel de instructores descargada correctamente');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-[var(--sena-blue)]">Importación Masiva de Instructores</h2>
        <p className="text-gray-600 mt-1">Importe múltiples instructores desde un archivo Excel</p>
      </div>

      {/* Instructions */}
      <Card className="p-6 rounded-2xl border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50">
        <h3 className="font-semibold text-[var(--sena-blue)] mb-3 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Instrucciones para Importación de Instructores
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-purple-600 mt-1">•</span>
            <span>El archivo debe ser formato Excel (.xlsx)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 mt-1">•</span>
            <span><strong>Columnas requeridas:</strong> Tipo Documento, Número de documento, Nombre, Apellidos, Celular, Correo electrónico, RH</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 mt-1">•</span>
            <span>Tipos de documento válidos: CC, CE, TI, PAS</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 mt-1">•</span>
            <span>Los instructores serán creados con el estado "Activo" por defecto</span>
          </li>
        </ul>
        <div className="mt-4">
          <Button 
            variant="outline" 
            className="h-10 rounded-xl border-2 border-purple-300 hover:bg-purple-50 transition-all duration-300"
            onClick={downloadTemplate}
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar Plantilla Instructores
          </Button>
        </div>
      </Card>

      {/* Estado por defecto */}
      {estadoDefault && (
        <Card className="p-4 rounded-2xl border-0 shadow-md bg-white">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Estado asignado a los instructores:</span>
            <Badge className="bg-indigo-100 text-indigo-800 rounded-lg px-3 py-1 text-sm">
              Activo
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
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
            }`}
          >
            <div className="flex flex-col items-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${
                isDragging 
                  ? 'bg-purple-500 scale-110' 
                  : isProcessing
                  ? 'bg-indigo-500'
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
                id="file-upload-instructores"
                accept=".xlsx"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isProcessing}
              />
              
              <Button
                onClick={() => document.getElementById('file-upload-instructores')?.click()}
                disabled={isProcessing}
                className="h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-300 rounded-xl disabled:opacity-50"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-5 rounded-2xl border-0 shadow-md bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Instructores</p>
                  <p className="text-3xl font-semibold text-indigo-600 mt-1">{editedData.length}</p>
                </div>
                <Users className="w-10 h-10 text-indigo-600" />
              </div>
            </Card>

            <Card className="p-5 rounded-2xl border-0 shadow-md bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Listos para importar</p>
                  <p className="text-3xl font-semibold text-purple-600 mt-1">
                    {editedData.filter(r => r.numero_documento && r.nombres && r.apellidos).length}
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
                className="h-12 rounded-xl border-2 hover:bg-indigo-50 transition-all duration-300"
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
              className="h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed px-8"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Users className="w-5 h-5 mr-2" />
                  Importar {editedData.length} Instructor(es)
                </>
              )}
            </Button>
          </div>

          {/* Preview Table */}
          <Card className="p-6 rounded-2xl border-0 shadow-lg bg-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-indigo-700">Vista Previa - Instructores</h3>
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
                <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  <tr>
                    <th className="text-left p-4 font-semibold whitespace-nowrap min-w-[100px]">Tipo Doc</th>
                    <th className="text-left p-4 font-semibold whitespace-nowrap min-w-[140px]">Documento</th>
                    <th className="text-left p-4 font-semibold whitespace-nowrap min-w-[120px]">Nombres</th>
                    <th className="text-left p-4 font-semibold whitespace-nowrap min-w-[140px]">Apellidos</th>
                    <th className="text-left p-4 font-semibold whitespace-nowrap min-w-[120px]">Teléfono</th>
                    <th className="text-left p-4 font-semibold whitespace-nowrap min-w-[200px]">Correo</th>
                    <th className="text-left p-4 font-semibold whitespace-nowrap min-w-[80px]">RH</th>
                  </tr>
                </thead>
                <tbody>
                  {editedData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-gray-500">
                        No hay datos para mostrar.
                      </td>
                    </tr>
                  ) : (
                    editedData.map((record, index) => (
                      <tr key={index} className={`border-b border-gray-100 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } hover:bg-indigo-50/30 transition-all duration-200`}>
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
                              className="h-9 rounded-lg border-gray-300 focus:border-indigo-500"
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
                              className="h-9 rounded-lg border-gray-300 focus:border-indigo-500"
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
                              className="h-9 rounded-lg border-gray-300 focus:border-indigo-500"
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
                              className="h-9 rounded-lg border-gray-300 focus:border-indigo-500"
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
                              className="h-9 rounded-lg border-gray-300 focus:border-indigo-500"
                            />
                          ) : (
                            <span className="text-gray-700 text-sm">{record.correo}</span>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Input
                              value={record.rh}
                              onChange={(e) => handleEditField(index, 'rh', e.target.value)}
                              className="h-9 rounded-lg border-gray-300 focus:border-indigo-500"
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
          </Card>
        </>
      )}
    </div>
  );
}


