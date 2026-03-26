import React, { useState, useRef, useEffect } from 'react';
import { QrCode, UserPlus, Clock, CheckCircle, LogOut, KeyRound, X, History, AlertCircle, Download } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { SenaLogo } from './SenaLogo';
import API from '../config/api';
import { toast } from 'sonner';

interface Persona {
  id_persona: number;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  numero_documento: string;
  tipo_documento: string;
  telefono?: string;
  correo?: string;
  rol: string;
  estado?: string;
}

interface RegistroAcceso {
  id_registro: number;
  fecha: string;
  hora_entrada?: string;
  hora_salida?: string;
  tipo_acceso: string;
  persona?: {
    id_persona: number;
    nombre_completo: string;
    numero_documento: string;
    rol: string;
  };
  area?: string;
}

interface GuardScreenProps {
  onRegisterNew: () => void;
  onLogout: () => void;
}

const tipoDocumentoOptions = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'PAS', label: 'Pasaporte' },
];

export function GuardScreen({ onRegisterNew, onLogout }: GuardScreenProps) {
  const [personaEncontrada, setPersonaEncontrada] = useState<Persona | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isScannerRunning, setIsScannerRunning] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showNewVisitorModal, setShowNewVisitorModal] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);
  const [manualDocument, setManualDocument] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [registrosHoy, setRegistrosHoy] = useState<RegistroAcceso[]>([]);
  const [loadingRegistros, setLoadingRegistros] = useState(false);
  const qrCodeRef = useRef<Html5Qrcode | null>(null);
  const isProcessingQR = useRef(false);
  const lastProcessedQR = useRef<string | null>(null);

  // Estado para nuevo visitante
  const [nuevoVisitante, setNuevoVisitante] = useState({
    tipo_documento: 'CC',
    numero_documento: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    correo: '',
    rh: '',
  });
  const [isSavingVisitante, setIsSavingVisitante] = useState(false);

  // Estado para el modal del QR del visitante registrado
  const [showQRModal, setShowQRModal] = useState(false);
  const [visitanteRegistrado, setVisitanteRegistrado] = useState<{
    nombres: string;
    apellidos: string;
    numero_documento: string;
    tipo_documento: string;
  } | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  // Cargar registros del día
  const cargarRegistrosHoy = async () => {
    setLoadingRegistros(true);
    try {
      const response = await API.get('/guarda/registros-hoy');
      if (response.data?.registros) {
        setRegistrosHoy(response.data.registros);
      }
    } catch (error: any) {
      console.error('Error cargando registros:', error);
    } finally {
      setLoadingRegistros(false);
    }
  };

  useEffect(() => {
    cargarRegistrosHoy();
  }, []);

  // Buscar persona por documento
  const buscarPersona = async (documento: string): Promise<Persona | null> => {
    try {
      const response = await API.post('/guarda/buscar-persona', {
        numero_documento: documento,
      });

      if (response.data?.persona) {
        return response.data.persona;
      }
      return null;
    } catch (error: any) {
      // 404 significa que la persona no existe - es comportamiento normal, no un error
      if (error.response?.status === 404) {
        console.log('Persona no encontrada en la BD:', documento);
        return null;
      }
      throw error;
    }
  };

  // Registrar entrada
  const registrarEntrada = async (documento: string) => {
    setIsRegistering(true);
    try {
      const response = await API.post('/guarda/ingreso-manual', {
        numero_documento: documento,
        tipo_acceso: 'ENTRADA',
      });

      if (response.data?.success) {
        toast.success(`Entrada registrada para ${response.data.persona.nombre_completo}`);
        setPersonaEncontrada(response.data.persona);
        cargarRegistrosHoy();
        return response.data;
      }
    } catch (error: any) {
      console.error('Error registrando entrada:', error);
      toast.error(error.response?.data?.error || 'Error al registrar entrada');
      throw error;
    } finally {
      setIsRegistering(false);
    }
  };

  // Registrar salida
  const registrarSalida = async (documento: string) => {
    setIsRegistering(true);
    try {
      const response = await API.post('/guarda/ingreso-manual', {
        numero_documento: documento,
        tipo_acceso: 'SALIDA',
      });

      if (response.data?.success) {
        toast.success(`Salida registrada para ${response.data.persona.nombre_completo}`);
        setPersonaEncontrada(null);
        cargarRegistrosHoy();
        return response.data;
      }
    } catch (error: any) {
      console.error('Error registrando salida:', error);
      toast.error(error.response?.data?.error || 'Error al registrar salida');
      throw error;
    } finally {
      setIsRegistering(false);
    }
  };

  // Parsear contenido del QR para extraer datos
  const parsearQR = (qrData: string): { documento: string; nombre?: string; apellido?: string; rol?: string; rh?: string } => {
    // Si es solo un número, es el documento directamente
    if (/^\d+$/.test(qrData.trim())) {
      return { documento: qrData.trim() };
    }

    // Formato esperado: "NOMBRE APELLIDO DOCUMENTO ROL RH=X+"
    // Ejemplo: "FERLEY OROBIO PAZ 1061200351 APRENDIZ RH=O+"
    
    // Buscar el número de documento (secuencia de dígitos de 6-15 caracteres)
    const docMatch = qrData.match(/\b(\d{6,15})\b/);
    const documento = docMatch ? docMatch[1] : '';

    // Buscar RH
    const rhMatch = qrData.match(/RH[=:]?\s*([ABO]{1,2}[+-])/i);
    const rh = rhMatch ? rhMatch[1].toUpperCase() : undefined;

    // Buscar rol
    const roles = ['APRENDIZ', 'INSTRUCTOR', 'FUNCIONARIO', 'VISITANTE', 'GUARDA', 'ADMINISTRADOR'];
    let rol: string | undefined;
    for (const r of roles) {
      if (qrData.toUpperCase().includes(r)) {
        rol = r.toLowerCase();
        break;
      }
    }

    // Extraer nombre (todo lo que está antes del documento)
    let nombre: string | undefined;
    let apellido: string | undefined;
    if (docMatch && docMatch.index !== undefined) {
      const parteNombre = qrData.substring(0, docMatch.index).trim();
      const palabras = parteNombre.split(/\s+/).filter(p => p.length > 1);
      if (palabras.length >= 2) {
        nombre = palabras[0];
        apellido = palabras.slice(1).join(' ');
      } else if (palabras.length === 1) {
        nombre = palabras[0];
      }
    }

    return { documento, nombre, apellido, rol, rh };
  };

  // Registrar acceso automático (entrada o salida según último registro)
  const registrarAccesoAutomatico = async (documento: string) => {
    try {
      const response = await API.post('/guarda/registro-automatico', {
        numero_documento: documento,
      });

      if (response.data?.success) {
        const tipoAcceso = response.data.tipo_acceso;
        const persona = response.data.persona;
        
        if (tipoAcceso === 'ENTRADA') {
          toast.success(`✅ ENTRADA registrada para ${persona.nombre_completo}`, {
            duration: 4000,
          });
        } else {
          toast.success(`👋 SALIDA registrada para ${persona.nombre_completo}`, {
            duration: 4000,
          });
        }
        
        setPersonaEncontrada({
          ...persona,
          ultimoAcceso: tipoAcceso,
        });
        cargarRegistrosHoy();
        return response.data;
      }
    } catch (error: any) {
      console.error('Error en registro automático:', error);
      throw error;
    }
  };

  // Manejar resultado del escaneo QR
  const handleScanResult = async (data: string) => {
    if (!data) return;
    
    // Verificación adicional por si acaso
    if (lastProcessedQR.current === data) {
      return;
    }
    lastProcessedQR.current = data;

    console.log('QR detectado (procesando):', data);

    try {
      // Parsear el contenido del QR
      const datosQR = parsearQR(data);
      console.log('Datos parseados del QR:', datosQR);

      if (!datosQR.documento) {
        toast.error('No se pudo extraer el número de documento del QR');
        return;
      }

      // Buscar por el documento extraído
      const persona = await buscarPersona(datosQR.documento);
      
      if (persona) {
        // Persona encontrada - registrar automáticamente entrada/salida
        await registrarAccesoAutomatico(datosQR.documento);
      } else {
        // Persona NO encontrada - verificar el rol del QR
        const rolQR = datosQR.rol?.toLowerCase();
        const rolesValidos = ['aprendiz', 'instructor', 'funcionario', 'visitante'];
        
        if (rolQR === 'aprendiz') {
          // Es un aprendiz pero no está registrado en ninguna ficha
          toast.error(
            `⚠️ APRENDIZ NO REGISTRADO\n\n${datosQR.nombre || ''} ${datosQR.apellido || ''}\nDocumento: ${datosQR.documento}\n\nEste aprendiz no está asociado a ninguna ficha. Debe ser registrado por el administrador.`,
            { duration: 6000 }
          );
          setPersonaEncontrada(null);
        } else if (rolQR === 'instructor' || rolQR === 'funcionario') {
          // Es instructor o funcionario pero no está registrado
          toast.error(
            `⚠️ ${rolQR.toUpperCase()} NO REGISTRADO\n\n${datosQR.nombre || ''} ${datosQR.apellido || ''}\nDocumento: ${datosQR.documento}\n\nDebe ser registrado por el administrador.`,
            { duration: 6000 }
          );
          setPersonaEncontrada(null);
        } else if (rolQR === 'visitante') {
          // Es visitante - ofrecer registrar como visitante
          toast.info('Visitante no registrado. ¿Desea registrarlo?');
          setNuevoVisitante(prev => ({ 
            ...prev, 
            numero_documento: datosQR.documento,
            nombres: datosQR.nombre || '',
            apellidos: datosQR.apellido || '',
            rh: datosQR.rh || '',
          }));
          setShowNewVisitorModal(true);
        } else if (!rolQR || !rolesValidos.includes(rolQR)) {
          // Sin rol o rol no reconocido - mostrar error de QR no válido
          toast.error(
            `❌ CÓDIGO QR NO RECONOCIDO\n\nEl código escaneado no contiene un rol válido.\n\nRoles válidos: Aprendiz, Instructor, Funcionario, Visitante`,
            { duration: 5000 }
          );
          setPersonaEncontrada(null);
        }
      }
    } catch (error: any) {
      console.error('Error al procesar QR:', error);
      toast.error(error.response?.data?.error || 'Error al procesar el código QR');
    } finally {
      isProcessingQR.current = false;
      // Permitir escanear el mismo QR después de 3 segundos
      setTimeout(() => {
        lastProcessedQR.current = null;
      }, 3000);
    }
  };

  // Iniciar escáner QR
  const startQRScanner = async () => {
    setIsScanning(true);
    setCameraError(null);
    isProcessingQR.current = false;
    lastProcessedQR.current = null; // Permitir escanear cualquier QR de nuevo

    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const element = document.getElementById('qr-reader');
      if (!element) {
        throw new Error('Contenedor QR no encontrado');
      }

      if (qrCodeRef.current && isScannerRunning) {
        try {
          await qrCodeRef.current.stop();
          qrCodeRef.current.clear();
        } catch (e: any) {
          if (!e.message?.includes('not running') && !e.message?.includes('not paused')) {
            console.warn('Advertencia al limpiar escáner previo:', e);
          }
        }
        qrCodeRef.current = null;
        setIsScannerRunning(false);
      }

      const html5QrCode = new Html5Qrcode('qr-reader');
      qrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 2, // Reducir FPS para menos detecciones duplicadas
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          // Verificar inmediatamente si ya se está procesando
          if (isProcessingQR.current) {
            return;
          }
          // Bloquear inmediatamente ANTES de cualquier cosa
          isProcessingQR.current = true;
          
          // Detener el escáner INMEDIATAMENTE
          try {
            await html5QrCode.stop();
            html5QrCode.clear();
            setIsScannerRunning(false);
            qrCodeRef.current = null;
            setIsScanning(false);
          } catch (stopErr) {
            // Ignorar errores al detener
          }
          
          // Ahora procesar el QR
          handleScanResult(decodedText);
        },
        () => {}
      );

      setIsScannerRunning(true);
    } catch (error: any) {
      console.error('Error al iniciar cámara:', error);
      
      let errorMessage = 'Error al acceder a la cámara.';
      
      if (error.name === 'NotAllowedError' || error.message?.includes('Permission dismissed')) {
        errorMessage = 'Permisos de cámara denegados.';
        setCameraError('PERMISSION_DENIED');
      } else if (error.name === 'NotFoundError' || error.message?.includes('no camera')) {
        errorMessage = 'No se encontró ninguna cámara.';
        setCameraError('NO_CAMERA');
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'La cámara está en uso por otra aplicación.';
        setCameraError('CAMERA_IN_USE');
      } else {
        errorMessage = `Error: ${error.message || 'Error desconocido'}`;
        setCameraError('UNKNOWN');
      }
      
      toast.error(errorMessage);
      setIsScanning(false);
      setIsScannerRunning(false);
      qrCodeRef.current = null;
    }
  };

  // Detener escáner QR
  const stopQRScanner = async () => {
    if (qrCodeRef.current && isScannerRunning) {
      try {
        await qrCodeRef.current.stop();
        qrCodeRef.current.clear();
        setIsScannerRunning(false);
      } catch (error: any) {
        if (!error.message?.includes('not running') && !error.message?.includes('not paused')) {
          console.error('Error al detener escáner:', error);
        }
        setIsScannerRunning(false);
      }
      qrCodeRef.current = null;
    }
    setIsScanning(false);
    setCameraError(null);
  };

  // Limpiar escáner al desmontar
  useEffect(() => {
    return () => {
      if (qrCodeRef.current && isScannerRunning) {
        qrCodeRef.current.stop().catch(() => {});
        qrCodeRef.current.clear();
      }
    };
  }, [isScannerRunning]);

  // Búsqueda manual por cédula
  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manualDocument.trim()) {
      toast.error('Por favor ingrese un número de documento');
      return;
    }

    setIsSearching(true);
    
    try {
      const persona = await buscarPersona(manualDocument.trim());
      
      if (persona) {
        // Persona encontrada - registrar automáticamente entrada/salida
        setShowManualEntry(false);
        setManualDocument('');
        await registrarAccesoAutomatico(manualDocument.trim());
      } else {
        // No encontrada, ofrecer registrar como visitante
        toast.info('Persona no encontrada. ¿Desea registrarla como visitante?');
        setNuevoVisitante(prev => ({ ...prev, numero_documento: manualDocument.trim() }));
        setShowManualEntry(false);
        setShowNewVisitorModal(true);
      }
    } catch (error: any) {
      console.error('Error al buscar persona:', error);
      toast.error(error.response?.data?.error || 'Error al buscar persona');
    } finally {
      setIsSearching(false);
    }
  };

  // Registrar entrada rápida (buscar + registrar entrada)
  const handleRegistrarEntrada = async () => {
    if (!personaEncontrada) return;
    await registrarEntrada(personaEncontrada.numero_documento);
  };

  // Registrar salida rápida
  const handleRegistrarSalida = async () => {
    if (!personaEncontrada) return;
    await registrarSalida(personaEncontrada.numero_documento);
  };

  // Guardar nuevo visitante
  const handleGuardarVisitante = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nuevoVisitante.nombres || !nuevoVisitante.apellidos || !nuevoVisitante.numero_documento) {
      toast.error('Complete los campos obligatorios: nombres, apellidos y documento');
      return;
    }

    setIsSavingVisitante(true);

    try {
      const response = await API.post('/guarda/registrar-visitante', {
        ...nuevoVisitante,
        registrar_entrada: true,
      });

      if (response.data?.success) {
        toast.success(`Visitante registrado: ${response.data.persona.nombre_completo}`);
        setPersonaEncontrada(response.data.persona);
        setShowNewVisitorModal(false);
        
        // Guardar datos para el QR y mostrar modal
        setVisitanteRegistrado({
          nombres: nuevoVisitante.nombres,
          apellidos: nuevoVisitante.apellidos,
          numero_documento: nuevoVisitante.numero_documento,
          tipo_documento: nuevoVisitante.tipo_documento,
        });
        setShowQRModal(true);
        
        setNuevoVisitante({
          tipo_documento: 'CC',
          numero_documento: '',
          nombres: '',
          apellidos: '',
          telefono: '',
          correo: '',
          rh: '',
        });
        cargarRegistrosHoy();
      }
    } catch (error: any) {
      console.error('Error registrando visitante:', error);
      
      if (error.response?.status === 409) {
        toast.error('Ya existe una persona con ese documento');
      } else {
        toast.error(error.response?.data?.error || 'Error al registrar visitante');
      }
    } finally {
      setIsSavingVisitante(false);
    }
  };

  // Generar contenido del QR para el visitante
  const generarContenidoQR = () => {
    if (!visitanteRegistrado) return '';
    return `${visitanteRegistrado.nombres.toUpperCase()} ${visitanteRegistrado.apellidos.toUpperCase()} ${visitanteRegistrado.numero_documento} VISITANTE`;
  };

  // Descargar QR como imagen PNG
  const descargarQR = () => {
    if (!qrRef.current || !visitanteRegistrado) return;

    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    // Crear un canvas para convertir SVG a PNG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const data = new XMLSerializer().serializeToString(svg);
    const DOMURL = window.URL || window.webkitURL || window;

    const img = new Image();
    const svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
    const url = DOMURL.createObjectURL(svgBlob);

    img.onload = () => {
      // Agregar padding y fondo blanco
      const padding = 40;
      canvas.width = img.width + padding * 2;
      canvas.height = img.height + padding * 2 + 80; // Espacio extra para el texto

      if (ctx) {
        // Fondo blanco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Dibujar QR
        ctx.drawImage(img, padding, padding);

        // Agregar texto con nombre del visitante
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${visitanteRegistrado.nombres} ${visitanteRegistrado.apellidos}`,
          canvas.width / 2,
          img.height + padding + 30
        );
        ctx.font = '14px Arial';
        ctx.fillStyle = '#666666';
        ctx.fillText(
          `Doc: ${visitanteRegistrado.numero_documento} | VISITANTE`,
          canvas.width / 2,
          img.height + padding + 55
        );

        // Descargar
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `QR_Visitante_${visitanteRegistrado.numero_documento}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
      
      DOMURL.revokeObjectURL(url);
    };

    img.src = url;
  };

  const limpiarPersona = () => {
    setPersonaEncontrada(null);
  };

  const getRolBadgeColor = (rol: string) => {
    const colors: Record<string, string> = {
      instructor: 'bg-blue-100 text-blue-800',
      funcionario: 'bg-purple-100 text-purple-800',
      visitante: 'bg-orange-100 text-orange-800',
      aprendiz: 'bg-emerald-100 text-emerald-800',
    };
    return colors[rol.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-4">
      {/* Header */}
      <div className="max-w-md mx-auto mb-6 pt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-2xl shadow-md">
            <SenaLogo size="md" />
            <div className="text-left">
              <h1 className="text-lg font-semibold text-[var(--sena-blue)]">CBI SENA Palmira</h1>
              <p className="text-sm text-gray-600">Control de Acceso</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowHistorial(true)}
              variant="outline"
              size="sm"
              className="text-[var(--sena-green)] border-2 border-[var(--sena-green)] hover:bg-emerald-50 rounded-xl"
            >
              <History className="w-4 h-4" />
            </Button>
            <Button 
              onClick={onLogout}
              variant="outline"
              size="sm"
              className="text-[var(--sena-blue)] border-2 border-[var(--sena-blue)] hover:bg-emerald-50 rounded-xl"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Salir
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto space-y-5">
        {/* Scanner Section */}
        <Card className="p-8 text-center shadow-xl rounded-2xl border-0 bg-white/80 backdrop-blur-sm">
          {!isScanning ? (
            <>
              <div className="mb-6">
                <div className="w-32 h-32 mx-auto rounded-3xl border-4 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                  <QrCode className="w-16 h-16 text-gray-400" />
                </div>
              </div>
              
              <Button 
                onClick={startQRScanner}
                className="w-full h-14 bg-gradient-to-r from-[var(--sena-blue)] to-[#0077A3] hover:from-[#0077A3] hover:to-[#005580] shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl mb-3"
              >
                <QrCode className="w-5 h-5 mr-2" />
                Escanear Código QR
              </Button>

              <Button 
                onClick={() => setShowManualEntry(true)}
                variant="outline"
                className="w-full h-12 border-2 border-[var(--sena-blue)] text-[var(--sena-blue)] hover:bg-[var(--sena-gray-light)] shadow-md transition-all duration-300 rounded-xl"
              >
                <KeyRound className="w-5 h-5 mr-2" />
                Ingreso por documento
              </Button>
            </>
          ) : (
            <div className="scanner-box">
              {cameraError ? (
                <div className="mb-4 p-6 bg-yellow-50 border-2 border-yellow-300 rounded-2xl">
                  <div className="text-center">
                    <AlertCircle className="w-10 h-10 mx-auto text-yellow-600 mb-2" />
                    <p className="text-yellow-800 font-semibold mb-2">Problema con la cámara</p>
                    <p className="text-sm text-yellow-700 mb-4">
                      {cameraError === 'PERMISSION_DENIED' && 'Permisos de cámara denegados.'}
                      {cameraError === 'NO_CAMERA' && 'No se encontró cámara disponible.'}
                      {cameraError === 'CAMERA_IN_USE' && 'La cámara está en uso.'}
                      {cameraError === 'UNKNOWN' && 'Error desconocido.'}
                    </p>
                    <Button
                      onClick={() => {
                        setCameraError(null);
                        setIsScanning(false);
                      }}
                      variant="outline"
                      className="border-yellow-500 text-yellow-700 hover:bg-yellow-100"
                    >
                      Cerrar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-lg border-4 border-[var(--sena-green)] bg-black">
                      <div id="qr-reader" className="w-full" style={{ minHeight: '280px' }} />
                    </div>
                  </div>
                  
                  <Button
                    onClick={stopQRScanner}
                    variant="outline"
                    className="w-full h-12 border-2 border-red-500 text-red-500 hover:bg-red-50 shadow-md transition-all duration-300 rounded-xl"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Cerrar cámara
                  </Button>
                </>
              )}
            </div>
          )}
        </Card>

        {/* Persona encontrada */}
        {personaEncontrada && (
          <Card className="p-6 border-2 border-[var(--sena-green)] shadow-xl rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 animate-in fade-in duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[var(--sena-green)] to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--sena-blue)] text-lg">{personaEncontrada.nombre_completo}</h3>
                  <p className="text-sm text-gray-600">
                    {personaEncontrada.tipo_documento}: {personaEncontrada.numero_documento}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={limpiarPersona}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <Badge className={`${getRolBadgeColor(personaEncontrada.rol)} rounded-lg px-3 py-1`}>
                {personaEncontrada.rol}
              </Badge>
              {personaEncontrada.estado && (
                <Badge className="bg-gray-100 text-gray-700 rounded-lg px-3 py-1">
                  {personaEncontrada.estado}
                </Badge>
              )}
            </div>

            {(personaEncontrada.telefono || personaEncontrada.correo) && (
              <div className="mb-4 p-3 bg-white/60 rounded-xl text-sm text-gray-600">
                {personaEncontrada.telefono && <p>📞 {personaEncontrada.telefono}</p>}
                {personaEncontrada.correo && <p>✉️ {personaEncontrada.correo}</p>}
              </div>
            )}

            {/* Mostrar el resultado del registro automático */}
            {(personaEncontrada as any).ultimoAcceso && (
              <div className={`p-4 rounded-xl text-center font-bold text-lg ${
                (personaEncontrada as any).ultimoAcceso === 'ENTRADA' 
                  ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                  : 'bg-orange-100 text-orange-700 border-2 border-orange-300'
              }`}>
                {(personaEncontrada as any).ultimoAcceso === 'ENTRADA' 
                  ? '✅ ENTRADA REGISTRADA' 
                  : '👋 SALIDA REGISTRADA'}
              </div>
            )}
          </Card>
        )}

        {/* Registrar Nueva Persona */}
        <Card className="p-4 shadow-lg rounded-2xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <Button 
            onClick={() => setShowNewVisitorModal(true)}
            variant="outline"
            className="w-full h-12 border-dashed border-2 border-gray-300 hover:border-[var(--sena-blue)] hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 transition-all duration-300 rounded-xl"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Registrar Nuevo Visitante
          </Button>
        </Card>

        {/* Últimos registros de hoy */}
        {registrosHoy.length > 0 && (
          <Card className="p-4 shadow-lg rounded-2xl border-0 bg-white/80 backdrop-blur-sm">
            <h3 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Últimos registros de hoy
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {registrosHoy.slice(0, 5).map((registro) => (
                <div key={registro.id_registro} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${registro.tipo_acceso === 'ENTRADA' ? 'bg-green-500' : 'bg-orange-500'}`} />
                    <span className="font-medium text-gray-800 truncate max-w-[150px]">
                      {registro.persona?.nombre_completo || 'Sin nombre'}
                    </span>
                  </div>
                  <span className="text-gray-500 text-xs">
                    {registro.hora_entrada || registro.hora_salida}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Modal: Ingreso Manual */}
      <Dialog open={showManualEntry} onOpenChange={setShowManualEntry}>
        <DialogContent className="max-w-md rounded-2xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-[var(--sena-blue)] flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              Buscar por Documento
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Ingrese el número de documento de la persona
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleManualSearch} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="document" className="text-gray-700">Número de Documento *</Label>
              <Input
                id="document"
                value={manualDocument}
                onChange={(e) => setManualDocument(e.target.value)}
                placeholder="Ej: 1234567890"
                className="h-12 rounded-xl border-gray-200 focus:border-[var(--sena-green)] focus:ring-[var(--sena-green)] text-lg"
                required
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11 rounded-xl border-2 hover:bg-gray-50"
                onClick={() => {
                  setShowManualEntry(false);
                  setManualDocument('');
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSearching}
                className="flex-1 h-11 bg-gradient-to-r from-[var(--sena-green)] to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg rounded-xl"
              >
                {isSearching ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Buscando...
                  </>
                ) : (
                  'Buscar'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Nuevo Visitante */}
      <Dialog open={showNewVisitorModal} onOpenChange={setShowNewVisitorModal}>
        <DialogContent className="max-w-lg rounded-2xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-[var(--sena-blue)] flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Registrar Nuevo Visitante
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Complete los datos del visitante. Se registrará automáticamente su entrada.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleGuardarVisitante} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-gray-700">Tipo de Documento *</Label>
                <Select
                  value={nuevoVisitante.tipo_documento}
                  onValueChange={(value) => setNuevoVisitante(prev => ({ ...prev, tipo_documento: value }))}
                >
                  <SelectTrigger className="h-11 rounded-xl border-gray-200">
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
                  value={nuevoVisitante.numero_documento}
                  onChange={(e) => setNuevoVisitante(prev => ({ ...prev, numero_documento: e.target.value }))}
                  placeholder="1234567890"
                  className="h-11 rounded-xl border-gray-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Nombres *</Label>
                <Input
                  value={nuevoVisitante.nombres}
                  onChange={(e) => setNuevoVisitante(prev => ({ ...prev, nombres: e.target.value }))}
                  placeholder="Juan Carlos"
                  className="h-11 rounded-xl border-gray-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Apellidos *</Label>
                <Input
                  value={nuevoVisitante.apellidos}
                  onChange={(e) => setNuevoVisitante(prev => ({ ...prev, apellidos: e.target.value }))}
                  placeholder="Pérez García"
                  className="h-11 rounded-xl border-gray-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Teléfono</Label>
                <Input
                  value={nuevoVisitante.telefono}
                  onChange={(e) => setNuevoVisitante(prev => ({ ...prev, telefono: e.target.value }))}
                  placeholder="3001234567"
                  className="h-11 rounded-xl border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Correo</Label>
                <Input
                  type="email"
                  value={nuevoVisitante.correo}
                  onChange={(e) => setNuevoVisitante(prev => ({ ...prev, correo: e.target.value }))}
                  placeholder="correo@ejemplo.com"
                  className="h-11 rounded-xl border-gray-200"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11 rounded-xl border-2 hover:bg-gray-50"
                onClick={() => {
                  setShowNewVisitorModal(false);
                  setNuevoVisitante({
                    tipo_documento: 'CC',
                    numero_documento: '',
                    nombres: '',
                    apellidos: '',
                    telefono: '',
                    correo: '',
                    rh: '',
                  });
                }}
                disabled={isSavingVisitante}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSavingVisitante}
                className="flex-1 h-11 bg-gradient-to-r from-[var(--sena-green)] to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg rounded-xl"
              >
                {isSavingVisitante ? 'Guardando...' : 'Registrar Entrada'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Historial del día */}
      <Dialog open={showHistorial} onOpenChange={setShowHistorial}>
        <DialogContent className="max-w-lg max-h-[80vh] rounded-2xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-[var(--sena-blue)] flex items-center gap-2">
              <History className="w-5 h-5" />
              Registros de Hoy
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Historial de entradas y salidas del día
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-2 max-h-[50vh] overflow-y-auto">
            {loadingRegistros ? (
              <div className="text-center py-8 text-gray-500">
                <div className="w-6 h-6 border-2 border-[var(--sena-green)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Cargando...
              </div>
            ) : registrosHoy.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay registros para hoy
              </div>
            ) : (
              registrosHoy.map((registro) => (
                <div key={registro.id_registro} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${registro.tipo_acceso === 'ENTRADA' ? 'bg-green-500' : 'bg-orange-500'}`} />
                    <div>
                      <p className="font-medium text-gray-800">
                        {registro.persona?.nombre_completo || 'Sin nombre'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {registro.persona?.numero_documento} • {registro.persona?.rol}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">
                      {registro.hora_entrada || registro.hora_salida}
                    </p>
                    <Badge className={`text-xs ${registro.tipo_acceso === 'ENTRADA' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {registro.tipo_acceso}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-4">
            <Button
              variant="outline"
              className="w-full h-10 rounded-xl"
              onClick={() => {
                cargarRegistrosHoy();
              }}
            >
              Actualizar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Código QR del Visitante Registrado */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="max-w-sm rounded-2xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-[var(--sena-blue)] flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Código QR del Visitante
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Descargue el código QR para el visitante registrado
            </DialogDescription>
          </DialogHeader>
          
          {visitanteRegistrado && (
            <div className="mt-4 flex flex-col items-center">
              {/* Información del visitante */}
              <div className="text-center mb-4">
                <p className="font-semibold text-lg text-gray-800">
                  {visitanteRegistrado.nombres} {visitanteRegistrado.apellidos}
                </p>
                <p className="text-sm text-gray-500">
                  {visitanteRegistrado.tipo_documento}: {visitanteRegistrado.numero_documento}
                </p>
                <Badge className="mt-2 bg-orange-100 text-orange-800">VISITANTE</Badge>
              </div>

              {/* Código QR */}
              <div 
                ref={qrRef}
                className="bg-white p-4 rounded-2xl shadow-lg border-2 border-gray-100"
              >
                <QRCodeSVG
                  value={generarContenidoQR()}
                  size={200}
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#1a1a1a"
                />
              </div>

              {/* Texto del contenido del QR */}
              <p className="mt-3 text-xs text-gray-400 text-center max-w-[200px] break-all">
                {generarContenidoQR()}
              </p>

              {/* Botones */}
              <div className="flex gap-3 mt-6 w-full">
                <Button
                  variant="outline"
                  className="flex-1 h-11 rounded-xl border-2 hover:bg-gray-50"
                  onClick={() => {
                    setShowQRModal(false);
                    setVisitanteRegistrado(null);
                  }}
                >
                  Cerrar
                </Button>
                <Button
                  onClick={descargarQR}
                  className="flex-1 h-11 bg-gradient-to-r from-[var(--sena-green)] to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg rounded-xl"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar QR
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
