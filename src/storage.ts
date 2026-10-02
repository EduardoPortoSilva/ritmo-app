import AsyncStorage from '@react-native-async-storage/async-storage';
import { emptyDatabase, parseDatabase, type Database } from './model';
import { syncWidget } from './widget';
import { widgetSnapshot } from './widgetSnapshot';
import { syncReminders, syncSupplementWidget } from './reminders';
import { reminderSnapshot, supplementWidgetSnapshot } from './supplements';
import { assertStorableDatabase } from './backupLimits';

export const STORAGE_KEY = '@ritmo/database/v1';
export async function loadDatabase(): Promise<Database> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const database = raw === null ? emptyDatabase() : parseDatabase(raw);
  // A failed widget refresh must not prevent opening the user's workouts.
  try {
    syncWidget(widgetSnapshot(database));
  } catch (error) {
    console.warn('Não foi possível atualizar o widget.', error);
  }
  try {
    syncReminders(reminderSnapshot(database.supplements ?? []), true);
  } catch (error) {
    console.warn('Não foi possível atualizar os lembretes.', error);
  }
  try {
    syncSupplementWidget(supplementWidgetSnapshot(database.supplements ?? []));
  } catch (error) {
    console.warn('Não foi possível atualizar o widget de suplementos.', error);
  }
  return database;
}

// Serialize writes so rapid input cannot let an old snapshot overwrite a new one.
let pending: Promise<void> = Promise.resolve();

function syncSavedDatabase(database: Database): void {
  try {
    syncWidget(widgetSnapshot(database));
  } catch (error) {
    console.warn('N\u00e3o foi poss\u00edvel atualizar o widget.', error);
  }
  try {
    syncReminders(reminderSnapshot(database.supplements ?? []));
  } catch (error) {
    console.warn('N\u00e3o foi poss\u00edvel atualizar os lembretes.', error);
  }
  try {
    syncSupplementWidget(supplementWidgetSnapshot(database.supplements ?? []));
  } catch (error) {
    console.warn('N\u00e3o foi poss\u00edvel atualizar o widget de suplementos.', error);
  }
}

function snapshotForStorage(database: Database): string {
  const snapshot = JSON.stringify(database);
  assertStorableDatabase(snapshot);
  return snapshot;
}

export function saveDatabase(database: Database): Promise<void> {
  let snapshot: string;
  try {
    snapshot = snapshotForStorage(database);
  } catch (error) {
    return Promise.reject(error);
  }
  pending = pending
    .catch(() => undefined)
    .then(async () => {
      await AsyncStorage.setItem(STORAGE_KEY, snapshot);
      syncSavedDatabase(database);
    });
  return pending;
}

export function restoreDatabase(database: Database): Promise<void> {
  let snapshot: string;
  try {
    snapshot = snapshotForStorage(database);
  } catch (error) {
    return Promise.reject(error);
  }
  pending = pending
    .catch(() => undefined)
    .then(async () => {
      const previous = await AsyncStorage.getItem(STORAGE_KEY);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, snapshot);
        if ((await AsyncStorage.getItem(STORAGE_KEY)) !== snapshot)
          throw new Error(
            'A leitura de confer\u00eancia n\u00e3o corresponde aos dados restaurados.',
          );
      } catch {
        try {
          if (previous === null) await AsyncStorage.removeItem(STORAGE_KEY);
          else await AsyncStorage.setItem(STORAGE_KEY, previous);
          if ((await AsyncStorage.getItem(STORAGE_KEY)) !== previous)
            throw new Error('A confer\u00eancia dos dados anteriores falhou.');
        } catch {
          throw new Error(
            'A restaura\u00e7\u00e3o falhou e n\u00e3o foi poss\u00edvel conferir os dados anteriores. Preserve o arquivo de backup e n\u00e3o desinstale o app.',
          );
        }
        throw new Error(
          'N\u00e3o foi poss\u00edvel restaurar; os dados anteriores foram conferidos.',
        );
      }
      syncSavedDatabase(database);
    });
  return pending;
}
