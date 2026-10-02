import { requireOptionalNativeModule } from 'expo';
import { Linking, PermissionsAndroid, Platform } from 'react-native';

type ReminderModule = {
  sync(snapshot: string, force: boolean): void;
  prepare(): void;
  notificationsEnabled(): boolean;
  syncWidget(snapshot: string): void;
  requestPinWidget(): Promise<boolean>;
};
const native =
  Platform.OS === 'android' ? requireOptionalNativeModule<ReminderModule>('RitmoReminders') : null;
export const remindersAvailable = native !== null;
export const notificationsEnabled = () => native?.notificationsEnabled() ?? false;
export function syncReminders(snapshot: string, force = false) {
  native?.sync(snapshot, force);
}
export function syncSupplementWidget(snapshot: string) {
  native?.syncWidget(snapshot);
}
export async function requestSupplementWidget(): Promise<boolean> {
  return (await native?.requestPinWidget()) ?? false;
}
export async function enableNotifications(): Promise<boolean> {
  if (!native) return false;
  native.prepare();
  if (
    Number(Platform.Version) >= 33 &&
    !(await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS))
  ) {
    const permission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (permission !== PermissionsAndroid.RESULTS.GRANTED) return false;
  }
  return native.notificationsEnabled();
}
export function openNotificationSettings() {
  void Linking.openSettings();
}
