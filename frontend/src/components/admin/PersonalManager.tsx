import React, { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Edit, Trash2, Download, QrCode } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { usePersonas } from '../../hooks/usePersonas';
import API from '../../config/api';

type PersonalTipo = 'instructor' | 'funcionario' | 'visitante';

interface Personal {
  id: number;
  nombre: string;
  nombres: string;
  apellidos: string;
  identificacion: string;
  telefono: string;
  correo: string;
  tipoDocumento: string;
  area?: string;
  estado: string;
  estadoId?: number | null;
  rh?: string;
}

interface PersonalManagerProps {
  tipo: PersonalTipo;
}

interface PersonaFormData {
  tipo_documento: string;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
  rh: string;
  area: string;
  estado: string;
}

type PersonalMetadata = {
  area?: string;
  estado?: string;
  categoria?: PersonalTipo;
};

const METADATA_STORAGE_KEY = 'personal-manager-metadata';

const tipoDocumentoOptions = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'PAS', label: 'Pasaporte' },
];

const getStoredMetadata = (): Record<string, PersonalMetadata> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(METADATA_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const persistMetadata = (metadata: Record<string, PersonalMetadata>) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(METADATA_STORAGE_KEY, JSON.stringify(metadata));
};

export function PersonalManager({ tipo }: PersonalManagerProps) {
  // Pasar el tipo como filtro de rol para obtener solo las personas del rol correspondiente
  const { personas, loading, error, createPersona, updatePersona, deletePersona } = usePersonas({ rol: tipo });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPersonal, setEditingPersonal] = useState<Personal | null>(null);
  const [metadataVersion, setMetadataVersion] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [estadosDisponibles, setEstadosDisponibles] = useState<any[]>([]);
  const [estadosLoading, setEstadosLoading] = useState(false);
  const [estadosError, setEstadosError] = useState<string | null>(null);

  const getTipoConfig = () => {
    switch (tipo) {
      case 'instructor':
        return {
          title: 'Instructores',
          singular: 'Instructor',
          icon: '👨‍🏫',
          tiposContrato: ['Planta', 'Contratista'],
        };
      case 'funcionario':
        return {
          title: 'Funcionarios',
          singular: 'Funcionario',
          icon: '💼',
          tiposContrato: ['Planta', 'Contratista'],
        };
      case 'visitante':
        return {
          title: 'Visitantes',
          singular: 'Visitante',
          icon: '🚶',
          tiposContrato: ['Visitante'],
        };
      default:
        return {
          title: 'Personal',
          singular: 'Personal',
          icon: '👤',
          tiposContrato: [],
        };
    }
  };

  const config = getTipoConfig();

  const buildEmptyFormData = (): PersonaFormData => ({
    tipo_documento: tipoDocumentoOptions[0].value,
    numero_documento: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    correo: '',
    rh: '',
    area: '',
    estado: '',
  });

  const [formData, setFormData] = useState<PersonaFormData>(buildEmptyFormData);

  useEffect(() => {
    setFormData(buildEmptyFormData());
  }, [tipo]);

  useEffect(() => {
    const fetchEstados = async () => {
      if (!tipo || tipo === 'visitante') {
        setEstadosDisponibles([]);
        setEstadosError(null);
        setFormData((prev) => ({ ...prev, estado: '' }));
        return;
      }

      setEstadosLoading(true);
      setEstadosError(null);
      try {
        const response = await API.get(`/estados/${tipo}`);
        const data = response.data?.estados ?? response.data ?? [];
        const lista = Array.isArray(data) ? data : [];
        setEstadosDisponibles(lista);
        setFormData((prev) => ({
          ...prev,
          estado: lista.length ? String(lista[0].id_estado) : '',
        }));
      } catch (err: any) {
        const message = err.response?.data?.error || 'Error al cargar los estados';
        setEstadosError(message);
        setEstadosDisponibles([]);
        setFormData((prev) => ({ ...prev, estado: '' }));
      } finally {
        setEstadosLoading(false);
      }
    };

    fetchEstados();
  }, [tipo]);

  const metadata = useMemo(() => getStoredMetadata(), [metadataVersion]);

  const persistMetadataForPersona = (id: number, data: PersonalMetadata) => {
    const current = getStoredMetadata();
    current[id] = { ...current[id], ...data };
    persistMetadata(current);
    setMetadataVersion((prev) => prev + 1);
  };

  const removeMetadataForPersona = (id: number) => {
    const current = getStoredMetadata();
    if (current[id]) {
      delete current[id];
      persistMetadata(current);
      setMetadataVersion((prev) => prev + 1);
    }
  };

  const personal = useMemo<Personal[]>(() => {
    const dataset = Array.isArray(personas) ? personas : [];
    // El backend ya filtra por rol, solo mapeamos los datos
    return dataset.map((persona: any) => {
      const meta = metadata[persona.id_persona] || {};
      const nombre = `${persona.nombres} ${persona.apellidos}`.trim();
      return {
        id: persona.id_persona,
        nombres: persona.nombres,
        apellidos: persona.apellidos,
        nombre,
        identificacion: persona.numero_documento,
        telefono: persona.telefono || '',
        correo: persona.correo || '',
        tipoDocumento: persona.tipo_documento,
        area: meta.area || persona.ficha?.programa_formacion || '',
        estado:
          meta.estado ||
          persona.estado?.nombre_estado ||
          (tipo === 'visitante' ? 'Visitante' : 'Sin estado'),
        estadoId: persona.id_estado ?? null,
        rh: persona.rh || '',
      };
    });
  }, [personas, metadata, tipo]);

  const filteredPersonal = personal.filter((p) => {
    const matchesSearch =
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.identificacion.includes(searchTerm);
    const matchesEstado = filterEstado === 'all' || p.estado === filterEstado;
    return matchesSearch && matchesEstado;
  });

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, string> = {
      Planta: 'bg-emerald-100 text-emerald-800',
      Contratista: 'bg-yellow-100 text-yellow-800',
      Visitante: 'bg-gray-100 text-gray-800',
      'Sin estado': 'bg-gray-100 text-gray-800',
    };
    return variants[estado] || 'bg-gray-100 text-gray-800';
  };

  const handleOpenModal = (persona?: Personal) => {
    if (persona) {
      setEditingPersonal(persona);
      setFormData({
        tipo_documento: persona.tipoDocumento || tipoDocumentoOptions[0].value,
        numero_documento: persona.identificacion,
        nombres: persona.nombres,
        apellidos: persona.apellidos,
        telefono: persona.telefono || '',
        correo: persona.correo || '',
        rh: persona.rh || '',
        area: persona.area || '',
        estado:
          tipo === 'visitante'
            ? persona.estado || config.tiposContrato[0] || ''
            : persona.estadoId
            ? String(persona.estadoId)
            : '',
      });
    } else {
      setEditingPersonal(null);
      setFormData(buildEmptyFormData());
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombres || !formData.apellidos || !formData.numero_documento) {
      toast.error('Los campos nombres, apellidos y documento son obligatorios');
      return;
    }

    setIsSaving(true);

    const payload: any = {
      tipo_documento: formData.tipo_documento,
      numero_documento: formData.numero_documento,
      nombres: formData.nombres,
      apellidos: formData.apellidos,
      telefono: formData.telefono || null,
      correo: formData.correo || null,
      rh: formData.rh || null,
      nombre_rol: tipo,
    };

    const selectedEstadoRecord = estadosDisponibles.find(
      (estado) => String(estado.id_estado) === formData.estado
    );
    const estadoSeleccionadoNombre =
      tipo === 'visitante'
        ? formData.estado || 'Visitante'
        : selectedEstadoRecord?.nombre_estado || '';

    if (tipo !== 'visitante') {
      if (!formData.estado) {
        toast.error('Seleccione un estado válido para este rol');
        setIsSaving(false);
        return;
      }
      payload.id_estado = Number(formData.estado);
    } else if (formData.estado) {
      payload.nombre_estado = formData.estado;
    }

    try {
      if (editingPersonal) {
        const result = await updatePersona(editingPersonal.id, payload);
        if (!result?.success) {
          throw new Error(result?.error || 'No se pudo actualizar la persona');
        }
        persistMetadataForPersona(editingPersonal.id, {
          area: formData.area,
          estado: estadoSeleccionadoNombre || editingPersonal.estado || 'Sin estado',
          categoria: tipo,
        });
        toast.success(`${config.singular} actualizado correctamente`);
      } else {
        const result = await createPersona(payload);
        if (!result?.success || !result.data?.id_persona) {
          throw new Error(result?.error || 'No se pudo crear la persona');
        }
        persistMetadataForPersona(result.data.id_persona, {
          area: formData.area,
          estado: estadoSeleccionadoNombre || 'Sin estado',
          categoria: tipo,
        });
        toast.success(`${config.singular} registrado correctamente`);
      }
      setShowModal(false);
      setFormData(buildEmptyFormData());
    } catch (err: any) {
      toast.error(err?.message || 'Ocurrió un error guardando la información');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number, forzar = false) => {
    const persona = personal.find((p) => p.id === id);
    if (!persona) return;

    if (!forzar && !confirm(`¿Está seguro de eliminar este ${config.singular.toLowerCase()}?`)) {
      return;
    }

    const result = await deletePersona(id, forzar);
    if (result?.success) {
      removeMetadataForPersona(id);
      toast.success(`${config.singular} eliminado correctamente`);
    } else if (result?.requiereConfirmacion) {
      // Tiene fichas o registros asociados
      let mensaje = result.error;
      if (result.fichasAsignadas) {
        mensaje += `\n\n¿Desea desasignar las fichas y eliminar esta persona?`;
      } else if (result.registrosAcceso) {
        mensaje += `\n\n¿Desea eliminar los registros de acceso y esta persona?`;
      }
      
      const confirmar = confirm(mensaje + '\n\nEsta acción no se puede deshacer.');
      if (confirmar) {
        handleDelete(id, true);
      }
    } else {
      toast.error(result?.error || 'No se pudo eliminar la persona');
    }
  };

  const columnsCount = tipo !== 'visitante' ? 6 : 5;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--sena-blue)]">Gestión de {config.title}</h2>
          <p className="text-gray-600 mt-1">
            Administre los {config.title.toLowerCase()} registrados en el sistema
          </p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="h-12 bg-gradient-to-r from-[var(--sena-green)] to-green-600 hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg transition-all duration-300 rounded-xl"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuevo {config.singular}
        </Button>
      </div>

      {(error || estadosError) && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl">
          {error || estadosError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 rounded-2xl border-0 shadow-md bg-white hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total {config.title}</p>
              <p className="text-3xl font-semibold text-[var(--sena-blue)] mt-1">{personal.length}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--sena-blue)] to-emerald-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">{config.icon}</span>
            </div>
          </div>
        </Card>

        {tipo !== 'visitante' && (
          <>
            <Card className="p-5 rounded-2xl border-0 shadow-md bg-white hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Planta</p>
                  <p className="text-3xl font-semibold text-[var(--sena-green)] mt-1">
                    {personal.filter((p) => p.estado === 'Planta').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-[var(--sena-green)] to-green-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">✓</span>
                </div>
              </div>
            </Card>

            <Card className="p-5 rounded-2xl border-0 shadow-md bg-white hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Contratistas</p>
                  <p className="text-3xl font-semibold text-orange-500 mt-1">
                    {personal.filter((p) => p.estado === 'Contratista').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">📋</span>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      <Card className="p-6 rounded-2xl border-0 shadow-lg bg-white">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder={`Buscar ${config.singular.toLowerCase()} por nombre o identificación...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
              />
            </div>
          </div>
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-full md:w-48 h-12 rounded-xl border-gray-200">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="rounded-lg">
                Todos los estados
              </SelectItem>
              {(tipo === 'visitante' ? config.tiposContrato : estadosDisponibles.map((e) => e.nombre_estado)).map(
                (estado) => (
                  <SelectItem key={estado} value={estado} className="rounded-lg">
                    {estado}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-12 rounded-xl border-2 hover:bg-emerald-50 transition-all duration-300">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </Card>

      <Card className="p-6 rounded-2xl border-0 shadow-lg bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left p-4 text-gray-700">Nombre Completo</th>
                <th className="text-left p-4 text-gray-700">Identificación</th>
                <th className="text-left p-4 text-gray-700">Contacto</th>
                {tipo !== 'visitante' && <th className="text-left p-4 text-gray-700">Área</th>}
                <th className="text-left p-4 text-gray-700">Estado</th>
                <th className="text-left p-4 text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columnsCount} className="p-10 text-center text-gray-500">
                    Cargando {config.title.toLowerCase()}...
                  </td>
                </tr>
              ) : filteredPersonal.length === 0 ? (
                <tr>
                  <td colSpan={columnsCount} className="p-10 text-center text-gray-500">
                    {personal.length === 0
                      ? `Aún no hay ${config.title.toLowerCase()} registrados.`
                      : 'No se encontraron resultados con los filtros actuales.'}
                  </td>
                </tr>
              ) : (
                filteredPersonal.map((persona) => (
                  <tr
                    key={persona.id}
                    className="border-b border-gray-100 hover:bg-emerald-50/50 transition-all duration-200"
                  >
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-gray-900">{persona.nombre}</p>
                        <p className="text-sm text-gray-500">{persona.correo || 'Sin correo'}</p>
                      </div>
                    </td>
                    <td className="p-4 text-gray-700">
                      <div className="text-sm text-gray-600">
                        <p>{persona.tipoDocumento}</p>
                        <p className="font-semibold text-gray-900">{persona.identificacion}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-gray-700">{persona.telefono || 'Sin teléfono'}</p>
                    </td>
                    {tipo !== 'visitante' && (
                      <td className="p-4 text-sm text-gray-600">{persona.area || '-'}</td>
                    )}
                    <td className="p-4">
                      <Badge className={`${getEstadoBadge(persona.estado)} rounded-lg px-3 py-1`}>
                        {persona.estado || 'Sin estado'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg hover:bg-emerald-50 transition-all duration-200"
                          onClick={() => handleOpenModal(persona)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg hover:bg-blue-50 transition-all duration-200"
                        >
                          <QrCode className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 rounded-lg hover:bg-red-50 transition-all duration-200"
                          onClick={() => handleDelete(persona.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl rounded-2xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-[var(--sena-blue)]">
              {editingPersonal ? `Editar ${config.singular}` : `Nuevo ${config.singular}`}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {editingPersonal
                ? `Actualice la información del ${config.singular.toLowerCase()}`
                : `Complete la información del nuevo ${config.singular.toLowerCase()}`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Tipo de Documento *</Label>
                <Select
                  value={formData.tipo_documento}
                  onValueChange={(value) => setFormData({ ...formData, tipo_documento: value })}
                >
                  <SelectTrigger className="h-12 rounded-xl border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {tipoDocumentoOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="rounded-lg">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Número de Documento *</Label>
                <Input
                  value={formData.numero_documento}
                  onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                  placeholder="Número de documento"
                  className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Nombres *</Label>
                <Input
                  value={formData.nombres}
                  onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                  placeholder="Ingrese los nombres"
                  className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Apellidos *</Label>
                <Input
                  value={formData.apellidos}
                  onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                  placeholder="Ingrese los apellidos"
                  className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Teléfono</Label>
                <Input
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="Número de teléfono"
                  className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Correo Electrónico</Label>
                <Input
                  type="email"
                  value={formData.correo}
                  onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                  placeholder="correo@sena.edu.co"
                  className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">RH</Label>
                <Input
                  value={formData.rh}
                  onChange={(e) => setFormData({ ...formData, rh: e.target.value })}
                  placeholder="Ej: O+"
                  className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
                />
              </div>

              {tipo !== 'visitante' && (
                <div className="space-y-2">
                  <Label className="text-gray-700">Área</Label>
                  <Input
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="Área o dependencia"
                    className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-gray-700">Estado {tipo !== 'visitante' && '*'}</Label>
                {tipo === 'visitante' ? (
                  <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value })}>
                    <SelectTrigger className="h-12 rounded-xl border-gray-200">
                      <SelectValue placeholder="Seleccione un estado" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {config.tiposContrato.map((estado) => (
                        <SelectItem key={estado} value={estado} className="rounded-lg">
                          {estado}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select
                    value={formData.estado}
                    onValueChange={(value) => setFormData({ ...formData, estado: value })}
                    disabled={estadosLoading || estadosDisponibles.length === 0}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-gray-200">
                      <SelectValue
                        placeholder={
                          estadosLoading
                            ? 'Cargando estados...'
                            : estadosDisponibles.length
                            ? 'Seleccione un estado'
                            : 'No hay estados configurados'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {estadosDisponibles.map((estado) => (
                        <SelectItem key={estado.id_estado} value={String(estado.id_estado)} className="rounded-lg">
                          {estado.nombre_estado}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12 rounded-xl border-2 hover:bg-gray-50 transition-all duration-300"
                onClick={() => setShowModal(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 bg-gradient-to-r from-[var(--sena-green)] to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                disabled={isSaving}
              >
                {isSaving ? 'Guardando...' : editingPersonal ? 'Actualizar' : 'Registrar'} {config.singular}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
