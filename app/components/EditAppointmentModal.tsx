'use client';

import React, { useState, useEffect } from 'react';
import { Cita, Paciente, Tratamiento } from '../types';

interface CitaConRelaciones extends Cita {
  paciente?: Paciente;
  tratamiento?: Tratamiento;
}

interface EditAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cita: CitaConRelaciones | null;
  tratamientos: Tratamiento[];
  onAppointmentUpdated: () => void;
  onAppointmentDeleted: () => void;
}

export function EditAppointmentModal({
  isOpen,
  onClose,
  cita,
  tratamientos,
  onAppointmentUpdated,
  onAppointmentDeleted
}: EditAppointmentModalProps) {
  // Campos del formulario
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('10:00');
  const [duracionMinutos, setDuracionMinutos] = useState(45);
  const [estado, setEstado] = useState<'programada' | 'asistio' | 'cancelada' | 'reprogramada'>('programada');
  const [tratamientoId, setTratamientoId] = useState('');
  const [numeroSesion, setNumeroSesion] = useState<number | ''>(1);
  const [motivo, setMotivo] = useState('');

  // Modo nuevo tratamiento
  const [modoNuevoTratamiento, setModoNuevoTratamiento] = useState(false);
  const [nuevoTratamientoNombre, setNuevoTratamientoNombre] = useState('');
  const [totalSesionesEstimadas, setTotalSesionesEstimadas] = useState(4);

  // Estados de control
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Inicializar campos cuando se abre con una cita
  useEffect(() => {
    if (cita) {
      const fechaHora = new Date(cita.fechaHoraInicio);
      const yyyy = fechaHora.getFullYear();
      const mm = String(fechaHora.getMonth() + 1).padStart(2, '0');
      const dd = String(fechaHora.getDate()).padStart(2, '0');
      const hh = String(fechaHora.getHours()).padStart(2, '0');
      const min = String(fechaHora.getMinutes()).padStart(2, '0');

      setFecha(`${yyyy}-${mm}-${dd}`);
      setHora(`${hh}:${min}`);
      setDuracionMinutos(cita.duracionMinutos || 45);
      setEstado(cita.estado);
      setTratamientoId(cita.tratamientoId || '');
      setNumeroSesion(cita.numeroSesion !== undefined ? cita.numeroSesion : '');
      setMotivo(cita.motivo || '');
      setModoNuevoTratamiento(false);
      setNuevoTratamientoNombre('');
      setConfirmDelete(false);
      setErrorMsg('');
    }
  }, [cita]);

  if (!isOpen || !cita) return null;

  // Filtrar tratamientos pertenecientes al paciente de esta cita
  const tratamientosDelPaciente = tratamientos.filter(t => t.pacienteId === cita.pacienteId);

  // Comprobar si la fecha seleccionada es a futuro
  const fechaHoraSeleccionada = new Date(`${fecha}T${hora}:00`);
  const esFechaFutura = fechaHoraSeleccionada.getTime() > Date.now();
  const fechaModificada = `${fecha}T${hora}:00` !== cita.fechaHoraInicio.substring(0, 16);

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    if (!cita) return;

    setLoading(true);
    setErrorMsg('');

    try {
      if (!fecha || !hora) {
        throw new Error('La fecha y hora son obligatorias');
      }

      const isoFechaHora = new Date(`${fecha}T${hora}:00`).toISOString();

      const payload: Record<string, unknown> = {
        id: cita.id,
        fechaHoraInicio: isoFechaHora,
        duracionMinutos: Number(duracionMinutos),
        motivo,
        estado,
        numeroSesion: numeroSesion === '' ? undefined : Number(numeroSesion)
      };

      if (modoNuevoTratamiento && nuevoTratamientoNombre.trim()) {
        payload.nuevoTratamientoNombre = nuevoTratamientoNombre.trim();
        payload.totalSesionesEstimadas = totalSesionesEstimadas;
      } else {
        payload.tratamientoId = tratamientoId || undefined;
      }

      const res = await fetch('/api/citas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al actualizar la cita');
      }

      onAppointmentUpdated();
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al guardar los cambios');
    } finally {
      setLoading(false);
    }
  }

  async function handleEliminar() {
    if (!cita) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/citas?id=${cita.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al eliminar la cita');
      }

      onAppointmentDeleted();
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al eliminar la cita');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera del modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50 to-white">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
              Modificar cita
            </span>
            <h3 className="text-base font-bold text-slate-800">
              {cita.paciente?.nombreCompleto || 'Paciente'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleGuardar} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Información del paciente */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-slate-500">Paciente:</span>{' '}
              <strong className="text-slate-800">{cita.paciente?.nombreCompleto}</strong>
            </div>
            <div>
              <span className="text-slate-500">WhatsApp:</span>{' '}
              <span className="font-mono text-slate-700">{cita.paciente?.telefono}</span>
            </div>
          </div>

          {/* Estado de la cita */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Estado de la Cita
            </label>
            <select
              value={estado}
              onChange={e => setEstado(e.target.value as 'programada' | 'asistio' | 'cancelada' | 'reprogramada')}
              className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="programada">📅 Programada</option>
              <option value="asistio">✅ Asistió / Concluida</option>
              <option value="cancelada">❌ Cancelada</option>
              <option value="reprogramada">🔄 Reprogramada</option>
            </select>
          </div>

          {/* Fecha y Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Fecha
              </label>
              <input
                type="date"
                required
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hora de Inicio
              </label>
              <input
                type="time"
                required
                value={hora}
                onChange={e => setHora(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Duración */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Duración (minutos)
              </label>
              <select
                value={duracionMinutos}
                onChange={e => setDuracionMinutos(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos (estándar)</option>
                <option value={60}>60 minutos (1 hora)</option>
                <option value={90}>90 minutos (1.5 horas)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Número de Sesión
              </label>
              <input
                type="number"
                min="1"
                placeholder="Ej: 2"
                value={numeroSesion}
                onChange={e => setNumeroSesion(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Aviso inteligente de recordatorios WhatsApp */}
          {fechaModificada && esFechaFutura && (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-[11px] leading-relaxed flex items-start gap-2">
              <span className="text-base">💡</span>
              <span>
                <strong>Reactivación de recordatorios:</strong> Al reprogramar a una fecha futura, las notificaciones de WhatsApp (24h y 2h) se restablecerán a <em>pendiente</em> para emitir los nuevos avisos oportunamente.
              </span>
            </div>
          )}

          {/* Tratamiento asociado */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Tratamiento Odontológico
              </label>
              <button
                type="button"
                onClick={() => setModoNuevoTratamiento(!modoNuevoTratamiento)}
                className="text-[11px] text-teal-600 hover:text-teal-700 font-semibold cursor-pointer"
              >
                {modoNuevoTratamiento ? 'Seleccionar existente' : '+ Crear nuevo tratamiento'}
              </button>
            </div>

            {modoNuevoTratamiento ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <input
                  type="text"
                  placeholder="Nombre del tratamiento (ej: Ortodoncia correctiva)"
                  value={nuevoTratamientoNombre}
                  onChange={e => setNuevoTratamientoNombre(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">Sesiones estimadas:</span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={totalSesionesEstimadas}
                    onChange={e => setTotalSesionesEstimadas(Number(e.target.value))}
                    className="w-20 text-xs px-2 py-1 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            ) : (
              <select
                value={tratamientoId}
                onChange={e => setTratamientoId(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="">Sin tratamiento específico / Consulta general</option>
                {tratamientosDelPaciente.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nombre} ({t.totalSesionesEstimadas} sesiones estimadas) — {t.estado}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Motivo / Notas */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Motivo o Procedimiento a Realizar
            </label>
            <textarea
              rows={2}
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Notas clínicas de la cita..."
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none resize-none"
            />
          </div>

          {/* Sección de eliminación */}
          <div className="pt-3 border-t border-slate-100">
            {confirmDelete ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <p className="text-xs font-semibold text-rose-800">
                  ¿Estás seguro de que deseas eliminar esta cita permanentemente?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleEliminar}
                    className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs cursor-pointer"
                  >
                    Sí, eliminar cita
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Eliminar esta cita
              </button>
            )}
          </div>

          {/* Botones de acción principales */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
