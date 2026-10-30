# SPEC 01 — Agenda de citas tipo calendario con recordatorios simulados por WhatsApp

> **Estado:** Aprobado
> **Depende de:** Ninguna
> **Fecha:** 2026-10-30
> **Objetivo:** Implementar una prueba de concepto de agenda de citas odontológicas tipo calendario con persistencia en archivo JSON local y recordatorios simulados de WhatsApp a 24 horas y 2 horas previas a la cita.

---

## Alcance

**Dentro del alcance:**

- Registro y gestión básica de pacientes (Nombre completo, teléfono celular para WhatsApp, documento de identidad/DNI y correo electrónico opcional).
- Registro de tratamientos odontológicos con asociación a sesiones y citas (fecha, hora, duración, número de sesión y total estimado de sesiones, ej. "Sesión 2 de 4").
- Interfaz gráfica tipo calendario mensual con cuadrícula de días e indicador visual de citas programadas, complementada con listado detallado de citas del día seleccionado.
- Modal/formulario para agendar nuevas citas o asociar sesiones a pacientes existentes o nuevos.
- Persistencia completa en un archivo de texto estructurado local en formato JSON (`data/db.json`) accesible en el entorno local.
- Motor de verificación de notificaciones con reglas de tiempo:
  - Recordatorio 1 día antes (ventana de 24 horas previas).
  - Recordatorio 2 horas antes (ventana de 2 horas previas).
- Mecanismo de control de duplicados mediante banderas booleanas (`notificado_24h`, `notificado_2h`) y fecha/hora de envío registradas en la cita.
- Simulación de envíos de WhatsApp: registro estructurado en la base de datos local y panel interactivo en la interfaz para visualizar los mensajes generados con detalle (destinatario, teléfono, contenido, fecha y hora simulada de envío).
- Disparador dual de recordatorios: verificación periódica automática en segundo plano (cada intervalo configurable) y botón manual "Comprobar y disparar notificaciones ahora" en la interfaz para pruebas inmediatas.

**Fuera del alcance (para futuras especificaciones):**

- Integración real con la API oficial de WhatsApp Cloud o servicios de mensajería como Twilio/Meta Business.
- Respuestas interactivas bidireccionales del paciente (confirmación o cancelación directa por chat de WhatsApp).
- Base de datos relacional externa o en la nube (PostgreSQL, Supabase, MySQL).
- Autenticación multi-usuario, roles de odontólogo vs. recepcionista y control de acceso.
- Módulo de facturación, pasarela de pagos o presupuestos odontológicos detallados.

---

## Modelo de datos

Estructura de datos persistida en `data/db.json`:

```typescript
// Tipos TypeScript para el sistema

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
```

---

## Plan de implementación

1. **Estructura base y persistencia local:**
   - Crear el directorio `data/` y el archivo semilla `data/db.json` con datos iniciales de prueba (pacientes, tratamientos y citas con fechas próximas).
   - Crear `app/types/index.ts` con las interfaces de TypeScript.
   - Implementar `app/lib/storage.ts` con funciones seguras de lectura y escritura atómica en `data/db.json`.

2. **Lógica de negocio y motor de recordatorios:**
   - Implementar `app/lib/notifications.ts` con la función `ejecutarVerificacionRecordatorios(ahora?: Date)`:
     - Evalúa citas en estado `'programada'`.
     - Identifica citas a menos o igual a 24 horas que tengan `notificado24h: false`.
     - Identifica citas a menos o igual a 2 horas que tengan `notificado2h: false`.
     - Genera el texto personalizado del recordatorio incluyendo nombre del paciente, tratamiento, sesión, fecha y hora.
     - Guarda los mensajes en `mensajesSimulados` y actualiza los flags en la cita.
     - Imprime el log en consola del servidor.

3. **Capa API de servidor (Next.js Route Handlers / Server Actions):**
   - Crear `app/api/citas/route.ts` para obtener citas y crear nuevas citas vinculadas a pacientes y tratamientos.
   - Crear `app/api/pacientes/route.ts` para consultar y registrar pacientes.
   - Crear `app/api/notificaciones/route.ts` para disparar la verificación manual y obtener el historial de mensajes de WhatsApp simulados.

4. **Componente de calendario interactivo:**
   - Crear `app/components/CalendarGrid.tsx`: cuadrícula mensual que permite navegar meses (anterior/siguiente), resaltar el día de hoy, marcar días con citas y seleccionar una fecha activa.
   - Crear `app/components/DayScheduleList.tsx`: listado detallado de citas para la fecha seleccionada con badges de estado y sesión.

5. **Formulario modal para agendar citas:**
   - Crear `app/components/AppointmentModal.tsx`: selector de paciente existente o creación rápida de paciente, selección o nuevo tratamiento, número de sesión, fecha, hora y duración.

6. **Panel de notificaciones y disparador:**
   - Crear `app/components/WhatsAppDrawer.tsx`: panel deslizable o sección inferior con la bandeja de mensajes simulados enviados y botón "Comprobar y disparar notificaciones ahora".
   - Integrar un hook/efecto de cliente con intervalo periódico (ej. cada 60 segundos) que invoque la verificación automática mientras la aplicación esté abierta.

7. **Integración principal en la interfaz:**
   - Modificar `app/page.tsx` para ensamblar la cabecera, vista de calendario, listado de citas del día y panel de WhatsApp simulado con diseño responsivo usando Tailwind CSS.

---

## Criterios de aceptación

- [ ] La aplicación corre localmente con `npm run dev` sin errores en consola ni en compilación de TypeScript.
- [ ] El archivo `data/db.json` se crea y mantiene actualizado tras cualquier operación de guardado.
- [ ] Se puede visualizar una cuadrícula mensual del calendario con navegación entre meses.
- [ ] Al hacer clic en un día del calendario, se filtran y muestran las citas correspondientes a esa fecha.
- [ ] Es posible agendar una nueva cita con datos de paciente, tratamiento y número de sesión.
- [ ] Una cita programada dentro de las próximas 24 horas genera un mensaje simulado de tipo `24_horas` al ejecutarse la verificación.
- [ ] Una cita programada dentro de las próximas 2 horas genera un mensaje simulado de tipo `2_horas` al ejecutarse la verificación.
- [ ] Las citas notificadas actualizan sus banderas (`notificado24h`, `notificado2h`) en `data/db.json` y no vuelven a generar mensajes duplicados en chequeos subsecuentes.
- [ ] El botón manual "Comprobar y disparar notificaciones ahora" ejecuta la revisión al instante y actualiza la lista visual de mensajes simulados.
- [ ] Cada mensaje simulado muestra el número telefónico, nombre del paciente, tratamiento, sesión, hora y el contenido redactado con tono empático para evitar el abandono del tratamiento.

---

## Decisiones

- **Sí:** Persistencia en `data/db.json`. Es liviana, nativa a Node.js/Next.js, no requiere servidores de bases de datos externos y cumple con el requerimiento estricto de PoC en archivo de texto local.
- **No:** Base de datos SQLite o PostgreSQL. Descartado para mantener la configuración cero y portabilidad inmediata en la PoC.
- **Sí:** Cuadrícula de calendario personalizada con Tailwind CSS. Evita problemas de dependencias pesadas o incompatibilidades con React 19 y Next.js 16.
- **No:** Librería FullCalendar. Agrega sobrecarga y estilos externos innecesarios para las necesidades de esta PoC.
- **Sí:** Doble control de recordatorios (timer periódico + botón manual). Permite comprobar el funcionamiento de manera inmediata sin esperar pasivamente a que transcurra el tiempo real.
- **Sí:** Banderas booleanas en la cita (`notificado24h`, `notificado2h`). Garantiza idempotencia y previene spam o duplicidad de mensajes.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Concurrencia o sobreescritura accidental en `data/db.json` al guardar citas simultáneamente | Operaciones de lectura y escritura síncronas o encapsuladas con manejo seguro de archivos en `fs/promises`. |
| Zonas horarias incompatibles entre el cliente y el servidor | Normalización obligatoria de todas las fechas y horas a formato UTC ISO 8601 en la base de datos y formateo localizado al mostrar en el calendario. |
| Inactividad de temporizadores automáticos si la pestaña del navegador está cerrada | El botón manual permite sincronizar y auditar en cualquier momento; la verificación calcula la diferencia con la hora actual (`ahora >= cita - 24h`), por lo que no se pierden avisos atrasados. |

---

## Qué **no** está en esta especificación

- Conexión real a la API de WhatsApp (Meta Cloud API o Twilio).
- Cancelación o reprogramación automática desde enlaces externos de WhatsApp.
- Autenticación o control de roles de usuario.
- Historial clínico odontológico completo u odontogramas visuales.
