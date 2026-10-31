'use client';

import React, { useState, useEffect } from 'react';
import { Paciente, Tratamiento } from '../types';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate: string; // "YYYY-MM-DD"
  pacientes: Paciente[];
  tratamientos: Tratamiento[];
  preselectedPacienteId?: string;
  onAppointmentCreated: () => void;
}

export function AppointmentModal({
  isOpen,
  onClose,
  defaultDate,
  pacientes,
  tratamientos,
  preselectedPacienteId,
  onAppointmentCreated
}: AppointmentModalProps) {
  const [modoNuevoPaciente, setModoNuevoPaciente] = useState(false);

  // Campos para paciente existente
  const [pacienteId, setPacienteId] = useState('');
  const [tratamientoId, setTratamientoId] = useState('');

  // Campos para nuevo paciente
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [documento, setDocumento] = useState('');
  const [email, setEmail] = useState('');

  // Tratamiento nuevo / personalizado
  const [modoNuevoTratamiento, setModoNuevoTratamiento] = useState(false);
  const [nuevoTratamientoNombre, setNuevoTratamientoNombre] = useState('');
  const [totalSesionesEstimadas, setTotalSesionesEstimadas] = useState(4);

  // Campos de la cita
  const [fecha, setFecha] = useState(defaultDate);
  const [hora, setHora] = useState('10:00');
  const [duracionMinutos, setDuracionMinutos] = useState(45);
  const [numeroSesion, setNumeroSesion] = useState(1);
  const [motivo, setMotivo] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (defaultDate) {
      setFecha(defaultDate);
    }
  }, [defaultDate]);

  useEffect(() => {
    if (preselectedPacienteId) {
      setPacienteId(preselectedPacienteId);
      setModoNuevoPaciente(false);
    } else if (pacientes.length > 0 && !pacienteId) {
      setPacienteId(pacientes[0].id);
    }
  }, [pacientes, pacienteId, preselectedPacienteId, isOpen]);

  // Tratamientos disponibles para el paciente seleccionado
  const tratamientosDelPaciente = tratamientos.filter(t => t.pacienteId === pacienteId);

  useEffect(() => {
    const trats = tratamientos.filter(t => t.pacienteId === pacienteId);
    if (trats.length > 0) {
      setTratamientoId(trats[0].id);
      setModoNuevoTratamiento(false);
    } else {
      setTratamientoId('');
      setModoNuevoTratamiento(true);
    }
  }, [pacienteId, tratamientos]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      let finalPacienteId = pacienteId;

      // 1. Si es nuevo paciente, crearlo primero
      if (modoNuevoPaciente) {
        if (!nombreCompleto.trim() || !telefono.trim()) {
          throw new Error('El nombre completo y el teléfono del paciente son obligatorios');
        }

        const resPac = await fetch('/api/pacientes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombreCompleto,
            telefono,
            documento,
            email,
            tratamientoNombre: nuevoTratamientoNombre.trim() || undefined,
            totalSesionesEstimadas
          })
        });

        if (!resPac.ok) {
          const errData = await resPac.json();
          throw new Error(errData.error || 'Error al crear paciente');
        }

        const pacData = await resPac.json();
        finalPacienteId = pacData.paciente.id;
      }

      // 2. Registrar la cita
      const isoFechaHora = new Date(`${fecha}T${hora}:00`).toISOString();

      const citaPayload = {
        pacienteId: finalPacienteId,
        tratamientoId: modoNuevoTratamiento ? undefined : (tratamientoId || undefined),
        nuevoTratamientoNombre: modoNuevoTratamiento ? nuevoTratamientoNombre : undefined,
        totalSesionesEstimadas: modoNuevoTratamiento ? totalSesionesEstimadas : undefined,
        numeroSesion,
        fechaHoraInicio: isoFechaHora,
        duracionMinutos,
        motivo
      };

      const resCita = await fetch('/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(citaPayload)
      });

      if (!resCita.ok) {
        const errData = await resCita.json();
        throw new Error(errData.error || 'Error al agendar cita');
      }

      // Éxito: refrescar citas y cerrar modal
      onAppointmentCreated();
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido al registrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Agendar Cita Odontológica</h3>
            <p className="text-xs text-slate-400">Fecha seleccionada: {fecha}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Selector / Alternador de Paciente */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Paciente</label>
              <button
                type="button"
                onClick={() => setModoNuevoPaciente(!modoNuevoPaciente)}
                className="text-xs text-teal-600 hover:text-teal-700 font-semibold cursor-pointer"
              >
                {modoNuevoPaciente ? '← Elegir paciente existente' : '+ Registrar nuevo paciente'}
              </button>
            </div>

            {modoNuevoPaciente ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Nombre completo del paciente *"
                  value={nombreCompleto}
                  onChange={e => setNombreCompleto(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                <input
                  type="tel"
                  required
                  placeholder="Teléfono móvil con código (+549... o 11...) *"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="DNI / Documento (opcional)"
                    value={documento}
                    onChange={e => setDocumento(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <input
                    type="email"
                    placeholder="Email (opcional)"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <select
                value={pacienteId}
                onChange={e => setPacienteId(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                {pacientes.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombreCompleto} ({p.telefono})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Tratamiento */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Tratamiento Odontológico</label>
              {!modoNuevoPaciente && (
                <button
                  type="button"
                  onClick={() => setModoNuevoTratamiento(!modoNuevoTratamiento)}
                  className="text-[11px] text-teal-600 hover:text-teal-700 font-semibold cursor-pointer"
                >
                  {modoNuevoTratamiento ? 'Seleccionar existente' : '+ Nuevo tratamiento'}
                </button>
              )}
            </div>

            {modoNuevoTratamiento || modoNuevoPaciente ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <input
                  type="text"
                  placeholder="Nombre del tratamiento (ej: Ortodoncia correctiva, Limpieza)"
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
                <option value="">Sin tratamiento específico / Consulta aislada</option>
                {tratamientosDelPaciente.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nombre} ({t.totalSesionesEstimadas} sesiones estimadas)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Fecha y Hora */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Fecha</label>
              <input
                type="date"
                required
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hora de Inicio</label>
              <input
                type="time"
                required
                value={hora}
                onChange={e => setHora(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Duración y Sesión */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Duración (minutos)</label>
              <select
                value={duracionMinutos}
                onChange={e => setDuracionMinutos(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos (1 hora)</option>
                <option value={90}>90 minutos</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Número de Sesión</label>
              <input
                type="number"
                min="1"
                placeholder="Ej: 1"
                value={numeroSesion}
                onChange={e => setNumeroSesion(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Motivo / Detalle del turno</label>
            <input
              type="text"
              placeholder="Ej: Control mensual de brackets, Colocación de perno"
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* Botones de acción */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Guardando...' : 'Confirmar Cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
