import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { BaseDatosLocal } from '../types';

function getDBPath(): string {
  const directPath = path.join(process.cwd(), 'data', 'db.json');
  if (fsSync.existsSync(directPath)) {
    return directPath;
  }

  const subDirPath = path.join(process.cwd(), 'Product_Engineer', 'data', 'db.json');
  if (fsSync.existsSync(subDirPath)) {
    return subDirPath;
  }

  // Si no existe aún en ninguno, usar directPath si el cwd termina en Product_Engineer
  if (process.cwd().endsWith('Product_Engineer')) {
    return directPath;
  }
  return subDirPath;
}

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
  const dbPath = getDBPath();
  try {
    const raw = await fs.readFile(dbPath, 'utf-8');
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
  const dbPath = getDBPath();
  const dir = path.dirname(dbPath);
  await fs.mkdir(dir, { recursive: true });

  const tempPath = `${dbPath}.tmp.${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const jsonContent = JSON.stringify(data, null, 2);

  await fs.writeFile(tempPath, jsonContent, 'utf-8');
  await fs.rename(tempPath, dbPath);
}
