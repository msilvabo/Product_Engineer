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

- **`/spec`** ([`SKILL.md`](file:///C:/learning/Codigo%20Facilito/Product%20Engineer/dental_office/.agents/skills/spec/SKILL.md)): Asistente guiado para diseñar y redactar especificaciones técnicas estructuradas previas al desarrollo.
- **`/spec-impl`** ([`SKILL.md`](file:///C:/learning/Codigo%20Facilito/Product%20Engineer/dental_office/.agents/skills/spec-impl/SKILL.md)): Implementador paso a paso de especificaciones en estado `Aprobado` con creación de ramas git automáticas (`spec-NN-slug`).

---

## 📋 Especificaciones y Verificación

- **Especificación Activa:**
  - [`specs/01-agenda-citas-notificaciones-whatsapp.md`](file:///C:/learning/Codigo%20Facilito/Product%20Engineer/dental_office/specs/01-agenda-citas-notificaciones-whatsapp.md) (Estado: *Aprobado / Implementado*).
  - **Objetivo:** Agenda mensual de citas, gestión de pacientes y tratamientos por sesiones, con notificaciones simuladas de WhatsApp disparadas automáticamente o bajo demanda a 24 horas y 2 horas antes de cada turno.
- **Informe de Pruebas e Implementación:**
  - [`spec-implement_test/01-informe-implementacion-y-verificacion.md`](file:///C:/learning/Codigo%20Facilito/Product%20Engineer/dental_office/spec-implement_test/01-informe-implementacion-y-verificacion.md).
  - **Resultado:** 10/10 criterios de aceptación verificados (compilación limpia con Turbopack, persistencia atómica, prevención de duplicados vía flags booleanos y mensajería con tono empático).

---

## 🏗️ Arquitectura de la Solución

- **Persistencia & Negocio:**
  - [`data/db.json`](file:///C:/learning/Codigo%20Facilito/Product%20Engineer/dental_office/data/db.json): Almacén de `pacientes`, `tratamientos`, `citas` y `mensajesSimulados`.
  - [`app/lib/storage.ts`](file:///C:/learning/Codigo%20Facilito/Product%20Engineer/dental_office/app/lib/storage.ts): Lectura y guardado atómico con archivos temporales (`.tmp`).
  - [`app/lib/notifications.ts`](file:///C:/learning/Codigo%20Facilito/Product%20Engineer/dental_office/app/lib/notifications.ts): Reglas temporales (24h y 2h), flags (`notificado24h`, `notificado2h`) y generación de texto motivacional.
- **Capa API (Route Handlers):**
  - `/api/pacientes`: CRUD básico de pacientes y tratamientos.
  - `/api/citas`: Consulta de citas con datos relacionales y agendamiento.
  - `/api/notificaciones`: Historial y disparo manual del motor de recordatorios.
- **Componentes UI (`app/components/`):**
  - `CalendarGrid`: Cuadrícula mensual nativa con Tailwind, navegación de fechas y badges de turnos.
  - `DayScheduleList`: Agenda del día seleccionado con detalles de sesión y estado de envío.
  - `AppointmentModal`: Creación ágil de citas/sesiones y pacientes.
  - `WhatsAppDrawer`: Bandeja interactiva de simulación de mensajes y botón de disparo manual.

---

## 🚀 Comandos de Referencia

- `npm run dev`: Levantar entorno de desarrollo (`http://localhost:3000`).
- `npm run build`: Compilación y verificación de tipos en producción.
- `npm run lint`: Análisis estático con ESLint 9.
