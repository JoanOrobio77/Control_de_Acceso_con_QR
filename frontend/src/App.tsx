import { useState, useEffect } from "react";
import { LoginScreen } from "./components/LoginScreen";
import { GuardScreen } from "./components/GuardScreen";
import { RegisterScreen } from "./components/RegisterScreen";
import { AdminDashboardNew } from "./components/AdminDashboardNew";
import { InstructorPanel } from "./components/InstructorPanel";
import { SplashScreen } from "./components/SplashScreen";
import { Toaster } from "./components/ui/sonner";
import { useAuth } from "./contexts/AuthContext";

type AppView =
  | "splash"
  | "login"
  | "guard"
  | "register"
  | "admin"
  | "instructor";

function AppContent() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>("splash");
  const [userRole, setUserRole] = useState<string>("");

  // Protección de rutas según autenticación y rol
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      // Si no está autenticado, ir al login
      if (currentView !== "splash" && currentView !== "login") {
        setCurrentView("login");
      }
      return;
    }

    // Si está autenticado, redirigir según rol
    // Pero permitir navegación a otras vistas permitidas (como register para guarda)
    if (user) {
      const roleName = (user.rol?.nombre_rol || user.nombre_rol || '').toUpperCase();
      
      // Vistas permitidas por rol (vistas a las que puede navegar)
      const allowedViews: Record<string, AppView[]> = {
        'ADMINISTRADOR': ['admin'],
        'ADMIN': ['admin'],
        'INSTRUCTOR': ['instructor'],
        'GUARDA': ['guard', 'register'], // Guarda puede ir a guard y register
        'APRENDIZ': ['login'],
        'VISITANTE': ['login'],
      };

      const viewsForRole = allowedViews[roleName] || ['login'];
      
      // Solo redirigir si la vista actual no está permitida para este rol
      if (!viewsForRole.includes(currentView)) {
        switch (roleName) {
          case 'ADMINISTRADOR':
          case 'ADMIN':
            setCurrentView("admin");
            setUserRole("admin");
            break;
          case 'INSTRUCTOR':
            setCurrentView("instructor");
            setUserRole("instructor");
            break;
          case 'GUARDA':
            setCurrentView("guard");
            setUserRole("guard");
            break;
          case 'APRENDIZ':
            // TODO: Implementar pantalla de aprendiz
            setCurrentView("login");
            setUserRole("aprendiz");
            break;
          case 'VISITANTE':
            // TODO: Implementar pantalla de visitante
            setCurrentView("login");
            setUserRole("visitante");
            break;
          default:
            setCurrentView("login");
        }
      } else {
        // Mantener el rol actual
        switch (roleName) {
          case 'ADMINISTRADOR':
          case 'ADMIN':
            setUserRole("admin");
            break;
          case 'INSTRUCTOR':
            setUserRole("instructor");
            break;
          case 'GUARDA':
            setUserRole("guard");
            break;
          case 'APRENDIZ':
            setUserRole("aprendiz");
            break;
          case 'VISITANTE':
            setUserRole("visitante");
            break;
        }
      }
    }
  }, [isAuthenticated, isLoading, user, currentView]);

  const handleLogin = (role: string) => {
    setUserRole(role);
    switch (role) {
      case "guard":
        setCurrentView("guard");
        break;
      case "admin":
        setCurrentView("admin");
        break;
      case "instructor":
        setCurrentView("instructor");
        break;
      case "aprendiz":
      case "visitante":
        // Por ahora redirigir a login si no hay pantalla específica
        setCurrentView("login");
        break;
      default:
        setCurrentView("login");
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentView("login");
    setUserRole("");
  };

  const showRegisterScreen = () => {
    setCurrentView("register");
  };

  const backToGuardScreen = () => {
    setCurrentView("guard");
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case "splash":
        return (
          <SplashScreen
            onFinish={() => setCurrentView("login")}
          />
        );

      case "login":
        return <LoginScreen onLogin={handleLogin} />;

      case "guard":
        return (
          <GuardScreen
            onRegisterNew={showRegisterScreen}
            onLogout={handleLogout}
          />
        );

      case "register":
        return <RegisterScreen onBack={backToGuardScreen} onSuccess={() => setCurrentView("guard")} />;

      case "admin":
        return <AdminDashboardNew onLogout={handleLogout} />;

      case "instructor":
        return <InstructorPanel onLogout={handleLogout} />;

      default:
        return <LoginScreen onLogin={handleLogin} />;
    }
  };

  return (
    <div className="size-full">
      {renderCurrentView()}
      <Toaster />
    </div>
  );
}

export default function App() {
  return <AppContent />;
}