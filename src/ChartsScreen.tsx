import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  exerciseHistoryOptions,
  exerciseLoadHistory,
  exerciseTotalLoadHistory,
  type Workout,
} from './model';
import { LoadHistoryChart } from './LoadHistoryChart';
import { Empty, s } from './ui';
import { colors as c } from './theme';

export function ChartsScreen({ history }: { history: readonly Workout[] }) {
  const options = exerciseHistoryOptions(history);
  const [selectedKey, setSelectedKey] = useState(options[0]?.key);
  const selected = options.find((option) => option.key === selectedKey) ?? options[0];
  return (
    <ScrollView contentContainerStyle={s.content}>
      <View>
        <Text style={s.eyebrow}>SEU PROGRESSO</Text>
        <Text style={s.title}>Gráficos</Text>
        <Text style={s.body}>Compare a evolução de cada exercício entre seus treinos.</Text>
      </View>
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
