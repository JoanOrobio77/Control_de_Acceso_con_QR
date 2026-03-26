import { useState } from 'react';
import { LogIn, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { SenaLogo } from './SenaLogo';
import { useAuth } from '../contexts/AuthContext';

interface LoginScreenProps {
  onLogin: (role: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const { login } = useAuth();
  const [credentials, setCredentials] = useState({
    correo: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones básicas
    if (!credentials.correo.trim()) {
      setError('El correo es obligatorio');
      return;
    }

    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.correo.trim())) {
      setError('El correo debe ser válido');
      return;
    }

    if (!credentials.password.trim()) {
      setError('La contraseña es obligatoria');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(credentials.correo.trim(), credentials.password);

      if (result.success && result.user) {
        // Determinar el rol para redirección
        // Los roles llegan desde el backend como texto en mayúsculas: "GUARDA", "INSTRUCTOR", "ADMINISTRADOR"
        const roleName = (result.user?.rol?.nombre_rol || result.user?.nombre_rol || '').toUpperCase();
        let redirectRole = '';

        switch (roleName) {
          case 'ADMINISTRADOR':
          case 'ADMIN':
            redirectRole = 'admin';
            break;
          case 'INSTRUCTOR':
            redirectRole = 'instructor';
            break;
          case 'GUARDA':
            redirectRole = 'guard';
            break;
          case 'APRENDIZ':
            redirectRole = 'aprendiz';
            break;
          case 'VISITANTE':
            redirectRole = 'visitante';
            break;
          default:
            console.warn('Rol no reconocido:', roleName);
            redirectRole = 'login';
        }

        // Pequeño delay para asegurar que el estado se actualice
        setTimeout(() => {
          onLogin(redirectRole);
        }, 100);
      } else {
        // Manejar errores
        if (result.error?.includes('Credenciales') || result.error?.includes('inválidas')) {
          setError('Credenciales incorrectas');
        } else {
          setError('Error al iniciar sesión');
        }
      }
    } catch (err: any) {
      setError('Error al iniciar sesión');
      console.error('Error en login:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--sena-light-blue)] via-emerald-50 to-[var(--sena-light-green)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[var(--sena-green)]/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[var(--sena-blue)]/10 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md p-10 shadow-2xl rounded-3xl border-0 bg-white/90 backdrop-blur-lg relative z-10">
        {/* Logo y Título */}
        <div className="text-center mb-10">
          <div className="mx-auto mb-6 flex justify-center">
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-3xl shadow-lg">
              <SenaLogo size="lg" />
            </div>
          </div>
          <h1 className="text-3xl font-semibold text-[var(--sena-blue)] mb-3">
            Control de Acceso
          </h1>
          <p className="text-gray-600">CBI SENA Palmira</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Correo */}
          <div className="space-y-2">
            <Label htmlFor="correo" className="text-gray-700">Correo Electrónico</Label>
            <Input
              id="correo"
              type="email"
              value={credentials.correo}
              onChange={(e) => {
                setCredentials({...credentials, correo: e.target.value});
                setError('');
              }}
              placeholder="correo@ejemplo.com"
              className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
              required
              disabled={isLoading}
            />
          </div>

          {/* Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={(e) => {
                  setCredentials({...credentials, password: e.target.value});
                  setError('');
                }}
                placeholder="Ingrese su contraseña"
                className="pl-11 pr-11 h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Botón de Login */}
          <Button 
            type="submit" 
            className="w-full h-14 bg-gradient-to-r from-[var(--sena-blue)] to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl mt-8"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Iniciando sesión...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                Iniciar Sesión
              </>
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Sistema de Control de Acceso v1.0
          </p>
        </div>
      </Card>
    </div>
  );
}
