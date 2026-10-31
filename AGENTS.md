<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# DentalCare Studio — Project Context & Agent Memory

Sistema de agenda odontológica tipo calendario (PoC) enfocado en la prevención del abandono de tratamientos mediante recordatorios automatizados y simulados por WhatsApp.

## 🛠️ Tecnologías Principales

- **Framework:** Next.js 16.4.3 (App Router, Turbopack, React Server/Client Components).
- **Librería UI:** React 19.3.0.
- **Tipado:** TypeScript 5 (estricto).
- **Estilos:** Tailwind CSS v4 (`@tailwindcss/turbopack`).
- **Persistencia:** Archivo JSON local (`data/db.json`) con escritura atómica concurrente (`app/lib/storage.ts`).
- **Ejecución y pruebas:** Node.js v22.x y `tsx`.

---

## ⚡ Skills Instalados (`.agents/skills/`)

- **`/spec`** ([`SKILL.md`](file:///E:/learning/Codigo%20Facilito/product%20engineering/Product_Engineer/.agents/skills/spec/SKILL.md)): Asistente guiado para diseñar y redactar especificaciones técnicas estructuradas previas al desarrollo.
- **`/spec-impl`** ([`SKILL.md`](file:///E:/learning/Codigo%20Facilito/product%20engineering/Product_Engineer/.agents/skills/spec-impl/SKILL.md)): Implementador paso a paso de especificaciones en estado `Aprobado` con creación de ramas git automáticas (`spec-NN-slug`).

---

## 📋 Especificaciones y Verificación

- **Especificaciones Activas e Historial:**
  - [`specs/01-agenda-citas-notificaciones-whatsapp.md`](file:///E:/learning/Codigo%20Facilito/product%20engineering/Product_Engineer/specs/01-agenda-citas-notificaciones-whatsapp.md) (Estado: *Implementado*).
    - **Objetivo:** Agenda mensual de citas, gestión de pacientes y tratamientos por sesiones, con notificaciones simuladas de WhatsApp a 24 horas y 2 horas antes de cada turno.
  - [`specs/02-modificacion-citas-resumen-paciente.md`](file:///E:/learning/Codigo%20Facilito/product%20engineering/Product_Engineer/specs/02-modificacion-citas-resumen-paciente.md) (Estado: *Implementado*).
    - **Objetivo:** Edición y reprogramación de citas con reactivación automática de recordatorios WhatsApp, eliminación segura y ficha clínica integral de paciente con historial cronológico de citas y tratamientos.
- **Informes de Pruebas e Implementación:**
  - [`spec-implement_test/01-informe-implementacion-y-verificacion.md`](file:///E:/learning/Codigo%20Facilito/product%20engineering/Product_Engineer/spec-implement_test/01-informe-implementacion-y-verificacion.md) (10/10 criterios verificados).
  - [`spec-implement_test/02-informe-implementacion-y-verificacion.md`](file:///E:/learning/Codigo%20Facilito/product%20engineering/Product_Engineer/spec-implement_test/02-informe-implementacion-y-verificacion.md) (10/10 criterios y 4/4 métricas de éxito verificadas).

---

## 🏗️ Arquitectura de la Solución

- **Persistencia & Negocio:**
  - [`data/db.json`](file:///E:/learning/Codigo%20Facilito/product%20engineering/Product_Engineer/data/db.json): Almacén de `pacientes`, `tratamientos`, `citas` y `mensajesSimulados`.
  - [`app/lib/storage.ts`](file:///E:/learning/Codigo%20Facilito/product%20engineering/Product_Engineer/app/lib/storage.ts): Lectura y guardado atómico con archivos temporales (`.tmp`) y resolución de rutas multientorno.
  - [`app/lib/notifications.ts`](file:///E:/learning/Codigo%20Facilito/product%20engineering/Product_Engineer/app/lib/notifications.ts): Reglas temporales (24h y 2h), flags (`notificado24h`, `notificado2h`) y generación de texto motivacional.
- **Capa API (Route Handlers):**
  - `/api/pacientes`: CRUD básico de pacientes y tratamientos.
  - `/api/citas`: Consulta (`GET`), registro (`POST`), modificación/reprogramación (`PUT`), y eliminación (`DELETE`).
  - `/api/notificaciones`: Historial y disparo manual del motor de recordatorios.
- **Componentes UI (`app/components/`):**
  - `CalendarGrid`: Cuadrícula mensual nativa con Tailwind, navegación de fechas y badges de turnos.
  - `DayScheduleList`: Agenda del día seleccionado con badges de sesión, estado de recordatorios, botón de edición y enlace a la ficha del paciente.
  - `AppointmentModal`: Creación ágil de citas/sesiones y pacientes con soporte para precarga de paciente.
  - `EditAppointmentModal`: Edición completa de turnos, estado, sesión, tratamiento y eliminación confirmada.
  - `PatientSummaryModal`: Ficha clínica con historial cronológico de todas las citas, tratamientos y datos de contacto.
  - `WhatsAppDrawer`: Bandeja interactiva de simulación de mensajes y botón de disparo manual.

---

## 🚀 Comandos de Referencia

- `npm run dev`: Levantar entorno de desarrollo (`http://localhost:3000`).
- `npm run build`: Compilación y verificación de tipos en producción.
- `npm run lint`: Análisis estático con ESLint 9.
