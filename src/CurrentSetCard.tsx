import React from 'react';
import { Pressable, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Icon, IconButton, s } from './ui';
import { colors as c } from './theme';
import { formatRestRemaining } from './restTimer';

export function CurrentSetCard({
  current,
  rest,
  onReturn,
  onToggleRest,
}: {
  current: { exerciseName: string; setIndex: number } | null;
  rest: { remaining: number; paused: boolean; after: string } | null;
  onReturn: () => void;
  onToggleRest: () => void;
}) {
  return (
    <View
      style={[s.noteCard, { paddingVertical: 8, paddingHorizontal: 12, gap: 8 }]}
      testID="current-set-card"
    >
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8, flexWrap: 'wrap' }}
        >
          <Text style={[s.fieldLabel, { fontSize: 12, flexShrink: 0 }]}>
            {current ? `Série atual · ${current.setIndex + 1}` : 'Séries concluídas'}
          </Text>
          {rest && (
            <Text
              style={[s.small, { fontSize: 11, flexShrink: 0 }]}
              accessibilityLabel={`Descanso ${rest.paused ? 'pausado' : 'em andamento'} após ${rest.after} · ${formatRestRemaining(rest.remaining)} restantes`}
            >
              {formatRestRemaining(rest.remaining)}
            </Text>
          )}
        </View>
        <Text numberOfLines={1} style={[s.small, { fontSize: 11 }]}>
          {current?.exerciseName ?? 'Treino pronto para finalizar.'}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {current ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar à série atual"
            onPress={onReturn}
            style={s.iconButton}
          >
            <MaterialCommunityIcons name="arrow-u-left-top" size={22} color={c.ink} />
          </Pressable>
        ) : (
          <View style={s.iconButton}>
            <Icon name="check-circle" color={c.dark} />
          </View>
        )}
        {rest && (
          <IconButton
            name={rest.paused ? 'play' : 'pause'}
            label={rest.paused ? 'Retomar descanso' : 'Pausar descanso'}
            onPress={onToggleRest}
          />
        )}
      </View>
    </View>
  );
}
