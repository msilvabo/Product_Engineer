'use client';

import React, { useState } from 'react';
import { Cita, Paciente, Tratamiento } from '../types';

interface CitaConRelaciones extends Cita {
  paciente?: Paciente;
  tratamiento?: Tratamiento;
}

interface PatientSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  paciente: Paciente | null;
  todosPacientes: Paciente[];
  onSelectPaciente: (paciente: Paciente) => void;
  citas: CitaConRelaciones[];
  tratamientos: Tratamiento[];
  onEditCita: (cita: CitaConRelaciones) => void;
  onAgendarCitaParaPaciente: (paciente: Paciente) => void;
}

export function PatientSummaryModal({
  isOpen,
  onClose,
  paciente,
  todosPacientes,
  onSelectPaciente,
  citas,
  tratamientos,
  onEditCita,
  onAgendarCitaParaPaciente
}: PatientSummaryModalProps) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todas');

  if (!isOpen) return null;

  // Filtrar lista de pacientes en caso de búsqueda
  const pacientesFiltrados = todosPacientes.filter(p =>
    p.nombreCompleto.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.telefono.includes(busqueda) ||
    (p.documento && p.documento.toLowerCase().includes(busqueda.toLowerCase()))
  );

  // Si no hay paciente seleccionado, tomar el primero de la lista
  const pacienteActivo = paciente || (todosPacientes.length > 0 ? todosPacientes[0] : null);

  // Citas y tratamientos del paciente activo
  const tratamientosDelPaciente = pacienteActivo
    ? tratamientos.filter(t => t.pacienteId === pacienteActivo.id)
    : [];

  const citasDelPaciente = pacienteActivo
    ? citas
        .filter(c => c.pacienteId === pacienteActivo.id)
        .filter(c => {
          if (filtroEstado === 'todas') return true;
          return c.estado === filtroEstado;
        })
        .sort((a, b) => new Date(b.fechaHoraInicio).getTime() - new Date(a.fechaHoraInicio).getTime())
    : [];

  const ahora = new Date().getTime();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* Cabecera principal */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-700 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/30 border border-teal-300/30 flex items-center justify-center text-xl font-bold">
              👤
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-200">
                Directorio y Resumen Clínico
              </span>
              <h2 className="text-lg font-bold">Ficha Histórica del Paciente</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pacienteActivo && (
              <button
                onClick={() => {
                  onAgendarCitaParaPaciente(pacienteActivo);
                  onClose();
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-teal-900 bg-teal-100 hover:bg-white rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>+ Agendar Cita</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Barra superior de selección rápida de paciente */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            <input
              type="text"
              placeholder="🔍 Buscar paciente..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none w-36 sm:w-44"
            />
            <select
              value={pacienteActivo?.id || ''}
              onChange={e => {
                const target = todosPacientes.find(p => p.id === e.target.value);
                if (target) onSelectPaciente(target);
              }}
              className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none flex-1 max-w-sm"
            >
              {pacientesFiltrados.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombreCompleto} ({p.telefono})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Filtrar citas:</span>
            <select
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium"
            >
              <option value="todas">Todas las citas ({citasDelPaciente.length})</option>
              <option value="programada">Programadas</option>
              <option value="asistio">Asistió</option>
              <option value="reprogramada">Reprogramadas</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>
        </div>

        {/* Cuerpo del modal con scroll */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {!pacienteActivo ? (
            <div className="text-center py-12 text-slate-500">
              No se han encontrado pacientes registrados en el sistema.
            </div>
          ) : (
            <>
              {/* Tarjeta de Datos del Paciente */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      {pacienteActivo.nombreCompleto}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-mono bg-white px-2.5 py-1 rounded-md border border-slate-200">
                        📱 WhatsApp: <strong>{pacienteActivo.telefono}</strong>
                      </span>
                      {pacienteActivo.documento && (
                        <span className="bg-white px-2.5 py-1 rounded-md border border-slate-200">
                          🪪 DNI/Cédula: <strong>{pacienteActivo.documento}</strong>
                        </span>
                      )}
                      {pacienteActivo.email && (
                        <span className="bg-white px-2.5 py-1 rounded-md border border-slate-200">
                          ✉️ {pacienteActivo.email}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right sm:border-l sm:border-slate-200 sm:pl-5 shrink-0">
                    <span className="text-[11px] text-slate-400 font-medium block">
                      Registrado en el consultorio
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {new Date(pacienteActivo.creadoEn).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tratamientos Asociados */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-800 mb-3 flex items-center gap-1.5">
                  <span>🦷 Tratamientos Odontológicos</span>
                  <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px]">
                    {tratamientosDelPaciente.length}
                  </span>
                </h4>

                {tratamientosDelPaciente.length === 0 ? (
                  <div className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Este paciente aún no tiene tratamientos registrados asociados.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tratamientosDelPaciente.map(trat => {
                      const citasDeEsteTratamiento = citas.filter(c => c.tratamientoId === trat.id);
                      const sesionesCompletadas = citasDeEsteTratamiento.filter(c => c.estado === 'asistio').length;

                      return (
                        <div
                          key={trat.id}
                          className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-bold text-slate-800">
                              {trat.nombre}
                            </span>
                            <span
                              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                                trat.estado === 'en_progreso'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : trat.estado === 'finalizado'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {trat.estado}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>
                              Progreso: <strong>{sesionesCompletadas}</strong> de <strong>{trat.totalSesionesEstimadas}</strong> sesiones
                            </span>
                            <span className="text-[11px] text-teal-600 font-semibold">
                              {citasDeEsteTratamiento.length} citas vinculadas
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Historial Cronológico de Citas */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                    <span>📅 Historial de Citas del Paciente</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px]">
                      {citasDelPaciente.length}
                    </span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Ordenado cronológicamente (más recientes primero)
                  </span>
                </div>

                {citasDelPaciente.length === 0 ? (
                  <div className="text-center py-10 px-4 border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-sm font-semibold text-slate-700">No hay citas registradas para este paciente</p>
                    <button
                      onClick={() => {
                        onAgendarCitaParaPaciente(pacienteActivo);
                        onClose();
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-700 cursor-pointer"
                    >
                      + Agendar la primera cita para {pacienteActivo.nombreCompleto}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {citasDelPaciente.map(cita => {
                      const fechaHora = new Date(cita.fechaHoraInicio);
                      const fechaLegible = fechaHora.toLocaleDateString('es-ES', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      });
                      const horaInicioStr = fechaHora.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      const fechaHoraFin = new Date(fechaHora.getTime() + (cita.duracionMinutos || 45) * 60000);
                      const horaFinStr = fechaHoraFin.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      const esFutura = fechaHora.getTime() > ahora;

                      return (
                        <div
                          key={cita.id}
                          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-teal-50 text-teal-800 border border-teal-100">
                                🗓️ {fechaLegible} — {horaInicioStr} a {horaFinStr}
                              </span>

                              {esFutura ? (
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                                  Próxima
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-600">
                                  Pasada
                                </span>
                              )}

                              <span
                                className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-md ${
                                  cita.estado === 'asistio'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : cita.estado === 'cancelada'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : cita.estado === 'reprogramada'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : 'bg-teal-50 text-teal-700 border border-teal-200'
                                }`}
                              >
                                {cita.estado}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                              {cita.tratamiento && (
                                <span className="font-semibold text-slate-800 flex items-center gap-1">
                                  🦷 {cita.tratamiento.nombre}
                                  {cita.numeroSesion && (
                                    <span className="font-normal text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100 text-[11px]">
                                      Sesión {cita.numeroSesion}
                                      {cita.tratamiento.totalSesionesEstimadas ? ` de ${cita.tratamiento.totalSesionesEstimadas}` : ''}
                                    </span>
                                  )}
                                </span>
                              )}
                              {!cita.tratamiento && (
                                <span className="text-slate-500 italic">Consulta general</span>
                              )}
                            </div>

                            {cita.motivo && (
                              <p className="text-xs text-slate-600 italic">
                                &quot;{cita.motivo}&quot;
                              </p>
                            )}

                            {/* Estado de recordatorios WhatsApp */}
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1">
                              <span>WhatsApp:</span>
                              <span className={cita.notificado24h ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                                24h: {cita.notificado24h ? '✓ Enviado' : 'Pendiente'}
                              </span>
                              <span>•</span>
                              <span className={cita.notificado2h ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                                2h: {cita.notificado2h ? '✓ Enviado' : 'Pendiente'}
                              </span>
                            </div>
                          </div>

                          {/* Botón de acción: Modificar cita */}
                          <div className="sm:pl-3 sm:border-l sm:border-slate-100 flex items-center">
                            <button
                              onClick={() => {
                                onEditCita(cita);
                              }}
                              className="w-full sm:w-auto px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-teal-600 hover:text-white rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span>Modificar</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>DentalCare Studio — Resumen por paciente</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
}
