import React from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import {
  exerciseLoadHistory,
  exerciseTotalLoadHistory,
  type LoggedExercise,
  type Workout,
} from './model';
import { LoadHistoryChart } from './LoadHistoryChart';
import { IconButton, s } from './ui';
import { colors as c } from './theme';

export function WorkoutHistoryModal({
  exercise,
  history,
  routineId,
  onClose,
}: {
  exercise: LoggedExercise | null;
  history: readonly Workout[];
  routineId: string;
  onClose: () => void;
}) {
  if (!exercise) return null;
  const records = exerciseLoadHistory(history, routineId, exercise.id);
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={[s.modalOverlay, { padding: 12 }]}>
        <View
          accessibilityViewIsModal
          testID="workout-history-modal"
          style={[s.modalCard, { maxWidth: 800, maxHeight: '92%', padding: 0, gap: 0 }]}
        >
          <View
            style={[s.sectionHeader, { padding: 18, borderBottomWidth: 1, borderColor: c.line }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.eyebrow}>HISTÓRICO DO EXERCÍCIO</Text>
              <Text style={s.sectionTitle}>{exercise.name}</Text>
            </View>
            <IconButton name="x" label="Fechar gráfico" onPress={onClose} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }}>
            {records.length ? (
              <LoadHistoryChart
                records={records}
                totals={exerciseTotalLoadHistory(history, routineId, exercise.id)}
                exerciseName={exercise.name}
              />
            ) : (
              <Text style={s.body}>
                Ainda não há séries concluídas deste exercício no histórico.
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
