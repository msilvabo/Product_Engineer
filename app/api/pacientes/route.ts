import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/app/lib/storage';
import { Paciente, Tratamiento } from '@/app/types';

export async function GET() {
  try {
    const db = await readDB();
    return NextResponse.json({
      pacientes: db.pacientes,
      tratamientos: db.tratamientos
    });
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    return NextResponse.json({ error: 'Error al leer los datos de pacientes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombreCompleto, telefono, documento, email, tratamientoNombre, totalSesionesEstimadas } = body;

    if (!nombreCompleto || !telefono) {
      return NextResponse.json({ error: 'Nombre completo y teléfono son obligatorios' }, { status: 400 });
    }

    const db = await readDB();

    const nuevoPaciente: Paciente = {
      id: `pac-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      nombreCompleto: nombreCompleto.trim(),
      telefono: telefono.trim(),
      documento: documento?.trim() || undefined,
      email: email?.trim() || undefined,
      creadoEn: new Date().toISOString()
    };

    db.pacientes.push(nuevoPaciente);

    let nuevoTratamiento: Tratamiento | undefined = undefined;
    if (tratamientoNombre && tratamientoNombre.trim()) {
      nuevoTratamiento = {
        id: `trat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        pacienteId: nuevoPaciente.id,
        nombre: tratamientoNombre.trim(),
        totalSesionesEstimadas: Number(totalSesionesEstimadas) || 1,
        estado: 'en_progreso',
        creadoEn: new Date().toISOString()
      };
      db.tratamientos.push(nuevoTratamiento);
    }

    await writeDB(db);

    return NextResponse.json({
      paciente: nuevoPaciente,
      tratamiento: nuevoTratamiento
    }, { status: 201 });
  } catch (error) {
    console.error('Error al crear paciente:', error);
    return NextResponse.json({ error: 'Error al registrar el paciente' }, { status: 500 });
  }
}
