import React, { useState } from 'react';
import { Keyboard, Pressable, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Svg, { Path } from 'react-native-svg';
import { formatNumber, validReps, validWeight, type LoggedSet } from './model';
import { colors as c } from './theme';
import { Icon, s } from './ui';
import { ExplanationModal } from './ExplanationModal';

const details = [
  {
    key: 'longRest',
    label: 'Descanso longo',
    icon: 'clock',
    hint: 'Descansei mais que o recomendado antes desta série para conseguir realizá-la.',
    description:
      'Descanso maior que o recomendado antes de realizar esta série, para conseguir completá-la.',
  },
  {
    key: 'restPause',
    label: 'Rest-pause',
    icon: 'pause-circle',
    hint: 'Fiz uma pausa de cerca de 5 a 10 segundos para recuperar o fôlego durante esta série.',
    description:
      'Pausa de cerca de 5 a 10 segundos para recuperar o fôlego durante a série. A execução teve uma interrupção breve.',
  },
  {
    key: 'cramp',
    label: 'Cãibra',
    icon: 'cramp',
    hint: 'Tive cãibra durante esta série.',
    description: 'Cãibra registrada durante esta série. O braço com raio identifica essa marcação.',
  },
] as const;

function ExecutionIcon({
  name,
  size,
  color,
  backgroundColor = c.paper,
}: {
  name: (typeof details)[number]['icon'];
  size: number;
  color: string;
  backgroundColor?: string;
}) {
  if (name !== 'cramp') return <Icon name={name} size={size} color={color} />;
  return (
    <View style={{ width: size, height: size }}>
      <MaterialCommunityIcons name="arm-flex-outline" size={size} color={color} />
      <Svg
        width={size * 0.7}
        height={size * 0.95}
        viewBox="0 0 24 24"
        style={{ position: 'absolute', left: size * 0.3, top: -size * 0.05 }}
        accessible={false}
      >
        <Path
          d="M13 2L4 14H11L10 22L20 9H13Z"
          fill={color}
          stroke={backgroundColor}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

export function SetExecutionControls({
  set,
  seriesLabel,
  onChange,
}: {
  set: LoggedSet;
  seriesLabel: string;
  onChange: (changes: Partial<Pick<LoggedSet, 'longRest' | 'restPause' | 'cramp'>>) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 4,
        padding: 4,
        borderRadius: 12,
        backgroundColor: '#F5F7F0',
      }}
    >
      {details.map((detail) => {
        const checked = set[detail.key] === true;
        return (
          <Pressable
            key={detail.key}
            accessibilityRole="checkbox"
            accessibilityLabel={`${detail.label} de ${seriesLabel}`}
            accessibilityHint={detail.hint}
            accessibilityState={{ checked }}
            aria-checked={checked}
            onPress={() => onChange({ [detail.key]: !checked })}
            style={{
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              minWidth: 0,
              minHeight: 44,
              gap: 2,
              paddingHorizontal: 4,
              borderWidth: 1,
              borderRadius: 9,
              borderColor: checked ? c.dark : 'transparent',
              backgroundColor: checked ? c.dark : 'transparent',
            }}
          >
            <ExecutionIcon
              name={detail.icon}
              size={14}
              color={checked ? c.lime : c.muted}
              backgroundColor={checked ? c.dark : '#F5F7F0'}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: checked ? '600' : '400',
                color: checked ? c.lime : c.muted,
                textAlign: 'center',
                lineHeight: 14,
              }}
            >
              {detail.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SetExecutionSummary({
  set,
  warnOnIncrease = false,
  current = false,
  previous = false,
}: {
  set?: LoggedSet;
  warnOnIncrease?: boolean;
  current?: boolean;
  previous?: boolean;
}) {
  const [explaining, setExplaining] = useState(false);
  const selected = details.filter((detail) => set?.[detail.key] === true);
  if (!selected.length) return null;
  const labels = selected.map((detail) => detail.label).join(' · ');
  const label = current
    ? `Nesta série: ${labels}`
    : warnOnIncrease
      ? `Atenção à sugestão de subir carga: a série anterior teve ${labels}.`
      : labels;
  const testID = current
    ? 'current-set-execution'
    : warnOnIncrease
      ? 'set-load-caution'
      : 'set-execution-summary';
  const symbols = selected.map((detail) => (
    <ExecutionIcon
      key={detail.key}
      name={detail.icon}
      size={current ? 10 : 12}
      color={current || warnOnIncrease ? c.warning : c.muted}
      backgroundColor={current ? '#F5F7F0' : c.paper}
    />
  ));
  return (
    <>
      {current ? (
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={label}
          testID={testID}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}
        >
          {symbols}
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          testID={testID}
          accessibilityHint="Toque para entender as marcações desta série."
          hitSlop={12}
          onPress={() => {
            Keyboard.dismiss();
            setExplaining(true);
          }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 44 }}
        >
          {symbols}
        </Pressable>
      )}
      {explaining && !current && (
        <ExplanationModal
          title={previous ? 'Detalhes da última série' : 'Detalhes da série'}
          testID="set-execution-explanation"
          onClose={() => setExplaining(false)}
        >
          <Text style={s.small}>
            {previous
              ? 'Marcações registradas nesta série do último treino.'
              : 'Marcações registradas nesta série.'}
          </Text>
          {selected.map((detail) => (
            <View key={detail.key} style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ExecutionIcon name={detail.icon} size={20} color={c.warning} />
                <Text style={s.fieldLabel}>{detail.label}</Text>
              </View>
              <Text style={s.body}>{detail.description}</Text>
            </View>
          ))}
          {warnOnIncrease && (
            <Text style={[s.small, { color: c.warning }]}>
              A sugestão de aumentar carga está em âmbar porque esta série teve detalhes de execução
              registrados.
            </Text>
          )}
        </ExplanationModal>
      )}
    </>
  );
}

export function SetComparison({
  target,
  last,
  warnOnIncrease,
  index,
}: {
  target: string;
  last?: LoggedSet;
  warnOnIncrease: boolean;
  index: number;
}) {
  const previous =
    last?.done && validReps(last.reps) && validWeight(last.weight) ? last : undefined;
  return (
    <View
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingLeft: 44 }}
      testID={`set-comparison-${index + 1}`}
    >
      <Text style={[s.small, { fontSize: 11 }]}>meta: {target}</Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 4,
          maxWidth: '100%',
        }}
      >
        <Text style={[s.small, { fontSize: 11 }]}>
          {previous
            ? `Última: ${previous.reps} reps × ${formatNumber(Number(previous.weight.replace(',', '.')))} kg`
            : 'Última: sem série concluída'}
        </Text>
        <SetExecutionSummary set={previous} warnOnIncrease={warnOnIncrease} previous />
      </View>
    </View>
  );
}
