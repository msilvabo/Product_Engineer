# SPEC 02 — Modificación de citas odontológicas y resumen de historial por paciente

> **Estado:** Aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-10-31
> **Objetivo:** Permitir la edición, reprogramación y eliminación de citas existentes con reinicio inteligente de recordatorios WhatsApp, y proporcionar una vista de resumen cronológico por paciente de todas sus citas y tratamientos asociados.

---

## Alcance

**Dentro del alcance:**

- **Edición completa de citas existentes:**
  - Modificación de fecha y hora de inicio, duración estimada en minutos, motivo/observaciones y asociación a tratamiento/sesión.
  - Actualización del estado de la cita (`programada`, `asistio`, `cancelada`, `reprogramada`).
  - Eliminación permanente de citas con confirmación previa.
- **Lógica de reactivación de recordatorios de WhatsApp al reprogramar:**
  - Si una cita es reprogramada a una nueva fecha/hora futura, las banderas de notificación (`notificado24h` y `notificado2h`) se restablecen automáticamente a `false` (y se limpian las marcas de fecha de envío previas), permitiendo que el motor de notificaciones genere los nuevos avisos correspondientes a la nueva fecha programada.
  - Si se cancela la cita o se marca como asistida, se preserva el estado de notificación y no se emiten nuevos recordatorios.
- **Ficha / Resumen de citas y tratamientos por paciente:**
  - Modal interactivo de "Ficha del Paciente" accesible haciendo clic sobre el nombre del paciente en la agenda diaria (`DayScheduleList`) o mediante un botón selector de pacientes en la barra superior.
  - Resumen de datos personales de contacto (nombre completo, teléfono WhatsApp, documento/DNI, correo electrónico).
  - Resumen de tratamientos activos y finalizados del paciente (nombre del tratamiento, número de sesiones planificadas y estado).
  - Línea de tiempo cronológica (pasadas y futuras) de todas las citas del paciente, indicando: fecha y hora en formato legible, insignia de estado (`programada`, `asistio`, `cancelada`, `reprogramada`), tratamiento asignado, número de sesión (ej. "Sesión 2 de 4") y motivo.
  - Accesos directos desde el resumen del paciente para editar cualquier cita pendiente o agendar una nueva cita preseleccionando automáticamente al paciente.
- **Capa de persistencia y API:**
  - Rutas API en `/api/citas` con soporte para métodos `PUT` (actualización completa/parcial) y `DELETE` (eliminación de cita por ID), persistiendo atómicamente en `data/db.json`.

**Fuera del alcance (para futuras especificaciones):**

- Historial clínico con odontograma gráfico interactivo (caries, obturaciones, piezas dentales en 3D/2D).
- Subida de archivos adjuntos (radiografías, recetas médicas, fotos en PDF o JPG).
- Envío automático e instantáneo de mensaje de WhatsApp al momento exacto de la cancelación o reprogramación (se mantiene el alcance de recordatorios a 24h y 2h previas).
- Módulo de cobros, presupuestos o pagos por cita/tratamiento.

---

## Métricas de éxito

1. **Reactivación efectiva de recordatorios (100% de cobertura):** El 100% de las citas reprogramadas a fechas futuras restablecen sus banderas de WhatsApp y generan oportunamente los recordatorios a 24 horas y 2 horas antes de la nueva fecha.
2. **Agilidad operativa en recepción (< 20 segundos):** El tiempo necesario para buscar un paciente, revisar su historial de sesiones y reprogramar una cita no supera los 20 segundos ni requiere más de 3 clics en la interfaz.
3. **Visibilidad y adherencia al tratamiento:** El 100% de los pacientes consultados en la ficha muestran con claridad el avance de sus sesiones ("Sesión X de Y") y el estado de sus tratamientos, facilitando la detección temprana de tratamientos abandonados o sesiones pendientes.
4. **Integridad y consistencia de datos (0 fallas):** Cero pérdida o duplicidad de citas en `data/db.json` durante operaciones de edición y eliminación concurrente, reflejándose los cambios de inmediato en el calendario y en la lista del día.

---

## Modelo de datos

No se requieren nuevas colecciones en `data/db.json`. Se aprovechan y complementan los modelos de datos existentes definidos en SPEC 01 (`Paciente`, `Tratamiento`, `Cita`, `MensajeWhatsAppSimulado`).

Estructuras de datos involucradas y extensiones:

```typescript
// En app/types/index.ts (campos existentes y tipado de actualización)

export interface Cita {
  id: string;
  pacienteId: string;
  tratamientoId?: string;
  numeroSesion?: number;
  fechaHoraInicio: string; // ISO 8601
  duracionMinutos: number;
  motivo: string;
  estado: 'programada' | 'asistio' | 'cancelada' | 'reprogramada';
  notificado24h: boolean;
  fechaNotificado24h?: string;
  notificado2h: boolean;
  fechaNotificado2h?: string;
  creadoEn: string;
  actualizadoEn?: string; // Marca de tiempo ISO de la última edición
}

// Payload para actualización de una cita (PUT /api/citas)
export interface ActualizarCitaDTO {
  id: string;
  fechaHoraInicio?: string;
  duracionMinutos?: number;
  motivo?: string;
  tratamientoId?: string;
  numeroSesion?: number;
  estado?: 'programada' | 'asistio' | 'cancelada' | 'reprogramada';
}
```

**Regla de negocio para actualización de recordatorios (`app/api/citas/route.ts`):**
```typescript
// Si la fechaHoraInicio cambió y la nueva fecha está en el futuro:
const cambioFechaHora = body.fechaHoraInicio && body.fechaHoraInicio !== citaOriginal.fechaHoraInicio;

if (cambioFechaHora && new Date(body.fechaHoraInicio).getTime() > Date.now()) {
  citaActualizada.notificado24h = false;
  citaActualizada.fechaNotificado24h = undefined;
  citaActualizada.notificado2h = false;
  citaActualizada.fechaNotificado2h = undefined;
  if (!body.estado || body.estado === 'programada') {
    citaActualizada.estado = 'reprogramada';
  }
}
```

---

## Plan de implementación

1. **Endpoints API para modificación y eliminación de citas (`app/api/citas/route.ts`):**
   - Implementar método `PUT`: Recibe el `id` y los campos modificables (`fechaHoraInicio`, `duracionMinutos`, `motivo`, `tratamientoId`, `numeroSesion`, `estado`).
     - Valida la existencia de la cita.
     - Aplica la regla de reactivación de recordatorios de WhatsApp si la fecha se reprograma a futuro.
     - Asigna `actualizadoEn` con la fecha/hora actual y guarda en `data/db.json`.
   - Implementar método `DELETE`: Recibe el parámetro `id` (por querystring `?id=...` o en el cuerpo JSON).
     - Elimina la cita del arreglo de citas en `data/db.json` de forma atómica con `writeDB`.
   - Verificación manual: Comprobar respuestas exitosas y persistencia de cambios en `data/db.json`.

2. **Componente Modal de Edición de Citas (`app/components/EditAppointmentModal.tsx`):**
   - Modal interactivo con formulario prellenado para editar una cita seleccionada.
   - Permite cambiar fecha, hora, duración, tratamiento asociado, número de sesión, motivo y estado de la cita.
   - Botón de acción para "Guardar Cambios" y botón secundario "Eliminar Cita" con advertencia de confirmación.
   - Conexión con `PUT /api/citas` y `DELETE /api/citas`.

3. **Componente de Ficha y Resumen del Paciente (`app/components/PatientSummaryModal.tsx`):**
   - Modal interactivo para visualizar el perfil integral del paciente:
     - Resumen de datos de contacto: Nombre, teléfono para WhatsApp, documento/DNI, email.
     - Lista de tratamientos vinculados con su estado y avance.
     - Línea de tiempo cronológica de todas las citas del paciente:
       - Indicadores visuales de estado (`programada`, `asistio`, `cancelada`, `reprogramada`).
       - Detalle de fecha, hora legible, nombre de tratamiento, número de sesión y observaciones.
       - Botón directo para editar cualquiera de las citas listadas (dispara `EditAppointmentModal`).
     - Botón superior "+ Agendar nueva cita" que abre `AppointmentModal` con el paciente precargado.

4. **Integración en `DayScheduleList.tsx`:**
   - Agregar botón de acción con icono de edición en cada tarjeta de cita para abrir `EditAppointmentModal`.
   - Hacer interactivo el nombre del paciente en la tarjeta para abrir `PatientSummaryModal` con un clic.

5. **Integración en la vista principal (`app/page.tsx`):**
   - Agregar en la barra de navegación superior un botón "👥 Directorio de Pacientes" para buscar y abrir la ficha de cualquier paciente registrado.
   - Conectar los estados de los modales y refrescar automáticamente las listas de citas y estadísticas tras editar o eliminar registros.

---

## Criterios de aceptación

- [ ] Existe un botón de edición en cada tarjeta de cita del listado diario que abre el modal `EditAppointmentModal`.
- [ ] Es posible modificar fecha, hora, duración, tratamiento, número de sesión y motivo de una cita existente.
- [ ] Al cambiar la fecha u hora de una cita ya notificada a una fecha futura, los flags `notificado24h` y `notificado2h` se restablecen automáticamente a `false` en `data/db.json`.
- [ ] Es posible cambiar el estado de la cita entre `programada`, `asistio`, `cancelada` y `reprogramada`.
- [ ] Es posible eliminar permanentemente una cita previa confirmación, desapareciendo del calendario y de `data/db.json`.
- [ ] Al hacer clic en el nombre de un paciente (en la lista diaria o desde el botón de la barra superior) se abre `PatientSummaryModal`.
- [ ] La Ficha del Paciente muestra todas las citas históricas y futuras del paciente ordenadas cronológicamente con su fecha, tratamiento, sesión y estado.
- [ ] Desde la Ficha del Paciente se puede iniciar la edición de cualquier cita existente del paciente.
- [ ] Desde la Ficha del Paciente se puede presionar "+ Agendar Cita" y el formulario se abre con dicho paciente ya seleccionado.
- [ ] La aplicación compila limpiamente (`npm run build`) sin errores de TypeScript ni de linting.

---

## Decisiones

- **Sí:** Resumen de paciente implementado mediante un modal interactivo (`PatientSummaryModal`). Evita recargar la página o crear rutas separadas complejas, manteniendo la experiencia fluida de SPA/Dashboard de la PoC.
- **Sí:** Restablecimiento automático de flags de notificación de WhatsApp al cambiar fecha/hora a futuro. Asegura que el paciente reciba recordatorios para la nueva fecha programada sin intervención manual.
- **Sí:** Opción dual de cancelación y eliminación. Permite tanto auditoría de citas canceladas para estadísticas como borrado definitivo ante citas creadas por error.
- **No:** Creación de rutas de navegación completas tipo `/pacientes/[id]`. Descartado para mantener simplicidad y consistencia con la arquitectura de SPEC 01.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Inconsistencia de datos si se edita una cita mientras se ejecuta la verificación de recordatorios | Persistencia atómica mediante `writeDB` con reemplazo seguro de archivos temporales en `app/lib/storage.ts`. |
| Borrado accidental de citas importantes | Diálogo de advertencia y confirmación antes de disparar la petición `DELETE`. |
| Pacientes sin citas registradas al abrir el resumen | Estado visual vacío amigable dentro de la Ficha del Paciente con sugerencia directa para agendar la primera cita. |
