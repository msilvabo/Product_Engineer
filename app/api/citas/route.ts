import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/app/lib/storage';
import { Cita, Tratamiento } from '@/app/types';

export async function GET() {
  try {
    const db = await readDB();
    const pacientesMap = new Map(db.pacientes.map(p => [p.id, p]));
    const tratamientosMap = new Map(db.tratamientos.map(t => [t.id, t]));

    const citasEnriquecidas = db.citas.map(cita => ({
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
