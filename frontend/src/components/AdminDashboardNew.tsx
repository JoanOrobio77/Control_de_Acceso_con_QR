import React, { useMemo, useState, useEffect } from 'react';
import { 
  Users, 
  GraduationCap,
  Briefcase,
  UserCheck,
  BookOpen,
  Upload,
  LogOut,
  Menu,
  X,
  FileText,
  History,
  Settings,
  Search
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { SenaLogo } from './SenaLogo';
import { AprendizManager } from './admin/AprendizManager';
import { FichaManager } from './admin/FichaManager';
import { ImportacionMasiva } from './admin/ImportacionMasiva';
import { ImportacionInstructores } from './admin/ImportacionInstructores';
import { PersonalManager } from './admin/PersonalManager';
import { useAuth } from '../contexts/AuthContext';
import API from '../config/api';

interface AdminDashboardNewProps {
  onLogout: () => void;
}

type MenuItem = {
  id: string;
  label: string;
  icon: any;
  badge?: number;
};

type DashboardStats = {
  totalUsuarios: number;
  totalAprendices: number;
  totalInstructores: number;
  totalFuncionarios: number;
  totalVisitantes: number;
  totalFichas: number;
  totalAccesos: number;
};

type ActivityItem = {
  id: number;
  nombre: string;
  tipo_acceso: 'ENTRADA' | 'SALIDA';
  fecha: string;
  hora: string;
  rol?: string;
  area?: string;
};

export function AdminDashboardNew({ onLogout }: AdminDashboardNewProps) {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalUsuarios: 0,
    totalAprendices: 0,
    totalInstructores: 0,
    totalFuncionarios: 0,
    totalVisitantes: 0,
    totalFichas: 0,
    totalAccesos: 0,
  } as DashboardStats);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [searchDocument, setSearchDocument] = useState('');

  // Cargar estadísticas del dashboard
  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const response = await API.get('/admin/dashboard');
        const data = response.data;
        setDashboardStats({
          totalUsuarios: (data.totalAprendices || 0) + (data.totalInstructores || 0) + (data.totalFuncionarios || 0) + (data.totalVisitantes || 0),
          totalAprendices: data.totalAprendices || 0,
          totalInstructores: data.totalInstructores || 0,
          totalFuncionarios: data.totalFuncionarios || 0,
          totalVisitantes: data.totalVisitantes || 0,
          totalFichas: data.totalFichas || 0,
          totalAccesos: data.totalRegistros || 0,
        });
      } catch (err) {
        console.error('Error cargando estadísticas:', err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, [activeSection]); // Recargar cuando cambie de sección

  // Cargar actividad reciente
  const fetchActivity = async (documento?: string) => {
    if (activeSection !== 'overview') return;
    
    setLoadingActivity(true);
    try {
      const params = new URLSearchParams();
      if (documento) {
        params.append('documento', documento);
      }
      const queryString = params.toString();
      const url = queryString ? `/admin/actividad-reciente?${queryString}` : '/admin/actividad-reciente';
      
      const response = await API.get(url);
      setRecentActivity(response.data?.registros || []);
    } catch (err) {
      console.error('Error cargando actividad:', err);
      setRecentActivity([]);
    } finally {
      setLoadingActivity(false);
    }
  };

  useEffect(() => {
    fetchActivity();
    
    // Actualizar cada 30 segundos si está en overview
    const interval = setInterval(() => fetchActivity(), 30000);
    return () => clearInterval(interval);
  }, [activeSection]);

  // Buscar cuando cambia el documento
  const handleSearchDocument = (value: string) => {
    setSearchDocument(value);
    // Debounce de 500ms para no hacer muchas peticiones
    const timeoutId = setTimeout(() => {
      fetchActivity(value);
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  const userName = user?.tipo_usuario || user?.rol?.nombre_rol || 'Administrador';
  const userEmail = user?.correo || 'Sin correo';
  const userInitials = useMemo(() => {
    const source = user?.tipo_usuario || user?.correo || 'AD';
    return source
      .split(' ')
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'AD';
  }, [user]);

  const menuItems: MenuItem[] = [
    { id: 'overview', label: 'Panel General', icon: FileText },
    { id: 'aprendices', label: 'Aprendices', icon: GraduationCap, badge: dashboardStats.totalAprendices || undefined },
    { id: 'instructores', label: 'Instructores', icon: Users, badge: dashboardStats.totalInstructores || undefined },
    { id: 'funcionarios', label: 'Funcionarios', icon: Briefcase, badge: dashboardStats.totalFuncionarios || undefined },
    { id: 'visitantes', label: 'Visitantes', icon: UserCheck, badge: dashboardStats.totalVisitantes || undefined },
    { id: 'fichas', label: 'Fichas y Programas', icon: BookOpen, badge: dashboardStats.totalFichas || undefined },
    { id: 'importacion', label: 'Importar Aprendices', icon: Upload },
    { id: 'importacion-instructores', label: 'Importar Instructores', icon: Upload },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'aprendices':
        return <AprendizManager />;
      case 'fichas':
        return <FichaManager />;
      case 'importacion':
        return <ImportacionMasiva />;
      case 'importacion-instructores':
        return <ImportacionInstructores />;
      case 'instructores':
        return <PersonalManager tipo="instructor" />;
      case 'funcionarios':
        return <PersonalManager tipo="funcionario" />;
      case 'visitantes':
        return <PersonalManager tipo="visitante" />;
      case 'overview':
      default:
        return (
          <OverviewSection 
            stats={dashboardStats} 
            activity={recentActivity} 
            loadingActivity={loadingActivity}
            searchDocument={searchDocument}
            onSearchDocument={handleSearchDocument}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 flex relative">
      {/* Logo marca de agua */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <SenaLogo size="2xl" opacity={0.05} variant="black" className="scale-[4]" />
      </div>

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-40 ${
        sidebarOpen ? 'w-72' : 'w-0 lg:w-20'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {sidebarOpen && (
                <div className="flex items-center gap-3">
                  <SenaLogo size="sm" />
                  <div>
                    <h1 className="font-semibold text-[var(--sena-blue)]">Administración</h1>
                    <p className="text-xs text-gray-600">Control de Acceso</p>
                  </div>
                </div>
              )}
              {!sidebarOpen && (
                <div className="mx-auto">
                  <SenaLogo size="sm" />
                </div>
              )}
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    activeSection === item.id
                      ? 'bg-gradient-to-r from-[var(--sena-blue)] to-emerald-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-emerald-50'
                  }`}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${activeSection === item.id ? 'text-white' : 'text-[var(--sena-green)]'}`} />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                          activeSection === item.id
                            ? 'bg-white/20 text-white'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <Button
              onClick={onLogout}
              variant="outline"
              className={`w-full rounded-xl border-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-300 ${
                !sidebarOpen && 'px-0'
              }`}
            >
              <LogOut className="w-5 h-5" />
              {sidebarOpen && <span className="ml-2">Cerrar Sesión</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 p-4 lg:p-6 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden rounded-lg hover:bg-emerald-50"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              <div>
                <h2 className="text-xl font-semibold text-[var(--sena-blue)]">
                  Panel de Administración
                </h2>
                <p className="text-sm text-gray-600">CBI SENA Palmira</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-2 rounded-xl border border-emerald-200">
                <div className="w-8 h-8 bg-gradient-to-br from-[var(--sena-blue)] to-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">{userInitials}</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 capitalize">{userName}</p>
                  <p className="text-xs text-gray-600 break-all">{userEmail}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 lg:p-8 relative">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

// Overview Section Component
interface OverviewSectionProps {
  stats: DashboardStats;
  activity: ActivityItem[];
  loadingActivity: boolean;
  searchDocument: string;
  onSearchDocument: (value: string) => void;
}

function OverviewSection({ stats, activity, loadingActivity, searchDocument, onSearchDocument }: OverviewSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--sena-blue)]">Panel General</h2>
        <p className="text-gray-600 mt-1">Resumen general del sistema de control de acceso</p>
      </div>

      {/* Stats Grid - Primera fila */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 rounded-2xl border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-gray-500">Total</span>
          </div>
          <h3 className="text-3xl font-semibold text-[var(--sena-blue)] mb-1">{stats.totalUsuarios}</h3>
          <p className="text-sm text-gray-600">Usuarios Registrados</p>
        </Card>

        <Card className="p-6 rounded-2xl border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--sena-green)] to-green-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-gray-500">Activos</span>
          </div>
          <h3 className="text-3xl font-semibold text-[var(--sena-green)] mb-1">{stats.totalAprendices}</h3>
          <p className="text-sm text-gray-600">Aprendices</p>
        </Card>

        <Card className="p-6 rounded-2xl border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-gray-500">Programas</span>
          </div>
          <h3 className="text-3xl font-semibold text-purple-600 mb-1">{stats.totalFichas}</h3>
          <p className="text-sm text-gray-600">Fichas Activas</p>
        </Card>

        <Card className="p-6 rounded-2xl border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <History className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-gray-500">Total</span>
          </div>
          <h3 className="text-3xl font-semibold text-orange-600 mb-1">{stats.totalAccesos}</h3>
          <p className="text-sm text-gray-600">Accesos Registrados</p>
        </Card>
      </div>

      {/* Stats Grid - Segunda fila: Personal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 rounded-2xl border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-gray-500">Personal</span>
          </div>
          <h3 className="text-3xl font-semibold text-cyan-600 mb-1">{stats.totalInstructores}</h3>
          <p className="text-sm text-gray-600">Instructores</p>
        </Card>

        <Card className="p-6 rounded-2xl border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-gray-500">Personal</span>
          </div>
          <h3 className="text-3xl font-semibold text-indigo-600 mb-1">{stats.totalFuncionarios}</h3>
          <p className="text-sm text-gray-600">Funcionarios</p>
        </Card>

        <Card className="p-6 rounded-2xl border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-gray-500">Externos</span>
          </div>
          <h3 className="text-3xl font-semibold text-pink-600 mb-1">{stats.totalVisitantes}</h3>
          <p className="text-sm text-gray-600">Visitantes</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--sena-blue)] mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-6 rounded-2xl border-0 shadow-md bg-white hover:shadow-lg transition-all duration-300 cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-[var(--sena-green)]" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Nuevo Aprendiz</h4>
                <p className="text-sm text-gray-600">Registrar estudiante</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl border-0 shadow-md bg-white hover:shadow-lg transition-all duration-300 cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Nueva Ficha</h4>
                <p className="text-sm text-gray-600">Crear programa</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl border-0 shadow-md bg-white hover:shadow-lg transition-all duration-300 cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Importar Datos</h4>
                <p className="text-sm text-gray-600">Carga masiva</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="p-6 rounded-2xl border-0 shadow-lg bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--sena-blue)]">Actividad Reciente</h3>
            <span className="text-xs text-gray-500">Últimos 20 registros</span>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por documento..."
              value={searchDocument}
              onChange={(e) => onSearchDocument(e.target.value)}
              className="pl-10 h-10 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)]"
            />
          </div>
        </div>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {loadingActivity ? (
            <div className="text-center py-10 text-gray-500">
              <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              Cargando actividad...
            </div>
          ) : activity.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <History className="w-12 h-12 mx-auto mb-2 opacity-30" />
              No hay registros de acceso aún.
            </div>
          ) : (
            activity.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 ${
                  item.tipo_acceso === 'ENTRADA' 
                    ? 'bg-green-50 hover:bg-green-100 border-l-4 border-green-500' 
                    : 'bg-orange-50 hover:bg-orange-100 border-l-4 border-orange-500'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    item.tipo_acceso === 'ENTRADA'
                      ? 'bg-green-500 text-white'
                      : 'bg-orange-500 text-white'
                  }`}
                >
                  {item.tipo_acceso === 'ENTRADA' ? '→' : '←'}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.nombre}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      item.tipo_acceso === 'ENTRADA' 
                        ? 'bg-green-200 text-green-800' 
                        : 'bg-orange-200 text-orange-800'
                    }`}>
                      {item.tipo_acceso}
                    </span>
                    {item.rol && (
                      <span className="text-gray-500">• {item.rol}</span>
                    )}
                    {item.area && (
                      <span className="text-gray-500">• {item.area}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">{item.hora}</p>
                  <p className="text-xs text-gray-500">{item.fecha}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

// Placeholder Section Component
function PlaceholderSection({ title, icon: Icon }: { title: string; icon: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--sena-blue)]">{title}</h2>
        <p className="text-gray-600 mt-1">Módulo en desarrollo</p>
      </div>

      <Card className="p-12 rounded-2xl border-0 shadow-lg bg-white text-center">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Icon className="w-12 h-12 text-[var(--sena-green)]" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Módulo en Desarrollo</h3>
          <p className="text-gray-600">
            Esta sección estará disponible próximamente con funcionalidades completas de gestión.
          </p>
        </div>
      </Card>
    </div>
  );
}