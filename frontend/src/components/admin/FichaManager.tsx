import React, { useEffect, useState } from 'react';
import { Search, Plus, Edit, Trash2, Users, Calendar, BookOpen } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { useFichas } from '../../hooks/useFichas';
import API from '../../config/api';
import { FichaCard } from '../FichaCard';

const jornadas = ['DIURNA', 'NOCTURNA', 'MIXTA'];

type FormState = {
  numero_ficha: string;
  programa_formacion: string;
  ambiente: string;
  fecha_inicio: string;
  fecha_fin: string;
  jornada: string;
  id_instructor: string;
};

const emptyForm: FormState = {
  numero_ficha: '',
  programa_formacion: '',
  ambiente: '',
  fecha_inicio: '',
  fecha_fin: '',
  jornada: '',
  id_instructor: '',
};

export function FichaManager() {
  const { fichas, loading, error, createFicha, updateFicha, deleteFicha } = useFichas();
  const [instructores, setInstructores] = useState<any[]>([]);
  const [instructoresLoading, setInstructoresLoading] = useState(false);
  const [instructoresError, setInstructoresError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingFicha, setEditingFicha] = useState<any>(null);
  const [formData, setFormData] = useState<FormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const dataset = Array.isArray(fichas) ? fichas : [];

  useEffect(() => {
    const fetchInstructores = async () => {
      setInstructoresLoading(true);
      setInstructoresError(null);
      try {
        const rolesResponse = await API.get('/roles');
        const roles = Array.isArray(rolesResponse.data) ? rolesResponse.data : [];
        const rolInstructor = roles.find(
          (rol: any) => rol.nombre_rol?.toLowerCase() === 'instructor'
        );

        if (!rolInstructor) {
          setInstructoresError('No se encontró el rol "instructor".');
          setInstructores([]);
          return;
        }

        const personasResponse = await API.get('/personas', {
          params: { id_rol: rolInstructor.id_rol },
        });
        const data = personasResponse.data?.personas ?? [];
        setInstructores(Array.isArray(data) ? data : []);
      } catch (err: any) {
        const message = err.response?.data?.error || 'Error al cargar instructores';
        setInstructoresError(message);
        setInstructores([]);
      } finally {
        setInstructoresLoading(false);
      }
    };

    fetchInstructores();
  }, []);

  const filteredFichas = dataset.filter((ficha: any) => {
    const instructorNombre = ficha.instructor
      ? `${ficha.instructor.nombres || ''} ${ficha.instructor.apellidos || ''}`.toLowerCase()
      : '';
    return (
      ficha.numero_ficha?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ficha.programa_formacion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instructorNombre.includes(searchTerm.toLowerCase())
    );
  });

  const totalAprendices = dataset.reduce((sum, ficha) => sum + (ficha.estudiantes?.length || 0), 0);
  const programasActivos = new Set(dataset.map((f) => f.programa_formacion)).size;
  const promedioAprendices = dataset.length ? Math.round(totalAprendices / dataset.length) : 0;

  const handleOpenModal = (ficha?: any) => {
    if (ficha) {
      setEditingFicha(ficha);
      setFormData({
        numero_ficha: ficha.numero_ficha || '',
        programa_formacion: ficha.programa_formacion || '',
        ambiente: ficha.ambiente || '',
        fecha_inicio: ficha.fecha_inicio || '',
        fecha_fin: ficha.fecha_fin || '',
        jornada: ficha.jornada || '',
        id_instructor: ficha.id_instructor ? String(ficha.id_instructor) : '',
      });
    } else {
      setEditingFicha(null);
      setFormData(emptyForm);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.numero_ficha.trim() ||
      !formData.programa_formacion.trim() ||
      !formData.fecha_inicio ||
      !formData.fecha_fin ||
      !formData.jornada
    ) {
      toast.error('Por favor complete los campos obligatorios');
      return;
    }

    const payload = {
      numero_ficha: formData.numero_ficha.trim(),
      programa_formacion: formData.programa_formacion.trim(),
      ambiente: formData.ambiente || null,
      fecha_inicio: formData.fecha_inicio,
      fecha_fin: formData.fecha_fin,
      jornada: formData.jornada,
      id_instructor: formData.id_instructor ? Number(formData.id_instructor) : null,
    };

    setIsSaving(true);
    try {
      const result = editingFicha
        ? await updateFicha(editingFicha.id_ficha, payload)
        : await createFicha(payload);

      if (!result?.success) {
        throw new Error(result?.error || 'No se pudo guardar la ficha');
      }

      toast.success(editingFicha ? 'Ficha actualizada' : 'Ficha creada');
      setShowModal(false);
      setFormData(emptyForm);
    } catch (err: any) {
      toast.error(err?.message || 'Ocurrió un error guardando la ficha');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (ficha: any, forzar = false) => {
    if (!ficha) return;
    
    if (!forzar && !confirm('¿Está seguro de eliminar esta ficha?')) {
      return;
    }
    
    const result = await deleteFicha(ficha.id_ficha, forzar);
    
    if (result?.success) {
      toast.success('Ficha eliminada');
    } else if (result?.requiereConfirmacion) {
      // La ficha tiene aprendices, preguntar si desea eliminar todo
      const confirmar = confirm(
        `Esta ficha tiene ${result.estudiantesAsociados} aprendice(s) asociado(s).\n\n¿Desea eliminar la ficha junto con todos sus aprendices?\n\nEsta acción no se puede deshacer.`
      );
      if (confirmar) {
        // Llamar de nuevo con forzar=true
        handleDelete(ficha, true);
      }
    } else {
      toast.error(result?.error || 'No se pudo eliminar la ficha');
    }
  };

  const getJornadaColor = (jornada: string) => {
    const colors: Record<string, string> = {
      DIURNA: 'bg-blue-100 text-blue-800',
      NOCTURNA: 'bg-purple-100 text-purple-800',
      MIXTA: 'bg-emerald-100 text-emerald-800',
    };
    return colors[jornada] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--sena-blue)]">Fichas y Programas de Formación</h2>
          <p className="text-gray-600 mt-1">Administre las fichas reales que se usan en el sistema</p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="h-12 bg-gradient-to-r from-[var(--sena-green)] to-green-600 hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg transition-all duration-300 rounded-xl"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nueva Ficha
        </Button>
      </div>

      {(error || instructoresError) && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl">
          {error || instructoresError}
        </div>
      )}

      {loading && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl">
          Cargando fichas...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 rounded-2xl border-0 shadow-md bg-white hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Fichas</p>
              <p className="text-3xl font-semibold text-[var(--sena-blue)] mt-1">{dataset.length}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--sena-blue)] to-emerald-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border-0 shadow-md bg-white hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Programas activos</p>
              <p className="text-3xl font-semibold text-emerald-500 mt-1">{programasActivos}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border-0 shadow-md bg-white hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total aprendices</p>
              <p className="text-3xl font-semibold text-orange-500 mt-1">{totalAprendices}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border-0 shadow-md bg-white hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Promedio por ficha</p>
              <p className="text-3xl font-semibold text-purple-500 mt-1">{promedioAprendices}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 rounded-2xl border-0 shadow-lg bg-white">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar por número, programa o instructor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
            />
          </div>
        </div>
      </Card>

      {filteredFichas.length === 0 ? (
        <Card className="p-10 rounded-2xl border-0 shadow-lg bg-white text-center text-gray-500">
          {dataset.length === 0
            ? 'Aún no hay fichas registradas.'
            : 'No se encontraron fichas con los filtros aplicados.'}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredFichas.map((ficha: any) => (
            <div key={ficha.id_ficha}>
              <FichaCard
                ficha={ficha}
                onEdit={handleOpenModal}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl rounded-2xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-[var(--sena-blue)]">
              {editingFicha ? 'Editar Ficha' : 'Nueva Ficha'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {editingFicha ? 'Actualice la información de la ficha' : 'Complete la información de la nueva ficha'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Número de Ficha *</Label>
                <Input
                  value={formData.numero_ficha}
                  onChange={(e) => setFormData((prev) => ({ ...prev, numero_ficha: e.target.value }))}
                  placeholder="Ej: 2478185"
                  className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Programa de Formación *</Label>
                <Input
                  value={formData.programa_formacion}
                  onChange={(e) => setFormData((prev) => ({ ...prev, programa_formacion: e.target.value }))}
                  placeholder="Nombre del programa"
                  className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Ambiente</Label>
                <Input
                  value={formData.ambiente}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ambiente: e.target.value }))}
                  placeholder="Ej: Laboratorio 201"
                  className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Fecha de Inicio *</Label>
                <Input
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fecha_inicio: e.target.value }))}
                  className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Fecha de Finalización *</Label>
                <Input
                  type="date"
                  value={formData.fecha_fin}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fecha_fin: e.target.value }))}
                  className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Jornada *</Label>
                <Select
                  value={formData.jornada}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, jornada: value }))}
                >
                  <SelectTrigger className="h-12 rounded-xl border-gray-200">
                    <SelectValue placeholder="Seleccione jornada" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {jornadas.map((jornada) => (
                      <SelectItem key={jornada} value={jornada} className="rounded-lg">
                        {jornada}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Instructor Responsable</Label>
                <Select
                  value={formData.id_instructor}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, id_instructor: value }))}
                  disabled={instructoresLoading || instructores.length === 0}
                >
                  <SelectTrigger className="h-12 rounded-xl border-gray-200">
                    <SelectValue
                      placeholder={
                        instructoresLoading
                          ? 'Cargando instructores...'
                          : instructores.length
                          ? 'Seleccione un instructor'
                          : 'No hay instructores disponibles'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {instructores.map((persona: any) => (
                      <SelectItem key={persona.id_persona} value={String(persona.id_persona)} className="rounded-lg">
                        {`${persona.nombres || ''} ${persona.apellidos || ''}`.trim()}
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
                {isSaving ? 'Guardando...' : editingFicha ? 'Actualizar' : 'Guardar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

