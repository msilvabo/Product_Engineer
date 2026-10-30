import { readDB, writeDB } from './storage';
import { Cita, MensajeWhatsAppSimulado, Paciente, Tratamiento } from '../types';

export interface ResultadoVerificacion {
  mensajesGenerados: MensajeWhatsAppSimulado[];
  citasActualizadas: number;
  totalEvaluadas: number;
  fechaEjecucion: string;
}

/**
 * Formatea la hora y fecha en un texto legible en español.
 */
function formatearHoraYFecha(fechaIso: string): { hora: string; fecha: string } {
  const d = new Date(fechaIso);
  const hora = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const fecha = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return { hora, fecha };
}

/**
 * Ejecuta la verificación de recordatorios de citas odontológicas para prevenir el abandono de tratamientos.
 * - 1 día antes (<= 24 horas)
 * - 2 horas antes (<= 2 horas)
 */
export async function ejecutarVerificacionRecordatorios(ahora: Date = new Date()): Promise<ResultadoVerificacion> {
  const db = await readDB();
  const pacientesMap = new Map<string, Paciente>(db.pacientes.map(p => [p.id, p]));
  const tratamientosMap = new Map<string, Tratamiento>(db.tratamientos.map(t => [t.id, t]));

  const tiempoAhora = ahora.getTime();
  const nuevosMensajes: MensajeWhatsAppSimulado[] = [];
  let citasActualizadas = 0;

  for (const cita of db.citas) {
    if (cita.estado !== 'programada') {
      continue;
    }

    const tiempoCita = new Date(cita.fechaHoraInicio).getTime();
    const diferenciaMs = tiempoCita - tiempoAhora;
    const diferenciaHoras = diferenciaMs / (1000 * 60 * 60);

    // Solo evaluar citas que están en el futuro o con tolerancia de gracia de hasta 5 minutos de inicio
    if (diferenciaMs < -5 * 60 * 1000) {
      continue;
    }

    const paciente = pacientesMap.get(cita.pacienteId);
    if (!paciente) {
      continue;
    }

    const tratamiento = cita.tratamientoId ? tratamientosMap.get(cita.tratamientoId) : undefined;
    const nombreTratamiento = tratamiento ? tratamiento.nombre : (cita.motivo || 'Consulta general');
    const sesionTexto = cita.numeroSesion
      ? `(Sesión ${cita.numeroSesion}${tratamiento?.totalSesionesEstimadas ? ` de ${tratamiento.totalSesionesEstimadas}` : ''})`
      : '';
    const { hora, fecha } = formatearHoraYFecha(cita.fechaHoraInicio);

    let citaModificada = false;

    // Regla 1: 1 día antes (ventana <= 24 horas)
    if (diferenciaHoras <= 24 && !cita.notificado24h) {
      cita.notificado24h = true;
      cita.fechaNotificado24h = ahora.toISOString();
      citaModificada = true;

      const cuerpo = `¡Hola ${paciente.nombreCompleto}! 👋 Te recordamos que tienes una cita programada para el ${fecha} a las ${hora} para tu tratamiento de ${nombreTratamiento} ${sesionTexto}. ¡La constancia en tus sesiones es esencial para lograr el mejor resultado en tu salud dental! 🦷 Te esperamos.`;

      const mensaje: MensajeWhatsAppSimulado = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        citaId: cita.id,
        pacienteId: paciente.id,
        telefonoDestino: paciente.telefono,
        tipoRecordatorio: '24_horas',
        cuerpoMensaje: cuerpo.trim(),
        enviadoEn: ahora.toISOString(),
        estado: 'simulado_exitoso'
      };

      nuevosMensajes.push(mensaje);
      console.log(`[WHATSAPP SIMULADO - 24H] Enviado a ${paciente.nombreCompleto} (${paciente.telefono}): ${cuerpo}`);
    }

    // Regla 2: 2 horas antes (ventana <= 2 horas)
    if (diferenciaHoras <= 2 && !cita.notificado2h) {
      cita.notificado2h = true;
      cita.fechaNotificado2h = ahora.toISOString();
      citaModificada = true;

      const cuerpo = `¡Hola ${paciente.nombreCompleto}! ⏰ Te recordamos que tu cita para ${nombreTratamiento} ${sesionTexto} es hoy en aproximadamente 2 horas (a las ${hora}). ¡El equipo médico ya tiene todo preparado para tu sesión! 🦷 Por favor avísanos si estás en camino.`;

      const mensaje: MensajeWhatsAppSimulado = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        citaId: cita.id,
        pacienteId: paciente.id,
        telefonoDestino: paciente.telefono,
        tipoRecordatorio: '2_horas',
        cuerpoMensaje: cuerpo.trim(),
        enviadoEn: ahora.toISOString(),
        estado: 'simulado_exitoso'
      };

      nuevosMensajes.push(mensaje);
      console.log(`[WHATSAPP SIMULADO - 2H] Enviado a ${paciente.nombreCompleto} (${paciente.telefono}): ${cuerpo}`);
    }

    if (citaModificada) {
      citasActualizadas++;
    }
  }

  if (nuevosMensajes.length > 0 || citasActualizadas > 0) {
    db.mensajesSimulados = [...db.mensajesSimulados, ...nuevosMensajes];
    await writeDB(db);
  }

  return {
    mensajesGenerados: nuevosMensajes,
    citasActualizadas,
    totalEvaluadas: db.citas.length,
    fechaEjecucion: ahora.toISOString()
  };
}
