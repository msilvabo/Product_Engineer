'use client';

import React from 'react';
import { Cita, Paciente } from '../types';

interface CitaConRelaciones extends Cita {
  paciente?: Paciente;
}

interface CalendarGridProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  selectedDate: string; // "YYYY-MM-DD"
  onSelectDate: (dateStr: string) => void;
  citas: CitaConRelaciones[];
  todayStr: string;
}

export function CalendarGrid({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  selectedDate,
  onSelectDate,
  citas,
  todayStr
}: CalendarGridProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Nombre del mes en español
  const nombreMes = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(currentDate);

  // Primer día del mes y total de días
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDays = lastDayOfMonth.getDate();

  // Día de la semana en que comienza el mes (0: Domingo, 1: Lunes, ..., 6: Sábado)
  // Ajustamos para que Lunes sea 0 y Domingo sea 6
  let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startingDayOfWeek === -1) startingDayOfWeek = 6;

  // Mapa de citas por fecha "YYYY-MM-DD"
  const citasPorFecha = React.useMemo(() => {
    const mapa = new Map<string, number>();
    for (const c of citas) {
      if (c.estado === 'cancelada') continue;
      const fechaClave = c.fechaHoraInicio.substring(0, 10);
      mapa.set(fechaClave, (mapa.get(fechaClave) || 0) + 1);
    }
    return mapa;
  }, [citas]);

  const hoyStr = todayStr;

  // Días previos de relleno
  const paddingCells = Array.from({ length: startingDayOfWeek });
  // Días del mes actual
  const daysInMonth = Array.from({ length: totalDays }, (_, i) => i + 1);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Cabecera del calendario */}
      <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50">
        <div>
          <h2 className="text-xl font-bold text-slate-800 capitalize tracking-tight">
            {nombreMes}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Selecciona un día para gestionar citas y recordatorios
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToday}
            className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer"
          >
            Hoy
          </button>
          <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-2xs">
            <button
              onClick={onPrevMonth}
              aria-label="Mes anterior"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-l-lg transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-px h-4 bg-slate-200" />
            <button
              onClick={onNextMonth}
              aria-label="Mes siguiente"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-r-lg transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 border-b border-slate-100 text-center text-xs font-semibold text-slate-400 py-2.5 bg-slate-50/30">
        <div>Lun</div>
        <div>Mar</div>
        <div>Mié</div>
        <div>Jue</div>
        <div>Vie</div>
        <div className="text-rose-500">Sáb</div>
        <div className="text-rose-500">Dom</div>
      </div>

      {/* Cuadrícula de días */}
      <div className="grid grid-cols-7 gap-px bg-slate-100">
        {paddingCells.map((_, index) => (
          <div key={`pad-${index}`} className="bg-slate-50/60 min-h-[70px] sm:min-h-[85px] p-2" />
        ))}

        {daysInMonth.map((day) => {
          const formattedDay = String(day).padStart(2, '0');
          const formattedMonth = String(month + 1).padStart(2, '0');
          const dateString = `${year}-${formattedMonth}-${formattedDay}`;

          const isSelected = selectedDate === dateString;
          const isToday = hoyStr === dateString;
          const cantCitas = citasPorFecha.get(dateString) || 0;

          return (
            <button
              key={dateString}
              onClick={() => onSelectDate(dateString)}
              className={`min-h-[70px] sm:min-h-[85px] p-2 text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'bg-teal-50/90 ring-2 ring-teal-500 ring-inset z-10'
                  : 'bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs sm:text-sm font-semibold rounded-full w-6 h-6 flex items-center justify-center transition-colors ${
                    isToday
                      ? 'bg-teal-600 text-white font-bold shadow-xs'
                      : isSelected
                      ? 'text-teal-900 font-bold'
                      : 'text-slate-700'
                  }`}
                >
                  {day}
                </span>

                {cantCitas > 0 && (
                  <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    {cantCitas} {cantCitas === 1 ? 'cita' : 'citas'}
                  </span>
                )}
              </div>

              {/* Indicador de citas para móvil y badges */}
              <div className="mt-1">
                {cantCitas > 0 && (
                  <div className="sm:hidden flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                    <span className="text-[10px] text-teal-800 font-bold">{cantCitas}</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
