import React, { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import type { LoggedExercise } from './model';
import { Button, Field, IconButton, s } from './ui';

export function ExerciseNoteModal({
  exercise,
  onClose,
  onSave,
}: {
  exercise: LoggedExercise;
  onClose: () => void;
  onSave: (note: string) => void;
}) {
  const [note, setNote] = useState(exercise.note ?? '');
  function close() {
    Keyboard.dismiss();
    onClose();
  }
  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[s.modalOverlay, { padding: 16 }]}
      >
        <View
          accessibilityViewIsModal
          testID="exercise-note-modal"
          style={[s.modalCard, { maxHeight: '92%', padding: 20, gap: 16 }]}
        >
          <View style={s.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.eyebrow}>OBSERVAÇÕES DO EXERCÍCIO</Text>
              <Text style={s.sectionTitle}>{exercise.name}</Text>
            </View>
            <IconButton name="x" label="Fechar observações" onPress={close} />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 16 }}>
            <Field
              label="Observações"
              accessibilityLabel={`Observações de ${exercise.name}`}
              value={note}
              multiline
              placeholder="Ex.: Barra W, máquina, ajuste do banco…"
              onChangeText={setNote}
            />
            <Text style={s.small}>Ficam guardadas para os próximos treinos deste exercício.</Text>
            <Button
              label="Salvar observações"
              icon="check"
              onPress={() => {
                Keyboard.dismiss();
                onSave(note.trim());
              }}
            />
            <Button label="Cancelar" secondary onPress={close} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
