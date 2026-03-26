import React from 'react';
import logoSena from 'figma:asset/9a182b417e937bc30ea5a4eac71ade0b3a5e6697.png';

interface SenaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  opacity?: number;
  variant?: 'default' | 'black' | 'white';
}

export function SenaLogo({ size = 'md', className = '', opacity = 1, variant = 'default' }: SenaLogoProps) {
  const sizeMap = {
    'sm': 'w-8 h-8',
    'md': 'w-12 h-12',
    'lg': 'w-16 h-16',
    'xl': 'w-24 h-24',
    '2xl': 'w-32 h-32'
  };

  // Aplicar fondo blanco para variante white
  const bgClass = variant === 'white' ? 'bg-white rounded-lg p-1.5' : '';

  return (
    <div className={`${sizeMap[size]} ${bgClass} ${className} flex items-center justify-center`} style={{ opacity }}>
      <img
        src={logoSena}
        alt="Logo SENA"
        className="w-full h-full object-contain"
      />
    </div>
  );
}