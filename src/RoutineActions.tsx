import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Icon, type IconName } from './ui';
import { colors as c } from './theme';

export const routineActionFonts = MaterialCommunityIcons.font;
type Action = {
  id: string;
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  disabled?: boolean;
} & (
  | { family: 'feather'; icon: IconName }
  | { family: 'material'; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }
);

export function RoutineActions({
  paused,
  canPause,
  onTogglePause,
  onCoverage,
  onCardio,
  onImport,
  onBackup,
  onSets,
}: {
  paused: boolean;
  canPause: boolean;
  onTogglePause: () => void;
  onCoverage: () => void;
  onCardio: () => void;
  onImport: () => void;
  onBackup: () => void;
  onSets: () => void;
}) {
  const actions: Action[] = [
    {
      id: 'pause',
      label: paused ? 'Retomar\nforça' : 'Pausar\nforça',
      accessibilityLabel: paused ? 'Retomar treinos de força' : 'Pausar treinos de força',
      family: 'feather',
      icon: paused ? 'play' : 'pause-circle',
      disabled: !paused && !canPause,
      onPress: onTogglePause,
    },
    {
      id: 'coverage',
      label: 'Cobertura\nmuscular',
      accessibilityLabel: 'Cobertura muscular',
      family: 'material',
      icon: 'arm-flex-outline',
      onPress: onCoverage,
    },
    {
      id: 'cardio',
      label: 'Cardio',
      accessibilityLabel: 'Rotinas de cardio',
      family: 'material',
      icon: 'heart-pulse',
      onPress: onCardio,
    },
    {
      id: 'import',
      label: 'Importar\ntreinos',
      accessibilityLabel: 'Importar treinos por texto',
      family: 'material',
      icon: 'robot-outline',
      onPress: onImport,
    },
    {
      id: 'backup',
      label: 'Backup',
      accessibilityLabel: 'Backup e restauração',
      family: 'feather',
      icon: 'save',
      onPress: onBackup,
    },
    {
      id: 'sets',
      label: 'Conjuntos',
      accessibilityLabel: 'Conjuntos de rotinas',
      family: 'feather',
      icon: 'archive',
      onPress: onSets,
    },
  ];
  return (
    <View style={{ gap: 10 }} testID="routine-actions-grid">
      {[actions.slice(0, 3), actions.slice(3)].map((row, index) => (
        <View key={index} style={{ flexDirection: 'row', gap: 10 }}>
          {row.map((action) => (
            <Pressable
              key={action.id}
              accessibilityRole="button"
              accessibilityLabel={action.accessibilityLabel}
              accessibilityState={{ disabled: !!action.disabled }}
              disabled={action.disabled}
              onPress={action.onPress}
              style={({ pressed }) => [
                styles.action,
                (pressed || action.disabled) && { opacity: 0.45 },
              ]}
            >
              {action.family === 'material' ? (
                <MaterialCommunityIcons name={action.icon} size={28} color={c.ink} />
              ) : (
                <Icon name={action.icon} size={26} />
              )}
              <Text style={styles.label}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    flex: 1,
    minWidth: 0,
    minHeight: 104,
    backgroundColor: c.soft,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 14,
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: c.ink, fontSize: 12, lineHeight: 17, fontWeight: '600', textAlign: 'center' },
});
