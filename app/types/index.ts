export interface Paciente {
  id: string;
  nombreCompleto: string;
  telefono: string; // Formato con código de país/área para WhatsApp, ej: "+5491112345678"
  documento?: string; // DNI / Cédula
  email?: string;
  creadoEn: string; // ISO 8601
}

export interface Tratamiento {
  id: string;
  pacienteId: string;
  nombre: string; // Ej: "Ortodoncia correctiva", "Endodoncia pieza 14"
  totalSesionesEstimadas: number;
  estado: 'en_progreso' | 'finalizado' | 'abandonado';
  creadoEn: string;
}

export interface Cita {
  id: string;
  pacienteId: string;
  tratamientoId?: string;
  numeroSesion?: number; // Ej: 2 (para mostrar "Sesión 2 de 4")
  fechaHoraInicio: string; // ISO 8601, ej: "2026-11-01T10:00:00.000Z"
  duracionMinutos: number; // Ej: 45
  motivo: string;
  estado: 'programada' | 'asistio' | 'cancelada' | 'reprogramada';
  notificado24h: boolean;
  fechaNotificado24h?: string;
  notificado2h: boolean;
  fechaNotificado2h?: string;
  creadoEn: string;
  actualizadoEn?: string;
}

export interface ActualizarCitaDTO {
  id: string;
  fechaHoraInicio?: string;
  duracionMinutos?: number;
  motivo?: string;
  tratamientoId?: string;
  numeroSesion?: number;
  estado?: 'programada' | 'asistio' | 'cancelada' | 'reprogramada';
}

export interface MensajeWhatsAppSimulado {
  id: string;
  citaId: string;
  pacienteId: string;
  telefonoDestino: string;
  tipoRecordatorio: '24_horas' | '2_horas';
  cuerpoMensaje: string;
  enviadoEn: string; // ISO 8601
  estado: 'simulado_exitoso';
}

export interface BaseDatosLocal {
  pacientes: Paciente[];
  tratamientos: Tratamiento[];
  citas: Cita[];
  mensajesSimulados: MensajeWhatsAppSimulado[];
}
