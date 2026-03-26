import { useState } from 'react';
import { 
  Users, 
  Settings, 
  FileText, 
  History, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw,
  Download,
  Filter,
  AlertTriangle,
  UserCheck,
  Clock,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { toast } from 'sonner@2.0.3';
import { SenaLogo } from './SenaLogo';

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [fichaFilter, setFichaFilter] = useState('all');
  const [fichaSearch, setFichaSearch] = useState('');
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    document: '',
    email: '',
    role: '',
    status: '',
    ficha: ''
  });

  // Mock data - se convertirá en estado para permitir agregar usuarios
  const [users, setUsers] = useState([
    { id: 1, name: 'Juan Carlos Martínez', document: '1234567890', email: 'juan@sena.edu.co', role: 'Aprendiz', status: 'En formación', lastAccess: '2024-09-14 08:30', ficha: '2715071' },
    { id: 2, name: 'María González', document: '0987654321', email: 'maria@sena.edu.co', role: 'Instructor', status: 'Planta', lastAccess: '2024-09-14 07:45', ficha: '' },
    { id: 3, name: 'Carlos Rodríguez', document: '1122334455', email: 'carlos@sena.edu.co', role: 'Funcionario', status: 'Contratista', lastAccess: '2024-09-13 16:30', ficha: '' },
    { id: 4, name: 'Ana López', document: '5544332211', email: 'ana@visitante.com', role: 'Visitante', status: 'Visitante', lastAccess: '2024-09-14 09:15', ficha: '' },
    { id: 5, name: 'Pedro Sánchez', document: '9988776655', email: 'pedro@sena.edu.co', role: 'Aprendiz', status: 'En formación', lastAccess: '2024-09-11 08:30', ficha: '2715071' },
    { id: 6, name: 'Andrea Morales', document: '7766554433', email: 'andrea@sena.edu.co', role: 'Aprendiz', status: 'En formación', lastAccess: '2024-09-14 08:00', ficha: '2715072' },
    { id: 7, name: 'Luis Fernández', document: '8877665544', email: 'luis@sena.edu.co', role: 'Instructor', status: 'Planta', lastAccess: '2024-09-14 07:30', ficha: '' }
  ]);

  const fichas = ['2715071', '2715072', '2715073', '2715074'];

  const accessHistory = [
    { id: 1, name: 'Juan Carlos Martínez', role: 'Aprendiz', type: 'Entrada', time: '2024-09-14 08:30:15' },
    { id: 2, name: 'María González', role: 'Instructor', type: 'Entrada', time: '2024-09-14 07:45:30' },
    { id: 3, name: 'Ana López', role: 'Visitante', type: 'Entrada', time: '2024-09-14 09:15:45' },
    { id: 4, name: 'Carlos Rodríguez', role: 'Funcionario', type: 'Salida', time: '2024-09-13 16:30:20' },
    { id: 5, name: 'Juan Carlos Martínez', role: 'Aprendiz', type: 'Salida', time: '2024-09-13 17:00:10' }
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.document.includes(searchTerm);
    const matchesRole = !filterRole || filterRole === 'all' || user.role === filterRole;
    const matchesFicha = fichaFilter === 'all' || 
                        (fichaFilter === 'specific' && user.ficha.includes(fichaSearch)) ||
                        (fichaFilter !== 'all' && fichaFilter !== 'specific' && user.ficha === fichaFilter);
    return matchesSearch && matchesRole && matchesFicha;
  });

  // Ordenar usuarios según el rol
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (filterRole === 'Instructor' || filterRole === 'Funcionario') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: string } = {
      'En formación': 'bg-[var(--sena-green)] text-white',
      'Planta': 'bg-emerald-100 text-emerald-800',
      'Contratista': 'bg-yellow-100 text-yellow-800',
      'Visitante': 'bg-gray-100 text-gray-800',
      'Condicionado': 'bg-orange-100 text-orange-800',
      'Cancelado': 'bg-red-100 text-red-800'
    };
    return variants[status] || 'bg-gray-100 text-gray-800';
  };

  const getAbsentStudents = () => {
    // Simulación de estudiantes con 3 días consecutivos de inasistencia
    return users.filter(user => 
      user.role === 'Aprendiz' && 
      new Date(user.lastAccess) < new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    );
  };

  const getStatusOptions = (role: string) => {
    switch (role) {
      case 'Aprendiz':
        return ['En formación', 'Condicionado', 'Cancelado'];
      case 'Instructor':
        return ['Planta', 'Contratista'];
      case 'Funcionario':
        return ['Planta', 'Contratista'];
      case 'Visitante':
        return ['Visitante'];
      default:
        return [];
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!newUser.name || !newUser.document || !newUser.email || !newUser.role || !newUser.status) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }

    if (newUser.role === 'Aprendiz' && !newUser.ficha) {
      toast.error('El número de ficha es obligatorio para aprendices');
      return;
    }

    // Verificar que el documento no exista
    if (users.some(user => user.document === newUser.document)) {
      toast.error('Ya existe un usuario con este documento');
      return;
    }

    // Crear nuevo usuario
    const user = {
      id: Math.max(...users.map(u => u.id)) + 1,
      name: newUser.name,
      document: newUser.document,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      lastAccess: 'Nunca',
      ficha: newUser.role === 'Aprendiz' ? newUser.ficha : ''
    };

    setUsers([...users, user]);
    toast.success(`Usuario ${newUser.name} creado exitosamente`);
    
    // Limpiar formulario y cerrar modal
    setNewUser({
      name: '',
      document: '',
      email: '',
      role: '',
      status: '',
      ficha: ''
    });
    setShowCreateUserModal(false);
  };

  const handleRoleChange = (role: string) => {
    setNewUser({
      ...newUser,
      role,
      status: '', // Reset status when role changes
      ficha: role === 'Aprendiz' ? newUser.ficha : '' // Keep ficha only for Aprendiz
    });
  };

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
              <h1 className="text-2xl font-semibold">Panel de Administrador</h1>
              <p className="text-emerald-100">CBI SENA Palmira</p>
            </div>
          </div>
          <Button onClick={onLogout} variant="outline" className="text-[var(--sena-blue)] bg-white hover:bg-emerald-50 rounded-xl transition-all duration-300 shadow-md">
            Cerrar Sesión
          </Button>
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
                <p className="text-sm text-gray-600">Total Usuarios</p>
                <p className="text-3xl font-semibold text-[var(--sena-blue)]">{users.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-300 rounded-2xl border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--sena-green)] to-green-600 rounded-xl flex items-center justify-center shadow-md">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Presentes Hoy</p>
                <p className="text-3xl font-semibold text-[var(--sena-green)]">12</p>
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

          <Card className="p-6 hover:shadow-lg transition-all duration-300 rounded-2xl border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Accesos Hoy</p>
                <p className="text-3xl font-semibold text-purple-500">24</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 rounded-2xl bg-white/80 backdrop-blur-sm shadow-md p-1">
            <TabsTrigger value="users" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--sena-blue)] data-[state=active]:to-emerald-600 data-[state=active]:text-white transition-all duration-300">
              <Users className="w-4 h-4" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--sena-blue)] data-[state=active]:to-emerald-600 data-[state=active]:text-white transition-all duration-300">
              <FileText className="w-4 h-4" />
              Reportes
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--sena-blue)] data-[state=active]:to-emerald-600 data-[state=active]:text-white transition-all duration-300">
              <History className="w-4 h-4" />
              Historial
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--sena-blue)] data-[state=active]:to-emerald-600 data-[state=active]:text-white transition-all duration-300">
              <Settings className="w-4 h-4" />
              Configuración
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="p-8 rounded-2xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        placeholder="Buscar por nombre o documento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
                      />
                    </div>
                  </div>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-full md:w-48 h-12 rounded-xl border-gray-200">
                      <SelectValue placeholder="Filtrar por rol" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all" className="rounded-lg">Todos los roles</SelectItem>
                      <SelectItem value="Aprendiz" className="rounded-lg">Aprendiz</SelectItem>
                      <SelectItem value="Instructor" className="rounded-lg">Instructor</SelectItem>
                      <SelectItem value="Funcionario" className="rounded-lg">Funcionario</SelectItem>
                      <SelectItem value="Visitante" className="rounded-lg">Visitante</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    className="h-12 bg-gradient-to-r from-[var(--sena-green)] to-green-600 hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg transition-all duration-300 rounded-xl"
                    onClick={() => setShowCreateUserModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Usuario
                  </Button>
                </div>

                {/* Filtro de Fichas - Solo visible cuando se selecciona Aprendiz */}
                {filterRole === 'Aprendiz' && (
                  <div className="flex flex-col md:flex-row gap-4">
                    <Select value={fichaFilter} onValueChange={setFichaFilter}>
                      <SelectTrigger className="w-full md:w-48 h-12 rounded-xl border-gray-200">
                        <SelectValue placeholder="Filtrar por ficha" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all" className="rounded-lg">Todas las fichas</SelectItem>
                        {fichas.map(ficha => (
                          <SelectItem key={ficha} value={ficha} className="rounded-lg">
                            Ficha {ficha}
                          </SelectItem>
                        ))}
                        <SelectItem value="specific" className="rounded-lg">Buscar ficha específica</SelectItem>
                      </SelectContent>
                    </Select>
                    {fichaFilter === 'specific' && (
                      <Input
                        placeholder="Ingrese número de ficha..."
                        value={fichaSearch}
                        onChange={(e) => setFichaSearch(e.target.value)}
                        className="w-full md:w-48 h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="overflow-x-auto rounded-xl">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left p-4 text-gray-700">Nombre</th>
                      <th className="text-left p-4 text-gray-700">Documento</th>
                      <th className="text-left p-4 text-gray-700">Rol</th>
                      {filterRole === 'Aprendiz' && <th className="text-left p-4 text-gray-700">Ficha</th>}
                      <th className="text-left p-4 text-gray-700">Estado</th>
                      <th className="text-left p-4 text-gray-700">Último Acceso</th>
                      <th className="text-left p-4 text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.map(user => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-emerald-50/50 transition-all duration-200">
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            {(user.role === 'Instructor' || user.role === 'Funcionario') && (
                              <p className="text-xs text-emerald-600">{user.role}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-gray-700">{user.document}</td>
                        <td className="p-4 text-gray-700">{user.role}</td>
                        {filterRole === 'Aprendiz' && (
                          <td className="p-4">
                            {user.ficha ? (
                              <Badge className="bg-emerald-100 text-emerald-800 rounded-lg px-3 py-1">
                                {user.ficha}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                        )}
                        <td className="p-4">
                          <Badge className={`${getStatusBadge(user.status)} rounded-lg px-3 py-1`}>
                            {user.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-gray-600">{user.lastAccess}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="rounded-lg hover:bg-emerald-50 transition-all duration-200">
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-lg hover:bg-emerald-50 transition-all duration-200">
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 rounded-lg hover:bg-red-50 transition-all duration-200">
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
                <Button className="w-full h-12 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
              </Card>

              <Card className="p-8 rounded-2xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-[var(--sena-blue)] mb-4">
                  Reporte de Accesos
                </h3>
                <p className="text-gray-600 mb-6">
                  Resumen de accesos por período
                </p>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                    <span className="font-medium text-gray-700">Hoy</span>
                    <span className="font-semibold text-[var(--sena-green)] text-xl">24 accesos</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                    <span className="font-medium text-gray-700">Esta semana</span>
                    <span className="font-semibold text-[var(--sena-blue)] text-xl">156 accesos</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                    <span className="font-medium text-gray-700">Este mes</span>
                    <span className="font-semibold text-purple-600 text-xl">1,247 accesos</span>
                  </div>
                </div>
                <Button className="w-full h-12 rounded-xl shadow-md hover:shadow-lg transition-all duration-300" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Excel
                </Button>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card className="p-8 rounded-2xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-[var(--sena-blue)]">
                  Historial de Accesos
                </h3>
                <Button variant="outline" className="h-11 rounded-xl border-2 hover:bg-emerald-50 transition-all duration-300">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtrar
                </Button>
              </div>

              <div className="space-y-3">
                {accessHistory.map(entry => (
                  <div key={entry.id} className="flex items-center gap-4 p-5 bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-300">
                    <div className={`w-3 h-3 rounded-full shadow-md ${
                      entry.type === 'Entrada' ? 'bg-[var(--sena-green)]' : 'bg-orange-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{entry.name}</p>
                      <p className="text-sm text-gray-600">{entry.role}</p>
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
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="p-8 rounded-2xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-[var(--sena-blue)] mb-6">
                Configuración del Sistema
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 border-2 border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/50 transition-all duration-300">
                  <div>
                    <p className="font-medium text-gray-900">Notificaciones automáticas</p>
                    <p className="text-sm text-gray-600 mt-1">Alertas por inasistencias</p>
                  </div>
                  <Button variant="outline" className="rounded-xl border-2 hover:bg-emerald-50 transition-all duration-300">Configurar</Button>
                </div>
                <div className="flex items-center justify-between p-5 border-2 border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/50 transition-all duration-300">
                  <div>
                    <p className="font-medium text-gray-900">Backup de datos</p>
                    <p className="text-sm text-gray-600 mt-1">Respaldo automático diario</p>
                  </div>
                  <Button variant="outline" className="rounded-xl border-2 hover:bg-emerald-50 transition-all duration-300">Configurar</Button>
                </div>
                <div className="flex items-center justify-between p-5 border-2 border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/50 transition-all duration-300">
                  <div>
                    <p className="font-medium text-gray-900">Roles y permisos</p>
                    <p className="text-sm text-gray-600 mt-1">Gestionar accesos del sistema</p>
                  </div>
                  <Button variant="outline" className="rounded-xl border-2 hover:bg-emerald-50 transition-all duration-300">Configurar</Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal para crear nuevo usuario */}
      <Dialog open={showCreateUserModal} onOpenChange={setShowCreateUserModal}>
        <DialogContent className="max-w-md rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="relative">
            <div className="absolute right-0 top-0 opacity-80">
              <SenaLogo size="md" opacity={0.8} variant="black" />
            </div>
            <DialogTitle className="text-2xl text-[var(--sena-blue)]">Crear Nuevo Usuario</DialogTitle>
            <DialogDescription className="text-gray-600">
              Ingrese la información del nuevo usuario. Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700">Nombre Completo *</Label>
              <Input
                id="name"
                placeholder="Ingrese el nombre completo"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document" className="text-gray-700">Documento de Identidad *</Label>
              <Input
                id="document"
                placeholder="Ingrese el número de documento"
                value={newUser.document}
                onChange={(e) => setNewUser({ ...newUser, document: e.target.value })}
                className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Correo Electrónico *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Ingrese el correo electrónico"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-gray-700">Rol *</Label>
              <Select value={newUser.role} onValueChange={handleRoleChange}>
                <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300">
                  <SelectValue placeholder="Seleccione un rol" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Aprendiz" className="rounded-lg">Aprendiz</SelectItem>
                  <SelectItem value="Instructor" className="rounded-lg">Instructor</SelectItem>
                  <SelectItem value="Funcionario" className="rounded-lg">Funcionario</SelectItem>
                  <SelectItem value="Visitante" className="rounded-lg">Visitante</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newUser.role && (
              <div className="space-y-2">
                <Label htmlFor="status" className="text-gray-700">Estado *</Label>
                <Select value={newUser.status} onValueChange={(status) => setNewUser({ ...newUser, status })}>
                  <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300">
                    <SelectValue placeholder="Seleccione un estado" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {getStatusOptions(newUser.role).map(status => (
                      <SelectItem key={status} value={status} className="rounded-lg">
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {newUser.role === 'Aprendiz' && (
              <div className="space-y-2">
                <Label htmlFor="ficha" className="text-gray-700">Número de Ficha *</Label>
                <Input
                  id="ficha"
                  placeholder="Ingrese el número de ficha"
                  value={newUser.ficha}
                  onChange={(e) => setNewUser({ ...newUser, ficha: e.target.value })}
                  className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
                  required
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12 rounded-xl border-2 hover:bg-gray-50 transition-all duration-300"
                onClick={() => setShowCreateUserModal(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 bg-gradient-to-r from-[var(--sena-green)] to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
              >
                Crear Usuario
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}