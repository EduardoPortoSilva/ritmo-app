import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Substance } from './substances';
import {
  blendError,
  recordBlend,
  formatSubstanceQuantity as quantity,
  type SubstanceBlend,
} from './substanceBlends';
import { localDate, localTime, doseTime } from './substanceTime';
import { uid } from './model';
import { Button, Field, Icon, IconButton, s } from './ui';
import { EditSheet, FormulaError } from './FormulaFields';
import { colors as c } from './theme';

type Draft = { id: string; name: string; selected: string[]; amounts: Record<string, string> };
export function BlendControls({
  items,
  blends,
  onChange,
  onIngest,
}: {
  items: Substance[];
  blends: SubstanceBlend[];
  onChange: (blends: SubstanceBlend[]) => void;
  onIngest: (items: Substance[]) => void;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [ingest, setIngest] = useState<SubstanceBlend | null>(null);
  const [removing, setRemoving] = useState<SubstanceBlend | null>(null);
  const [servings, setServings] = useState('1');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState('');
  const openEditor = (blend?: SubstanceBlend) => {
    setError('');
    setDraft({
      id: blend?.id ?? uid(),
      name: blend?.name ?? '',
      selected: blend?.components.map((c) => c.substanceId) ?? [],
      amounts: Object.fromEntries(
        blend?.components.map((c) => [c.substanceId, String(c.amount)]) ?? [],
      ),
    });
  };
  const openIntake = (blend: SubstanceBlend) => {
    setError('');
    setIngest(blend);
    setServings('1');
    const now = new Date();
    setDate(localDate(now));
    setTime(localTime(now));
  };
  const save = (register: boolean) => {
    try {
      if (!draft) return;
      const blend: SubstanceBlend = {
        id: draft.id,
        name: draft.name.trim(),
        components: draft.selected.map((id) => ({
          substanceId: id,
          amount: Number((draft.amounts[id] ?? '').replace(',', '.')),
          unit: items.find((s) => s.id === id)?.unit ?? '',
        })),
      };
      const error = blendError(blend, items);
      if (error) throw new Error(error);
      if (!blends.some((b) => b.id === blend.id) && blends.length >= 50)
        throw new Error('Limite de 50 blends salvos.');
      onChange(
        blends.some((b) => b.id === blend.id)
          ? blends.map((b) => (b.id === blend.id ? blend : b))
          : [...blends, blend],
      );
      setDraft(null);
      if (register) openIntake(blend);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const selectedIds = draft?.selected ?? [];
  return (
    <View style={{ gap: 12 }} testID="substance-blends">
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Blends</Text>
        <Text style={s.small}>{blends.length} salvos</Text>
      </View>
      <Button
        label="Novo blend"
        secondary
        icon="layers"
        disabled={items.length < 2}
        onPress={() => openEditor()}
      />
      {items.length < 2 && (
        <Text style={s.small}>Cadastre pelo menos duas substâncias para montar uma mistura.</Text>
      )}
      {blends.map((blend) => (
        <View
          key={blend.id}
          style={[s.card, { gap: 10, padding: 14 }]}
          testID={`blend-${blend.id}`}
        >
          <View style={s.cardHeader}>
            <Text style={[s.cardTitle, { flex: 1 }]}>{blend.name}</Text>
            <IconButton
              label={`Editar blend ${blend.name}`}
              name="edit-2"
              onPress={() => openEditor(blend)}
            />
            <IconButton
              label={`Excluir blend ${blend.name}`}
              name="trash-2"
              onPress={() => {
                setError('');
                setRemoving(blend);
              }}
            />
          </View>
          <Text style={s.small}>Composição por porção</Text>
          {blend.components.map((component) => (
            <Text key={component.substanceId} style={s.small}>
              {items.find((s) => s.id === component.substanceId)?.name ?? 'Substância removida'} ·{' '}
              {quantity(component.amount)} {component.unit}
            </Text>
          ))}
          {!!blendError(blend, items) && (
            <Text style={{ color: c.danger }}>{blendError(blend, items)}</Text>
          )}
          <Button
            label={`Registrar blend ${blend.name}`}
            icon="plus"
            onPress={() => openIntake(blend)}
          />
        </View>
      ))}
      {draft && (
        <EditSheet
          title={blends.some((b) => b.id === draft.id) ? 'Editar blend' : 'Novo blend'}
          onClose={() => setDraft(null)}
        >
          <Field
            label="Nome do blend"
            value={draft.name}
            onChangeText={(name) => setDraft({ ...draft, name })}
          />
          <Text style={s.small}>
            Selecione as substâncias e a quantidade de cada uma por porção, na unidade cadastrada.
          </Text>
          {draft.selected
            .filter((id) => !items.some((s) => s.id === id))
            .map((id) => (
              <View key={id}>
                <Text style={{ color: c.danger }}>Uma substância deste blend foi removida.</Text>
                <Button
                  label="Remover componente indisponível"
                  secondary
                  onPress={() =>
                    setDraft({ ...draft, selected: draft.selected.filter((s) => s !== id) })
                  }
                />
              </View>
            ))}
          {items.map((item) => {
            const checked = selectedIds.includes(item.id);
            return (
              <View key={item.id} style={{ gap: 8 }}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityLabel={`Incluir ${item.name} no blend`}
                  accessibilityState={{ checked }}
                  aria-checked={checked}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}
                  onPress={() =>
                    setDraft({
                      ...draft,
                      selected: checked
                        ? draft.selected.filter((id) => id !== item.id)
                        : [...draft.selected, item.id],
                    })
                  }
                >
                  <Icon
                    name={checked ? 'check-square' : 'square'}
                    color={checked ? c.dark : c.muted}
                    size={20}
                  />
                  <Text style={s.fieldLabel}>{item.name}</Text>
                </Pressable>
                {checked && (
                  <Field
                    label={`Quantidade de ${item.name} (${item.unit}) por porção`}
                    value={draft.amounts[item.id] ?? ''}
                    onChangeText={(value) =>
                      setDraft({ ...draft, amounts: { ...draft.amounts, [item.id]: value } })
                    }
                    numeric
                  />
                )}
              </View>
            );
          })}
          <FormulaError message={error} />
          <Button label="Salvar e registrar blend" onPress={() => save(true)} />
          <Button label="Salvar composição do blend" secondary onPress={() => save(false)} />
        </EditSheet>
      )}
      {ingest && (
        <EditSheet title={`Ingestão do blend · ${ingest.name}`} onClose={() => setIngest(null)}>
          <Field label="Porções do blend" value={servings} onChangeText={setServings} numeric />
          <View style={[s.progressCard, { gap: 6, padding: 12 }]} testID="blend-intake-preview">
            <Text style={s.fieldLabel}>Quantidades desta ingestão</Text>
            {ingest.components.map((component) => {
              const n = Number(servings.replace(',', '.'));
              const amount = component.amount * n;
              return (
                <Text key={component.substanceId} style={s.small}>
                  {items.find((s) => s.id === component.substanceId)?.name ?? 'Substância removida'}{' '}
                  · {Number.isFinite(amount) && n > 0 ? quantity(amount) : '—'} {component.unit}
                </Text>
              );
            })}
          </View>
          <Field label="Data da ingestão (AAAA-MM-DD)" value={date} onChangeText={setDate} />
          <Field label="Horário da ingestão (HH:mm)" value={time} onChangeText={setTime} />
          <Text style={s.small}>
            Todas as substâncias recebem o mesmo horário. Cada uma mantém seu próprio modelo e
            projeção. A composição fica salva mesmo se você cancelar esta ingestão.
          </Text>
          <FormulaError message={error} />
          <Button
            label="Registrar ingestão do blend"
            onPress={() => {
              try {
                const current = blends.find((b) => b.id === ingest.id);
                if (!current) throw new Error('Este blend não está mais disponível.');
                if (JSON.stringify(current) !== JSON.stringify(ingest))
                  throw new Error(
                    'A composição mudou. Reabra a ingestão para conferir as quantidades.',
                  );
                onIngest(
                  recordBlend(items, current, {
                    id: uid(),
                    at: doseTime(date, time),
                    servings: Number(servings.replace(',', '.')),
                  }),
                );
                setIngest(null);
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          />
        </EditSheet>
      )}
      {removing && (
        <EditSheet title="Excluir blend?" dirty={false} onClose={() => setRemoving(null)}>
          <Text style={s.body}>
            A composição salva de {removing.name} será removida. As ingestões anteriores e suas
            projeções permanecem.
          </Text>
          <FormulaError message={error} />
          <Button
            label="Confirmar exclusão do blend"
            danger
            onPress={() => {
              try {
                onChange(blends.filter((b) => b.id !== removing.id));
                setRemoving(null);
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          />
        </EditSheet>
      )}
    </View>
  );
}
