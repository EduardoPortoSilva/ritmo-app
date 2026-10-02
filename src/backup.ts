import { parseDatabase, type Database } from './model.ts';
import { assertStorableDatabase } from './backupLimits.ts';

export const BACKUP_FORMAT = 'ritmo-backup/1';
export const MAX_BACKUP_CHARS = 10_000_000;

export type BackupPreview = {
  exportedAt: string;
  database: Database;
};

export function backupSummary(database: Database) {
  return {
    routines: database.routines.length,
    workouts: database.workouts.length,
    cardioRoutines: database.cardioRoutines?.length ?? 0,
    cardioHistory: database.cardioHistory?.length ?? 0,
    supplements: database.supplements?.length ?? 0,
    activeWorkout: !!database.active,
    activeCardio: !!database.activeCardio,
  };
}

export function createBackup(database: Database, exportedAt = new Date().toISOString()): string {
  // The same parser used at startup must accept a backup before it can be exported.
  parseDatabase(JSON.stringify(database));
  const contents = JSON.stringify({ format: BACKUP_FORMAT, exportedAt, database }, null, 2);
  if (contents.length > MAX_BACKUP_CHARS)
    throw new Error('O backup ultrapassa o limite de 10 milhões de caracteres.');
  return contents;
}

export function parseBackup(contents: string): BackupPreview {
  if (contents.length > MAX_BACKUP_CHARS)
    throw new Error('O arquivo é grande demais para restaurar com segurança.');
  let value: unknown;
  try {
    value = JSON.parse(contents);
  } catch {
    throw new Error('O arquivo não contém um JSON válido.');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Este arquivo não é um backup do Ritmo.');
  const backup = value as Record<string, unknown>;
  if (backup.format !== BACKUP_FORMAT) throw new Error('Formato de backup não reconhecido.');
  if (typeof backup.exportedAt !== 'string' || !Number.isFinite(Date.parse(backup.exportedAt)))
    throw new Error('Data do backup inválida.');
  if (!backup.database || typeof backup.database !== 'object' || Array.isArray(backup.database))
    throw new Error('O backup não contém um banco de dados válido.');
  let database: Database;
  try {
    database = parseDatabase(JSON.stringify(backup.database));
  } catch {
    throw new Error('Os dados do backup são inválidos; nada foi restaurado.');
  }
  assertStorableDatabase(JSON.stringify(database));
  return { exportedAt: backup.exportedAt, database };
}
