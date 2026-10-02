import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

type WidgetModule = {
  sync(snapshot: string): void;
  requestPin(): Promise<boolean>;
};
const native =
  Platform.OS === 'android' ? requireOptionalNativeModule<WidgetModule>('RitmoWidget') : null;

export const widgetAvailable = native !== null;
export function syncWidget(snapshot: string) {
  native?.sync(snapshot);
}
export async function requestWidget(): Promise<boolean> {
  return (await native?.requestPin()) ?? false;
}
