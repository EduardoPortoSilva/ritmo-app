import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  exerciseHistoryOptions,
  exerciseLoadHistory,
  exerciseTotalLoadHistory,
  type Workout,
} from './model';
import { BodyWeightChart, LoadHistoryChart } from './LoadHistoryChart';
import { EffortHistoryChart } from './EffortHistoryChart';
import { chartWindows, inChartWindow, type ChartWindow, type EffortHistory } from './effort';
import { Empty, s } from './ui';
import { colors as c } from './theme';

export function ChartsScreen({
  history,
  effort,
}: {
  history: readonly Workout[];
  effort: EffortHistory;
}) {
  const [window, setWindow] = useState<ChartWindow>('90d');
  const [now] = useState(Date.now);
  const visibleHistory = history.filter(
    (workout) => workout.finishedAt && inChartWindow(workout.finishedAt, window, now),
  );
  const options = exerciseHistoryOptions(history);
  const [selectedKey, setSelectedKey] = useState(options[0]?.key);
  const selected = options.find((option) => option.key === selectedKey) ?? options[0];
  return (
    <ScrollView contentContainerStyle={s.content}>
      <View>
        <Text style={s.eyebrow}>SEU PROGRESSO</Text>
        <Text style={s.title}>Gráficos</Text>
        <Text style={s.body}>Acompanhe seu peso, esforço e cargas ao longo do tempo.</Text>
      </View>
      <View style={s.card}>
        <Text style={s.cardTitle}>Período dos gráficos</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {chartWindows.map((option) => (
            <Pressable
              key={option.key}
              accessibilityRole="radio"
              accessibilityLabel={'Período ' + option.label}
              accessibilityState={{ checked: window === option.key }}
              aria-checked={window === option.key}
              onPress={() => setWindow(option.key)}
              style={[
                s.secondaryButton,
                {
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: window === option.key ? c.lime : c.soft,
                },
              ]}
            >
              <Text style={s.fieldLabel}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={s.small}>
          O período filtra os dois gráficos abaixo. O máximo do esforço considera todo o histórico
          da mesma fase.
        </Text>
      </View>
      <BodyWeightChart
        history={visibleHistory}
        emptyMessage={
          history.some((workout) => workout.bodyWeight)
            ? 'Nenhum peso registrado neste período. Escolha uma janela maior.'
            : undefined
        }
      />
      <EffortHistoryChart effort={effort} window={window} now={now} />
      {!selected ? (
        <Empty
          icon="trending-up"
          title="Seu progresso começa aqui"
          message="Finalize um treino com séries concluídas para acompanhar suas cargas."
        />
      ) : (
        <>
          <View style={s.card}>
            <Text style={s.cardTitle}>Escolha o exercício</Text>
            <Text style={s.small}>
              Os registros ficam separados por rotina, inclusive das rotinas excluídas.
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator
              contentContainerStyle={{ gap: 10, paddingBottom: 6 }}
            >
              {options.map((option) => (
                <Pressable
                  key={option.key}
                  accessibilityRole="radio"
                  accessibilityLabel={`${option.exerciseName} · ${option.routineName}`}
                  accessibilityState={{ checked: option.key === selected.key }}
                  aria-checked={option.key === selected.key}
                  onPress={() => setSelectedKey(option.key)}
                  style={[
                    s.secondaryButton,
                    {
                      padding: 12,
                      width: 190,
                      borderRadius: 12,
                      backgroundColor: option.key === selected.key ? c.lime : c.soft,
                    },
                  ]}
                >
                  <Text style={s.fieldLabel}>{option.exerciseName}</Text>
                  <Text style={s.small}>{option.routineName}</Text>
                </Pressable>
              ))}
            </ScrollView>
            {options.length > 1 && (
              <Text style={s.small}>Deslize para escolher outro exercício.</Text>
            )}
          </View>
          <Text style={s.sectionTitle}>
            {selected.exerciseName} · {selected.routineName}
          </Text>
          <LoadHistoryChart
            key={`load-${selected.key}`}
            exerciseName={selected.exerciseName}
            records={exerciseLoadHistory(history, selected.routineId, selected.exerciseId)}
            totals={exerciseTotalLoadHistory(history, selected.routineId, selected.exerciseId)}
          />
        </>
      )}
    </ScrollView>
  );
}
