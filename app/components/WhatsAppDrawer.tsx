'use client';

import React, { useState } from 'react';
import { MensajeWhatsAppSimulado } from '../types';

interface WhatsAppDrawerProps {
  mensajes: MensajeWhatsAppSimulado[];
  onTriggerCheck: () => Promise<void>;
  loadingCheck: boolean;
  lastCheckResult?: {
    mensajesGenerados: MensajeWhatsAppSimulado[];
    citasActualizadas: number;
    fechaEjecucion: string;
  } | null;
}

export function WhatsAppDrawer({
  mensajes,
  onTriggerCheck,
  loadingCheck,
  lastCheckResult
}: WhatsAppDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Barra superior / Cabecera interactiva */}
      <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-emerald-950 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.5C9.36 7.5 9.09 7.57 8.87 7.8C8.65 8.04 8.04 8.61 8.04 9.77C8.04 10.93 8.89 12.05 9.01 12.21C9.13 12.37 10.64 14.81 13.01 15.74C14.98 16.52 15.38 16.36 15.82 16.32C16.26 16.28 17.23 15.74 17.43 15.18C17.63 14.62 17.63 14.14 17.57 14.04C17.51 13.94 17.34 13.88 17.08 13.75C16.82 13.62 15.53 12.98 15.29 12.9C15.05 12.81 14.88 12.77 14.71 13.03C14.54 13.29 14.06 13.87 13.91 14.04C13.76 14.21 13.62 14.23 13.36 14.1C13.1 13.97 12.26 13.7 11.26 12.81C10.48 12.11 9.96 11.26 9.81 11C9.66 10.74 9.8 10.6 9.93 10.47C10.04 10.36 10.18 10.17 10.31 10.02C10.44 9.87 10.49 9.77 10.57 9.6C10.66 9.43 10.61 9.28 10.55 9.16C10.48 9.03 9.96 7.74 9.74 7.23C9.53 6.73 9.32 6.8 9.16 6.8L8.71 6.8C8.54 6.8 8.27 6.86 8.05 7.1C7.83 7.33 7.22 7.91 7.22 9.07" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Recordatorios de WhatsApp (Simulador)</h3>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                PoC Activa
              </span>
            </div>
            <p className="text-xs text-emerald-300/80 mt-0.5">
              Notificaciones automáticas 1 día antes y 2 horas antes para evitar el abandono de pacientes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onTriggerCheck}
            disabled={loadingCheck}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            title="Evalúa las citas próximas a 24h y 2h y genera los mensajes"
          >
            {loadingCheck ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-emerald-950/30 border-t-emerald-950 rounded-full animate-spin" />
                Comprobando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Comprobar y disparar ahora
              </>
            )}
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-3 py-2 text-xs font-semibold text-emerald-200 hover:text-white bg-white/10 hover:bg-white/15 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Bandeja ({mensajes.length})</span>
            <svg
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Banner con último resultado si se acaba de disparar */}
      {lastCheckResult && (
        <div className="bg-emerald-50 border-b border-emerald-100 px-5 py-2.5 text-xs flex items-center justify-between text-emerald-900">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <strong>Chequeo ejecutado:</strong> Se generaron {lastCheckResult.mensajesGenerados.length} mensaje(s) nuevo(s) y se actualizaron {lastCheckResult.citasActualizadas} cita(s).
          </span>
          <span className="text-[11px] text-emerald-600">
            {new Date(lastCheckResult.fechaEjecucion).toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* Contenido desplegable: Historial de mensajes */}
      {isOpen && (
        <div className="p-5 bg-slate-50 border-t border-slate-100 max-h-96 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-2">
            <span>Mensajes simulados enviados ({mensajes.length})</span>
            <span className="text-[11px] text-slate-400">Verificación automática activa en segundo plano</span>
          </div>

          {mensajes.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
              No se han emitido notificaciones simuladas aún. Pulsa &quot;Comprobar y disparar ahora&quot; o agenda una cita próxima para ver el mensaje.
            </div>
          ) : (
            mensajes.map(m => {
              const fechaEnvio = new Date(m.enviadoEn);
              const horaStr = fechaEnvio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
              const fechaStr = fechaEnvio.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });

              return (
                <div
                  key={m.id}
                  className="bg-white rounded-xl p-4 border border-emerald-100 shadow-2xs space-y-2 relative"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {m.tipoRecordatorio === '24_horas' ? '⏰ Recordatorio 1 Día Antes' : '⚡ Recordatorio 2 Horas Antes'}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-700">
                        {m.telefonoDestino}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {fechaStr} {horaStr}
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 text-xs text-slate-700 leading-relaxed font-sans">
                    {m.cuerpoMensaje}
                  </div>

                  <div className="flex items-center justify-end text-[10px] text-emerald-700 font-semibold gap-1">
                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Simulado exitosamente (guardado en db.json)
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
