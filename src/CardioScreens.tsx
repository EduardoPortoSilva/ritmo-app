import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { weekdays } from './model';
import {
  cardioDraftKey,
  cardioCueBoundary,
  cardioDistanceValue,
  cardioPlanDuration,
  cardioProgress,
  cardioDuration,
  expectedCardioDistance,
  cardioDistanceDifference,
  formatCardioSpeed,
  formatCardioTime,
  newCardioStep,
  validCardioDistance,
  type CardioRoutine,
  type CardioRun,
  type CardioSession,
} from './cardio';
import { colors as c } from './theme';
import { Button, Field, IconButton, PageHeader, s } from './ui';

const daySummary = (routine: CardioRoutine) =>
  weekdays
    .filter((day) => routine.weekdays?.includes(day.value))
    .map((day) => day.short)
    .join(' · ') || 'Sem dia definido';

export function CardioRoutineCard({
  routine,
  onStart,
  onEdit,
  onDelete,
}: {
  routine: CardioRoutine;
  onStart: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={s.card}>
      <Text style={s.eyebrow}>CARDIO · {daySummary(routine)}</Text>
      <Text style={s.cardTitle}>{routine.name}</Text>
      <Text style={s.body}>
        {routine.steps.length} {routine.steps.length === 1 ? 'etapa' : 'etapas'} ·{' '}
        {formatCardioTime(cardioPlanDuration(routine))} no total
      </Text>
      <Text style={s.small} numberOfLines={2}>
        {routine.steps
          .map((step) => `${formatCardioSpeed(Number(step.speed.replace(',', '.')))} km/h`)
          .join(' → ')}
      </Text>
      <Button label={`Iniciar cardio ${routine.name}`} icon="play" onPress={onStart} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Button
            label={`Editar cardio ${routine.name}`}
            secondary
            icon="edit-2"
            onPress={onEdit}
          />
        </View>
        <IconButton name="trash-2" label={`Excluir cardio ${routine.name}`} onPress={onDelete} />
      </View>
    </View>
  );
}

export function CardioEditor({
  initial,
  onBack,
  onSave,
  onDirtyChange,
}: {
  initial: CardioRoutine;
  onBack: () => void;
  onSave: (routine: CardioRoutine) => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [draft, setDraft] = useState<CardioRoutine>(() => JSON.parse(JSON.stringify(initial)));
  useEffect(
    () => onDirtyChange(cardioDraftKey(draft) !== cardioDraftKey(initial)),
    [draft, initial, onDirtyChange],
  );
  const changeStep = (stepId: string, patch: Partial<CardioRoutine['steps'][number]>) =>
    setDraft((previous) => ({
      ...previous,
      steps: previous.steps.map((step) => (step.id === stepId ? { ...step, ...patch } : step)),
    }));
  return (
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <PageHeader
        title={initial.name ? 'Editar cardio' : 'Novo cardio'}
        subtitle="Defina a velocidade de cada etapa e os dias da semana."
        onBack={onBack}
      />
      <View style={s.card}>
        <Field
          label="Nome do cardio"
          placeholder="Ex.: HIIT na esteira"
          value={draft.name}
          onChangeText={(name) => setDraft((previous) => ({ ...previous, name }))}
        />
      </View>
      <View style={s.card}>
        <Text style={s.cardTitle}>Dias da semana</Text>
        <Text style={s.small}>Deixe sem seleção para fazer quando quiser.</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {weekdays.map((day) => {
            const checked = draft.weekdays?.includes(day.value) ?? false;
            return (
              <Pressable
                key={day.value}
                accessibilityRole="checkbox"
                accessibilityLabel={`Cardio · ${day.label}`}
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
      <View style={s.card}>
        <Text style={s.cardTitle}>Etapas</Text>
        <Text style={s.small}>
          Informe a duração em minutos e a velocidade em km/h. Meio minuto: 0,5.
        </Text>
        {draft.steps.map((step, index) => (
          <View
            key={step.id}
            style={[s.noteCard, { flexDirection: 'column', alignItems: 'stretch', gap: 12 }]}
          >
            <View style={[s.row, { justifyContent: 'space-between' }]}>
              <Text style={s.cardTitle}>Etapa {index + 1}</Text>
              {draft.steps.length > 1 && (
                <IconButton
                  name="trash-2"
                  label={`Remover etapa ${index + 1}`}
                  onPress={() =>
                    setDraft((previous) => ({
                      ...previous,
                      steps: previous.steps.filter((item) => item.id !== step.id),
                    }))
                  }
                />
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Field
                label={`Duração da etapa ${index + 1} (min)`}
                value={step.minutes}
                numeric
                onChangeText={(minutes) => changeStep(step.id, { minutes })}
              />
              <Field
                label={`Velocidade da etapa ${index + 1} (km/h)`}
                value={step.speed}
                numeric
                onChangeText={(speed) => changeStep(step.id, { speed })}
              />
            </View>
          </View>
        ))}
        <Button
          label="Adicionar etapa"
          secondary
          icon="plus"
          onPress={() =>
            setDraft((previous) => ({
              ...previous,
              steps: [...previous.steps, newCardioStep(previous.steps.at(-1))],
            }))
          }
          disabled={draft.steps.length >= 50}
        />
      </View>
      <Button label="Salvar cardio" icon="check" onPress={() => onSave(draft)} />
      <Text style={[s.small, { textAlign: 'center' }]}>
        O app mostra a velocidade; ajuste a esteira manualmente.
      </Text>
    </ScrollView>
  );
}

function RunningKeepAwake() {
  useKeepAwake();
  return null;
}

export function CardioPlayer({
  run,
  onBack,
  onPause,
  onResume,
  onStop,
}: {
  run: CardioRun;
  onBack: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}) {
  const [now, setNow] = useState(Date.now);
  const cuePlayer = useAudioPlayer(require('../assets/cardio-cue.wav'));
  const lastCue = useRef(-1);
  useEffect(() => {
    void setAudioModeAsync({
      interruptionMode: 'duckOthers',
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    });
  }, []);
  useEffect(() => {
    if (!run.runningSince) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [run.runningSince]);
  useEffect(() => {
    if (!run.runningSince) {
      cuePlayer.pause();
      return;
    }
    const boundary = cardioCueBoundary(run, now);
    if (boundary === null || boundary === lastCue.current) return;
    lastCue.current = boundary;
    void cuePlayer.seekTo(0).then(() => cuePlayer.play());
  }, [now, run.runningSince, cuePlayer]);
  const progress = cardioProgress(run, now);
  const current = run.steps[progress.index];
  const next = run.steps[progress.index + 1];
  const running = !!run.runningSince && !progress.complete;
  return (
    <ScrollView contentContainerStyle={s.content} testID="cardio-player">
      {running && <RunningKeepAwake />}
      <PageHeader
        title={run.name}
        subtitle="Acompanhe a velocidade de cada etapa."
        onBack={onBack}
      />
      <View
        style={[s.card, { backgroundColor: c.dark, alignItems: 'center', paddingVertical: 32 }]}
      >
        <Text style={[s.eyebrow, { color: c.lime }]}>
          {progress.complete
            ? 'CARDIO CONCLUÍDO'
            : run.runningSince
              ? `ETAPA ${progress.index + 1} DE ${run.steps.length}`
              : progress.elapsedMs
                ? 'PAUSADO'
                : 'PRONTO PARA COMEÇAR'}
        </Text>
        <Text style={[s.small, { color: '#C7D7C9' }]}>VELOCIDADE AGORA</Text>
        <Text
          accessibilityLiveRegion="polite"
          testID="cardio-speed"
          style={{ color: c.lime, fontSize: 88, fontWeight: '800', lineHeight: 105 }}
        >
          {current ? formatCardioSpeed(current.speed) : '✓'}
        </Text>
        {current && <Text style={[s.cardTitle, { color: c.paper }]}>km/h</Text>}
        <Text style={[s.small, { color: '#C7D7C9', marginTop: 12 }]}>
          {progress.complete ? 'Todas as etapas terminaram.' : 'Tempo restante nesta etapa'}
        </Text>
        {!progress.complete && (
          <Text
            testID="cardio-remaining"
            style={{ color: c.paper, fontSize: 40, fontWeight: '700' }}
          >
            {formatCardioTime(progress.remainingSeconds)}
          </Text>
        )}
        {!progress.complete && (
          <View style={{ alignSelf: 'stretch', marginTop: 10 }}>
            {running ? (
              <Button label="Pausar cardio" icon="pause" onPress={onPause} />
            ) : (
              <Button
                label={progress.elapsedMs ? 'Retomar cardio' : 'Iniciar cardio agora'}
                icon="play"
                onPress={onResume}
              />
            )}
          </View>
        )}
      </View>
      <View style={s.card}>
        <Text style={s.cardTitle}>
          Tempo total: {formatCardioTime(progress.elapsedSeconds)} /{' '}
          {formatCardioTime(progress.totalSeconds)}
        </Text>
        {next && (
          <Text style={s.body}>
            Próxima etapa: {formatCardioSpeed(next.speed)} km/h por{' '}
            {formatCardioTime(next.durationSeconds)}
          </Text>
        )}
        <Text style={s.small}>
          A velocidade é uma indicação visual. Ajuste o aparelho manualmente.
        </Text>
      </View>
      {progress.complete ? <Button label="Encerrar cardio" icon="check" onPress={onStop} /> : null}
      {!progress.complete && (
        <Button label="Encerrar cardio" secondary icon="square" onPress={onStop} />
      )}
      <View style={s.card}>
        <Text style={s.cardTitle}>Sequência</Text>
        {run.steps.map((step, index) => (
          <View
            key={index}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 10,
              borderBottomWidth: index === run.steps.length - 1 ? 0 : 1,
              borderBottomColor: c.line,
            }}
          >
            <Text
              style={[s.body, index === progress.index && { color: c.dark, fontWeight: '800' }]}
            >
              {index + 1}. {formatCardioTime(step.durationSeconds)}
            </Text>
            <Text
              style={[s.body, index === progress.index && { color: c.dark, fontWeight: '800' }]}
            >
              {formatCardioSpeed(step.speed)} km/h
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const km = (value: number) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
const distanceFeedback = (actual: number, expected: number) => {
  const difference = cardioDistanceDifference(actual, expected);
  return difference === 0
    ? 'Distância dentro do esperado'
    : `${difference > 0 ? '+' : '−'}${km(Math.abs(difference))} km ${difference > 0 ? 'acima' : 'abaixo'} do esperado`;
};

export function CardioFinish({
  run,
  onBack,
  onSave,
  onError,
}: {
  run: CardioRun;
  onBack: () => void;
  onSave: (distanceKm: string) => void;
  onError: (message: string) => void;
}) {
  const [distance, setDistance] = useState('');
  const progress = cardioProgress(run);
  const expected = expectedCardioDistance(run.steps, progress.elapsedMs);
  const actual =
    distance.trim() && validCardioDistance(distance) ? cardioDistanceValue(distance) : null;
  return (
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <PageHeader title="Finalizar cardio" subtitle={run.name} onBack={onBack} />
      <View style={s.card}>
        <Text style={s.eyebrow}>
          {progress.complete ? 'SEQUÊNCIA COMPLETA' : 'SEQUÊNCIA PARCIAL'}
        </Text>
        <Text style={s.cardTitle}>Distância esperada: {km(expected)} km</Text>
        <Text style={s.small}>
          Calculada pelas velocidades e pelo tempo realizado:{' '}
          {formatCardioTime(progress.elapsedSeconds)} de {formatCardioTime(progress.totalSeconds)}.
        </Text>
      </View>
      <View style={s.card}>
        <Field
          label="Distância percorrida (km) · opcional"
          accessibilityLabel="Distância percorrida (km)"
          value={distance}
          onChangeText={setDistance}
          numeric
          placeholder="Ex.: 2,35"
        />
        {actual !== null && (
          <Text style={s.cardTitle} testID="cardio-distance-feedback">
            {distanceFeedback(actual, expected)}
          </Text>
        )}
      </View>
      <Button
        label="Salvar cardio no histórico"
        icon="check"
        onPress={() =>
          validCardioDistance(distance)
            ? onSave(distance)
            : onError('Informe a distância em km ou deixe em branco.')
        }
      />
    </ScrollView>
  );
}

export function CardioHistoryCard({
  session,
  onPress,
}: {
  session: CardioSession;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver cardio ${session.name}`}
      onPress={onPress}
      style={s.historyCard}
    >
      <View style={s.historyIcon}>
        <Text style={s.cardTitle}>↗</Text>
      </View>
      <View style={{ flex: 1, gap: 5 }}>
        <Text style={s.cardTitle}>{session.name}</Text>
        <Text style={s.small}>
          {new Date(session.finishedAt).toLocaleString('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short',
          })}{' '}
          · {formatCardioTime(Math.floor(session.elapsedMs / 1000))} ·{' '}
          {session.distanceKm
            ? `${km(cardioDistanceValue(session.distanceKm))} km`
            : 'sem distância informada'}
        </Text>
      </View>
    </Pressable>
  );
}

export function CardioHistoryDetail({
  session,
  onBack,
  onDelete,
}: {
  session: CardioSession;
  onBack: () => void;
  onDelete: () => void;
}) {
  const expected = expectedCardioDistance(session.steps, session.elapsedMs);
  const actual = session.distanceKm ? cardioDistanceValue(session.distanceKm) : null;
  return (
    <ScrollView contentContainerStyle={s.content}>
      <PageHeader
        title={session.name}
        subtitle={new Date(session.finishedAt).toLocaleString('pt-BR', {
          dateStyle: 'long',
          timeStyle: 'short',
        })}
        onBack={onBack}
      />
      <View style={s.card}>
        <Text style={s.cardTitle}>
          {session.elapsedMs >= cardioDuration(session.steps) * 1000
            ? 'Cardio completo'
            : 'Cardio parcial'}
        </Text>
        <Text style={s.body}>
          Tempo realizado: {formatCardioTime(Math.floor(session.elapsedMs / 1000))}
        </Text>
        <Text style={s.body}>Distância esperada: {km(expected)} km</Text>
        <Text style={s.body}>
          Distância percorrida: {actual === null ? 'não informada' : `${km(actual)} km`}
        </Text>
        {actual !== null && <Text style={s.cardTitle}>{distanceFeedback(actual, expected)}</Text>}
      </View>
      <Button
        label="Excluir cardio do histórico"
        secondary
        danger
        icon="trash-2"
        onPress={onDelete}
      />
    </ScrollView>
  );
}
