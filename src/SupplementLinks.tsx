import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Supplement } from './supplements';
import type { Substance } from './substances';
import type { SubstanceBlend } from './substanceBlendSchema';
import { linkedSupplements } from './supplementIntakes';
import { Button, Icon, s } from './ui';
import { colors as c } from './theme';

export function SupplementLinks({
  supplement,
  substances,
  blends,
  onChange,
}: {
  supplement: Supplement;
  substances: Substance[];
  blends: SubstanceBlend[];
  onChange: (next: Supplement) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const groups = [
    {
      field: 'substanceIds' as const,
      title: 'Substâncias',
      label: 'Substância',
      items: substances,
    },
    { field: 'blendIds' as const, title: 'Blends', label: 'Blend', items: blends },
  ];
  const selected = groups.flatMap((g) =>
    (supplement[g.field] ?? []).map(
      (id) => g.items.find((i) => i.id === id)?.name ?? 'Item removido',
    ),
  );
  return (
    <View style={s.card} testID="supplement-links">
      <Text style={s.cardTitle}>Marcar por ingestão</Text>
      <Text style={s.small}>
        Ao registrar qualquer substância ou blend vinculado, este suplemento será marcado como
        tomado na data da ingestão.
      </Text>
      {!!selected.length && <Text style={s.body}>{selected.join(' · ')}</Text>}
      <Button
        secondary
        icon={expanded ? 'chevron-up' : 'link'}
        label={expanded ? 'Recolher vínculos' : 'Vincular substâncias e blends'}
        onPress={() => setExpanded(!expanded)}
      />
      {expanded &&
        groups.map((g) => (
          <View key={g.field} style={{ gap: 6 }}>
            <Text style={s.fieldLabel}>{g.title}</Text>
            {!g.items.length && <Text style={s.small}>Nenhum cadastro disponível.</Text>}
            {[
              ...g.items.map((i) => ({ id: i.id, name: i.name })),
              ...(supplement[g.field] ?? [])
                .filter((id) => !g.items.some((i) => i.id === id))
                .map((id) => ({ id, name: `Item removido (${id})` })),
            ].map((item) => {
              const checked = supplement[g.field]?.includes(item.id) ?? false;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="checkbox"
                  accessibilityLabel={`Vincular ${g.label.toLowerCase()} ${item.name}`}
                  accessibilityState={{ checked }}
                  aria-checked={checked}
                  onPress={() =>
                    onChange({
                      ...supplement,
                      [g.field]: checked
                        ? supplement[g.field]!.filter((id) => id !== item.id)
                        : [...(supplement[g.field] ?? []), item.id],
                    })
                  }
                  style={[
                    s.row,
                    {
                      minHeight: 44,
                      padding: 10,
                      borderRadius: 12,
                      backgroundColor: checked ? c.dark : c.soft,
                    },
                  ]}
                >
                  <Icon
                    name={checked ? 'check-square' : 'square'}
                    color={checked ? c.lime : c.ink}
                    size={18}
                  />
                  <Text style={[s.body, { flex: 1, color: checked ? c.lime : c.ink }]}>
                    {item.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      <Text style={s.small}>
        Estes vínculos marcam o suplemento a partir de novas ingestões. Para criar doses ao marcar
        “Tomei hoje”, configure “Dose ao tomar o suplemento”. Excluir uma ingestão mantém a marcação
        diária, que pode ser desfeita em Suplementos.
      </Text>
    </View>
  );
}

export function IntakeSupplementNotice({
  supplements,
  substanceIds,
  blendId,
}: {
  supplements: Supplement[];
  substanceIds: string[];
  blendId?: string;
}) {
  const linked = linkedSupplements(supplements, substanceIds, blendId);
  if (!linked.length) return null;
  return (
    <View style={[s.card, { backgroundColor: c.soft, padding: 12 }]} testID="intake-supplements">
      <Text style={s.fieldLabel}>Também marca como tomado</Text>
      <Text style={s.body}>{linked.map((s) => s.name).join(' · ')}</Text>
      <Text style={s.small}>Na data da ingestão, uma vez por dia.</Text>
    </View>
  );
}
