import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/app/lib/storage';
import { Cita, Tratamiento } from '@/app/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pacienteIdParam = searchParams.get('pacienteId');

    const db = await readDB();
    const pacientesMap = new Map(db.pacientes.map(p => [p.id, p]));
    const tratamientosMap = new Map(db.tratamientos.map(t => [t.id, t]));

    let citas = db.citas;
    if (pacienteIdParam) {
      citas = citas.filter(c => c.pacienteId === pacienteIdParam);
    }

    const citasEnriquecidas = citas.map(cita => ({
      ...cita,
      paciente: pacientesMap.get(cita.pacienteId),
      tratamiento: cita.tratamientoId ? tratamientosMap.get(cita.tratamientoId) : undefined
    }));

    return NextResponse.json({
      citas: citasEnriquecidas
    });
  } catch (error) {
    console.error('Error al obtener citas:', error);
    return NextResponse.json({ error: 'Error al leer citas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      pacienteId,
      tratamientoId,
      nuevoTratamientoNombre,
      totalSesionesEstimadas,
      numeroSesion,
      fechaHoraInicio,
      duracionMinutos,
      motivo
    } = body;

    if (!pacienteId || !fechaHoraInicio) {
      return NextResponse.json({ error: 'Paciente y fecha/hora de inicio son obligatorios' }, { status: 400 });
    }

    const db = await readDB();

    const pacienteExiste = db.pacientes.some(p => p.id === pacienteId);
    if (!pacienteExiste) {
      return NextResponse.json({ error: 'El paciente especificado no existe' }, { status: 404 });
    }

    let finalTratamientoId = tratamientoId;

    if (!finalTratamientoId && nuevoTratamientoNombre && nuevoTratamientoNombre.trim()) {
      const nuevoTratamiento: Tratamiento = {
        id: `trat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        pacienteId,
        nombre: nuevoTratamientoNombre.trim(),
        totalSesionesEstimadas: Number(totalSesionesEstimadas) || 1,
        estado: 'en_progreso',
        creadoEn: new Date().toISOString()
      };
      db.tratamientos.push(nuevoTratamiento);
      finalTratamientoId = nuevoTratamiento.id;
    }

    const nuevaCita: Cita = {
      id: `cita-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      pacienteId,
      tratamientoId: finalTratamientoId || undefined,
      numeroSesion: numeroSesion ? Number(numeroSesion) : undefined,
      fechaHoraInicio,
      duracionMinutos: Number(duracionMinutos) || 45,
      motivo: motivo?.trim() || 'Consulta odontológica programada',
      estado: 'programada',
      notificado24h: false,
      notificado2h: false,
      creadoEn: new Date().toISOString()
    };

    db.citas.push(nuevaCita);
    await writeDB(db);

    return NextResponse.json({ cita: nuevaCita }, { status: 201 });
  } catch (error) {
    console.error('Error al agendar cita:', error);
    return NextResponse.json({ error: 'Error al registrar la cita' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      fechaHoraInicio,
      duracionMinutos,
      motivo,
      tratamientoId,
      nuevoTratamientoNombre,
      totalSesionesEstimadas,
      numeroSesion,
      estado
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'El identificador de la cita (id) es obligatorio' }, { status: 400 });
    }

    const db = await readDB();
    const citaIndex = db.citas.findIndex(c => c.id === id);

    if (citaIndex === -1) {
      return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
    }

    const citaOriginal = db.citas[citaIndex];
    let finalTratamientoId = tratamientoId !== undefined ? tratamientoId : citaOriginal.tratamientoId;

    // Si se crea un nuevo tratamiento durante la edición
    if (nuevoTratamientoNombre && nuevoTratamientoNombre.trim()) {
      const nuevoTratamiento: Tratamiento = {
        id: `trat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        pacienteId: citaOriginal.pacienteId,
        nombre: nuevoTratamientoNombre.trim(),
        totalSesionesEstimadas: Number(totalSesionesEstimadas) || 1,
        estado: 'en_progreso',
        creadoEn: new Date().toISOString()
      };
      db.tratamientos.push(nuevoTratamiento);
      finalTratamientoId = nuevoTratamiento.id;
    }

    const citaActualizada: Cita = {
      ...citaOriginal,
      duracionMinutos: duracionMinutos !== undefined ? Number(duracionMinutos) : citaOriginal.duracionMinutos,
      motivo: motivo !== undefined ? motivo.trim() : citaOriginal.motivo,
      tratamientoId: finalTratamientoId || undefined,
      numeroSesion: numeroSesion !== undefined ? (numeroSesion ? Number(numeroSesion) : undefined) : citaOriginal.numeroSesion,
      actualizadoEn: new Date().toISOString()
    };

    // Actualización de fecha y lógica de recordatorios
    const cambioFechaHora = fechaHoraInicio && fechaHoraInicio !== citaOriginal.fechaHoraInicio;

    if (cambioFechaHora) {
      citaActualizada.fechaHoraInicio = fechaHoraInicio;
      // Si la nueva fecha u hora está en el futuro, reactivar recordatorios de WhatsApp
      if (new Date(fechaHoraInicio).getTime() > Date.now()) {
        citaActualizada.notificado24h = false;
        citaActualizada.fechaNotificado24h = undefined;
        citaActualizada.notificado2h = false;
        citaActualizada.fechaNotificado2h = undefined;
        if (!estado || estado === 'programada') {
          citaActualizada.estado = 'reprogramada';
        }
      }
    }

    // Actualización explícita del estado si fue proporcionado
    if (estado) {
      citaActualizada.estado = estado;
    }

    db.citas[citaIndex] = citaActualizada;
    await writeDB(db);

    const paciente = db.pacientes.find(p => p.id === citaActualizada.pacienteId);
    const tratamiento = citaActualizada.tratamientoId
      ? db.tratamientos.find(t => t.id === citaActualizada.tratamientoId)
      : undefined;

    return NextResponse.json({
      cita: {
        ...citaActualizada,
        paciente,
        tratamiento
      }
    });
  } catch (error) {
    console.error('Error al actualizar cita:', error);
    return NextResponse.json({ error: 'Error al actualizar la cita' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch {
        // No body provided
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'El ID de la cita a eliminar es obligatorio' }, { status: 400 });
    }

    const db = await readDB();
    const index = db.citas.findIndex(c => c.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
    }

    const [citaEliminada] = db.citas.splice(index, 1);
    await writeDB(db);

    return NextResponse.json({
      success: true,
      mensaje: 'Cita eliminada correctamente',
      cita: citaEliminada
    });
  } catch (error) {
    console.error('Error al eliminar cita:', error);
    return NextResponse.json({ error: 'Error al eliminar la cita' }, { status: 500 });
  }
}
