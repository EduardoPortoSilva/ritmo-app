import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { bodyWeightHistory, formatNumber, type ExerciseLoadRecord, type Workout } from './model';
import { colors as c } from './theme';
import { s } from './ui';

const plotHeight = 120;
const labelHeight = 42;
const repsColor = '#80509A';
const totalColor = '#A64B16';

function ChartLine({
  x,
  startY,
  endY,
  width,
  dashed,
  color = c.dark,
  dashLength = 7,
  testID,
}: {
  x: number;
  startY: number;
  endY: number;
  width: number;
  dashed?: boolean;
  color?: string;
  dashLength?: number;
  testID: string;
}) {
  const length = Math.hypot(width, endY - startY);
  return (
    <View
      testID={testID}
      pointerEvents="none"
      style={[
        styles.line,
        {
          width: length,
          left: x + width / 2 - length / 2,
          top: (startY + endY) / 2 - 1,
          backgroundColor: dashed ? 'transparent' : color,
          transform: [{ rotate: `${Math.atan2(endY - startY, width)}rad` }],
        },
      ]}
    >
      {dashed &&
        Array.from({ length: Math.ceil(length / 12) }, (_, index) => (
          <View
            key={index}
            style={{
              position: 'absolute',
              left: index * 12,
              width: Math.min(dashLength, length - index * 12),
              height: 2,
              backgroundColor: color,
            }}
          />
        ))}
    </View>
  );
}

export function LoadHistoryChart({
  records,
  totals,
  exerciseName,
}: {
  records: ExerciseLoadRecord[];
  totals: { workoutId: string; weight: number }[];
  exerciseName: string;
}) {
  const totalByWorkout = new Map(totals.map((record) => [record.workoutId, record.weight]));
  return (
    <HistoryChart
      records={records.map((record) => ({
        ...record,
        total: totalByWorkout.get(record.workoutId) ?? 0,
      }))}
      exerciseName={exerciseName}
    />
  );
}

export function BodyWeightChart({ history }: { history: readonly Workout[] }) {
  const records = bodyWeightHistory(history);
  if (!records.length)
    return (
      <View style={s.progressCard} testID="body-weight-empty">
        <Text style={s.fieldLabel}>Peso ao longo do tempo</Text>
        <Text style={s.small}>
          Registre seu peso ao finalizar um treino para acompanhar seu histórico aqui.
        </Text>
      </View>
    );
  return <HistoryChart records={records} bodyWeight />;
}

function HistoryChart({
  records,
  exerciseName,
  bodyWeight = false,
}: {
  records: (Omit<ExerciseLoadRecord, 'reps'> & { reps?: number; total?: number })[];
  exerciseName?: string;
  bodyWeight?: boolean;
}) {
  const [width, setWidth] = useState(0);
  const scroll = useRef<ScrollView>(null);
  const points = records;
  const minimum = bodyWeight
    ? Math.max(0, Math.floor(Math.min(...points.map((p) => p.weight)) - 1))
    : 0;
  const maximum = bodyWeight
    ? Math.ceil(Math.max(...points.map((p) => p.weight)) + 1)
    : Math.max(1, ...points.flatMap((point) => [point.weight, point.reps ?? 0]));
  const totalMaximum = Math.max(1, ...points.map((point) => point.total ?? 0));
  const heightFor = (value: number, metric = 'weight') =>
    metric === 'total'
      ? (value / totalMaximum) * plotHeight
      : ((value - minimum) / (maximum - minimum)) * plotHeight;
  const prefix = bodyWeight ? 'body-weight' : 'load';
  const metrics: ('weight' | 'reps' | 'total')[] = bodyWeight
    ? ['weight']
    : ['weight', 'reps', 'total'];
  // Each session gets one equal-width category, regardless of elapsed time.
  const columnWidth = Math.max(bodyWeight ? 76 : 100, width / Math.max(points.length, 1));
  return (
    <View
      style={s.progressCard}
      testID={`${prefix}-chart`}
      accessibilityLabel={
        bodyWeight ? 'Histórico de peso corporal' : `Histórico de carga de ${exerciseName}`
      }
    >
      <Text style={s.fieldLabel}>
        {bodyWeight ? 'Peso ao longo do tempo' : 'Evolução da carga'}
      </Text>
      <Text style={s.small}>
        {bodyWeight
          ? `Último registro: ${formatNumber(points[points.length - 1].weight)} kg`
          : 'Série mais pesada e carga efetiva total de cada treino'}
      </Text>
      {!bodyWeight && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={{ width: 22, height: 2, backgroundColor: c.dark }} />
            <Text style={styles.caption}>Carga (kg)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {[0, 1, 2].map((index) => (
                <View key={index} style={{ width: 5, height: 2, backgroundColor: repsColor }} />
              ))}
            </View>
            <Text style={[styles.caption, { color: repsColor }]}>Repetições</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={{ flexDirection: 'row', gap: 5 }}>
              {[0, 1, 2].map((index) => (
                <View key={index} style={{ width: 3, height: 2, backgroundColor: totalColor }} />
              ))}
            </View>
            <Text style={[styles.caption, { color: totalColor }]}>
              Carga efetiva total (kg·repetições)
            </Text>
          </View>
          <Text style={styles.caption}>Esquerda: carga e reps · Direita: total</Text>
        </View>
      )}
      <View style={styles.chart}>
        <View style={styles.axis}>
          {[maximum, (maximum + minimum) / 2, minimum].map((value, index) => (
            <Text
              key={index}
              style={[styles.tick, { top: labelHeight + (index * plotHeight) / 2 - 7 }]}
            >
              {formatNumber(value)}
            </Text>
          ))}
        </View>
        <ScrollView
          ref={scroll}
          horizontal
          onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
          showsHorizontalScrollIndicator
          style={{ flex: 1 }}
        >
          <View style={{ flexDirection: 'row' }}>
            {[0, 0.5, 1].map((fraction) => (
              <View
                key={fraction}
                pointerEvents="none"
                style={[styles.grid, { top: labelHeight + fraction * plotHeight }]}
              />
            ))}
            {metrics.flatMap((metric) =>
              points
                .slice(0, -1)
                .map((point, index) => (
                  <ChartLine
                    key={`${metric}-${point.workoutId}`}
                    testID={`${metric === 'weight' ? prefix : metric === 'total' ? 'total-load' : 'reps'}-line-${point.workoutId}`}
                    x={(index + 0.5) * columnWidth}
                    width={columnWidth}
                    startY={labelHeight + plotHeight - heightFor(point[metric] ?? 0, metric)}
                    endY={
                      labelHeight + plotHeight - heightFor(points[index + 1][metric] ?? 0, metric)
                    }
                    dashed={metric !== 'weight'}
                    dashLength={metric === 'total' ? 3 : 7}
                    color={metric === 'total' ? totalColor : metric === 'reps' ? repsColor : c.dark}
                  />
                )),
            )}
            {points.map((point) => {
              const date = new Date(point.date);
              const dateLabel = date.toLocaleDateString('pt-BR');
              const height = heightFor(point.weight);
              const repsHeight = heightFor(point.reps ?? 0);
              const labelsClose = Math.abs(height - repsHeight) < 26;
              const repsLabelBottom = labelsClose
                ? Math.min(height, repsHeight) >= 24
                  ? Math.min(height, repsHeight) - 23
                  : Math.max(height, repsHeight) + 25
                : repsHeight + 9;
              return (
                <View
                  key={point.workoutId}
                  testID={`${prefix}-record-${point.workoutId}`}
                  accessible
                  accessibilityLabel={`${dateLabel}, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}: ${formatNumber(point.weight)} kg${bodyWeight ? '' : `, ${point.reps} repetições, carga efetiva total ${formatNumber(point.total ?? 0)} kg·repetições`}`}
                  style={{ width: columnWidth, alignItems: 'center', paddingBottom: 8 }}
                >
                  <View style={styles.column}>
                    <Text style={[styles.value, { bottom: height + 9 }]}>
                      {formatNumber(point.weight)}
                    </Text>
                    <View
                      testID={`${prefix}-point-${point.workoutId}`}
                      style={[styles.point, { bottom: height - 5 }]}
                    />
                    {!bodyWeight && (
                      <>
                        <Text
                          style={[
                            styles.value,
                            { bottom: repsLabelBottom, color: repsColor, fontSize: 11 },
                          ]}
                        >
                          {point.reps} reps
                        </Text>
                        <View
                          testID={`reps-point-${point.workoutId}`}
                          style={[styles.repsPoint, { bottom: repsHeight - 3 }]}
                        />
                        <View
                          testID={`total-load-point-${point.workoutId}`}
                          style={[
                            styles.totalPoint,
                            { bottom: heightFor(point.total ?? 0, 'total') - 4 },
                          ]}
                        />
                      </>
                    )}
                  </View>
                  <Text style={styles.date}>
                    {date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </Text>
                  <Text style={styles.year}>{date.getFullYear()}</Text>
                  {!bodyWeight && (
                    <Text
                      testID={`total-load-record-${point.workoutId}`}
                      accessibilityLabel={`Carga efetiva total: ${formatNumber(point.total ?? 0)} kg·repetições`}
                      style={[
                        styles.caption,
                        { color: totalColor, fontWeight: '700', marginTop: 5 },
                      ]}
                    >
                      {formatNumber(point.total ?? 0)} total
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
        {!bodyWeight && (
          <View style={[styles.axis, { width: 64 }]} testID="total-load-axis">
            {[totalMaximum, totalMaximum / 2, 0].map((value, index) => (
              <Text
                key={index}
                style={[
                  styles.tick,
                  {
                    left: 6,
                    right: undefined,
                    color: totalColor,
                    top: labelHeight + (index * plotHeight) / 2 - 7,
                  },
                ]}
              >
                {formatNumber(value)}
              </Text>
            ))}
          </View>
        )}
      </View>
      <Text style={styles.caption}>
        {bodyWeight
          ? 'Peso corporal em kg · um ponto por registro.'
          : 'Cada data representa um treino. Total = soma de repetições × carga das séries concluídas; valores em laranja abaixo das datas.'}
        {points.length > 3 ? ' Deslize para ver o histórico.' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  legendItem: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  chart: { flexDirection: 'row' },
  axis: { width: 44, position: 'relative' },
  tick: { position: 'absolute', right: 8, color: c.muted, fontSize: 10 },
  grid: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#D5DCCC' },
  column: {
    height: plotHeight + labelHeight,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  line: { position: 'absolute', height: 2, backgroundColor: c.dark },
  point: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: c.lime,
    borderWidth: 2,
    borderColor: c.dark,
  },
  repsPoint: { position: 'absolute', width: 6, height: 6, backgroundColor: repsColor },
  totalPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: totalColor,
    transform: [{ rotate: '45deg' }],
  },
  value: { position: 'absolute', color: c.ink, fontSize: 12, fontWeight: '700' },
  date: { marginTop: 9, color: c.ink, fontSize: 11 },
  year: { marginTop: 2, color: c.muted, fontSize: 10 },
  caption: { color: c.muted, fontSize: 11, lineHeight: 16 },
});
