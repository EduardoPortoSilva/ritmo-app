import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';
import { cardioCueSchedule, type CardioRun } from './cardio';

type CardioCueModule = {
  startCardio(delaysJson: string, durationMs: number): void;
  stopCardio(): void;
};

const native =
  Platform.OS === 'android' ? requireOptionalNativeModule<CardioCueModule>('RitmoRest') : null;

export let backgroundCardioCueAvailable = native !== null;

export function syncBackgroundCardioCue(run: CardioRun | null): void {
  if (!native || !backgroundCardioCueAvailable) return;
  const schedule = run && cardioCueSchedule(run);
  try {
    if (schedule) native.startCardio(JSON.stringify(schedule.delaysMs), schedule.durationMs);
    else native.stopCardio();
  } catch (error) {
    backgroundCardioCueAvailable = false;
    throw error;
  }
}
