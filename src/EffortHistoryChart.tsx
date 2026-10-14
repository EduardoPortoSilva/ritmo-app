import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { formatNumber } from './model';
import { inChartWindow, type ChartWindow, type EffortHistory } from './effort';
import { colors as c } from './theme';
import { s } from './ui';

const plotTop = 28;
const plotHeight = 140;
const chartHeight = 230;
const yFor = (percent: number) => plotTop + ((100 - percent) / 100) * plotHeight;

export function EffortHistoryChart({
  effort,
  window,
  now,
}: {
  effort: EffortHistory;
  window: ChartWindow;
  now: number;
}) {
  const [viewportWidth, setViewportWidth] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const scroll = useRef<ScrollView>(null);
  const records = effort.records.filter((record) => inChartWindow(record.date, window, now));
  const visibleGroups = effort.groups.filter((group) =>
    group.records.some((record) => inChartWindow(record.date, window, now)),
  );
  const selected = records.find((record) => record.workoutId === selectedId) ?? records.at(-1);
  const columnWidth = Math.max(70, viewportWidth / Math.max(records.length, 1));
  const chartWidth = columnWidth * records.length;
  const indexByWorkout = new Map(records.map((record, index) => [record.workoutId, index]));
  const xFor = (workoutId: string) => (indexByWorkout.get(workoutId)! + 0.5) * columnWidth;

  return (
    <View style={s.progressCard} testID="effort-chart">
      <Text style={s.fieldLabel}>Esforço relativo ao melhor treino</Text>
      <Text style={s.small}>
        Cada cor representa um treino ou fase do planejamento. 100% é o maior volume daquela fase em
        todo o histórico.
      </Text>
      {!records.length ? (
        <Text style={s.small} testID="effort-empty">
          {effort.records.length
            ? 'Nenhum treino de força nesta janela. Escolha um período maior.'
            : 'Finalize um treino de força para acompanhar o esforço aqui.'}
        </Text>
      ) : (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {visibleGroups.map((group) => (
              <View key={group.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View
                  style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: group.color }}
                />
                <Text style={[s.small, { color: c.ink }]}>{group.label}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ width: 36, height: chartHeight }}>
              {[100, 50, 0].map((tick) => (
                <Text
                  key={tick}
                  style={{
                    position: 'absolute',
                    right: 6,
                    top: yFor(tick) - 7,
                    fontSize: 10,
                    color: c.muted,
                  }}
                >
                  {tick}
                </Text>
              ))}
            </View>
            <ScrollView
              ref={scroll}
              horizontal
              onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}
              onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
              showsHorizontalScrollIndicator
              style={{ flex: 1 }}
            >
              <View style={{ width: chartWidth, height: chartHeight }}>
                <Svg width={chartWidth} height={plotTop + plotHeight + 10}>
                  {[100, 50, 0].map((tick) => (
                    <Line
                      key={tick}
                      x1={0}
                      x2={chartWidth}
                      y1={yFor(tick)}
                      y2={yFor(tick)}
                      stroke={c.line}
                      strokeWidth={1}
                    />
                  ))}
                  {visibleGroups.map((group) => {
                    const points = group.records.filter(
                      (record) => indexByWorkout.has(record.workoutId) && record.percent !== null,
                    );
                    return points
                      .slice(0, -1)
                      .map((point, index) => (
                        <Line
                          key={point.workoutId}
                          x1={xFor(point.workoutId)}
                          y1={yFor(point.percent!)}
                          x2={xFor(points[index + 1].workoutId)}
                          y2={yFor(points[index + 1].percent!)}
                          stroke={group.color}
                          strokeWidth={2}
                        />
                      ));
                  })}
                  {records
                    .filter((record) => record.percent !== null)
                    .map((record) => (
                      <Circle
                        key={record.workoutId}
                        cx={xFor(record.workoutId)}
                        cy={yFor(record.percent!)}
                        r={5}
                        fill={record.color}
                        stroke={c.paper}
                        strokeWidth={2}
                      />
                    ))}
                </Svg>
                {records.map((record) => {
                  const date = new Date(record.date);
                  return (
                    <React.Fragment key={record.workoutId}>
                      {record.percent !== null && (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={
                            record.label +
                            ', ' +
                            formatNumber(record.volume) +
                            ' de ' +
                            formatNumber(record.maxVolume) +
                            ' kg, ' +
                            record.percent +
                            '%'
                          }
                          onPress={() => setSelectedId(record.workoutId)}
                          testID={'effort-record-' + record.workoutId}
                          style={{
                            position: 'absolute',
                            left: xFor(record.workoutId) - 29,
                            top: Math.max(0, yFor(record.percent) - 29),
                            width: 58,
                            height: 46,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: record.color, fontSize: 11, fontWeight: '700' }}>
                            {record.percent}%
                          </Text>
                        </Pressable>
                      )}
                      <View
                        style={{
                          position: 'absolute',
                          left: xFor(record.workoutId) - columnWidth / 2,
                          top: 184,
                          width: columnWidth,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: c.ink, fontSize: 11 }}>
                          {date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </Text>
                        <Text style={{ color: c.muted, fontSize: 10 }}>{date.getFullYear()}</Text>
                      </View>
                    </React.Fragment>
                  );
                })}
              </View>
            </ScrollView>
          </View>
          {selected && (
            <View
              style={{
                borderLeftWidth: 4,
                borderLeftColor: selected.color,
                paddingLeft: 10,
                gap: 3,
              }}
              testID="effort-selection"
            >
              <Text style={s.fieldLabel}>
                {selected.label} · {new Date(selected.date).toLocaleDateString('pt-BR')}
              </Text>
              <Text style={s.small}>
                {formatNumber(selected.volume)} de {formatNumber(selected.maxVolume)} kg·repetições
                {' · '}
                {selected.percent === null ? 'sem referência de carga' : selected.percent + '%'}
              </Text>
            </View>
          )}
          {visibleGroups.some((group) => group.maxVolume === 0) && (
            <Text style={s.small}>Treinos sem carga registrada não têm percentual calculável.</Text>
          )}
          <Text style={s.small}>
            Toque em um ponto para ver o volume. Deslize para ver outras datas.
          </Text>
        </>
      )}
    </View>
  );
}
