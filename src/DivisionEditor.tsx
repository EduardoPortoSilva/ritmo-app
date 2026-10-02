import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import {
  divisionDraftKey,
  divisionError,
  newRoutine,
  routineDays,
  totalRoutineSets,
  type DivisionDraft,
} from './model';
import { RoutineFields } from './screens';
import { Button, Field, Icon, PageHeader, s } from './ui';
import { colors as c } from './theme';

export function DivisionEditor({
  initial,
  onBack,
  onSave,
  onDirtyChange,
}: {
  initial: DivisionDraft;
  onBack: () => void;
  onSave: (draft: DivisionDraft) => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [draft, setDraft] = useState<DivisionDraft>(() => JSON.parse(JSON.stringify(initial)));
  const [expanded, setExpanded] = useState([initial.routines[0]?.id]);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);
  useEffect(
    () => onDirtyChange(divisionDraftKey(draft) !== divisionDraftKey(initial)),
    [draft, initial, onDirtyChange],
  );
  return (
    <>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <PageHeader
          title={initial.name ? 'Editar divisão' : 'Nova divisão'}
          subtitle="Monte seus treinos juntos, no seu ritmo."
          onBack={onBack}
        />
        <View style={s.card}>
          <Field
            label="Nome da divisão"
            placeholder="Ex.: ABC — Base"
            value={draft.name}
            onChangeText={(name) => setDraft({ ...draft, name })}
          />
          <Text style={s.small}>
            Cada treino tem seus próprios dias, exercícios e metas por série.
          </Text>
        </View>
        {draft.routines.map((routine, index) => {
          const open = expanded.includes(routine.id);
          return (
            <View key={routine.id} testID={`division-section-${index + 1}`} style={{ gap: 14 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${open ? 'Recolher' : 'Abrir'} treino ${index + 1}`}
                accessibilityState={{ expanded: open }}
                aria-expanded={open}
                onPress={() =>
                  setExpanded(
                    open ? expanded.filter((id) => id !== routine.id) : [...expanded, routine.id],
                  )
                }
                style={s.progressCard}
              >
                <View style={s.cardHeader}>
                  <Text style={[s.cardTitle, { flex: 1 }]}>
                    {routine.name || `Treino ${index + 1}`}
                  </Text>
                  <Icon name={open ? 'chevron-up' : 'chevron-down'} />
                </View>
                <Text style={s.small}>
                  {routineDays(routine)} · {routine.exercises.length} exercícios ·{' '}
                  {totalRoutineSets(routine)} séries
                </Text>
                <Text style={s.small}>
                  {routine.exercises
                    .map((exercise) => exercise.name)
                    .filter(Boolean)
                    .join(' · ') || 'Preencha os exercícios'}
                </Text>
              </Pressable>
              {open && (
                <View style={{ gap: 18 }}>
                  <RoutineFields
                    draft={routine}
                    setDraft={(change) =>
                      setDraft((previous) => ({
                        ...previous,
                        routines: previous.routines.map((item) =>
                          item.id === routine.id
                            ? typeof change === 'function'
                              ? change(item)
                              : change
                            : item,
                        ),
                      }))
                    }
                  />
                  <Button
                    label={`Recolher treino ${index + 1}`}
                    secondary
                    icon="chevron-up"
                    onPress={() => setExpanded(expanded.filter((id) => id !== routine.id))}
                  />
                  <Button
                    label={`Remover treino ${index + 1}`}
                    secondary
                    danger
                    icon="trash-2"
                    onPress={() => setRemoving(routine.id)}
                  />
                </View>
              )}
            </View>
          );
        })}
        <Button
          label="Adicionar treino"
          secondary
          icon="plus"
          onPress={() => {
            const routine = newRoutine();
            setDraft({ ...draft, routines: [...draft.routines, routine] });
            setExpanded([routine.id]);
          }}
        />
        {!!error && (
          <Text accessibilityRole="alert" style={{ color: c.danger }}>
            {error}
          </Text>
        )}
        <Button
          label="Salvar divisão"
          icon="check"
          onPress={() => {
            const message = divisionError(draft);
            setError(message ?? '');
            if (!message) onSave(draft);
          }}
        />
      </ScrollView>
      <Modal
        visible={removing !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRemoving(null)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.sectionTitle}>Remover treino da divisão?</Text>
            <Text style={s.body}>
              A remoção será aplicada ao salvar a divisão. O histórico e o treino em andamento serão
              preservados.
            </Text>
            <Button
              label="Remover treino"
              danger
              onPress={() => {
                setDraft({
                  ...draft,
                  routines: draft.routines.filter((routine) => routine.id !== removing),
                });
                setRemoving(null);
              }}
            />
            <Button label="Manter treino" secondary onPress={() => setRemoving(null)} />
          </View>
        </View>
      </Modal>
    </>
  );
}
