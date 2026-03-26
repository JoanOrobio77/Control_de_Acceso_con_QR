import { useState } from 'react';
import { ArrowLeft, QrCode, User, FileText, Mail, Users, CheckCircle, MapPin, FileEdit, AlertCircle, UserPlus, Phone } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { SenaLogo } from './SenaLogo';
import API from '../config/api';

interface RegisterScreenProps {
  onBack: () => void;
  onSuccess?: () => void;
}

export function RegisterScreen({ onBack, onSuccess }: RegisterScreenProps) {
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    email: '',
    phone: '',
    role: '',
    status: '',
    fichaNumber: '',
    area: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<any>(null);

  const roleOptions = [
    { value: 'aprendiz', label: 'Aprendiz' },
    { value: 'instructor', label: 'Instructor' },
    { value: 'funcionario', label: 'Funcionario' },
    { value: 'visitante', label: 'Visitante' }
  ];

  const areaOptions = [
    { value: 'aula', label: 'AULA' },
    { value: 'biblioteca', label: 'BIBLIOTECA' },
    { value: 'auditorio', label: 'AUDITORIO' },
    { value: 'otras', label: 'OTRAS' }
  ];

  const getStatusOptions = (role: string) => {
    switch (role) {
      case 'aprendiz':
        return [
          { value: 'en-formacion', label: 'En formación' },
          { value: 'condicionado', label: 'Condicionado' },
          { value: 'cancelado', label: 'Cancelado' },
          { value: 'certificado', label: 'Certificado' }
        ];
      case 'instructor':
      case 'funcionario':
        return [
          { value: 'planta', label: 'Planta' },
          { value: 'contratista', label: 'Contratista' }
        ];
      case 'visitante':
        return [
          { value: 'visitante', label: 'Visitante' }
        ];
      default:
        return [];
    }
  };

  const validateEmail = (email: string) => {
    if (!email) return true; // Email es opcional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones mínimas
    if (!formData.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    if (!formData.document.trim()) {
      setError('La identificación es obligatoria');
      return;
    }

    if (!formData.role) {
      setError('El rol es obligatorio');
      return;
    }

    // Validar correo si se proporciona
    if (formData.email && !validateEmail(formData.email)) {
      setError('El correo electrónico no es válido');
      return;
    }

    // Validación específica para aprendices
    if (formData.role === 'aprendiz' && !formData.fichaNumber) {
      setError('El número de ficha es obligatorio para aprendices');
      return;
    }

    // Validación específica para visitantes
    if (formData.role === 'visitante' && !formData.area) {
      setError('El área es obligatoria para visitantes');
      return;
    }

    setIsLoading(true);

    try {
      // Preparar payload según el rol
      let payload: any = {
        nombre: formData.name.trim(),
        identificacion: formData.document.trim(),
        telefono: formData.phone.trim() || null,
        correo: formData.email.trim() || null,
        nombre_rol: formData.role, // El backend resolverá el id_rol
        id_ficha: null,
      };

      // Si es aprendiz, buscar el id_ficha por número de ficha
      if (formData.role === 'aprendiz' && formData.fichaNumber) {
        // Por ahora dejamos id_ficha como null, se puede implementar búsqueda de ficha después
        // TODO: Buscar ficha por número y asignar id_ficha
        payload.id_ficha = null;
      }

      const response = await API.post('/auth/register', payload);

      if (response.status === 201) {
        setRegisteredUser(response.data.user);
        setShowSuccess(true);
        
        // Redirigir a login después de 2 segundos
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            // Fallback: recargar página
            window.location.href = '/';
          }
        }, 2000);
      }
    } catch (err: any) {
      // Manejar errores
      if (err.response?.status >= 400 && err.response?.status < 500) {
        setError(err.response?.data?.error || 'Error al registrar usuario. Verifique los datos ingresados.');
      } else {
        setError('Error al registrar usuario. Por favor, intente nuevamente.');
      }
      console.error('Error en registro:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      document: '',
      email: '',
      phone: '',
      role: '',
      status: '',
      fichaNumber: '',
      area: '',
      description: ''
    });
    setShowSuccess(false);
    setRegisteredUser(null);
    setError('');
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-4">
        <div className="max-w-md mx-auto pt-8">
          <Card className="p-8 text-center shadow-xl rounded-2xl border-0 bg-white/80 backdrop-blur-sm">
            <div className="w-20 h-20 bg-gradient-to-br from-[var(--sena-green)] to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-2xl font-semibold text-[var(--sena-blue)] mb-3">
              ¡Registro Exitoso!
            </h2>
            <p className="text-gray-600 mb-8">
              La persona ha sido registrada correctamente
            </p>

            {/* User Card */}
            {registeredUser && (
              <Card className="p-6 mb-8 border-2 border-[var(--sena-green)] rounded-xl shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[var(--sena-blue)] to-emerald-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-[var(--sena-blue)] text-lg">{registeredUser.nombre}</h3>
                    <p className="text-sm text-gray-600 capitalize mt-1">{formData.role.replace('-', ' ')}</p>
                    <p className="text-xs text-gray-500 mt-1">Doc: {registeredUser.identificacion}</p>
                    {formData.fichaNumber && (
                      <p className="text-xs text-gray-500">Ficha: {formData.fichaNumber}</p>
                    )}
                    {formData.area && (
                      <p className="text-xs text-emerald-600 mt-1 capitalize">Área: {formData.area}</p>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* QR Code Simulation */}
            <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-gray-300 mb-8 shadow-inner">
              <QrCode className="w-28 h-28 mx-auto text-gray-400 mb-3" />
              <p className="text-xs text-gray-500 break-all font-mono">SENA-{formData.document}-{Date.now()}</p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={resetForm}
                className="w-full h-12 bg-gradient-to-r from-[var(--sena-green)] to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Registrar Otra Persona
              </Button>
              <Button 
                onClick={() => {
                  if (onSuccess) {
                    onSuccess();
                  } else {
                    window.location.href = '/';
                  }
                }}
                variant="outline"
                className="w-full h-12 rounded-xl border-2 hover:bg-emerald-50 transition-all duration-300"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Ir al Login
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-4">
      {/* Header */}
      <div className="max-w-md mx-auto mb-8 pt-4">
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-[var(--sena-blue)] hover:bg-emerald-100 rounded-xl transition-all duration-300"
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <SenaLogo size="sm" />
        </div>
        
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-[var(--sena-blue)] mb-2">
            Registrar Nueva Persona
          </h1>
          <p className="text-gray-600">Complete la información para generar el código QR</p>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        <Card className="p-8 shadow-xl rounded-2xl border-0 bg-white/80 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2 text-gray-700">
                <User className="w-4 h-4 text-[var(--sena-green)]" />
                Nombre Completo *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({...formData, name: e.target.value});
                  setError('');
                }}
                placeholder="Ingrese el nombre completo"
                className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
                required
                disabled={isLoading}
              />
            </div>

            {/* Documento */}
            <div className="space-y-2">
              <Label htmlFor="document" className="flex items-center gap-2 text-gray-700">
                <FileText className="w-4 h-4 text-[var(--sena-green)]" />
                Número de Documento *
              </Label>
              <Input
                id="document"
                value={formData.document}
                onChange={(e) => {
                  setFormData({...formData, document: e.target.value});
                  setError('');
                }}
                placeholder="Ingrese el número de documento"
                className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
                required
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-gray-700">
                <Mail className="w-4 h-4 text-[var(--sena-green)]" />
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({...formData, email: e.target.value});
                  setError('');
                }}
                placeholder="ejemplo@sena.edu.co"
                className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
                disabled={isLoading}
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4 text-[var(--sena-green)]" />
                Teléfono
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({...formData, phone: e.target.value});
                  setError('');
                }}
                placeholder="Ingrese el número de teléfono"
                className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
                disabled={isLoading}
              />
            </div>

            {/* Rol */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-gray-700">
                <Users className="w-4 h-4 text-[var(--sena-green)]" />
                Rol *
              </Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => {
                  setFormData({...formData, role: value, status: '', fichaNumber: '', area: '', description: ''});
                  setError('');
                }}
                disabled={isLoading}
              >
                <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300">
                  <SelectValue placeholder="Seleccione un rol" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {roleOptions.map(option => (
                    <SelectItem key={option.value} value={option.value} className="rounded-lg">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Número de Ficha - Solo para Aprendices */}
            {formData.role === 'aprendiz' && (
              <div className="space-y-2">
                <Label htmlFor="fichaNumber" className="flex items-center gap-2 text-gray-700">
                  <FileText className="w-4 h-4 text-[var(--sena-green)]" />
                  Número de Ficha *
                </Label>
                <Input
                  id="fichaNumber"
                  value={formData.fichaNumber}
                  onChange={(e) => {
                    setFormData({...formData, fichaNumber: e.target.value});
                    setError('');
                  }}
                  placeholder="Ej: 2715071"
                  className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300"
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Área y Descripción - Solo para Visitantes */}
            {formData.role === 'visitante' && (
              <>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-4 h-4 text-[var(--sena-green)]" />
                    Área de Visita *
                  </Label>
                  <Select 
                    value={formData.area} 
                    onValueChange={(value) => {
                      setFormData({...formData, area: value});
                      setError('');
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300">
                      <SelectValue placeholder="Seleccione el área" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {areaOptions.map(option => (
                        <SelectItem key={option.value} value={option.value} className="rounded-lg">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="flex items-center gap-2 text-gray-700">
                    <FileEdit className="w-4 h-4 text-[var(--sena-green)]" />
                    Descripción (opcional)
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Motivo de la visita, persona a la que visita, etc."
                    className="min-h-[100px] rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300 resize-none"
                    disabled={isLoading}
                  />
                </div>
              </>
            )}

            {/* Estado - No mostrar para Aprendices ni Visitantes */}
            {formData.role && formData.role !== 'visitante' && formData.role !== 'aprendiz' && (
              <div className="space-y-2">
                <Label className="text-gray-700">Estado</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData({...formData, status: value})}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] transition-all duration-300">
                    <SelectValue placeholder="Seleccione un estado" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {getStatusOptions(formData.role).map(option => (
                      <SelectItem key={option.value} value={option.value} className="rounded-lg">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Mensaje de error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button 
              type="submit"
              className="w-full h-14 bg-gradient-to-r from-[var(--sena-blue)] to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl mt-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Registrando...
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5 mr-2" />
                  Generar Código QR
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
