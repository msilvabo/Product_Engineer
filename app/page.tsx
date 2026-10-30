'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CalendarGrid } from './components/CalendarGrid';
import { DayScheduleList } from './components/DayScheduleList';
import { AppointmentModal } from './components/AppointmentModal';
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

  const [isModalOpen, setIsModalOpen] = useState(false);
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

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-4 text-xs font-semibold mr-2">
              <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                👥 {pacientes.length} Pacientes
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
                📅 {citasHoyCount} Citas Hoy
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                💬 {mensajes.length} WhatsApps Enviados
              </span>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-xl shadow-xs transition-all cursor-pointer"
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
                Prueba de Concepto
              </span>
              <span className="text-xs text-teal-200">Persistencia local en data/db.json</span>
            </div>
            <h2 className="text-lg font-bold">Automatización de Recordatorios para Tratamientos Dentales</h2>
            <p className="text-xs text-teal-100/80 max-w-2xl leading-relaxed">
              El sistema evalúa continuamente los tratamientos y dispara mensajes simulados de WhatsApp a <strong>24 horas</strong> y <strong>2 horas antes</strong> de cada sesión para garantizar la adherencia y evitar cancelaciones.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="self-start md:self-auto px-4 py-2 text-xs font-bold text-teal-900 bg-white hover:bg-teal-50 rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
          >
            Crear Paciente y Cita
          </button>
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
              onOpenAgendarModal={() => setIsModalOpen(true)}
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
        onClose={() => setIsModalOpen(false)}
        defaultDate={selectedDate}
        pacientes={pacientes}
        tratamientos={tratamientos}
        onAppointmentCreated={cargarDatos}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        DentalCare Studio — SPEC 01: Agenda de citas tipo calendario y recordatorios automáticos de WhatsApp
      </footer>
    </div>
  );
}
