import React, { useState, useEffect } from 'react';
import { 
  Users, 
  History, 
  FileText, 
  AlertTriangle,
  Download,
  Search,
  Filter,
  User,
  Calendar,
  RefreshCw,
  BookOpen,
  Clock,
  Loader2
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { SenaLogo } from './SenaLogo';
import { useAuth } from '../contexts/AuthContext';
import API from '../config/api';

interface InstructorPanelProps {
  onLogout: () => void;
}

interface Student {
  id: number | string;
  name: string;
  document: string;
  program?: string;
  status?: string;
  lastAccess?: string;
}

interface AccessEntry {
  id: number | string;
  name?: string;
  type: 'Entrada' | 'Salida';
  time: string;
  duration?: string;
}

interface FichaResumen {
  number: string;
  program?: string;
  year?: string;
  aprendices?: number;
  jornada?: string;
  id_ficha?: number;
}

export function InstructorPanel({ onLogout }: InstructorPanelProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [showFichaModal, setShowFichaModal] = useState(true); // Mostrar modal al inicio
  const [fichaNumber, setFichaNumber] = useState('');
  const [selectedFicha, setSelectedFicha] = useState('');
  const [selectedFichaId, setSelectedFichaId] = useState<number | null>(null);
  const [selectedJornada, setSelectedJornada] = useState('');
  const [selectedPrograma, setSelectedPrograma] = useState('');
  const [showFichaChangeModal, setShowFichaChangeModal] = useState(false);
  const [fichaSearchTerm, setFichaSearchTerm] = useState('');
  const [programasConFichas, setProgramasConFichas] = useState<{ programa: string; fichas: string[] }[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [availableFichas, setAvailableFichas] = useState<FichaResumen[]>([]);
  const [accessHistory, setAccessHistory] = useState<AccessEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [filteredFichasByJornada, setFilteredFichasByJornada] = useState<FichaResumen[]>([]);
  const [filteredFichasByPrograma, setFilteredFichasByPrograma] = useState<FichaResumen[]>([]);

  const jornadaOptions = [
    { value: 'DIURNA', label: 'DIURNA' },
    { value: 'NOCTURNA', label: 'NOCTURNA' },
    { value: 'MIXTA', label: 'MIXTA' }
  ];

  // Cargar fichas asignadas al instructor
  useEffect(() => {
    const fetchFichasInstructor = async () => {
      setLoading(true);
      try {
        // Obtener todas las fichas y filtrar las del instructor
        const response = await API.get('/fichas');
        const todasFichas = response.data || [];
        
        // Filtrar fichas donde el instructor sea el usuario actual
        // El user puede tener id_persona si es una persona
        const fichasDelInstructor = todasFichas.filter((ficha: any) => {
          // Si el usuario tiene id_persona, comparar con id_instructor
          if (user?.id_persona) {
            return ficha.id_instructor === user.id_persona;
          }
          return true; // Si no hay filtro, mostrar todas (para pruebas)
        });

        const fichasFormateadas: FichaResumen[] = fichasDelInstructor.map((ficha: any) => ({
          number: ficha.numero_ficha,
          program: ficha.programa_formacion || 'Sin programa',
          year: ficha.fecha_inicio ? new Date(ficha.fecha_inicio).getFullYear().toString() : 'N/A',
          aprendices: ficha.estudiantes?.length || 0,
          jornada: ficha.jornada || 'N/A',
          id_ficha: ficha.id_ficha,
        }));

        setAvailableFichas(fichasFormateadas);

        // Crear lista de programas únicos con sus fichas
        const programasMap = new Map<string, string[]>();
        fichasFormateadas.forEach((ficha: any) => {
          const programa = ficha.program || 'Sin programa';
          if (!programasMap.has(programa)) {
            programasMap.set(programa, []);
          }
          programasMap.get(programa)!.push(ficha.number);
        });

        const programasArray = Array.from(programasMap.entries()).map(([programa, fichas]) => ({
          programa,
          fichas,
        }));
        setProgramasConFichas(programasArray);

        // Siempre mostrar el modal de selección al inicio
        // No seleccionar automáticamente, dejar que el usuario elija
        setShowFichaModal(true);
      } catch (error) {
        console.error('Error cargando fichas del instructor:', error);
        setShowFichaModal(true);
      } finally {
        setLoading(false);
      }
    };

    fetchFichasInstructor();
  }, [user]);

  // Función para cargar estudiantes de una ficha con su último acceso
  const loadStudentsForFicha = async (idFicha: number, todasFichas?: any[]) => {
    setLoadingStudents(true);
    try {
      // Obtener el programa de formación de la ficha
      let programaFormacion = '';
      if (todasFichas) {
        const fichaData = todasFichas.find((f: any) => f.id_ficha === idFicha);
        programaFormacion = fichaData?.programa_formacion || '';
      } else {
        const responseFichas = await API.get('/fichas');
        const fichas = responseFichas.data || [];
        const fichaData = fichas.find((f: any) => f.id_ficha === idFicha);
        programaFormacion = fichaData?.programa_formacion || '';
      }

      // Usar el nuevo endpoint que trae aprendices con su último acceso
      const response = await API.get(`/instructor/fichas/${idFicha}/aprendices-acceso`);
      const aprendices = response.data || [];

      const estudiantesFormateados: Student[] = aprendices.map((est: any) => ({
        id: est.id_aprendiz || est.id,
        name: `${est.nombres || ''} ${est.apellidos || ''}`.trim(),
        document: est.numero_documento || '',
        program: programaFormacion,
        status: est.estado?.nombre_estado || 'En formación',
        lastAccess: est.ultimo_acceso || 'Sin registro',
      }));
      setStudents(estudiantesFormateados);

      // Cargar también el historial de acceso
      loadAccessHistory(idFicha);
    } catch (error) {
      console.error('Error cargando estudiantes:', error);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Función para cargar historial de acceso de la ficha
  const loadAccessHistory = async (idFicha: number, fecha?: string) => {
    try {
      const params = new URLSearchParams();
      if (fecha && fecha !== 'all') {
        if (fecha === 'today') {
          params.append('fecha', new Date().toISOString().split('T')[0]);
        }
      }
      params.append('limite', '100');

      const response = await API.get(`/instructor/fichas/${idFicha}/registros?${params.toString()}`);
      const data = response.data || {};
      
      const registrosFormateados: AccessEntry[] = (data.registros || []).map((reg: any) => ({
        id: reg.id,
        name: reg.nombre,
        type: reg.tipo as 'Entrada' | 'Salida',
        time: reg.time,
        duration: '-',
      }));
      
      setAccessHistory(registrosFormateados);
    } catch (error) {
      console.error('Error cargando historial de acceso:', error);
      setAccessHistory([]);
    }
  };

  // Filtrar fichas cuando cambia la jornada
  const handleJornadaChangeModal = (jornada: string) => {
    setSelectedJornada(jornada);
    setSelectedPrograma('');
    setFichaNumber('');
    
    // Filtrar fichas por jornada
    const fichasFiltradas = availableFichas.filter(f => 
      f.jornada?.toUpperCase() === jornada.toUpperCase()
    );
    setFilteredFichasByJornada(fichasFiltradas);
    setFilteredFichasByPrograma([]);
  };

  // Filtrar fichas cuando cambia el programa
  const handleProgramaChangeModal = (programa: string) => {
    setSelectedPrograma(programa);
    setFichaNumber('');
    
    // Filtrar fichas por programa (ya filtradas por jornada)
    const fichasFiltradas = filteredFichasByJornada.filter(f => 
      f.program === programa
    );
    setFilteredFichasByPrograma(fichasFiltradas);
    
    // Si solo hay una ficha, seleccionarla automáticamente
    if (fichasFiltradas.length === 1) {
      setFichaNumber(fichasFiltradas[0].number);
    }
  };

  // Manejar cambio de programa y autocompletar ficha
  const handleProgramaChange = (programa: string) => {
    setSelectedPrograma(programa);
    // Autocompletar con la primera ficha del programa seleccionado
    const programaData = programasConFichas.find(p => p.programa === programa);
    if (programaData && programaData.fichas.length > 0) {
      setFichaNumber(programaData.fichas[0]);
    }
  };

  // Obtener programas únicos de las fichas filtradas por jornada
  const getProgramasFromFilteredFichas = () => {
    const programas = new Set<string>();
    filteredFichasByJornada.forEach(f => {
      if (f.program) programas.add(f.program);
    });
    return Array.from(programas);
  };

  // Obtener fichas del programa seleccionado
  const getFichasFromPrograma = () => {
    return filteredFichasByPrograma;
  };

  // Manejar selección de ficha desde el modal de cambio
  const handleFichaSelect = (ficha: any) => {
    setSelectedFicha(ficha.number);
    setSelectedFichaId(ficha.id_ficha);
    setSelectedJornada(ficha.jornada || '');
    setSelectedPrograma(ficha.program || '');
    setShowFichaChangeModal(false);
    setFichaSearchTerm('');
    
    // Cargar estudiantes de la ficha seleccionada
    loadStudentsForFicha(ficha.id_ficha);
  };

  const getAbsentStudents = () => {
    const limit = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    return students.filter(student => {
      if (!student.lastAccess) return false;
      return new Date(student.lastAccess) < limit;
    });
  };

  const getPresentStudents = () => {
    const today = new Date().toISOString().split('T')[0];
    return students.filter(student => student.lastAccess?.startsWith(today));
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: string } = {
      'En formación': 'bg-[var(--sena-green)] text-white',
      'Condicionado': 'bg-orange-100 text-orange-800',
      'Cancelado': 'bg-red-100 text-red-800',
      'Certificado': 'bg-emerald-100 text-emerald-800'
    };
    return variants[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.document?.includes(searchTerm)
  );
  const asistenciaPromedio = students.length ? Math.round((getPresentStudents().length / students.length) * 100) : 0;

  const handleFichaSubmit = async () => {
    if (!fichaNumber) {
      alert('Por favor seleccione un número de ficha');
      return;
    }
    if (!selectedJornada) {
      alert('Por favor seleccione una jornada');
      return;
    }
    if (!selectedPrograma) {
      alert('Por favor seleccione un programa de formación');
      return;
    }
    
    // Buscar la ficha en las filtradas por programa
    const fichaEncontrada = filteredFichasByPrograma.find(f => f.number === fichaNumber);
    if (fichaEncontrada && fichaEncontrada.id_ficha) {
      setSelectedFicha(fichaNumber);
      setSelectedFichaId(fichaEncontrada.id_ficha);
      setShowFichaModal(false);
      loadStudentsForFicha(fichaEncontrada.id_ficha);
    } else {
      // Buscar en todas las fichas disponibles
      const fichaGeneral = availableFichas.find(f => f.number === fichaNumber);
      if (fichaGeneral && fichaGeneral.id_ficha) {
        setSelectedFicha(fichaNumber);
        setSelectedFichaId(fichaGeneral.id_ficha);
        setShowFichaModal(false);
        loadStudentsForFicha(fichaGeneral.id_ficha);
      } else {
        alert('No se encontró la ficha seleccionada');
      }
    }
  };

  const handleFichaChange = (newFicha: string) => {
    const fichaData = availableFichas.find(f => f.number === newFicha);
    if (fichaData) {
      handleFichaSelect({ ...fichaData, id_ficha: (fichaData as any).id_ficha });
    }
  };

  const filteredFichas = availableFichas.filter(ficha =>
    ficha.number.includes(fichaSearchTerm) ||
    ficha.program?.toLowerCase().includes(fichaSearchTerm.toLowerCase())
  );

  // Mostrar loading inicial
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[var(--sena-green)] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando datos del instructor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 relative">
      {/* Logo marca de agua */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <SenaLogo size="2xl" opacity={0.08} variant="black" className="scale-[4]" />
      </div>

      {/* Header */}
      <header className="bg-gradient-to-r from-[var(--sena-blue)] to-emerald-600 text-white p-6 shadow-xl relative">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-2">
              <SenaLogo size="md" variant="white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Panel de Instructor</h1>
              <p className="text-emerald-100">CBI SENA Palmira - {selectedPrograma || 'Sin programa asignado'}</p>
              {selectedFicha && (
                <div className="flex items-center gap-3 mt-1">
                  <Badge className="bg-white/20 text-white border-white/30">
                    Ficha: {selectedFicha}
                  </Badge>
                  {selectedJornada && (
                    <Badge className="bg-white/20 text-white border-white/30 uppercase">
                      {selectedJornada}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setShowFichaChangeModal(true)} 
              variant="outline" 
              className="text-[var(--sena-blue)] bg-white hover:bg-emerald-50 rounded-xl transition-all duration-300 shadow-md"
              disabled={!selectedFicha}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Cambiar Ficha
            </Button>
            <Button onClick={onLogout} variant="outline" className="text-[var(--sena-blue)] bg-white hover:bg-emerald-50 rounded-xl transition-all duration-300 shadow-md">
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 relative">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="p-6 hover:shadow-lg transition-all duration-300 rounded-2xl border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--sena-blue)] to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Aprendices</p>
                <p className="text-3xl font-semibold text-[var(--sena-blue)]">{students.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-300 rounded-2xl border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--sena-green)] to-green-600 rounded-xl flex items-center justify-center shadow-md">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Presentes Hoy</p>
                <p className="text-3xl font-semibold text-[var(--sena-green)]">{getPresentStudents().length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-300 rounded-2xl border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Inasistencias</p>
                <p className="text-3xl font-semibold text-orange-500">{getAbsentStudents().length}</p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-6 cursor-pointer hover:shadow-xl transition-all duration-300 rounded-2xl border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100/50 hover:from-purple-100 hover:to-purple-200/50"
            onClick={() => setShowFichaChangeModal(true)}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Ficha Actual</p>
                <p className="text-3xl font-semibold text-purple-600">{selectedFicha || 'N/A'}</p>
              </div>
              <RefreshCw className="w-5 h-5 text-purple-400" />
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-white/80 backdrop-blur-sm shadow-md p-1">
            <TabsTrigger value="students" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--sena-blue)] data-[state=active]:to-emerald-600 data-[state=active]:text-white transition-all duration-300">
              <Users className="w-4 h-4" />
              Mis Aprendices
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--sena-blue)] data-[state=active]:to-emerald-600 data-[state=active]:text-white transition-all duration-300">
              <History className="w-4 h-4" />
              Historial de Registros
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--sena-blue)] data-[state=active]:to-emerald-600 data-[state=active]:text-white transition-all duration-300">
              <FileText className="w-4 h-4" />
              Reportes
            </TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <Card className="p-8 rounded-2xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      placeholder="Buscar aprendiz por nombre o documento..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
                    />
                  </div>
                </div>
                <Button variant="outline" className="h-12 rounded-xl border-2 hover:bg-emerald-50 transition-all duration-300">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Lista
                </Button>
              </div>

              {loadingStudents ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-[var(--sena-green)] animate-spin mr-3" />
                  <span className="text-gray-600">Cargando aprendices...</span>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left p-4 text-gray-700">Aprendiz</th>
                        <th className="text-left p-4 text-gray-700">Documento</th>
                        <th className="text-left p-4 text-gray-700">Estado</th>
                        <th className="text-left p-4 text-gray-700">Último Acceso</th>
                        <th className="text-left p-4 text-gray-700">Estado Asistencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-500">
                            {students.length === 0 
                              ? 'No hay aprendices registrados en esta ficha'
                              : 'No se encontraron aprendices con ese criterio de búsqueda'
                            }
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map(student => {
                          const isPresent = getPresentStudents().includes(student);
                          const isAbsent = getAbsentStudents().includes(student);
                          
                          return (
                            <tr key={student.id} className="border-b border-gray-100 hover:bg-emerald-50/50 transition-all duration-200">
                              <td className="p-4">
                                <div>
                                  <p className="font-medium text-gray-900">{student.name}</p>
                                  <p className="text-sm text-gray-500">{student.program}</p>
                                </div>
                              </td>
                              <td className="p-4 text-gray-700">{student.document}</td>
                              <td className="p-4">
                                <Badge className={`${getStatusBadge(student.status || '')} rounded-lg px-3 py-1`}>
                                  {student.status || 'Sin estado'}
                                </Badge>
                              </td>
                              <td className="p-4 text-sm text-gray-600">{student.lastAccess || 'Sin registro'}</td>
                              <td className="p-4">
                                {isPresent ? (
                                  <Badge className="bg-[var(--sena-green)] text-white rounded-lg px-3 py-1">Presente</Badge>
                                ) : isAbsent ? (
                                  <Badge className="bg-red-100 text-red-800 rounded-lg px-3 py-1">Ausente 3+ días</Badge>
                                ) : (
                                  <Badge className="bg-yellow-100 text-yellow-800 rounded-lg px-3 py-1">Ausente hoy</Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card className="p-8 rounded-2xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-[var(--sena-blue)]">
                  Historial de Registros
                </h3>
                <div className="flex gap-3">
                  <Select value={dateFilter} onValueChange={(value) => {
                    setDateFilter(value);
                    if (selectedFichaId) {
                      loadAccessHistory(selectedFichaId, value);
                    }
                  }}>
                    <SelectTrigger className="w-48 h-11 rounded-xl border-gray-200">
                      <SelectValue placeholder="Filtrar por fecha" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all" className="rounded-lg">Todas las fechas</SelectItem>
                      <SelectItem value="today" className="rounded-lg">Hoy</SelectItem>
                      <SelectItem value="week" className="rounded-lg">Esta semana</SelectItem>
                      <SelectItem value="month" className="rounded-lg">Este mes</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    className="h-11 rounded-xl border-2 hover:bg-emerald-50 transition-all duration-300"
                    onClick={() => selectedFichaId && loadAccessHistory(selectedFichaId, dateFilter)}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Actualizar
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {accessHistory.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No hay registros de acceso disponibles para la ficha seleccionada.
                  </div>
                ) : (
                  accessHistory.map(entry => (
                    <div key={entry.id} className="flex items-center gap-4 p-5 bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-300">
                      <div className={`w-3 h-3 rounded-full shadow-md ${
                        entry.type === 'Entrada' ? 'bg-[var(--sena-green)]' : 'bg-orange-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{entry.name || 'Sin nombre'}</p>
                        <p className="text-sm text-gray-600">
                          {entry.type} - {entry.duration && entry.duration !== '-' ? `Duración: ${entry.duration}` : 'En curso'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${
                          entry.type === 'Entrada' ? 'text-[var(--sena-green)]' : 'text-orange-500'
                        }`}>
                          {entry.type}
                        </p>
                        <p className="text-sm text-gray-600">{entry.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-8 rounded-2xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-[var(--sena-blue)] mb-4">
                  Reporte de Inasistencias
                </h3>
                <p className="text-gray-600 mb-6">
                  Aprendices con 3+ días consecutivos de inasistencia
                </p>
                
                {getAbsentStudents().length > 0 ? (
                  <div className="space-y-3 mb-6">
                    {getAbsentStudents().map(student => (
                      <div key={student.id} className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">{student.name}</p>
                          <p className="text-sm text-gray-600">Último acceso: {student.lastAccess}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-gray-500">No hay inasistencias reportadas</p>
                  </div>
                )}
                
                <Button className="w-full h-12 rounded-xl shadow-md hover:shadow-lg transition-all duration-300" disabled={getAbsentStudents().length === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Reporte
                </Button>
              </Card>

              <Card className="p-8 rounded-2xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-[var(--sena-blue)] mb-4">
                  Resumen de Asistencia
                </h3>
                <p className="text-gray-600 mb-6">
                  Estadísticas del programa
                </p>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                    <span className="font-medium text-gray-700">Asistencia promedio</span>
                    <span className="font-semibold text-[var(--sena-green)] text-xl">{asistenciaPromedio}%</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                    <span className="font-medium text-gray-700">Aprendices activos</span>
                    <span className="font-semibold text-[var(--sena-blue)] text-xl">{students.filter(s => s.status === 'En formación').length}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                    <span className="font-medium text-gray-700">Condicionados</span>
                    <span className="font-semibold text-orange-600 text-xl">{students.filter(s => s.status === 'Condicionado').length}</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal para solicitar número de ficha */}
      <Dialog open={showFichaModal} onOpenChange={setShowFichaModal}>
        <DialogContent className="sm:max-w-lg rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="relative">
            <div className="absolute right-0 top-0 opacity-80">
              <SenaLogo size="md" opacity={0.8} variant="black" />
            </div>
            <DialogTitle className="text-2xl text-[var(--sena-blue)] mb-2">
              Bienvenido Instructor
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Por favor complete la información para continuar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-[var(--sena-green)] animate-spin mr-3" />
                <span className="text-gray-600">Cargando fichas disponibles...</span>
              </div>
            ) : availableFichas.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No hay fichas asignadas</p>
                <p className="text-sm text-gray-500 mt-1">No tiene fichas asignadas como instructor</p>
              </div>
            ) : (
              <>
                {/* Paso 1: Seleccionar Jornada */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-700">
                    <Clock className="w-4 h-4 text-[var(--sena-green)]" />
                    1. Seleccione Jornada *
                  </Label>
                  <Select value={selectedJornada} onValueChange={handleJornadaChangeModal}>
                    <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300">
                      <SelectValue placeholder="Seleccionar jornada" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {jornadaOptions.map(option => (
                        <SelectItem key={option.value} value={option.value} className="rounded-lg">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedJornada && (
                    <p className="text-xs text-emerald-600">
                      {filteredFichasByJornada.length} ficha(s) encontrada(s) en jornada {selectedJornada}
                    </p>
                  )}
                </div>

                {/* Paso 2: Seleccionar Programa (solo si hay jornada seleccionada) */}
                {selectedJornada && filteredFichasByJornada.length > 0 && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-gray-700">
                      <BookOpen className="w-4 h-4 text-[var(--sena-green)]" />
                      2. Seleccione Programa de Formación *
                    </Label>
                    <Select value={selectedPrograma} onValueChange={handleProgramaChangeModal}>
                      <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300">
                        <SelectValue placeholder="Seleccionar programa" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {getProgramasFromFilteredFichas().map(programa => (
                          <SelectItem key={programa} value={programa} className="rounded-lg">
                            {programa}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedPrograma && (
                      <p className="text-xs text-emerald-600">
                        {filteredFichasByPrograma.length} ficha(s) en este programa
                      </p>
                    )}
                  </div>
                )}

                {/* Paso 3: Seleccionar Ficha (solo si hay programa seleccionado) */}
                {selectedPrograma && filteredFichasByPrograma.length > 0 && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-gray-700">
                      <FileText className="w-4 h-4 text-[var(--sena-green)]" />
                      3. Seleccione Número de Ficha *
                    </Label>
                    <Select value={fichaNumber} onValueChange={setFichaNumber}>
                      <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300">
                        <SelectValue placeholder="Seleccionar ficha" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {getFichasFromPrograma().map(ficha => (
                          <SelectItem key={ficha.number} value={ficha.number} className="rounded-lg">
                            <div className="flex items-center justify-between w-full">
                              <span className="font-medium">Ficha {ficha.number}</span>
                              <Badge className="ml-2 bg-emerald-100 text-emerald-700 text-xs">
                                {ficha.aprendices || 0} aprendices
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fichaNumber && (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                        <p className="text-sm text-emerald-800 font-medium">Ficha seleccionada: {fichaNumber}</p>
                        <p className="text-xs text-emerald-600 mt-1">
                          {filteredFichasByPrograma.find(f => f.number === fichaNumber)?.aprendices || 0} aprendices registrados
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Mensaje si no hay fichas en la jornada */}
                {selectedJornada && filteredFichasByJornada.length === 0 && (
                  <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      No hay fichas disponibles en la jornada {selectedJornada}
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowFichaModal(false);
                  onLogout();
                }}
                className="h-12 rounded-xl border-2 hover:bg-gray-50 transition-all duration-300"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleFichaSubmit}
                disabled={!fichaNumber || !selectedJornada || !selectedPrograma}
                className="h-12 bg-gradient-to-r from-[var(--sena-blue)] to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-8 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para cambiar de ficha */}
      <Dialog open={showFichaChangeModal} onOpenChange={setShowFichaChangeModal}>
        <DialogContent className="sm:max-w-lg rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="relative">
            <div className="absolute right-0 top-0 opacity-80">
              <SenaLogo size="md" opacity={0.8} variant="black" />
            </div>
            <DialogTitle className="text-2xl text-[var(--sena-blue)]">Cambiar Ficha</DialogTitle>
            <DialogDescription className="text-gray-600">
              Seleccione una nueva ficha para consultar los aprendices asignados.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label htmlFor="fichaSearch" className="flex items-center gap-2 text-gray-700">
                <Search className="w-4 h-4 text-[var(--sena-green)]" />
                Buscar Ficha
              </Label>
              <Input
                id="fichaSearch"
                value={fichaSearchTerm}
                onChange={(e) => setFichaSearchTerm(e.target.value)}
                placeholder="Buscar por número de ficha o programa..."
                className="w-full h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
              />
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
              {filteredFichas.length > 0 ? (
                filteredFichas.map(ficha => (
                  <div
                    key={ficha.number}
                    className={`p-4 border-2 rounded-xl cursor-pointer hover:bg-emerald-50 transition-all duration-300 ${
                      selectedFicha === ficha.number ? 'border-[var(--sena-blue)] bg-gradient-to-r from-emerald-50 to-green-50 shadow-md' : 'border-gray-200 hover:border-emerald-300'
                    }`}
                    onClick={() => handleFichaSelect(ficha)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-[var(--sena-blue)]">Ficha {ficha.number}</p>
                        <p className="text-sm text-gray-600 mt-1">{ficha.program}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge className="bg-gray-100 text-gray-700 text-xs">{ficha.jornada || 'N/A'}</Badge>
                          <span className="text-xs text-gray-500">Año: {ficha.year}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">
                          {(ficha.aprendices ?? 0)} aprendices
                        </p>
                        {selectedFicha === ficha.number && (
                          <Badge className="bg-[var(--sena-green)] text-white mt-2 rounded-lg">Activa</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No se encontraron fichas</p>
                  <p className="text-sm mt-1">Intente con otros términos de búsqueda</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowFichaChangeModal(false);
                  setFichaSearchTerm('');
                }}
                className="h-12 rounded-xl border-2 hover:bg-gray-50 transition-all duration-300"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}