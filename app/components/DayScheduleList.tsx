'use client';

import React from 'react';
import { Cita, Paciente, Tratamiento } from '../types';

interface CitaConRelaciones extends Cita {
  paciente?: Paciente;
  tratamiento?: Tratamiento;
}

interface DayScheduleListProps {
  selectedDate: string; // "YYYY-MM-DD"
  citas: CitaConRelaciones[];
  onOpenAgendarModal: () => void;
  onEditCita: (cita: CitaConRelaciones) => void;
  onOpenPacienteSummary: (paciente: Paciente) => void;
}

export function DayScheduleList({
  selectedDate,
  citas,
  onOpenAgendarModal,
  onEditCita,
  onOpenPacienteSummary
}: DayScheduleListProps) {
  // Formatear la fecha seleccionada
  const fechaObjeto = new Date(`${selectedDate}T12:00:00`);
  const fechaLegible = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(fechaObjeto);

  // Filtrar citas del día
  const citasDelDia = citas
    .filter(c => c.fechaHoraInicio.startsWith(selectedDate))
    .sort((a, b) => new Date(a.fechaHoraInicio).getTime() - new Date(b.fechaHoraInicio).getTime());

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-teal-600">
            Agenda del día
          </span>
          <h3 className="text-lg font-bold text-slate-800 capitalize">
            {fechaLegible}
          </h3>
        </div>
        <button
          onClick={onOpenAgendarModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Nueva Cita
        </button>
      </div>

      <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
        {citasDelDia.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl">
            <div className="w-12 h-12 mx-auto bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-700">No hay citas programadas para este día</p>
            <p className="text-xs text-slate-400 mt-1">Aprovecha para agendar una nueva sesión para un paciente.</p>
            <button
              onClick={onOpenAgendarModal}
              className="mt-4 inline-flex items-center text-xs font-semibold text-teal-600 hover:text-teal-700 cursor-pointer"
            >
              + Agendar cita ahora
            </button>
          </div>
        ) : (
          citasDelDia.map(cita => {
            const fechaHora = new Date(cita.fechaHoraInicio);
            const horaInicioStr = fechaHora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            const fechaHoraFin = new Date(fechaHora.getTime() + (cita.duracionMinutos || 45) * 60000);
            const horaFinStr = fechaHoraFin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

            const paciente = cita.paciente;
            const tratamiento = cita.tratamiento;

            return (
              <div
                key={cita.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-300 hover:shadow-xs transition-all space-y-2.5 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-teal-50 text-teal-700 border border-teal-100">
                      {horaInicioStr} - {horaFinStr}
                    </span>
                    {cita.numeroSesion && (
                      <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Sesión {cita.numeroSesion}
                        {tratamiento?.totalSesionesEstimadas ? ` de ${tratamiento.totalSesionesEstimadas}` : ''}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-md ${
                        cita.estado === 'asistio'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : cita.estado === 'cancelada'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : cita.estado === 'reprogramada'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {cita.estado}
                    </span>

                    {/* Botón de Modificación de Cita */}
                    <button
                      onClick={() => onEditCita(cita)}
                      title="Modificar cita"
                      className="p-1 rounded-md text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    {paciente ? (
                      <button
                        type="button"
                        onClick={() => onOpenPacienteSummary(paciente)}
                        className="text-sm font-bold text-slate-800 hover:text-teal-700 hover:underline flex items-center gap-1.5 cursor-pointer text-left"
                        title="Ver resumen e historial completo del paciente"
                      >
                        <span>{paciente.nombreCompleto}</span>
                        <span className="text-[10px] font-normal text-teal-600 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-100">
                          Ficha ↗
                        </span>
                      </button>
                    ) : (
                      <h4 className="text-sm font-bold text-slate-800">
                        Paciente no registrado
                      </h4>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-mono text-slate-600">
                      📱 {paciente?.telefono || 'Sin teléfono'}
                    </span>
                    {tratamiento && (
                      <span className="text-slate-600 font-medium">
                        🦷 {tratamiento.nombre}
                      </span>
                    )}
                  </div>
                  {cita.motivo && (
                    <p className="text-xs text-slate-500 mt-1 italic">
                      &quot;{cita.motivo}&quot;
                    </p>
                  )}
                </div>

                {/* Banderas de estado de notificación de WhatsApp */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-medium">WhatsApp:</span>
                    
                    {/* Flag 24h */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        cita.notificado24h
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${cita.notificado24h ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      24h: {cita.notificado24h ? 'Enviado' : 'Pendiente'}
                    </span>

                    {/* Flag 2h */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        cita.notificado2h
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${cita.notificado2h ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      2h: {cita.notificado2h ? 'Enviado' : 'Pendiente'}
                    </span>
                  </div>

                  <button
                    onClick={() => onEditCita(cita)}
                    className="text-[11px] font-semibold text-teal-600 hover:text-teal-800 cursor-pointer"
                  >
                    Editar turno →
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
