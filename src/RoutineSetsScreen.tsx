import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { colors as c } from './theme';
import { type Database, type Routine, type RoutineSet, uid } from './model';
import { Button, Field, Icon, PageHeader, s } from './ui';

export function RoutineSetsScreen({
  db,
  onBack,
  onSave,
  onActivate,
  onDelete,
  onOpenRoutine,
  onDirtyChange,
}: {
  db: Database;
  onBack: () => void;
  onSave: (draft: RoutineSet) => boolean;
  onActivate: (id: string) => void;
  onDelete: (set: RoutineSet) => void;
  onOpenRoutine: (routine: Routine) => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [draft, setDraft] = useState<RoutineSet | null>(null);
  useEffect(() => onDirtyChange(!!draft), [draft, onDirtyChange]);
  const sets = db.routineSets ?? [];
  const unassigned = db.routines.filter(
    (routine) => !sets.some((set) => set.routineIds.includes(routine.id)),
  );
  const toggle = (id: string) =>
    setDraft((current) =>
      current
        ? {
            ...current,
            routineIds: current.routineIds.includes(id)
              ? current.routineIds.filter((item) => item !== id)
              : [...current.routineIds, id],
          }
        : null,
    );

  return (
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <PageHeader
        title={
          draft
            ? sets.some((set) => set.id === draft.id)
              ? 'Editar conjunto'
              : 'Novo conjunto'
            : 'Conjuntos de rotinas'
        }
        subtitle={
          draft
            ? 'Selecione as rotinas que fazem parte deste período de treino.'
            : 'Guarde planos anteriores e volte a eles quando quiser.'
        }
        onBack={onBack}
      />
      {draft ? (
        <>
          <View style={s.card}>
            <Field
              label="Nome do conjunto"
              value={draft.name}
              onChangeText={(name) => setDraft({ ...draft, name })}
              placeholder="Ex.: Hipertrofia de outubro"
            />
            <Text style={s.small}>
              A mesma rotina pode pertencer a vários conjuntos. Editá-la atualiza todos os conjuntos
              em que ela aparece.
            </Text>
          </View>
          <View style={s.card}>
            <Text style={s.cardTitle}>Rotinas neste conjunto</Text>
            {db.routines.length ? (
              db.routines.map((routine) => {
                const checked = draft.routineIds.includes(routine.id);
                return (
                  <Pressable
                    key={routine.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    accessibilityLabel={`${checked ? 'Remover' : 'Adicionar'} ${routine.name}`}
                    onPress={() => toggle(routine.id)}
                    style={[s.noteCard, { padding: 13 }]}
                  >
                    <Icon
                      name={checked ? 'check-square' : 'square'}
                      color={checked ? c.dark : c.muted}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={s.cardTitle}>{routine.name}</Text>
                      {routine.division && <Text style={s.small}>{routine.division.name}</Text>}
                    </View>
                  </Pressable>
                );
              })
            ) : (
              <Text style={s.body}>Crie rotinas na aba Rotinas e depois vincule-as aqui.</Text>
            )}
          </View>
          <Button
            label="Salvar conjunto"
            icon="check"
            onPress={() => {
              if (onSave(draft)) setDraft(null);
            }}
          />
          <Button label="Cancelar" secondary onPress={() => setDraft(null)} />
        </>
      ) : (
        <>
          <View style={s.card}>
            <Text style={s.cardTitle}>Como funciona</Text>
            <Text style={s.body}>
              {db.strengthPaused
                ? 'Os treinos de força estão pausados. Ativar outro conjunto retoma o planejamento. Cardios, histórico e treinos em andamento continuam disponíveis.'
                : 'Só as rotinas do conjunto ativo aparecem no planejamento e nos treinos de hoje. Cardios, histórico e treinos em andamento continuam disponíveis ao trocar de conjunto.'}
            </Text>
          </View>
          {!sets.length && db.routines.length > 0 && (
            <View style={s.card}>
              <Text style={s.cardTitle}>Planejamento atual</Text>
              <Text style={s.body}>
                Suas {db.routines.length} rotinas atuais serão guardadas automaticamente no primeiro
                conjunto quando você criar uma alternativa.
              </Text>
            </View>
          )}
          {sets.map((set) => {
            const active = set.id === db.activeRoutineSetId;
            return (
              <View key={set.id} style={s.card} testID={`routine-set-${set.id}`}>
                <Text style={s.eyebrow}>
                  {active ? (db.strengthPaused ? 'ATIVO · PAUSADO' : 'ATIVO') : 'GUARDADO'}
                </Text>
                <Text style={s.cardTitle}>{set.name}</Text>
                <Text style={s.body}>{set.routineIds.length} rotinas</Text>
                {set.routineIds.map((id) => {
                  const routine = db.routines.find((item) => item.id === id);
                  return routine ? (
                    <Pressable
                      key={id}
                      accessibilityRole="button"
                      accessibilityLabel={`Ver rotina ${routine.name}`}
                      onPress={() => onOpenRoutine(routine)}
                    >
                      <Text style={s.link}>{routine.name} →</Text>
                    </Pressable>
                  ) : null;
                })}
                {!active && (
                  <Button
                    label={`Ativar ${set.name}`}
                    icon="rotate-ccw"
                    onPress={() => onActivate(set.id)}
                  />
                )}
                <Button
                  label={`Editar ${set.name}`}
                  secondary
                  icon="edit-2"
                  onPress={() => setDraft({ ...set, routineIds: [...set.routineIds] })}
                />
                <Button
                  label={`Excluir conjunto ${set.name}`}
                  secondary
                  danger
                  icon="trash-2"
                  onPress={() => onDelete(set)}
                />
              </View>
            );
          })}
          {!!sets.length && !!unassigned.length && (
            <View style={s.card}>
              <Text style={s.cardTitle}>Sem conjunto</Text>
              <Text style={s.body}>
                Estas rotinas estão guardadas, mas não aparecem no planejamento ativo.
              </Text>
              {unassigned.map((routine) => (
                <Text key={routine.id} style={s.small}>
                  {routine.name}
                </Text>
              ))}
            </View>
          )}
          <Button
            label="Novo conjunto"
            icon="plus"
            onPress={() => setDraft({ id: uid(), name: '', routineIds: [] })}
          />
        </>
      )}
    </ScrollView>
  );
}
