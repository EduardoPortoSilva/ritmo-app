import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { loadAdjustments, type LoggedExercise, type LoadAdjustment } from './model';
import { Icon, s } from './ui';
import { colors as c } from './theme';

type FeedbackKind = keyof typeof loadAdjustments | 'cramp' | 'external';
const feedbackColors = {
  increase: { ink: '#168447', background: '#E8F7EE' },
  decrease: { ink: '#F2C230', background: '#FFF8D9' },
  maintain: { ink: '#2876DE', background: '#EDF4FF' },
  cramp: { ink: '#FF3038', background: '#FFF0F1' },
  external: { ink: '#687380', background: '#F0F2F5' },
};

function FeedbackSymbol({ kind }: { kind: FeedbackKind }) {
  const color = feedbackColors[kind].ink;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" accessible={false}>
      {kind === 'increase' && (
        <Path
          d="M12 2L20 10H4Z M12 13L20 21H4Z"
          fill={color}
          stroke={color}
          strokeWidth={1}
          strokeLinejoin="round"
        />
      )}
      {kind === 'decrease' && (
        <Path
          d="M4 3H20L12 11Z M4 14H20L12 22Z"
          fill={color}
          stroke="#B88708"
          strokeWidth={1}
          strokeLinejoin="round"
        />
      )}
      {kind === 'maintain' && (
        <Path d="M5 8H19 M5 16H19" stroke={color} strokeWidth={3.5} strokeLinecap="round" />
      )}
      {kind === 'cramp' && (
        <>
          <Path
            d="M12 2L22 21H2Z"
            fill={color}
            stroke={color}
            strokeWidth={1}
            strokeLinejoin="round"
          />
          <Path d="M12 8V13" stroke="white" strokeWidth={2.5} strokeLinecap="round" />
          <Circle cx={12} cy={17} r={1.3} fill="white" />
        </>
      )}
      {kind === 'external' && (
        <>
          <Circle cx={12} cy={12} r={9} fill="none" stroke={color} strokeWidth={2} />
          <Path
            d="M12 7V12L16 14"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </Svg>
  );
}

export function ExerciseFeedbackStatus({
  exercise,
  previous = false,
}: {
  exercise?: LoggedExercise;
  previous?: boolean;
}) {
  if (!exercise?.loadAdjustment && !exercise?.cramp && !exercise?.externalImpediment) return null;
  const kinds: FeedbackKind[] = [
    ...(exercise.loadAdjustment ? [exercise.loadAdjustment] : []),
    ...(exercise.cramp ? ['cramp' as const] : []),
    ...(exercise.externalImpediment ? ['external' as const] : []),
  ];
  return (
    <View
      testID="exercise-feedback-status"
      style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}
    >
      <Text style={s.small}>{previous ? 'Último treino:' : 'Marcado neste treino:'}</Text>
      {kinds.map((kind) => (
        <View
          key={kind}
          accessible
          accessibilityRole="image"
          accessibilityLabel={`${previous ? 'Último treino' : 'Marcado neste treino'}: ${kind === 'cramp' ? 'Impedimento' : kind === 'external' ? 'Impedimento externo' : loadAdjustments[kind]}`}
          testID={`exercise-status-${kind}`}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: feedbackColors[kind].background,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FeedbackSymbol kind={kind} />
        </View>
      ))}
    </View>
  );
}

export function AutomaticLoadHint({
  adjustment,
}: {
  adjustment: Extract<LoadAdjustment, 'increase' | 'decrease'>;
}) {
  const decrease = adjustment === 'decrease';
  const color = decrease ? '#FF3038' : '#168447';
  return (
    <View
      style={[
        s.row,
        { backgroundColor: decrease ? '#FFF0F1' : '#E8F7EE', borderRadius: 10, padding: 10 },
      ]}
      testID={decrease ? 'load-reduction-hint' : 'load-progression-hint'}
    >
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Sugestão do app: ${loadAdjustments[adjustment]}`}
      >
        <Svg width={24} height={24} viewBox="0 0 24 24" accessible={false}>
          <Path
            d={decrease ? 'M3 5H21L12 21Z' : 'M12 3L21 19H3Z'}
            fill={color}
            stroke={color}
            strokeWidth={1}
            strokeLinejoin="round"
          />
        </Svg>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[s.fieldLabel, { color: decrease ? c.danger : c.dark }]}>Sugestão do app</Text>
        <Text style={s.small}>
          {decrease
            ? 'Parece que está na hora de diminuir a carga: nos últimos dois treinos, mais da metade das séries ficou abaixo de metade da meta.'
            : 'Parece que está na hora de progredir a carga: você atingiu as metas com os mesmos pesos nos últimos dois treinos.'}
        </Text>
      </View>
    </View>
  );
}

export function ExerciseFeedbackControls({
  exercise,
  onChange,
}: {
  exercise: LoggedExercise;
  onChange: (changes: Partial<LoggedExercise>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const options = Object.entries(loadAdjustments) as [keyof typeof loadAdjustments, string][];
  function choice(label: string, kind: FeedbackKind, selected: boolean, onPress: () => void) {
    return (
      <Pressable
        key={label}
        accessibilityRole="checkbox"
        accessibilityLabel={`${label} para ${exercise.name}`}
        accessibilityState={{ checked: selected }}
        aria-checked={selected}
        onPress={onPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          minHeight: 44,
          borderWidth: 1,
          borderColor: selected ? c.dark : c.line,
          backgroundColor: selected ? c.soft : c.paper,
          borderRadius: 10,
          padding: 10,
        }}
      >
        <FeedbackSymbol kind={kind} />
        <Text style={s.fieldLabel}>{label}</Text>
      </Pressable>
    );
  }
  return (
    <View style={[s.card, { padding: 0, gap: 0 }]} testID="exercise-feedback-controls">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Algum ponto importante?"
        accessibilityState={{ expanded }}
        aria-expanded={expanded}
        onPress={() => setExpanded((value) => !value)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, minHeight: 56 }}
      >
        <Text style={[s.fieldLabel, { flex: 1 }]}>Algum ponto importante?</Text>
        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} color={c.muted} size={20} />
      </Pressable>
      {expanded && (
        <View
          style={{ paddingHorizontal: 18, paddingBottom: 18, gap: 16 }}
          testID="exercise-feedback-content"
        >
          <Text style={s.fieldLabel}>Como foi {exercise.name}?</Text>
          <Text style={s.small}>
            Marque um lembrete para o próximo treino. Toque novamente para desmarcar.
          </Text>
          <Text style={s.small}>
            Impedimento: cansaço, cãibra ou qualquer dificuldade que tenha atrapalhado o exercício.
          </Text>
          <Text style={s.small}>
            Impedimento externo: falta de tempo, equipamento ocupado ou outra situação externa. Essa
            sessão não entra nas sugestões automáticas de carga.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {options.map(([value, label]) =>
              choice(label, value, exercise.loadAdjustment === value, () =>
                onChange({ loadAdjustment: exercise.loadAdjustment === value ? undefined : value }),
              ),
            )}
            {choice('Impedimento', 'cramp', exercise.cramp === true, () =>
              onChange({ cramp: !exercise.cramp }),
            )}
            {choice('Impedimento externo', 'external', exercise.externalImpediment === true, () =>
              onChange({ externalImpediment: !exercise.externalImpediment }),
            )}
          </View>
        </View>
      )}
    </View>
  );
}
