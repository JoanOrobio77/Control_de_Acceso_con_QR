import { useEffect } from 'react';
import { SenaLogo } from './SenaLogo';

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="animate-pulse">
        <SenaLogo size="2xl" />
      </div>
      
      <div className="mt-8 text-center space-y-2">
        <h1 className="text-2xl text-[var(--sena-blue)]">
          Control de Acceso
        </h1>
        <p className="text-lg text-gray-600">
          CBI SENA Palmira
        </p>
      </div>

      {/* Indicador de carga */}
      <div className="mt-8">
        <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-[var(--sena-green)] rounded-full animate-[loading_2s_ease-in-out_infinite]" />
        </div>
      </div>

      <style>{`
        @keyframes loading {
          0%, 100% { width: 0%; margin-left: 0%; }
          50% { width: 100%; margin-left: 0%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}
