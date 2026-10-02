import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

type RestCueModule = { start(durationMs: number): void; stop(): void };
const native =
  Platform.OS === 'android' ? requireOptionalNativeModule<RestCueModule>('RitmoRest') : null;

export function startBackgroundRestCue(durationMs: number): boolean {
  if (!native) return false;
  native.start(Math.ceil(durationMs));
  return true;
}

export function stopBackgroundRestCue(): void {
  native?.stop();
}
