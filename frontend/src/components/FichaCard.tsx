import React from 'react';
import { BookOpen, Users, Edit, Trash2 } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface FichaCardProps extends React.HTMLAttributes<HTMLDivElement> {
  ficha: any;
  onEdit: (ficha: any) => void;
  onDelete: (ficha: any) => void;
}

const getJornadaColor = (jornada: string) => {
  const colors: Record<string, string> = {
    DIURNA: 'bg-blue-100 text-blue-800',
    NOCTURNA: 'bg-purple-100 text-purple-800',
    MIXTA: 'bg-emerald-100 text-emerald-800',
  };
  return colors[jornada] || 'bg-gray-100 text-gray-800';
};

export function FichaCard({ ficha, onEdit, onDelete }: FichaCardProps) {
  const instructorNombre = ficha.instructor
    ? `${ficha.instructor.nombres || ''} ${ficha.instructor.apellidos || ''}`.trim()
    : 'Sin asignar';

  return (
    <Card className="w-56 h-96 rounded-2xl shadow-md p-4 flex flex-col justify-between bg-white border border-gray-200 hover:shadow-lg transition-all duration-300">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--sena-blue)] to-emerald-500 flex items-center justify-center text-white">
            <BookOpen className="w-5 h-5" />
          </div>
          <Badge className={`${getJornadaColor(ficha.jornada)} rounded-full px-2 py-0.5 text-[10px]`}>
            {ficha.jornada || 'N/D'}
          </Badge>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Ficha</p>
          <p className="text-2xl font-bold text-[var(--sena-blue)] leading-tight">
            {ficha.numero_ficha}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 space-y-2 py-2 overflow-hidden">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Programa</p>
          <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
            {ficha.programa_formacion || 'Sin programa'}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Ambiente</p>
          <p className="text-sm font-medium text-gray-800 truncate">
            {ficha.ambiente || 'Sin asignar'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-500 font-medium">Inicio</p>
            <p className="text-xs font-semibold text-gray-900">{ficha.fecha_inicio || '—'}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wide text-gray-500 font-medium">Fin</p>
            <p className="text-xs font-semibold text-gray-900">{ficha.fecha_fin || '—'}</p>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Instructor</p>
          <p className="text-sm font-medium text-gray-800 truncate">{instructorNombre}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="space-y-2 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          <Users className="w-3.5 h-3.5" />
          {ficha.estudiantes?.length ?? 0} estudiantes
        </div>

        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 rounded-lg text-xs hover:bg-emerald-50 transition-all"
            onClick={() => onEdit(ficha)}
          >
            <Edit className="w-3 h-3 mr-1" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-8 h-8 p-0 rounded-lg text-red-500 hover:bg-red-50 transition-all"
            onClick={() => onDelete(ficha)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

