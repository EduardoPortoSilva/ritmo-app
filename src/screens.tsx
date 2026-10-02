import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';
import { startBackgroundRestCue, stopBackgroundRestCue } from './restCue';
import {
  allSets,
  duration,
  exerciseLoadHistory,
  exerciseTotalLoadHistory,
  formatDate,
  formatNumber,
  newExercise,
  weekdays,
  routineDays,
  routineDraftKey,
  restLabel,
  totalRoutineSets,
  validReps,
  validWeight,
  validBodyWeight,
  volume,
  type Routine,
  type Workout,
} from './model';
import { Button, Field, Icon, IconButton, Metric, PageHeader, SectionTitle, s } from './ui';
import { colors as c } from './theme';
import { LoadHistoryChart } from './LoadHistoryChart';
import { MusclePicker, MuscleLinksSummary } from './MusclePicker';
import { ExerciseMuscleModal } from './ExerciseMuscleModal';
import {
  formatRestRemaining,
  pauseRestTimer,
  restRemainingMs,
  resumeRestTimer,
  startRestTimer,
  type RestTimer,
} from './restTimer';

export function RoutineCard({
  routine,
  index,
  onStart,
  onEdit,
  onView,
  onDelete,
}: {
  routine: Routine;
  index: number;
  onStart: () => void;
  onEdit: () => void;
  onView: () => void;
  onDelete?: () => void;
}) {
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.routineBadge}>
          <Text style={s.badgeText}>{String(index + 1).padStart(2, '0')}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{routine.name}</Text>
          <Text style={s.small}>
            {routine.exercises.length} exercícios · {totalRoutineSets(routine)} séries
          </Text>
        </View>
        <IconButton name="edit-2" label={`Editar ${routine.name}`} onPress={onEdit} />
        {onDelete && (
          <IconButton name="trash-2" label={`Excluir ${routine.name}`} onPress={onDelete} />
        )}
      </View>
      <Text numberOfLines={2} style={s.body}>
        {routine.exercises.map((e) => e.name).join('  ·  ')}
      </Text>
      <Text style={s.small} accessibilityLabel={`Dias de ${routine.name}: ${routineDays(routine)}`}>
        {routineDays(routine)}
      </Text>
      {!!routine.note && <Text style={s.small}>{routine.note}</Text>}
      <Button
        label="Ver rotina"
        accessibilityLabel={`Ver rotina ${routine.name}`}
        icon="list"
        secondary
        onPress={onView}
      />
      <Button label="Iniciar treino" icon="play" secondary onPress={onStart} />
    </View>
  );
}
export function HistoryCard({ workout, onPress }: { workout: Workout; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver treino ${workout.name}, ${formatDate(workout.finishedAt!)}`}
      onPress={onPress}
      style={s.historyCard}
    >
      <View style={s.historyIcon}>
        <Icon name="check" color={c.dark} />
      </View>
      <View style={{ flex: 1, gap: 5 }}>
        <Text style={s.cardTitle}>{workout.name}</Text>
        <Text style={s.small}>
          {formatDate(workout.finishedAt!)} · {allSets(workout).filter((set) => set.done).length}{' '}
          séries · {formatNumber(volume(workout))} kg
        </Text>
      </View>
      <Icon name="chevron-right" color={c.muted} />
    </Pressable>
  );
}

export function RoutineEditor({
  initial,
  onBack,
  onSave,
  onDirtyChange,
}: {
  initial: Routine;
  onBack: () => void;
  onSave: (routine: Routine) => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [draft, setDraft] = useState<Routine>(() => JSON.parse(JSON.stringify(initial)));
  useEffect(
    () => onDirtyChange(routineDraftKey(draft) !== routineDraftKey(initial)),
    [draft, initial, onDirtyChange],
  );
  return (
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <PageHeader
        title={initial.name ? 'Editar rotina' : 'Nova rotina'}
        subtitle="Um plano simples para o seu próximo treino."
        onBack={onBack}
      />
      <RoutineFields draft={draft} setDraft={setDraft} />
      <Button label="Salvar rotina" icon="check" onPress={() => onSave(draft)} />
      <Text style={[s.small, { textAlign: 'center' }]}>
        As repetições são a meta de cada série. A carga é registrada no treino.
      </Text>
    </ScrollView>
  );
}

export function RoutineFields({
  draft,
  setDraft,
}: {
  draft: Routine;
  setDraft: React.Dispatch<React.SetStateAction<Routine>>;
}) {
  const [musclePreviewId, setMusclePreviewId] = useState<string | null>(null);
  const changeExercise = (id: string, patch: Partial<Routine['exercises'][number]>) =>
    setDraft((previous) => ({
      ...previous,
      exercises: previous.exercises.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  return (
    <>
      <View style={s.card}>
        <Field
          label="Nome da rotina"
          placeholder="Ex.: Treino A — Superiores"
          value={draft.name}
          onChangeText={(name) => setDraft({ ...draft, name })}
        />
        <Field
          label="Observações (opcional)"
          placeholder="Ex.: Priorizar a técnica dos movimentos"
          value={draft.note}
          onChangeText={(note) => setDraft({ ...draft, note })}
          multiline
        />
      </View>
      <View style={s.card}>
        <Text style={s.cardTitle}>Dias da semana</Text>
        <Text style={s.small}>
          Selecione um ou mais dias. Deixe sem seleção para uma rotina livre.
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {weekdays.map((day) => {
            const checked = draft.weekdays?.includes(day.value) ?? false;
            return (
              <Pressable
                key={day.value}
                accessibilityRole="checkbox"
                accessibilityLabel={day.label}
                accessibilityState={{ checked }}
                aria-checked={checked}
                onPress={() =>
                  setDraft((previous) => {
                    const selected = new Set(previous.weekdays ?? []);
                    if (selected.has(day.value)) selected.delete(day.value);
                    else selected.add(day.value);
                    return {
                      ...previous,
                      weekdays: weekdays
                        .filter((item) => selected.has(item.value))
                        .map((item) => item.value),
                    };
                  })
                }
                style={{
                  width: 64,
                  minHeight: 44,
                  borderRadius: 10,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: checked ? c.dark : c.soft,
                }}
              >
                <Text style={{ color: checked ? c.lime : c.ink, fontWeight: '700' }}>
                  {day.short}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <SectionTitle title={`Exercícios (${draft.exercises.length})`} />
      {draft.exercises.map((exercise, index) => (
        <View key={exercise.id} style={s.card}>
          <View style={s.cardHeader}>
            <Text style={[s.eyebrow, { flex: 1 }]}>
              EXERCÍCIO {String(index + 1).padStart(2, '0')}
            </Text>
            <IconButton
              name="help-circle"
              label={`Ver mapa muscular do exercício ${index + 1}`}
              onPress={() => setMusclePreviewId(exercise.id)}
            />
            <IconButton
              name="trash-2"
              label={`Remover exercício ${index + 1}`}
              onPress={() =>
                setDraft({
                  ...draft,
                  exercises: draft.exercises.filter((e) => e.id !== exercise.id),
                })
              }
            />
          </View>
          <Field
            label={`Nome do exercício ${index + 1}`}
            value={exercise.name}
            placeholder="Ex.: Supino reto"
            onChangeText={(name) => changeExercise(exercise.id, { name })}
          />
          <View style={s.sectionHeader}>
            <Text style={s.fieldLabel}>Metas por série</Text>
            <Text style={s.small}>{exercise.reps.length} séries</Text>
          </View>
          <MusclePicker
            exerciseNumber={index + 1}
            links={exercise.muscles}
            onChange={(muscles) => changeExercise(exercise.id, { muscles })}
          />
          {exercise.reps.map((rep, setIndex) => (
            <React.Fragment key={setIndex}>
              <View style={s.row}>
                <Text style={[s.small, { width: 42 }]}>Série {setIndex + 1}</Text>
                <Field
                  label="Reps"
                  accessibilityLabel={`Repetições exercício ${index + 1} série ${setIndex + 1}`}
                  numeric
                  value={rep}
                  onChangeText={(value) =>
                    changeExercise(exercise.id, {
                      reps: exercise.reps.map((r, i) => (i === setIndex ? value : r)),
                    })
                  }
                />
                <Field
                  label="Descanso (s)"
                  accessibilityLabel={`Descanso exercício ${index + 1} série ${setIndex + 1}`}
                  numeric
                  placeholder="Opcional"
                  value={exercise.rests?.[setIndex] ?? ''}
                  onChangeText={(value) =>
                    changeExercise(exercise.id, {
                      rests: exercise.reps.map((_, i) =>
                        i === setIndex ? value : (exercise.rests?.[i] ?? ''),
                      ),
                    })
                  }
                />
                <IconButton
                  name="minus-circle"
                  label={`Remover série ${setIndex + 1} do exercício ${index + 1}`}
                  onPress={() =>
                    changeExercise(exercise.id, {
                      reps: exercise.reps.filter((_, i) => i !== setIndex),
                      rests: exercise.reps
                        .map((_, i) => exercise.rests?.[i] ?? '')
                        .filter((_, i) => i !== setIndex),
                    })
                  }
                />
              </View>
              {setIndex === 0 && exercise.reps.length > 1 && (
                <View style={{ gap: 10 }}>
                  <Text style={s.small}>Usar os valores da série 1 nas demais?</Text>
                  <Button
                    label="Repetições da série 1 para todas"
                    accessibilityLabel={`Aplicar repetições da série 1 a todas · exercício ${index + 1}`}
                    secondary
                    disabled={!exercise.reps.length}
                    onPress={() =>
                      changeExercise(exercise.id, {
                        reps: exercise.reps.map(() => exercise.reps[0]),
                      })
                    }
                  />
                  <Button
                    label="Descanso da série 1 para todas"
                    accessibilityLabel={`Aplicar descanso da série 1 a todas · exercício ${index + 1}`}
                    secondary
                    disabled={!exercise.reps.length}
                    onPress={() =>
                      changeExercise(exercise.id, {
                        rests: exercise.reps.map(() => exercise.rests?.[0] ?? ''),
                      })
                    }
                  />
                </View>
              )}
            </React.Fragment>
          ))}
          <Text style={s.small}>
            Ajustes individuais continuam livres. Descanso em segundos; vazio = não definido.
          </Text>
          <Button
            label="Adicionar série"
            icon="plus"
            secondary
            disabled={exercise.reps.length >= 20}
            onPress={() =>
              changeExercise(exercise.id, {
                reps: [...exercise.reps, exercise.reps.at(-1) ?? '12'],
                rests: [
                  ...exercise.reps.map((_, i) => exercise.rests?.[i] ?? ''),
                  exercise.rests?.at(-1) ?? '',
                ],
              })
            }
          />
        </View>
      ))}
      <Button
        label="Adicionar exercício"
        icon="plus"
        secondary
        onPress={() => setDraft({ ...draft, exercises: [...draft.exercises, newExercise()] })}
      />
      <ExerciseMuscleModal
        exercise={draft.exercises.find((item) => item.id === musclePreviewId) ?? null}
        onClose={() => setMusclePreviewId(null)}
      />
    </>
  );
}

export type RoutineViewState = { scrollY: number; expandedExercises: string[] };

export function RoutineDetail({
  routine,
  initialViewState,
  onBack,
  onEdit,
  onStart,
  onDelete,
  onCoverage,
}: {
  routine: Routine;
  initialViewState?: RoutineViewState;
  onBack: () => void;
  onEdit: (viewState: RoutineViewState) => void;
  onStart: () => void;
  onDelete: () => void;
  onCoverage: () => void;
}) {
  const scroll = useRef<ScrollView>(null);
  const scrollY = useRef(initialViewState?.scrollY ?? 0);
  const restoreScroll = useRef(true);
  const [expandedExercises, setExpandedExercises] = useState(
    initialViewState?.expandedExercises ?? [],
  );
  const [musclePreviewId, setMusclePreviewId] = useState<string | null>(null);
  return (
    <ScrollView
      ref={scroll}
      testID="routine-reading"
      contentContainerStyle={s.content}
      scrollEventThrottle={16}
      onScroll={(event) => {
        scrollY.current = event.nativeEvent.contentOffset.y;
      }}
      onContentSizeChange={() => {
        if (restoreScroll.current) {
          scroll.current?.scrollTo({ y: initialViewState?.scrollY ?? 0, animated: false });
          restoreScroll.current = false;
        }
      }}
    >
      <PageHeader title={routine.name} subtitle="Confira sua rotina" onBack={onBack} />
      <View style={s.card}>
        <Text style={s.body}>
          {routine.exercises.length} exercícios · {totalRoutineSets(routine)} séries
        </Text>
        <Text style={s.small}>{routineDays(routine)}</Text>
        {!!routine.note && <Text style={s.body}>{routine.note}</Text>}
        <Button label="Iniciar treino" icon="play" onPress={onStart} />
        <Button label="Cobertura muscular" secondary icon="activity" onPress={onCoverage} />
        <Button
          label={`Editar ${routine.name}`}
          icon="edit-2"
          secondary
          onPress={() => onEdit({ scrollY: scrollY.current, expandedExercises })}
        />
      </View>
      {routine.exercises.map((exercise, index) => {
        const sameTargets =
          exercise.reps.length > 1 &&
          exercise.reps.every(
            (rep, i) =>
              rep === exercise.reps[0] &&
              (exercise.rests?.[i] ?? '') === (exercise.rests?.[0] ?? ''),
          );
        const expanded = expandedExercises.includes(exercise.id);
        return (
          <View key={exercise.id} style={s.card} testID={`routine-exercise-${index + 1}`}>
            <Text style={s.eyebrow}>EXERCÍCIO {index + 1}</Text>
            <View style={s.sectionHeader}>
              <Text style={[s.cardTitle, { flex: 1 }]}>{exercise.name}</Text>
              <IconButton
                name="help-circle"
                label={`Ver mapa muscular de ${exercise.name}`}
                onPress={() => setMusclePreviewId(exercise.id)}
              />
            </View>
            <MuscleLinksSummary links={exercise.muscles} />
            {sameTargets && (
              <>
                <Text style={s.fieldLabel}>
                  {exercise.reps.length} × {exercise.reps[0]} repetições ·{' '}
                  {restLabel(exercise.rests?.[0])}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${expanded ? 'Ocultar' : 'Ver'} séries de ${exercise.name}`}
                  accessibilityState={{ expanded }}
                  aria-expanded={expanded}
                  onPress={() =>
                    setExpandedExercises((previous) =>
                      expanded
                        ? previous.filter((id) => id !== exercise.id)
                        : [...previous, exercise.id],
                    )
                  }
                  style={[s.button, s.secondaryButton]}
                >
                  <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={18} />
                  <Text style={s.buttonText}>{expanded ? 'Ocultar séries' : 'Ver séries'}</Text>
                </Pressable>
              </>
            )}
            {(!sameTargets || expanded) &&
              exercise.reps.map((rep, i) => (
                <View key={i} style={s.detailRow}>
                  <Text style={s.small}>Série {i + 1}</Text>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={s.fieldLabel}>{rep} repetições</Text>
                    <Text style={s.small}>{restLabel(exercise.rests?.[i])}</Text>
                  </View>
                </View>
              ))}
          </View>
        );
      })}
      <Button
        label={`Excluir ${routine.name}`}
        icon="trash-2"
        danger
        secondary
        onPress={onDelete}
      />
      <ExerciseMuscleModal
        exercise={routine.exercises.find((item) => item.id === musclePreviewId) ?? null}
        onClose={() => setMusclePreviewId(null)}
      />
    </ScrollView>
  );
}

export function WorkoutScreen({
  workout,
  history,
  onBack,
  onChange,
  onFinish,
  onCancel,
  onError,
}: {
  workout: Workout;
  history: readonly Workout[];
  onBack: () => void;
  onChange: (workout: Workout) => void;
  onFinish: () => void;
  onCancel: () => void;
  onError: (message: string) => void;
}) {
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [musclePreviewId, setMusclePreviewId] = useState<string | null>(null);
  const [restTimer, setRestTimer] = useState<RestTimer | null>(null);
  const [now, setNow] = useState(Date.now);
  const cuePlayer = useAudioPlayer(require('../assets/cardio-cue.wav'));
  const completionPlayed = useRef(false);
  const nativeCueStarted = useRef(false);
  const scroll = useRef<ScrollView>(null);
  const exercise = workout.exercises[exerciseIndex];
  const loadHistory = exercise ? exerciseLoadHistory(history, workout.routineId, exercise.id) : [];
  const sets = allSets(workout);
  const done = sets.filter((set) => set.done).length;
  const restLeft = restTimer ? restRemainingMs(restTimer, now) : 0;
  const restingExercise = restTimer
    ? workout.exercises.find((item) => item.id === restTimer.exerciseId)
    : undefined;
  const restingSetIndex = restingExercise?.sets.findIndex((set) => set.id === restTimer?.setId);
  useEffect(() => {
    void setAudioModeAsync({
      interruptionMode: 'duckOthers',
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    });
  }, []);
  useEffect(() => () => stopBackgroundRestCue(), []);
  function scheduleRestCue(remainingMs: number) {
    try {
      nativeCueStarted.current = startBackgroundRestCue(remainingMs);
      if (Platform.OS === 'android' && !nativeCueStarted.current)
        onError(
          'O aviso em segundo plano n\u00e3o est\u00e1 dispon\u00edvel nesta instala\u00e7\u00e3o.',
        );
    } catch {
      nativeCueStarted.current = false;
      onError(
        'N\u00e3o foi poss\u00edvel iniciar o aviso em segundo plano. O cron\u00f4metro continua na tela.',
      );
    }
  }
  useEffect(() => {
    if (restTimer?.runningSince === null || !restTimer) return;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [restTimer?.runningSince]);
  useEffect(() => {
    if (!restTimer || restTimer.runningSince === null || restLeft > 0 || completionPlayed.current)
      return;
    completionPlayed.current = true;
    setRestTimer((current) => (current ? pauseRestTimer(current, now) : current));
    if (!nativeCueStarted.current) void cuePlayer.seekTo(0).then(() => cuePlayer.play());
  }, [restTimer, restLeft, now, cuePlayer]);
  function toggleRest(exerciseId: string, setId: string, seconds: number) {
    const pressedAt = Date.now();
    setNow(pressedAt);
    if (restTimer?.exerciseId === exerciseId && restTimer.setId === setId && restLeft > 0) {
      if (restTimer.runningSince === null) {
        const resumed = resumeRestTimer(restTimer, pressedAt);
        setRestTimer(resumed);
        scheduleRestCue(resumed.remainingMs);
      } else {
        setRestTimer(pauseRestTimer(restTimer, pressedAt));
        stopBackgroundRestCue();
        nativeCueStarted.current = false;
      }
      return;
    }
    completionPlayed.current = false;
    cuePlayer.pause();
    stopBackgroundRestCue();
    const started = startRestTimer(exerciseId, setId, seconds, pressedAt);
    setRestTimer(started);
    scheduleRestCue(started.remainingMs);
  }
  function navigateExercise(index: number) {
    Keyboard.dismiss();
    setExerciseIndex(index);
    scroll.current?.scrollTo({ y: 0, animated: false });
  }
  function patch(
    exerciseId: string,
    setId: string,
    changes: Partial<Workout['exercises'][number]['sets'][number]>,
  ) {
    onChange({
      ...workout,
      exercises: workout.exercises.map((e) =>
        e.id === exerciseId
          ? { ...e, sets: e.sets.map((set) => (set.id === setId ? { ...set, ...changes } : set)) }
          : e,
      ),
    });
  }
  return (
    <ScrollView ref={scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <PageHeader
        title={workout.name}
        subtitle="Seu treino está em andamento. Vamos nessa."
        onBack={onBack}
      />
      {exercise && loadHistory.length > 0 ? (
        <LoadHistoryChart
          key={`chart-${exercise.id}`}
          records={loadHistory}
          totals={exerciseTotalLoadHistory(history, workout.routineId, exercise.id)}
          exerciseName={exercise.name}
        />
      ) : (
        <View style={s.progressCard}>
          <View style={s.sectionHeader}>
            <Text style={s.fieldLabel}>Um passo de cada vez</Text>
            <Text style={s.link}>
              {done}/{sets.length} séries
            </Text>
          </View>
          <View style={s.progressTrack}>
            <View
              style={[
                s.progressFill,
                { width: `${sets.length ? (done / sets.length) * 100 : 0}%` },
              ]}
            />
          </View>
          <Text style={s.small}>Preencha as repetições e a carga, depois marque ✓.</Text>
        </View>
      )}
      {restTimer && restTimer.exerciseId !== exercise?.id && restLeft > 0 && (
        <View style={s.noteCard} testID="rest-other-exercise">
          <View style={{ flex: 1 }}>
            <Text style={s.fieldLabel}>Descanso em andamento</Text>
            <Text style={s.small}>
              {restingExercise?.name} · série {(restingSetIndex ?? 0) + 1} ·{' '}
              {formatRestRemaining(restLeft)} restantes
            </Text>
          </View>
          <IconButton
            name={restTimer.runningSince === null ? 'play' : 'pause'}
            label={restTimer.runningSince === null ? 'Retomar descanso' : 'Pausar descanso'}
            onPress={() => {
              const seconds = restTimer.durationMs / 1000;
              toggleRest(restTimer.exerciseId, restTimer.setId, seconds);
            }}
          />
        </View>
      )}
      {exercise && (
        <View style={s.card} key={exercise.id}>
          <Text style={s.small}>
            Exercício {exerciseIndex + 1} de {workout.exercises.length}
          </Text>
          <View style={s.cardHeader}>
            <View style={s.routineBadge}>
              <Text style={s.badgeText}>{String(exerciseIndex + 1).padStart(2, '0')}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{exercise.name}</Text>
              <Text style={s.small}>
                {exercise.sets.filter((set) => set.done).length} de {exercise.sets.length} séries
                concluídas
              </Text>
            </View>
            <IconButton
              name="help-circle"
              label={`Ver mapa muscular de ${exercise.name}`}
              onPress={() => setMusclePreviewId(exercise.id)}
            />
          </View>
          <View style={s.setRow}>
            <Text style={[s.tableHeading, { width: 36 }]}>SÉRIE</Text>
            <Text style={[s.tableHeading, { flex: 1 }]}>REPS</Text>
            <Text style={[s.tableHeading, { flex: 1 }]}>KG</Text>
            <Text style={[s.tableHeading, { width: 44, textAlign: 'center' }]}>FEITO</Text>
          </View>
          {exercise.sets.map((set, i) => (
            <View key={set.id}>
              <View style={[s.setRow, set.done && s.completedRow]}>
                <Text style={[s.setIndex, { width: 36 }]}>{String(i + 1).padStart(2, '0')}</Text>
                <View style={{ flex: 1 }}>
                  <TextInput
                    accessibilityLabel={`${exercise.name} série ${i + 1} repetições`}
                    keyboardType="number-pad"
                    maxLength={3}
                    value={set.reps}
                    onChangeText={(reps) => patch(exercise.id, set.id, { reps, done: false })}
                    style={s.setInput}
                  />
                  <Text style={s.target}>meta: {set.target}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    accessibilityLabel={`${exercise.name} série ${i + 1} carga em kg`}
                    keyboardType="decimal-pad"
                    maxLength={8}
                    value={set.weight}
                    placeholder="0"
                    placeholderTextColor={c.muted}
                    onChangeText={(weight) => patch(exercise.id, set.id, { weight, done: false })}
                    style={s.setInput}
                  />
                  <Text style={s.target}>kg</Text>
                </View>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityLabel={`Concluir ${exercise.name} série ${i + 1}`}
                  accessibilityState={{ checked: set.done }}
                  aria-checked={set.done}
                  onPress={() => {
                    if (!set.done && (!validReps(set.reps) || !validWeight(set.weight))) {
                      onError(
                        'Informe de 1 a 999 repetições e uma carga de 0 a 9.999 kg. Para exercícios sem carga, digite 0.',
                      );
                      return;
                    }
                    patch(exercise.id, set.id, { done: !set.done });
                  }}
                  style={[s.check, set.done && { backgroundColor: c.dark, borderColor: c.dark }]}
                >
                  <Icon name="check" color={set.done ? c.lime : c.muted} size={19} />
                </Pressable>
              </View>
              <View style={[s.row, { justifyContent: 'space-between', paddingTop: 5 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.small}>{`Série ${i + 1} · ${restLabel(set.rest)}`}</Text>
                  {restTimer?.exerciseId === exercise.id && restTimer.setId === set.id && (
                    <Text
                      accessibilityLiveRegion="polite"
                      testID={`rest-remaining-${set.id}`}
                      style={[s.fieldLabel, { color: restLeft === 0 ? c.dark : c.ink }]}
                    >
                      {restLeft === 0
                        ? 'Descanso concluído'
                        : `${formatRestRemaining(restLeft)} restantes${restTimer.runningSince === null ? ' · pausado' : ''}`}
                    </Text>
                  )}
                </View>
                {set.rest !== undefined && Number(set.rest) > 0 && (
                  <IconButton
                    name={
                      restTimer?.exerciseId === exercise.id &&
                      restTimer.setId === set.id &&
                      restTimer.runningSince !== null &&
                      restLeft > 0
                        ? 'pause'
                        : 'play'
                    }
                    label={
                      restTimer?.exerciseId === exercise.id && restTimer.setId === set.id
                        ? restLeft === 0
                          ? `Reiniciar descanso de ${exercise.name} série ${i + 1}`
                          : restTimer.runningSince === null
                            ? `Retomar descanso de ${exercise.name} série ${i + 1}`
                            : `Pausar descanso de ${exercise.name} série ${i + 1}`
                        : `Iniciar descanso de ${exercise.name} série ${i + 1}`
                    }
                    onPress={() => toggleRest(exercise.id, set.id, Number(set.rest))}
                  />
                )}
              </View>
            </View>
          ))}
        </View>
      )}
      {workout.exercises.length > 1 && (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Button
              label="Anterior"
              icon="arrow-left"
              secondary
              disabled={exerciseIndex === 0}
              onPress={() => navigateExercise(exerciseIndex - 1)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label="Próximo"
              icon="arrow-right"
              disabled={exerciseIndex === workout.exercises.length - 1}
              onPress={() => navigateExercise(exerciseIndex + 1)}
            />
          </View>
        </View>
      )}
      <Text style={s.small}>
        Sem carga externa? Registre 0 kg. Alterar uma série desmarca sua conclusão para você
        conferir novamente.
      </Text>
      <Button label="Finalizar treino" icon="check-circle" onPress={onFinish} />
      <Button label="Continuar depois" secondary icon="pause" onPress={onBack} />
      <Pressable accessibilityRole="button" onPress={onCancel} style={s.textButton}>
        <Text style={{ color: c.danger }}>Descartar treino</Text>
      </Pressable>
      <ExerciseMuscleModal
        exercise={workout.exercises.find((item) => item.id === musclePreviewId) ?? null}
        onClose={() => setMusclePreviewId(null)}
      />
    </ScrollView>
  );
}

export function FinishWorkoutScreen({
  workout,
  initialWeight,
  onBack,
  onSave,
}: {
  workout: Workout;
  initialWeight: string;
  onBack: () => void;
  onSave: (weight: string) => void;
}) {
  const [weight, setWeight] = useState(initialWeight);
  const [error, setError] = useState('');
  const pending = allSets(workout).filter((set) => !set.done).length;
  return (
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <PageHeader title="Finalizar treino" subtitle={workout.name} onBack={onBack} />
      <View style={s.card}>
        <Text style={s.cardTitle}>Seu peso hoje</Text>
        <Text style={s.small}>
          {initialWeight
            ? 'Preenchemos com seu último peso registrado. Você pode atualizar ou apagar o valor.'
            : 'Registre seu peso corporal, se quiser. Você também pode deixar em branco.'}
        </Text>
        <Field
          label="Peso corporal (kg)"
          value={weight}
          onChangeText={(value) => {
            setWeight(value);
            setError('');
          }}
          placeholder="Ex.: 75,5"
          numeric
        />
        {!!error && (
          <Text accessibilityRole="alert" style={{ color: c.danger }}>
            {error}
          </Text>
        )}
        <Text style={s.small}>Opcional · salvo junto com este treino.</Text>
      </View>
      <View style={s.progressCard}>
        <Text style={s.fieldLabel}>
          {pending ? 'Finalizar com séries pendentes?' : 'Treino feito. Boa!'}
        </Text>
        <Text style={s.small}>
          {pending
            ? `${pending} série(s) não concluída(s) ficarão como não realizadas no histórico.`
            : 'Seu treino será salvo no histórico com todas as cargas e repetições.'}
        </Text>
      </View>
      <Button
        label="Salvar treino"
        icon="check-circle"
        onPress={() => {
          if (weight.trim() && !validBodyWeight(weight)) {
            setError('Informe um peso maior que 0 e até 999 kg.');
            return;
          }
          Keyboard.dismiss();
          onSave(weight.trim());
        }}
      />
      <Button label="Voltar ao treino" secondary onPress={onBack} />
    </ScrollView>
  );
}

export function WorkoutDetail({
  workout,
  onBack,
  onDelete,
}: {
  workout: Workout;
  onBack: () => void;
  onDelete: () => void;
}) {
  const [musclePreviewId, setMusclePreviewId] = useState<string | null>(null);
  return (
    <ScrollView contentContainerStyle={s.content}>
      <PageHeader
        title={workout.name}
        subtitle={`${new Date(workout.finishedAt!).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}`}
        onBack={onBack}
      />
      {workout.bodyWeight !== undefined && (
        <View style={s.card}>
          <Text style={s.small}>Peso corporal</Text>
          <Text style={s.cardTitle}>
            {formatNumber(Number(workout.bodyWeight.replace(',', '.')))} kg
          </Text>
        </View>
      )}
      <View style={s.metrics}>
        <Metric
          value={String(allSets(workout).filter((set) => set.done).length)}
          label="séries feitas"
        />
        <View style={s.divider} />
        <Metric value={formatNumber(volume(workout))} label="volume (kg)" />
        <View style={s.divider} />
        <Metric value={String(duration(workout))} label="minutos decorridos" />
      </View>
      {workout.exercises.map((exercise) => (
        <View style={s.card} key={exercise.id}>
          <View style={s.sectionHeader}>
            <Text style={[s.cardTitle, { flex: 1 }]}>{exercise.name}</Text>
            <IconButton
              name="help-circle"
              label={`Ver mapa muscular de ${exercise.name}`}
              onPress={() => setMusclePreviewId(exercise.id)}
            />
          </View>
          {exercise.sets.map((set, i) => (
            <View key={set.id}>
              <View style={s.detailRow}>
                <Text style={s.small}>Série {i + 1}</Text>
                <Text style={[s.fieldLabel, { flex: 1, textAlign: 'right' }]}>
                  {set.done
                    ? `${set.reps} reps × ${formatNumber(Number(set.weight.replace(',', '.')))} kg`
                    : 'Não realizada'}
                </Text>
                <Icon
                  name={set.done ? 'check-circle' : 'minus-circle'}
                  size={16}
                  color={set.done ? c.dark : c.muted}
                />
              </View>
              <Text style={s.small}>{restLabel(set.rest)}</Text>
            </View>
          ))}
        </View>
      ))}
      <Text style={s.small}>
        Volume = soma das repetições × carga de cada série concluída. O tempo inclui pausas desde o
        início do treino.
      </Text>
      <Button label="Excluir registro" danger secondary icon="trash-2" onPress={onDelete} />
      <ExerciseMuscleModal
        exercise={workout.exercises.find((item) => item.id === musclePreviewId) ?? null}
        onClose={() => setMusclePreviewId(null)}
      />
    </ScrollView>
  );
}
