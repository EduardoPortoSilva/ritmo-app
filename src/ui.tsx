import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { colors as c } from './theme';
export type IconName = React.ComponentProps<typeof Feather>['name'];
export function Icon({
  name,
  color = c.ink,
  size = 20,
}: {
  name: IconName;
  color?: string;
  size?: number;
}) {
  return <Feather name={name} size={size} color={color} />;
}
export function Button({
  label,
  accessibilityLabel,
  onPress,
  icon,
  secondary,
  danger,
  disabled,
}: {
  label: string;
  accessibilityLabel?: string;
  onPress: () => void;
  icon?: IconName;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondaryButton,
        danger && { backgroundColor: c.dangerSoft },
        disabled && { opacity: 0.45 },
        pressed && { opacity: 0.75 },
      ]}
    >
      {icon && <Icon name={icon} color={danger ? c.danger : c.ink} size={18} />}
      <Text style={[s.buttonText, danger && { color: c.danger }]}>{label}</Text>
    </Pressable>
  );
}
export function IconButton({
  name,
  label,
  onPress,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={s.iconButton}
    >
      <Icon name={name} size={19} />
    </Pressable>
  );
}
export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  numeric,
  multiline,
  accessibilityLabel,
}: {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  numeric?: boolean;
  multiline?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <View style={{ flex: 1, gap: 7 }}>
      {label && <Text style={s.fieldLabel}>{label}</Text>}
      <TextInput
        accessibilityLabel={accessibilityLabel ?? label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.muted}
        keyboardType={numeric ? 'decimal-pad' : 'default'}
        maxLength={numeric ? 8 : multiline ? 300 : 80}
        multiline={multiline}
        style={[s.input, multiline && { minHeight: 80, textAlignVertical: 'top' }]}
      />
    </View>
  );
}
export function Empty({
  icon,
  title,
  message,
  action,
}: {
  icon: IconName;
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <Icon name={icon} size={28} />
      </View>
      <Text style={s.cardTitle}>{title}</Text>
      <Text style={[s.body, { textAlign: 'center', maxWidth: 320 }]}>{message}</Text>
      {action}
    </View>
  );
}
export function SectionTitle({
  title,
  aside,
  onPress,
}: {
  title: string;
  aside?: string;
  onPress?: () => void;
}) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {aside && (
        <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8}>
          <Text style={s.link}>{aside} →</Text>
        </Pressable>
      )}
    </View>
  );
}
export function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.metric}>
      <Text style={s.metricValue}>{value}</Text>
      <Text style={[s.small, { textAlign: 'center' }]}>{label}</Text>
    </View>
  );
}
export function PageHeader({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
}) {
  return (
    <View style={{ gap: 15 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        onPress={onBack}
        style={s.back}
      >
        <Icon name="arrow-left" size={18} />
        <Text style={s.link}>Voltar</Text>
      </Pressable>
      <View>
        <Text style={s.title}>{title}</Text>
        <Text style={s.body}>{subtitle}</Text>
      </View>
    </View>
  );
}
export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  shell: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center' },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: c.line,
  },
  brand: { color: c.ink, fontSize: 30, fontWeight: '800', letterSpacing: -1.5 },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.dark,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  offlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  offlineText: { fontSize: 9, letterSpacing: 0.8, color: c.muted, fontWeight: '700' },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#8AAB60' },
  content: { padding: 24, gap: 20, paddingBottom: 36 },
  eyebrow: { fontSize: 10, letterSpacing: 1.5, fontWeight: '700', color: c.muted, marginBottom: 8 },
  title: { fontSize: 29, fontWeight: '800', letterSpacing: -0.9, color: c.ink, marginBottom: 7 },
  body: { color: c.muted, fontSize: 14, lineHeight: 22 },
  small: { color: c.muted, fontSize: 12, lineHeight: 19 },
  hero: { backgroundColor: c.dark, borderRadius: 22, padding: 25, gap: 17, overflow: 'hidden' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroEyebrow: { color: c.lime, fontSize: 10, letterSpacing: 1.6, fontWeight: '700' },
  heroTitle: {
    color: '#F8FAF2',
    fontWeight: '700',
    letterSpacing: -0.8,
    fontSize: 31,
    maxWidth: 430,
  },
  heroBody: { color: '#C3CDC4', fontSize: 14, lineHeight: 23, marginBottom: 5 },
  button: {
    backgroundColor: c.lime,
    minHeight: 50,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
  },
  secondaryButton: { backgroundColor: c.soft },
  buttonText: { fontSize: 14, color: c.ink, fontWeight: '700' },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  metrics: {
    flexDirection: 'row',
    backgroundColor: '#EDEFE5',
    borderRadius: 16,
    paddingVertical: 22,
    alignItems: 'center',
  },
  metric: { flex: 1, alignItems: 'center', alignSelf: 'stretch', paddingHorizontal: 8, gap: 4 },
  metricValue: { color: c.ink, fontSize: 26, fontWeight: '700', letterSpacing: -0.7 },
  divider: { height: 34, width: 1, backgroundColor: '#D9DFCE' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitle: { color: c.ink, fontWeight: '700', fontSize: 19, letterSpacing: -0.4 },
  link: { color: c.dark, fontSize: 12, fontWeight: '700' },
  card: {
    backgroundColor: c.paper,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.line,
    padding: 18,
    gap: 16,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { color: c.ink, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  routineBadge: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#F0F2E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: c.dark, fontWeight: '600', fontSize: 16 },
  empty: {
    backgroundColor: '#EEEFE7',
    borderRadius: 18,
    padding: 26,
    gap: 14,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#E0E6D3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  noteCard: {
    backgroundColor: '#EDEFE5',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 19,
    gap: 15,
  },
  localNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  nav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: c.line,
    backgroundColor: c.background,
    paddingVertical: 10,
  },
  navItem: { flex: 1, gap: 5, alignItems: 'center', minHeight: 56 },
  navIcon: { paddingVertical: 7, paddingHorizontal: 22, borderRadius: 14 },
  navLabel: { fontSize: 11, color: c.muted },
  back: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    minHeight: 44,
  },
  fieldLabel: { fontSize: 13, color: c.ink, fontWeight: '600' },
  input: {
    backgroundColor: '#F8F9F5',
    borderColor: c.line,
    borderWidth: 1,
    borderRadius: 10,
    padding: 13,
    fontSize: 15,
    minHeight: 48,
    color: c.ink,
  },
  progressCard: { backgroundColor: '#EDEFE5', borderRadius: 16, padding: 18, gap: 14 },
  progressTrack: { height: 7, backgroundColor: '#D5DCCC', borderRadius: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#597D44', borderRadius: 8 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tableHeading: { fontSize: 9, color: c.muted, fontWeight: '700', letterSpacing: 0.5 },
  setIndex: { fontSize: 14, color: c.muted, fontWeight: '600' },
  setInput: {
    backgroundColor: '#F5F7F0',
    borderColor: c.line,
    borderWidth: 1,
    borderRadius: 9,
    padding: 10,
    minHeight: 46,
    fontSize: 17,
    textAlign: 'center',
    color: c.ink,
  },
  target: { color: c.muted, fontSize: 10, textAlign: 'center', marginTop: 4 },
  check: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  completedRow: { backgroundColor: '#F0F6E7', borderRadius: 10 },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: c.paper,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.line,
    padding: 18,
  },
  historyIcon: {
    width: 43,
    height: 43,
    backgroundColor: c.soft,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderTopWidth: 1,
    borderColor: c.line,
    paddingTop: 14,
  },
  textButton: { alignItems: 'center', padding: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(22,38,30,.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: c.paper,
    padding: 25,
    borderRadius: 22,
    gap: 20,
  },
  toast: {
    marginHorizontal: 24,
    marginBottom: 12,
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 9,
    backgroundColor: c.dark,
    alignItems: 'center',
  },
  toastText: { color: '#FFFFFF', fontSize: 13, flex: 1 },
  errorBanner: { padding: 12, backgroundColor: c.dangerSoft },
});
