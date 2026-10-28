import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Supplement } from './supplements';
import type { Substance } from './substances';
import { Button, Field, Icon, s } from './ui';
import { colors as c } from './theme';

export function SupplementDoseLinks({
  supplement,
  substances,
  onChange,
}: {
  supplement: Supplement;
  substances: Substance[];
  onChange: (next: Supplement) => void;
}) {
  const doses = supplement.substanceDoses ?? [];
  const items = [
    ...substances.map((s) => ({ id: s.id, name: s.name, unit: s.unit })),
    ...doses
      .filter((d) => !substances.some((s) => s.id === d.substanceId))
      .map((d) => ({ id: d.substanceId, name: 'Substância removida', unit: d.unit })),
  ];
  return (
    <View style={s.card} testID="supplement-dose-links">
      <Text style={s.cardTitle}>Dose ao tomar o suplemento</Text>
      <Text style={s.small}>
        Ao marcar “Tomei hoje”, registra estas doses com o horário do clique. Salvar o vínculo não
        cria ingestões antigas.
      </Text>
      {!items.length && (
        <Text style={s.small}>
          Cadastre uma substância em Acompanhar substâncias para configurar a dose.
        </Text>
      )}
      {items.map((item) => {
        const dose = doses.find((d) => d.substanceId === item.id);
        return (
          <View key={item.id} style={{ gap: 8 }}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityLabel={`Registrar dose de ${item.name}`}
              accessibilityState={{ checked: !!dose }}
              aria-checked={!!dose}
              onPress={() =>
                onChange({
                  ...supplement,
                  substanceDoses: dose
                    ? doses.filter((d) => d.substanceId !== item.id)
                    : [...doses, { substanceId: item.id, amount: '', unit: item.unit }],
                })
              }
              style={[
                s.row,
                {
                  padding: 10,
                  minHeight: 44,
                  borderRadius: 10,
                  backgroundColor: dose ? c.dark : c.soft,
                },
              ]}
            >
              <Icon name={dose ? 'check-square' : 'square'} color={dose ? c.lime : c.ink} />
              <Text style={[s.fieldLabel, { flex: 1, color: dose ? c.lime : c.ink }]}>
                {item.name}
              </Text>
            </Pressable>
            {dose && (
              <Field
                label={`Dose de ${item.name} (${dose.unit})`}
                value={dose.amount}
                numeric
                onChangeText={(amount) =>
                  onChange({
                    ...supplement,
                    substanceDoses: doses.map((d) =>
                      d.substanceId === item.id ? { ...d, amount } : d,
                    ),
                  })
                }
              />
            )}
            {dose && dose.unit !== item.unit && (
              <Button
                secondary
                label={`Usar unidade ${item.unit} e redefinir dose`}
                onPress={() =>
                  onChange({
                    ...supplement,
                    substanceDoses: doses.map((d) =>
                      d.substanceId === item.id ? { ...d, unit: item.unit, amount: '' } : d,
                    ),
                  })
                }
              />
            )}
          </View>
        );
      })}
      <Text style={s.small}>
        Uma confirmação por dia. Desfazer “Tomei hoje” remove somente as doses criadas por essa
        confirmação, preservando ingestões avulsas e de blends.
      </Text>
    </View>
  );
}
