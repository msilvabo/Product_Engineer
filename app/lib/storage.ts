import fs from 'fs/promises';
import path from 'path';
import { BaseDatosLocal } from '../types';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

const INITIAL_DB: BaseDatosLocal = {
  pacientes: [],
  tratamientos: [],
  citas: [],
  mensajesSimulados: []
};

/**
 * Lee la base de datos local desde data/db.json.
 * Si el archivo o directorio no existen, los crea con una estructura vacía o inicial.
 */
export async function readDB(): Promise<BaseDatosLocal> {
  try {
    const raw = await fs.readFile(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<BaseDatosLocal>;
    return {
      pacientes: parsed.pacientes || [],
      tratamientos: parsed.tratamientos || [],
      citas: parsed.citas || [],
      mensajesSimulados: parsed.mensajesSimulados || []
    };
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      await writeDB(INITIAL_DB);
      return INITIAL_DB;
    }
    throw error;
  }
}

/**
 * Escribe la base de datos local en data/db.json de forma segura usando un archivo temporal atómico.
 */
export async function writeDB(data: BaseDatosLocal): Promise<void> {
  const dir = path.dirname(DB_PATH);
  await fs.mkdir(dir, { recursive: true });

  const tempPath = `${DB_PATH}.tmp.${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const jsonContent = JSON.stringify(data, null, 2);

  await fs.writeFile(tempPath, jsonContent, 'utf-8');
  await fs.rename(tempPath, DB_PATH);
}
