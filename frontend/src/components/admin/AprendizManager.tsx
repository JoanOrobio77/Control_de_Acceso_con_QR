import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Edit, Trash2, QrCode, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { toast } from 'sonner@2.0.3';
import { useEstudiantes } from '../../hooks/useEstudiantes';
import { useFichas } from '../../hooks/useFichas';
import API from '../../config/api';

const tipoDocumentoOptions = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'PAS', label: 'Pasaporte' },
];

type EstadoOption = {
  id_estado: number;
  nombre_estado: string;
  tipo_aplica: string;
};

type FormData = {
  tipo_documento: string;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
  rh: string;
  id_ficha: string;
  id_estado: string;
  programa: string;
};

const buildEmptyFormData = (): FormData => ({
  tipo_documento: tipoDocumentoOptions[0].value,
  numero_documento: '',
  nombres: '',
  apellidos: '',
  telefono: '',
  correo: '',
  rh: '',
  id_ficha: '',
  id_estado: '',
  programa: '',
});

const normalizeEstado = (value?: string | null) =>
  value ? value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : '';

const getEstadoBadge = (estado?: string | null) => {
  const normalized = normalizeEstado(estado);
  if (normalized.includes('formacion')) return 'bg-[var(--sena-green)] text-white';
  if (normalized.includes('condicion')) return 'bg-orange-100 text-orange-800';
  if (normalized.includes('cancel')) return 'bg-red-100 text-red-800';
  if (normalized.includes('certific')) return 'bg-emerald-100 text-emerald-800';
  return 'bg-gray-100 text-gray-800';
};

export function AprendizManager() {
  const { estudiantes, loading, error, createEstudiante, updateEstudiante, deleteEstudiante } = useEstudiantes();
  const { fichas } = useFichas();

  const [estados, setEstados] = useState<EstadoOption[]>([]);
  const [estadosLoading, setEstadosLoading] = useState(false);
  const [estadosError, setEstadosError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterFicha, setFilterFicha] = useState('all');
  const [filterEstado, setFilterEstado] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingAprendiz, setEditingAprendiz] = useState<any>(null);
  const [formData, setFormData] = useState<FormData>(buildEmptyFormData);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchEstados = async () => {
      setEstadosLoading(true);
      setEstadosError(null);
      try {
        const response = await API.get('/estados/aprendiz');
        const data = response.data?.estados ?? response.data ?? [];
        setEstados(Array.isArray(data) ? data : []);
      } catch (err: any) {
        const message = err?.response?.data?.error || 'Error al cargar los estados';
        setEstadosError(message);
      } finally {
        setEstadosLoading(false);
      }
    };

    fetchEstados();
  }, []);

  const aprendices = useMemo(() => (Array.isArray(estudiantes) ? estudiantes : []), [estudiantes]);
  const fichasList = useMemo(() => (Array.isArray(fichas) ? fichas : []), [fichas]);

  const countByEstado = (nombre: string) => {
    const normalized = normalizeEstado(nombre);
    return aprendices.filter((ap: any) => normalizeEstado(ap.estado?.nombre_estado) === normalized).length;
  };

  const filteredAprendices = useMemo(() => {
    const lowerSearch = searchTerm.trim().toLowerCase();
    return aprendices.filter((aprendiz: any) => {
      const nombreCompleto = `${aprendiz.nombres || ''} ${aprendiz.apellidos || ''}`.trim().toLowerCase();
      const matchesSearch =
        nombreCompleto.includes(lowerSearch) || aprendiz.numero_documento?.toLowerCase().includes(lowerSearch);
      const matchesFicha = filterFicha === 'all' || String(aprendiz.id_ficha) === filterFicha;
      const matchesEstado = filterEstado === 'all' || String(aprendiz.id_estado) === filterEstado;
      return matchesSearch && matchesFicha && matchesEstado;
    });
  }, [aprendices, searchTerm, filterFicha, filterEstado]);

  const handleOpenModal = (aprendiz?: any) => {
    if (aprendiz) {
      setEditingAprendiz(aprendiz);
      setFormData({
        tipo_documento: aprendiz.tipo_documento || tipoDocumentoOptions[0].value,
        numero_documento: aprendiz.numero_documento || '',
        nombres: aprendiz.nombres || '',
        apellidos: aprendiz.apellidos || '',
        telefono: aprendiz.telefono || '',
        correo: aprendiz.correo || '',
        rh: aprendiz.rh || '',
        id_ficha: aprendiz.id_ficha ? String(aprendiz.id_ficha) : '',
        id_estado: aprendiz.id_estado ? String(aprendiz.id_estado) : '',
        programa: aprendiz.ficha?.programa_formacion || '',
      });
    } else {
      setEditingAprendiz(null);
      setFormData(buildEmptyFormData());
    }
    setShowModal(true);
  };

  const handleFichaChange = (value: string) => {
    const fichaSeleccionada = fichasList.find((f: any) => String(f.id_ficha) === value);
    setFormData((prev) => ({
      ...prev,
      id_ficha: value,
      programa: fichaSeleccionada?.programa_formacion || '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombres.trim() || !formData.apellidos.trim() || !formData.numero_documento.trim()) {
      toast.error('Los campos nombres, apellidos y documento son obligatorios');
      return;
    }

    if (!formData.id_ficha) {
      toast.error('Debe seleccionar una ficha');
      return;
    }

    if (!formData.id_estado) {
      toast.error('Debe seleccionar un estado válido');
      return;
    }

    setIsSaving(true);

    const payload = {
      tipo_documento: formData.tipo_documento,
      numero_documento: formData.numero_documento.trim(),
      nombres: formData.nombres.trim(),
      apellidos: formData.apellidos.trim(),
      telefono: formData.telefono || null,
      correo: formData.correo || null,
      rh: formData.rh || null,
      id_ficha: Number(formData.id_ficha),
      id_estado: Number(formData.id_estado),
    };

    try {
      const result = editingAprendiz
        ? await updateEstudiante(editingAprendiz.id_estudiante, payload)
        : await createEstudiante(payload);

      if (!result?.success) {
        throw new Error(result?.error || 'No se pudo guardar el aprendiz');
      }

      toast.success(editingAprendiz ? 'Aprendiz actualizado correctamente' : 'Aprendiz creado correctamente');
      setShowModal(false);
      setFormData(buildEmptyFormData());
    } catch (err: any) {
      toast.error(err?.message || 'Ocurrió un error guardando el aprendiz');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (aprendiz: any) => {
    if (!aprendiz) return;

    if (!confirm('¿Está seguro de eliminar este aprendiz?')) {
      return;
    }

    const result = await deleteEstudiante(aprendiz.id_estudiante);
    if (result?.success) {
      toast.success('Aprendiz eliminado correctamente');
    } else {
      toast.error(result?.error || 'No se pudo eliminar el aprendiz');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--sena-blue)]">Gestión de Aprendices</h2>
          <p className="text-gray-600 mt-1">Administre los aprendices registrados en el sistema</p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="h-12 bg-gradient-to-r from-[var(--sena-green)] to-green-600 hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg transition-all duration-300 rounded-xl"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Aprendiz
        </Button>
      </div>

      {(error || estadosError) && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl">
          {error || estadosError}
        </div>
      )}

      {loading && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl">
          Cargando aprendices...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 rounded-2xl border-0 shadow-md bg-white hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Aprendices</p>
              <p className="text-3xl font-semibold text-[var(--sena-blue)] mt-1">{aprendices.length}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--sena-blue)] to-emerald-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">👨‍🎓</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border-0 shadow-md bg-white hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Formación</p>
              <p className="text-3xl font-semibold text-[var(--sena-green)] mt-1">{countByEstado('En formación')}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--sena-green)] to-green-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">✓</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border-0 shadow-md bg-white hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Condicionados</p>
              <p className="text-3xl font-semibold text-orange-500 mt-1">{countByEstado('Condicionado')}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">⚠</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border-0 shadow-md bg-white hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Certificados</p>
              <p className="text-3xl font-semibold text-emerald-600 mt-1">{countByEstado('Certificado')}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🎓</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 rounded-2xl border-0 shadow-lg bg-white">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Buscar por nombre o identificación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
              />
            </div>
          </div>
          <Select value={filterFicha} onValueChange={setFilterFicha}>
            <SelectTrigger className="w-full md:w-48 h-12 rounded-xl border-gray-200">
              <SelectValue placeholder="Todas las fichas" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="rounded-lg">
                Todas las fichas
              </SelectItem>
              {fichasList.map((ficha: any) => (
                <SelectItem key={ficha.id_ficha} value={String(ficha.id_ficha)} className="rounded-lg">
                  Ficha {ficha.numero_ficha}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-full md:w-48 h-12 rounded-xl border-gray-200">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="rounded-lg">
                Todos los estados
              </SelectItem>
              {estados.map((estado) => (
                <SelectItem key={estado.id_estado} value={String(estado.id_estado)} className="rounded-lg">
                  {estado.nombre_estado}
                </SelectItem>
              ))}
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
                <th className="text-left p-4 text-gray-700">Ficha</th>
                <th className="text-left p-4 text-gray-700">Programa</th>
                <th className="text-left p-4 text-gray-700">Estado</th>
                <th className="text-left p-4 text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredAprendices.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-gray-500">
                    {aprendices.length === 0
                      ? 'Aún no hay aprendices registrados.'
                      : 'No se encontraron resultados con los filtros aplicados.'}
                  </td>
                </tr>
              )}
              {filteredAprendices.map((aprendiz: any) => (
                <tr
                  key={aprendiz.id_estudiante}
                  className="border-b border-gray-100 hover:bg-emerald-50/50 transition-all duration-200"
                >
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {`${aprendiz.nombres || ''} ${aprendiz.apellidos || ''}`.trim()}
                      </p>
                      <p className="text-sm text-gray-500">{aprendiz.correo || 'Sin correo'}</p>
                    </div>
                  </td>
                  <td className="p-4 text-gray-700">{aprendiz.numero_documento}</td>
                  <td className="p-4">
                    <Badge className="bg-emerald-100 text-emerald-800 rounded-lg px-3 py-1">
                      {aprendiz.ficha?.numero_ficha || 'Sin ficha'}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{aprendiz.ficha?.programa_formacion || 'Sin definir'}</td>
                  <td className="p-4">
                    <Badge className={`${getEstadoBadge(aprendiz.estado?.nombre_estado)} rounded-lg px-3 py-1`}>
                      {aprendiz.estado?.nombre_estado || 'Sin estado'}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg hover:bg-emerald-50 transition-all duration-200"
                        onClick={() => handleOpenModal(aprendiz)}
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
                        onClick={() => handleDelete(aprendiz)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl rounded-2xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-[var(--sena-blue)]">
              {editingAprendiz ? 'Editar Aprendiz' : 'Nuevo Aprendiz'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {editingAprendiz ? 'Actualice la información del aprendiz' : 'Complete la información del nuevo aprendiz'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Nombres *</Label>
                <Input
                  value={formData.nombres}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nombres: e.target.value }))}
                  placeholder="Nombres del aprendiz"
                  className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Apellidos *</Label>
                <Input
                  value={formData.apellidos}
                  onChange={(e) => setFormData((prev) => ({ ...prev, apellidos: e.target.value }))}
                  placeholder="Apellidos del aprendiz"
                  className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Tipo de Documento</Label>
                <Select
                  value={formData.tipo_documento}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, tipo_documento: value }))}
                >
                  <SelectTrigger className="h-12 rounded-xl border-gray-200">
                    <SelectValue placeholder="Seleccione el tipo de documento" />
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, numero_documento: e.target.value }))}
                  placeholder="Número de documento"
                  className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Teléfono</Label>
                <Input
                  value={formData.telefono}
                  onChange={(e) => setFormData((prev) => ({ ...prev, telefono: e.target.value }))}
                  placeholder="Número de teléfono"
                  className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Correo Electrónico</Label>
                <Input
                  type="email"
                  value={formData.correo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, correo: e.target.value }))}
                  placeholder="correo@sena.edu.co"
                  className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Factor RH</Label>
                <Input
                  value={formData.rh}
                  onChange={(e) => setFormData((prev) => ({ ...prev, rh: e.target.value }))}
                  placeholder="Ej: O+, AB-, etc."
                  className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Ficha *</Label>
                <Select
                  value={formData.id_ficha}
                  onValueChange={handleFichaChange}
                  disabled={fichasList.length === 0}
                >
                  <SelectTrigger className="h-12 rounded-xl border-gray-200">
                    <SelectValue
                      placeholder={fichasList.length ? 'Seleccione una ficha' : 'No hay fichas registradas'}
                    />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {fichasList.map((ficha: any) => (
                      <SelectItem key={ficha.id_ficha} value={String(ficha.id_ficha)} className="rounded-lg">
                        {`Ficha ${ficha.numero_ficha}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Programa de Formación</Label>
                <Input
                  value={formData.programa}
                  onChange={(e) => setFormData((prev) => ({ ...prev, programa: e.target.value }))}
                  placeholder="Se autocompleta al seleccionar la ficha"
                  readOnly
                  className="h-12 rounded-xl border-gray-200 bg-gray-50"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-gray-700">Estado *</Label>
                <Select
                  value={formData.id_estado}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, id_estado: value }))}
                  disabled={estadosLoading || estados.length === 0}
                >
                  <SelectTrigger className="h-12 rounded-xl border-gray-200">
                    <SelectValue
                      placeholder={
                        estadosLoading
                          ? 'Cargando estados...'
                          : estados.length
                          ? 'Seleccione un estado'
                          : 'No hay estados configurados'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {estados.map((estado) => (
                      <SelectItem key={estado.id_estado} value={String(estado.id_estado)} className="rounded-lg">
                        {estado.nombre_estado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12 rounded-xl border-2 hover:bg-gray-50 transition-all duration-300"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="flex-1 h-12 bg-gradient-to-r from-[var(--sena-green)] to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
              >
                {isSaving ? 'Guardando...' : editingAprendiz ? 'Actualizar Aprendiz' : 'Registrar Aprendiz'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


