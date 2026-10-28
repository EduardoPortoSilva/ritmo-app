import React, { useState } from 'react';
import { Keyboard, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { loadAdjustments, type LoggedExercise, type LoadAdjustment } from './model';
import { Icon, s } from './ui';
import { colors as c } from './theme';
import { ExplanationModal } from './ExplanationModal';
import { ExerciseOrderStatus } from './ExerciseOrderNotice';
import type { ExerciseOrderChange } from './exerciseOrder';

type FeedbackKind = keyof typeof loadAdjustments | 'cramp' | 'external';
const feedbackColors = {
  increase: { ink: '#168447', background: '#E8F7EE' },
  decrease: { ink: '#F2C230', background: '#FFF8D9' },
  maintain: { ink: '#2876DE', background: '#EDF4FF' },
  cramp: { ink: '#FF3038', background: '#FFF0F1' },
  external: { ink: '#687380', background: '#F0F2F5' },
};
const feedbackNames: Record<FeedbackKind, string> = {
  ...loadAdjustments,
  cramp: 'Impedimento',
  external: 'Impedimento externo',
};
const feedbackExplanations: Record<FeedbackKind, string> = {
  increase:
    'Lembrete de que você pretende aumentar a carga na próxima vez que fizer este exercício.',
  maintain:
    'Lembrete para repetir a carga na próxima vez que fizer este exercício. Essa escolha suspende a sugestão automática de aumentar carga na comparação seguinte.',
  decrease:
    'Lembrete para diminuir a carga na próxima vez que fizer este exercício. Essa escolha suspende a sugestão automática de aumentar carga na comparação seguinte.',
  external:
    'Falta de tempo, equipamento ocupado ou outra situação externa atrapalhou o exercício. Enquanto esta sessão estiver entre as duas últimas comparadas, as sugestões automáticas de aumentar e reduzir carga ficam suspensas.',
  cramp:
    'Impedimento registrado no formato antigo, para o exercício inteiro: cansaço, cãibra ou outra dificuldade. As novas marcações de cãibra ficam nos detalhes de cada série; este registro antigo não foi distribuído entre elas.',
};

function FeedbackSymbol({
  kind,
  size = 24,
  color: overrideColor,
}: {
  kind: FeedbackKind;
  size?: number;
  color?: string;
}) {
  const color = overrideColor ?? feedbackColors[kind].ink;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
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
          stroke={overrideColor ?? '#B88708'}
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
  suggestedAdjustment,
  executionCaution = false,
  orderChanges = [],
}: {
  exercise?: LoggedExercise;
  previous?: boolean;
  suggestedAdjustment?: Extract<LoadAdjustment, 'increase' | 'decrease'>;
  executionCaution?: boolean;
  orderChanges?: readonly ExerciseOrderChange[];
}) {
  const [explaining, setExplaining] = useState<FeedbackKind | null>(null);
  if (
    !exercise?.loadAdjustment &&
    !exercise?.cramp &&
    !exercise?.externalImpediment &&
    !suggestedAdjustment &&
    !orderChanges.length
  )
    return null;
  const kinds: FeedbackKind[] = [
    ...(exercise?.loadAdjustment ? [exercise.loadAdjustment] : []),
    ...(exercise?.cramp ? ['cramp' as const] : []),
    ...(exercise?.externalImpediment ? ['external' as const] : []),
  ];
  return (
    <>
      <View
        testID="exercise-feedback-status"
        style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}
      >
        <Text style={s.small}>{previous ? 'Último treino:' : 'Marcado neste treino:'}</Text>
        {kinds.map((kind) => (
          <Pressable
            key={kind}
            accessibilityRole="button"
            accessibilityLabel={`${previous ? 'Último treino' : 'Marcado neste treino'}: ${feedbackNames[kind]}`}
            accessibilityHint="Toque para entender esta marcação manual."
            hitSlop={4}
            onPress={() => {
              Keyboard.dismiss();
              setExplaining(kind);
            }}
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
          </Pressable>
        ))}
        {suggestedAdjustment && (
          <AutomaticLoadHint adjustment={suggestedAdjustment} caution={executionCaution} />
        )}
        {orderChanges.map((change) => (
          <ExerciseOrderStatus
            key={JSON.stringify([change.beforeId, change.afterId])}
            change={change}
            previous={previous}
          />
        ))}
      </View>
      {explaining && (
        <ExplanationModal
          title={feedbackNames[explaining]}
          testID="manual-feedback-explanation"
          onClose={() => setExplaining(null)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <FeedbackSymbol kind={explaining} />
            <Text style={[s.small, { flex: 1 }]}>
              {previous
                ? 'Marcação feita manualmente no último treino deste exercício.'
                : 'Marcação feita manualmente neste treino.'}
            </Text>
          </View>
          <Text style={s.body}>{feedbackExplanations[explaining]}</Text>
          <Text style={s.small}>
            É uma anotação sua. Abrir esta explicação não altera a marcação nem a carga registrada.
          </Text>
        </ExplanationModal>
      )}
    </>
  );
}

export function AutomaticLoadHint({
  adjustment,
  caution = false,
}: {
  adjustment: Extract<LoadAdjustment, 'increase' | 'decrease'>;
  caution?: boolean;
}) {
  const [explaining, setExplaining] = useState(false);
  const decrease = adjustment === 'decrease';
  const warned = !decrease && caution;
  const color = decrease ? '#FF3038' : warned ? c.warning : '#168447';
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Sugestão do app: ${loadAdjustments[adjustment]}${caution ? '. Atenção: houve descanso longo, rest-pause ou cãibra em uma série do último treino.' : ''}`}
        accessibilityHint="Toque para entender a sugestão e seus alertas."
        hitSlop={4}
        onPress={() => {
          Keyboard.dismiss();
          setExplaining(true);
        }}
        style={{
          width: 40,
          height: 40,
          backgroundColor: decrease ? '#FFF0F1' : warned ? c.warningSoft : '#E8F7EE',
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        testID={decrease ? 'load-reduction-hint' : 'load-progression-hint'}
      >
        <Svg width={24} height={24} viewBox="0 0 24 24" accessible={false}>
          {decrease && caution && (
            <Path
              d="M3 5H21L12 21Z"
              fill="none"
              stroke={color}
              strokeWidth={5.5}
              strokeLinejoin="round"
            />
          )}
          <Path
            d={decrease ? 'M3 5H21L12 21Z' : 'M12 3L21 19H3Z'}
            fill={color}
            stroke={decrease && caution ? '#FFE600' : color}
            strokeWidth={decrease && caution ? 2.5 : 1}
            strokeLinejoin="round"
          />
        </Svg>
      </Pressable>
      {explaining && (
        <ExplanationModal
          title={decrease ? 'Sugestão de reduzir carga' : 'Sugestão de aumentar carga'}
          onClose={() => setExplaining(false)}
          testID="load-hint-explanation"
        >
          <Text style={s.body}>
            {decrease
              ? 'Nas duas últimas sessões desta rotina, mais da metade das séries deste exercício foi concluída com menos de metade da meta de repetições, em cada sessão.'
              : 'Nas duas últimas sessões desta rotina, todas as séries deste exercício atingiram a meta de repetições, com a mesma carga em cada série correspondente.'}
          </Text>
          {caution && (
            <View style={{ backgroundColor: c.warningSoft, padding: 14, borderRadius: 12, gap: 8 }}>
              <Text style={[s.fieldLabel, { color: c.warning }]}>Detalhe no último treino</Text>
              <Text style={s.body}>
                Uma ou mais séries foram marcadas com descanso longo, rest-pause ou cãibra. Toque
                nos símbolos ao lado de “Última” para entender os detalhes de cada série.
              </Text>
              <Text style={s.small}>
                {decrease
                  ? 'A borda amarela com contorno vermelho destaca que a sugestão de reduzir carga aconteceu com essas marcações.'
                  : 'O tom âmbar destaca essa ressalva na sugestão de aumentar carga.'}
              </Text>
            </View>
          )}
          <Text style={s.small}>
            Esta é uma sugestão automática. A carga registrada só muda quando você edita o campo KG.
          </Text>
        </ExplanationModal>
      )}
    </>
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
          flexDirection: kind === 'external' ? 'row' : 'column',
          alignItems: 'center',
          flex: kind === 'external' ? undefined : 1,
          minWidth: 0,
          justifyContent: 'center',
          gap: kind === 'external' ? 6 : 2,
          minHeight: 46,
          borderWidth: 1,
          borderColor: selected ? c.dark : 'transparent',
          backgroundColor: selected ? c.dark : 'transparent',
          borderRadius: 9,
          paddingHorizontal: 4,
        }}
      >
        <FeedbackSymbol kind={kind} size={14} color={selected ? c.lime : c.muted} />
        <Text
          style={{
            fontSize: 11,
            lineHeight: 14,
            textAlign: 'center',
            color: selected ? c.lime : c.muted,
            fontWeight: selected ? '600' : '400',
          }}
        >
          {label}
        </Text>
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
            Impedimento externo: falta de tempo, equipamento ocupado ou outra situação externa. Essa
            sessão não entra nas sugestões automáticas de carga.
          </Text>
          <View
            style={{
              gap: 4,
              padding: 4,
              borderRadius: 12,
              backgroundColor: '#F5F7F0',
            }}
          >
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {options.map(([value, label]) =>
                choice(label, value, exercise.loadAdjustment === value, () =>
                  onChange({
                    loadAdjustment: exercise.loadAdjustment === value ? undefined : value,
                  }),
                ),
              )}
            </View>
            {choice('Impedimento externo', 'external', exercise.externalImpediment === true, () =>
              onChange({ externalImpediment: !exercise.externalImpediment }),
            )}
          </View>
        </View>
      )}
    </View>
  );
}
