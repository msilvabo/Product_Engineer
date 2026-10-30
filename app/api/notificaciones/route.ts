import { NextResponse } from 'next/server';
import { readDB } from '@/app/lib/storage';
import { ejecutarVerificacionRecordatorios } from '@/app/lib/notifications';

export async function GET() {
  try {
    const db = await readDB();
    const mensajesOrdenados = [...db.mensajesSimulados].reverse();
    return NextResponse.json({
      mensajes: mensajesOrdenados,
      total: mensajesOrdenados.length
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return NextResponse.json({ error: 'Error al obtener mensajes simulados' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const resultado = await ejecutarVerificacionRecordatorios();
    const db = await readDB();

    return NextResponse.json({
      resultado,
      mensajesActualizados: [...db.mensajesSimulados].reverse()
    });
  } catch (error) {
    console.error('Error al ejecutar verificación de recordatorios:', error);
    return NextResponse.json({ error: 'Error al procesar recordatorios' }, { status: 500 });
  }
}
