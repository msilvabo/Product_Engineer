'use client';

import React, { useState, useEffect } from 'react';
import { Paciente, Tratamiento } from '../types';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate: string; // "YYYY-MM-DD"
  pacientes: Paciente[];
  tratamientos: Tratamiento[];
  onAppointmentCreated: () => void;
}

export function AppointmentModal({
  isOpen,
  onClose,
  defaultDate,
  pacientes,
  tratamientos,
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
    if (pacientes.length > 0 && !pacienteId) {
      setPacienteId(pacientes[0].id);
    }
  }, [pacientes, pacienteId]);

  // Tratamientos disponibles para el paciente seleccionado
  const tratamientosDelPaciente = tratamientos.filter(t => t.pacienteId === pacienteId);

  useEffect(() => {
    if (tratamientosDelPaciente.length > 0) {
      setTratamientoId(tratamientosDelPaciente[0].id);
      setModoNuevoTratamiento(false);
    } else {
      setTratamientoId('');
      setModoNuevoTratamiento(true);
    }
  }, [pacienteId]);

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
          throw new Error(errData.error || 'Error al registrar el paciente');
        }

        const dataPac = await resPac.json();
        finalPacienteId = dataPac.paciente.id;
      }

      // 2. Construir la fecha ISO
      const fechaHoraInicioIso = new Date(`${fecha}T${hora}:00`).toISOString();

      // 3. Crear la cita
      const resCita = await fetch('/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pacienteId: finalPacienteId,
          tratamientoId: modoNuevoTratamiento ? undefined : tratamientoId || undefined,
          nuevoTratamientoNombre: modoNuevoTratamiento ? nuevoTratamientoNombre : undefined,
          totalSesionesEstimadas: modoNuevoTratamiento ? totalSesionesEstimadas : undefined,
          numeroSesion,
          fechaHoraInicio: fechaHoraInicioIso,
          duracionMinutos,
          motivo
        })
      });

      if (!resCita.ok) {
        const errData = await resCita.json();
        throw new Error(errData.error || 'Error al agendar la cita');
      }

      // Éxito
      onAppointmentCreated();
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera del modal */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Agendar Cita Odontológica</h3>
            <p className="text-xs text-slate-500">Programa la sesión y asegura el seguimiento con recordatorios de WhatsApp</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-sm">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Toggle Modo Paciente */}
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setModoNuevoPaciente(false)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                !modoNuevoPaciente ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paciente Existente
            </button>
            <button
              type="button"
              onClick={() => setModoNuevoPaciente(true)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                modoNuevoPaciente ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              + Nuevo Paciente
            </button>
          </div>

          {!modoNuevoPaciente ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Seleccionar Paciente *</label>
              <select
                value={pacienteId}
                onChange={e => setPacienteId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-800"
                required
              >
                {pacientes.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombreCompleto} ({p.telefono})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-3 p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Lucía Benítez"
                  value={nombreCompleto}
                  onChange={e => setNombreCompleto(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp / Móvil *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+54911..."
                    value={telefono}
                    onChange={e => setTelefono(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">DNI / Documento</label>
                  <input
                    type="text"
                    placeholder="Opcional"
                    value={documento}
                    onChange={e => setDocumento(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tratamiento y Sesiones */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Tratamiento Odontológico</label>
              {!modoNuevoPaciente && tratamientosDelPaciente.length > 0 && (
                <button
                  type="button"
                  onClick={() => setModoNuevoTratamiento(!modoNuevoTratamiento)}
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700 cursor-pointer"
                >
                  {modoNuevoTratamiento ? 'Elegir tratamiento existente' : '+ Iniciar otro tratamiento'}
                </button>
              )}
            </div>

            {!modoNuevoTratamiento && tratamientosDelPaciente.length > 0 ? (
              <select
                value={tratamientoId}
                onChange={e => setTratamientoId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
              >
                {tratamientosDelPaciente.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nombre} (Total {t.totalSesionesEstimadas} sesiones)
                  </option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder="Nombre del tratamiento (ej: Implante dental)"
                    value={nuevoTratamientoNombre}
                    onChange={e => setNuevoTratamientoNombre(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    min="1"
                    placeholder="Total sesiones"
                    value={totalSesionesEstimadas}
                    onChange={e => setTotalSesionesEstimadas(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                    title="Total de sesiones estimadas"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Fecha, Hora, Duración y Número de Sesión */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Fecha *</label>
              <input
                type="date"
                required
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hora *</label>
              <input
                type="time"
                required
                value={hora}
                onChange={e => setHora(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nº Sesión</label>
              <input
                type="number"
                min="1"
                value={numeroSesion}
                onChange={e => setNumeroSesion(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Motivo / Notas clínicas</label>
            <input
              type="text"
              placeholder="Ej: Colocación de brackets superiores"
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                'Agendar Cita'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
