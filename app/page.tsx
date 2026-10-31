'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import { CalendarGrid } from './components/CalendarGrid';
import { DayScheduleList } from './components/DayScheduleList';
import { AppointmentModal } from './components/AppointmentModal';
import { EditAppointmentModal } from './components/EditAppointmentModal';
import { PatientSummaryModal } from './components/PatientSummaryModal';
import { WhatsAppDrawer } from './components/WhatsAppDrawer';
import { Cita, Paciente, Tratamiento, MensajeWhatsAppSimulado } from './types';

interface CitaEnriquecida extends Cita {
  paciente?: Paciente;
  tratamiento?: Tratamiento;
}

// Fecha base estática para inicialización segura durante prerender en Next.js
const STATIC_DEFAULT_DATE = '2026-10-30';

export default function Home() {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date('2026-10-30T12:00:00Z'));
  const [selectedDate, setSelectedDate] = useState<string>(STATIC_DEFAULT_DATE);
  const [todayStr, setTodayStr] = useState<string>(STATIC_DEFAULT_DATE);

  const [citas, setCitas] = useState<CitaEnriquecida[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [mensajes, setMensajes] = useState<MensajeWhatsAppSimulado[]>([]);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preselectedPacienteId, setPreselectedPacienteId] = useState<string | undefined>(undefined);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCitaParaEditar, setSelectedCitaParaEditar] = useState<CitaEnriquecida | null>(null);

  const [isPatientSummaryOpen, setIsPatientSummaryOpen] = useState(false);
  const [selectedPatientForSummary, setSelectedPatientForSummary] = useState<Paciente | null>(null);

  const [loadingCheck, setLoadingCheck] = useState(false);
  const [lastCheckResult, setLastCheckResult] = useState<{
    mensajesGenerados: MensajeWhatsAppSimulado[];
    citasActualizadas: number;
    fechaEjecucion: string;
  } | null>(null);

  // Inicializar la fecha del cliente en useEffect para evitar errores de prerendering en Next.js 16
  useEffect(() => {
    const ahora = new Date();
    setCurrentDate(ahora);
    const hoyFormatted = ahora.toISOString().substring(0, 10);
    setSelectedDate(hoyFormatted);
    setTodayStr(hoyFormatted);
  }, []);

  // Carga inicial y refresco de datos
  const cargarDatos = useCallback(async () => {
    try {
      const [resCitas, resPacientes, resNotif] = await Promise.all([
        fetch('/api/citas'),
        fetch('/api/pacientes'),
        fetch('/api/notificaciones')
      ]);

      if (resCitas.ok) {
        const data = await resCitas.json();
        setCitas(data.citas || []);
      }

      if (resPacientes.ok) {
        const data = await resPacientes.json();
        setPacientes(data.pacientes || []);
        setTratamientos(data.tratamientos || []);
      }

      if (resNotif.ok) {
        const data = await resNotif.json();
        setMensajes(data.mensajes || []);
      }
    } catch (err) {
      console.error('Error al sincronizar datos:', err);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Disparar comprobación de recordatorios de WhatsApp
  const handleTriggerCheck = async () => {
    setLoadingCheck(true);
    try {
      const res = await fetch('/api/notificaciones', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLastCheckResult(data.resultado);
        setMensajes(data.mensajesActualizados || []);
        // Refrescar citas para ver los flags notificado24h y notificado2h actualizados
        const resCitas = await fetch('/api/citas');
        if (resCitas.ok) {
          const dataCitas = await resCitas.json();
          setCitas(dataCitas.citas || []);
        }
      }
    } catch (error) {
      console.error('Error al comprobar recordatorios:', error);
    } finally {
      setLoadingCheck(false);
    }
  };

  // Intervalo automático cada 60 segundos para revisión en segundo plano
  useEffect(() => {
    const interval = setInterval(() => {
      handleTriggerCheck();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Navegación de mes del calendario
  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const hoy = new Date();
    setCurrentDate(hoy);
    setSelectedDate(hoy.toISOString().substring(0, 10));
  };

  // Manejo de edición de citas
  const handleOpenEditCita = (cita: CitaEnriquecida) => {
    setSelectedCitaParaEditar(cita);
    setIsEditModalOpen(true);
  };

  // Manejo de resumen de paciente
  const handleOpenPatientSummary = (paciente?: Paciente) => {
    if (paciente) {
      setSelectedPatientForSummary(paciente);
    } else if (pacientes.length > 0) {
      setSelectedPatientForSummary(pacientes[0]);
    }
    setIsPatientSummaryOpen(true);
  };

  // Agendar cita con paciente preseleccionado
  const handleAgendarParaPaciente = (paciente: Paciente) => {
    setPreselectedPacienteId(paciente.id);
    setIsModalOpen(true);
  };

  // Agendar cita genérica
  const handleAgendarGenerica = () => {
    setPreselectedPacienteId(undefined);
    setIsModalOpen(true);
  };

  // Estadísticas rápidas
  const hoyStr = todayStr;
  const citasHoyCount = citas.filter(c => c.fechaHoraInicio.startsWith(hoyStr)).length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col">
      {/* Barra de Navegación Superior */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xl shadow-xs">
              🦷
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                DentalCare Studio
              </h1>
              <p className="text-[11px] text-teal-700 font-semibold">
                Agenda Odontológica & Prevención de Abandono
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden lg:flex items-center gap-3 text-xs font-semibold mr-1">
              <button
                onClick={() => handleOpenPatientSummary()}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                title="Abrir resumen y fichas de pacientes"
              >
                👥 {pacientes.length} Pacientes
              </button>
              <span className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
                📅 {citasHoyCount} Citas Hoy
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                💬 {mensajes.length} WhatsApps Enviados
              </span>
            </div>

            {/* Botón Directorio de Pacientes */}
            <button
              onClick={() => handleOpenPatientSummary()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl border border-slate-300 shadow-2xs transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Pacientes</span>
            </button>

            {/* Botón Nueva Cita */}
            <button
              onClick={handleAgendarGenerica}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Agendar Cita</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Banner descriptivo de la PoC */}
        <section className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-800 rounded-2xl p-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-400/20 text-teal-200 border border-teal-400/30">
                SPEC 02 Activo
              </span>
              <span className="text-xs text-teal-200">Agenda, Edición de Citas y Ficha por Paciente</span>
            </div>
            <h2 className="text-lg font-bold">Automatización de Recordatorios & Control Odontológico</h2>
            <p className="text-xs text-teal-100/80 max-w-2xl leading-relaxed">
              Modifica o reprograma turnos con reactivación automática de recordatorios de WhatsApp. Consulta el historial cronológico y tratamientos de cada paciente desde su ficha clínica.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => handleOpenPatientSummary()}
              className="px-4 py-2 text-xs font-bold text-teal-100 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Ver Directorio de Pacientes
            </button>
            <button
              onClick={handleAgendarGenerica}
              className="px-4 py-2 text-xs font-bold text-teal-900 bg-white hover:bg-teal-50 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Crear Paciente y Cita
            </button>
          </div>
        </section>

        {/* Cuadrícula de Calendario y Lista de Citas */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Calendario mensual (7 columnas en desktop) */}
          <div className="lg:col-span-7">
            <CalendarGrid
              currentDate={currentDate}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onToday={handleToday}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              citas={citas}
              todayStr={todayStr}
            />
          </div>

          {/* Agenda de citas del día seleccionado (5 columnas en desktop) */}
          <div className="lg:col-span-5 h-[520px]">
            <DayScheduleList
              selectedDate={selectedDate}
              citas={citas}
              onOpenAgendarModal={handleAgendarGenerica}
              onEditCita={handleOpenEditCita}
              onOpenPacienteSummary={handleOpenPatientSummary}
            />
          </div>
        </section>

        {/* Panel Inferior de Notificaciones de WhatsApp Simuladas */}
        <section>
          <WhatsAppDrawer
            mensajes={mensajes}
            onTriggerCheck={handleTriggerCheck}
            loadingCheck={loadingCheck}
            lastCheckResult={lastCheckResult}
          />
        </section>
      </main>

      {/* Modal para Agendar Cita */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPreselectedPacienteId(undefined);
        }}
        defaultDate={selectedDate}
        pacientes={pacientes}
        tratamientos={tratamientos}
        preselectedPacienteId={preselectedPacienteId}
        onAppointmentCreated={cargarDatos}
      />

      {/* Modal para Modificar Cita */}
      <EditAppointmentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCitaParaEditar(null);
        }}
        cita={selectedCitaParaEditar}
        tratamientos={tratamientos}
        onAppointmentUpdated={cargarDatos}
        onAppointmentDeleted={cargarDatos}
      />

      {/* Modal de Ficha y Resumen del Paciente */}
      <PatientSummaryModal
        isOpen={isPatientSummaryOpen}
        onClose={() => {
          setIsPatientSummaryOpen(false);
          setSelectedPatientForSummary(null);
        }}
        paciente={selectedPatientForSummary}
        todosPacientes={pacientes}
        onSelectPaciente={setSelectedPatientForSummary}
        citas={citas}
        tratamientos={tratamientos}
        onEditCita={handleOpenEditCita}
        onAgendarCitaParaPaciente={handleAgendarParaPaciente}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        DentalCare Studio — SPEC 02: Modificación de citas odontológicas y resumen de historial por paciente
      </footer>
    </div>
  );
}
