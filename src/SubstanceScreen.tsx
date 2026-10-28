import React, { useEffect, useMemo, useState } from 'react';
import { AppState, Text, View } from 'react-native';
import { KeyboardScrollView as ScrollView } from './KeyboardScrollView';
import Svg, { Polyline } from 'react-native-svg';
import * as Clipboard from 'expo-clipboard';
import { Button, Field, PageHeader, s } from './ui';
import { colors as c } from './theme';
import { formatNumber, uid } from './model';
import { BlendControls } from './BlendControls';
import { IntakeSupplementNotice } from './SupplementLinks';
import type { Supplement } from './supplements';
import { removeBlendIntake, formatSubstanceQuantity, type SubstanceBlend } from './substanceBlends';
import { localDate, localTime, doseTime } from './substanceTime';
import {
  EditSheet,
  FormulaFields,
  FormulaText,
  FormulaError,
  formulaDraft,
  readFormula,
  type FormulaDraft,
} from './FormulaFields';
import {
  doseModelExample,
  recordDose,
  removeDose,
  substanceAmount,
  substanceCurve,
  substanceModelError,
  validSubstance,
  type Substance,
} from './substances';

export const substancePrompt = `Retorne somente JSON {"name":"nome", "unit":"mg", "model":{"mode":"sum", "absorptionHours":1, "halfLifeHours":5, "horizonHours":24, "formula":{"expression":"expressão", "steps":[], "parameters":{}, "reference":"referência e hipóteses"}}}. Os números mostrados são exemplos, não parâmetros de uma substância específica. Use os dados e referências fornecidos pelo usuário; não invente valores ou validação clínica. A saída é quantidade na unidade informada, não concentração sanguínea nem intensidade de efeito. t: horas desde a ingestão, d: quantidade ingerida, a: parâmetro de absorção em horas, h: meia-vida em horas. Defina na referência se a significa meia-vida de absorção, pico ou outra medida; não são equivalentes. mode=sum soma contribuições independentes de cada dose; não permite p1..p4. mode=state usa somente a curva da última ingestão e permite p1: residual da curva anterior no instante dessa ingestão; p2..p4: três residuais anteriores, guardados nos instantes em que foram registrados, não projetados para agora. Inicialização p1..p4=0. Não some doses separadamente em state. Sua expressão deve representar a evolução conjunta; se esses dados não bastarem para o modelo, explique ao usuário em vez de inventar uma solução. Até quatro passos sem loops em steps, referenciados por v1..v4 em ordem; cada passo acessa só os anteriores. A expressão final acessa os passos e variáveis. Sem recorrência ou função F(t-1). Sintaxe: ponto decimal; + - * / % ^; < <= > >= == != && ||; if(condição,sim,não) com avaliação só do ramo escolhido; exp, ln, log, sqrt, abs, sin, cos, min, max, pow, clamp, floor, ceil, round; constantes pi e e. Até 1.200 caracteres por expressão, 256 tokens, 24 níveis; até 16 parâmetros numéricos de módulo <=1e9 com nomes sem colisão com variáveis, funções, constantes ou v1..v4. Máximo 500 caracteres em reference. Fórmulas precisam devolver valores finitos e não negativos. Cada ingestão guarda uma cópia do modelo; uma mudança de modelo só vale para próximas ingestões. Este é um simulador com parâmetros assumidos, não uma recomendação de dose.`;
type Editor = {
  id: string;
  name: string;
  unit: string;
  mode: 'sum' | 'state';
  a: string;
  h: string;
  horizon: string;
  formula: FormulaDraft;
};
const toEditor = (item?: Substance): Editor => {
  const model = item?.model ?? doseModelExample();
  return {
    id: item?.id ?? uid(),
    name: item?.name ?? '',
    unit: item?.unit ?? 'mg',
    mode: model.mode,
    a: String(model.absorptionHours),
    h: String(model.halfLifeHours),
    horizon: String(model.horizonHours),
    formula: formulaDraft(model.formula),
  };
};
function Projection({ item, now }: { item: Substance; now: number }) {
  const result = useMemo(() => {
    try {
      return { amount: substanceAmount(item, now), points: substanceCurve(item, now), error: '' };
    } catch (e) {
      return { amount: null, points: [], error: (e as Error).message };
    }
  }, [item, now]);
  const max = Math.max(1, ...result.points.map((p) => p.amount));
  return (
    <View style={s.progressCard} testID="substance-projection">
      <Text style={s.fieldLabel}>Quantidade estimada agora</Text>
      <Text style={s.title}>
        {result.amount === null ? 'Indisponível' : `≈ ${formatNumber(result.amount)} ${item.unit}`}
      </Text>
      <FormulaError message={result.error} />
      {!!result.points.length && (
        <>
          <Text style={s.small}>
            Projeção sem novas ingestões · máximo no gráfico: {formatNumber(max)} {item.unit}
          </Text>
          <Svg
            width="100%"
            height={120}
            viewBox="0 0 300 120"
            accessibilityLabel={`Projeção estimada de ${item.name}`}
          >
            <Polyline
              points={result.points
                .map((p, i) => `${8 + (i * 284) / 32},${110 - (p.amount / max) * 100}`)
                .join(' ')}
              fill="none"
              stroke={c.dark}
              strokeWidth={2}
            />
          </Svg>
          <View style={s.sectionHeader}>
            <Text style={s.small}>Agora</Text>
            <Text style={s.small}>+{item.model.horizonHours} h</Text>
          </View>
        </>
      )}
      <Text style={s.small}>
        Simulação do modelo cadastrado. Quantidade estimada não mede concentração sanguínea ou
        efeito e não indica quando repetir uma dose.
      </Text>
    </View>
  );
}
export function SubstanceScreen({
  items,
  blends,
  supplements,
  onBlendsChange,
  onChange,
  onBack,
  onBulk,
}: {
  items: Substance[];
  blends: SubstanceBlend[];
  supplements: Supplement[];
  onBlendsChange: (blends: SubstanceBlend[]) => void;
  onChange: (items: Substance[]) => void;
  onBack: () => void;
  onBulk: () => void;
}) {
  const [now, setNow] = useState(Date.now);
  const [selected, setSelected] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [ingest, setIngest] = useState<Substance | null>(null);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [json, setJson] = useState('');
  const [remove, setRemove] = useState<{ item: Substance; doseId?: string } | null>(null);
  const [message, setMessage] = useState('');
  const [modelDetails, setModelDetails] = useState(false);
  const [doseDetails, setDoseDetails] = useState<string | null>(null);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(Date.now());
    });
    return () => {
      clearInterval(timer);
      listener.remove();
    };
  }, []);
  const item = items.find((i) => i.id === selected) ?? items[0];
  const existing = items.find((i) => i.id === editor?.id);
  const removingBlendIntake = remove?.item.doses.find((d) => d.id === remove.doseId)?.blend;
  const save = (next: Substance) => {
    if (!validSubstance(next))
      throw new Error('Confira nome, unidade, fórmula e registros do acompanhamento.');
    if (!items.some((i) => i.id === next.id) && items.length >= 30)
      throw new Error('Limite de 30 acompanhamentos.');
    onChange(
      items.some((i) => i.id === next.id)
        ? items.map((i) => (i.id === next.id ? next : i))
        : [...items, next],
    );
    setSelected(next.id);
    setNow(Date.now());
  };
  return (
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <PageHeader
        title="Substâncias"
        subtitle="Registre ingestões e acompanhe seu modelo."
        onBack={onBack}
      />
      <Button
        label="Nova substância"
        icon="plus"
        onPress={() => {
          setEditor(toEditor());
          setError('');
        }}
      />
      <BlendControls
        items={items}
        blends={blends}
        supplements={supplements}
        onChange={onBlendsChange}
        onIngest={(next) => {
          onChange(next);
          setNow(Date.now());
        }}
      />
      <View style={s.card}>
        <Text style={s.fieldLabel}>Modelos personalizados</Text>
        <Button label="Editar fórmulas em lote" secondary icon="code" onPress={onBulk} />
        <Text style={s.small}>
          A fórmula e os parâmetros são definidos por você. O exemplo de absorção e eliminação serve
          para montar o modelo; não é um perfil farmacológico validado.
        </Text>
        <Button
          secondary
          label="Copiar instruções do modelo para IA"
          icon="copy"
          onPress={() => {
            void Clipboard.setStringAsync(substancePrompt)
              .then(() => setMessage('Instruções copiadas.'))
              .catch(() => setMessage('Não foi possível copiar.'));
          }}
        />
        <Button
          secondary
          label="Importar modelo de substância"
          icon="download"
          onPress={() => {
            setImporting(true);
            setJson('');
            setError('');
          }}
        />
        {!!message && <Text style={s.small}>{message}</Text>}
      </View>
      {!items.length && (
        <Text style={s.body}>
          Cadastre uma substância, configure o modelo e registre a primeira ingestão.
        </Text>
      )}
      <View style={{ gap: 8 }}>
        {items.map((i) => (
          <Button
            key={i.id}
            label={i.name}
            secondary={item?.id !== i.id}
            onPress={() => setSelected(i.id)}
          />
        ))}
      </View>
      {item && (
        <>
          <Projection item={item} now={now} />
          <Button
            label={`Registrar ingestão de ${item.name}`}
            icon="plus"
            onPress={() => {
              const current = new Date();
              setIngest(item);
              setAmount('');
              setDate(localDate(current));
              setTime(localTime(current));
              setError('');
            }}
          />
          <View style={s.card}>
            <Text style={s.cardTitle}>{item.name}</Text>
            <Text style={s.small}>
              {item.model.mode === 'sum'
                ? 'Soma das contribuições de cada dose'
                : 'Modelo acumulado com até 4 residuais'}{' '}
              · {item.doses.length}/200 ingestões
            </Text>
            <Text style={s.small}>{item.model.formula.reference}</Text>
            <Button
              label="Editar modelo da substância"
              secondary
              icon="edit-2"
              onPress={() => {
                setEditor(toEditor(item));
                setError('');
              }}
            />
            <Button
              secondary
              label={modelDetails ? 'Recolher fórmula atual' : 'Ver fórmula atual'}
              onPress={() => setModelDetails(!modelDetails)}
            />
            {modelDetails && (
              <Text selectable style={s.small}>
                {JSON.stringify(item.model, null, 2)}
              </Text>
            )}
          </View>
          <Text style={s.sectionTitle}>Ingestões registradas</Text>
          {[...item.doses].reverse().map((d) => (
            <View style={s.card} key={d.id}>
              <Text style={s.fieldLabel}>
                {formatSubstanceQuantity(d.amount)} {item.unit} ·{' '}
                {new Date(d.at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
              </Text>
              {d.blend && (
                <Text style={s.fieldLabel}>
                  Blend {d.blend.name} · {formatSubstanceQuantity(d.blend.servings)}{' '}
                  {d.blend.servings === 1 ? 'porção' : 'porções'}
                </Text>
              )}
              <Text style={s.small}>Modelo desta ingestão: {d.model.formula.reference}</Text>
              <Button
                secondary
                label={
                  doseDetails === d.id ? 'Recolher modelo da ingestão' : 'Ver modelo da ingestão'
                }
                onPress={() => setDoseDetails(doseDetails === d.id ? null : d.id)}
              />
              {doseDetails === d.id && (
                <Text selectable style={s.small}>
                  {JSON.stringify({ model: d.model, prior: d.prior, blend: d.blend }, null, 2)}
                </Text>
              )}
              <Button
                label={
                  d.blend
                    ? `Excluir ingestão do blend ${d.blend.name}`
                    : `Excluir ingestão de ${formatSubstanceQuantity(d.amount)} ${item.unit}`
                }
                secondary
                danger
                onPress={() => {
                  setRemove({ item, doseId: d.id });
                  setError('');
                }}
              />
            </View>
          ))}
          <Button
            label="Excluir acompanhamento"
            secondary
            danger
            onPress={() => {
              setRemove({ item });
              setError('');
            }}
          />
        </>
      )}
      {editor && (
        <EditSheet
          title={existing ? 'Editar substância' : 'Nova substância'}
          onClose={() => setEditor(null)}
        >
          <Field
            label="Nome da substância"
            value={editor.name}
            onChangeText={(name) => setEditor({ ...editor, name })}
          />
          <Field
            label="Unidade da quantidade"
            value={editor.unit}
            onChangeText={(unit) => setEditor({ ...editor, unit })}
          />
          {!existing?.doses.length && (
            <View style={{ gap: 8 }}>
              <Button
                label="Somar curvas por dose"
                secondary={editor.mode !== 'sum'}
                onPress={() => setEditor({ ...editor, mode: 'sum' })}
              />
              <Button
                label="Modelo acumulado"
                secondary={editor.mode !== 'state'}
                onPress={() => setEditor({ ...editor, mode: 'state' })}
              />
            </View>
          )}
          {!!existing?.doses.length && (
            <Text style={s.small}>
              Modo de combinação e unidade são preservados com ingestões existentes. Para outro modo
              ou unidade, crie um novo acompanhamento. Alterações de fórmula valem só para próximas
              ingestões.
            </Text>
          )}
          <Field
            label="Parâmetro de absorção (horas)"
            numeric
            value={editor.a}
            onChangeText={(a) => setEditor({ ...editor, a })}
          />
          <Field
            label="Meia-vida de eliminação (horas)"
            numeric
            value={editor.h}
            onChangeText={(h) => setEditor({ ...editor, h })}
          />
          <Field
            label="Janela de projeção (horas)"
            numeric
            value={editor.horizon}
            onChangeText={(horizon) => setEditor({ ...editor, horizon })}
          />
          <FormulaFields
            draft={editor.formula}
            onChange={(formula) => setEditor({ ...editor, formula })}
            variables={`t: horas desde a ingestão; d: quantidade; a: parâmetro de absorção; h: meia-vida, ambos em horas.${editor.mode === 'state' ? ' p1: residual anterior na ingestão; p2..p4: três residuais anteriores registrados. Primeiro registro: todos zero.' : ''} Defina na referência o significado de a; o exemplo usa meia-vida de absorção.`}
          />
          <FormulaError message={error} />
          <Button
            label="Salvar substância"
            onPress={() => {
              try {
                if (existing?.doses.length && editor.unit.trim() !== existing.unit)
                  throw new Error('Crie outro acompanhamento para mudar a unidade.');
                const model = {
                  mode: editor.mode,
                  absorptionHours: Number(editor.a.replace(',', '.')),
                  halfLifeHours: Number(editor.h.replace(',', '.')),
                  horizonHours: Number(editor.horizon.replace(',', '.')),
                  formula: readFormula(editor.formula),
                };
                const error = substanceModelError(model);
                if (error) throw new Error(error);
                save({
                  id: editor.id,
                  name: editor.name.trim(),
                  unit: editor.unit.trim(),
                  model,
                  doses: existing?.doses ?? [],
                });
                setEditor(null);
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          />
        </EditSheet>
      )}
      {ingest && (
        <EditSheet title={`Ingestão · ${ingest.name}`} onClose={() => setIngest(null)}>
          <Field
            label={`Quantidade (${ingest.unit})`}
            numeric
            value={amount}
            onChangeText={setAmount}
          />
          <Field label="Data da ingestão (AAAA-MM-DD)" value={date} onChangeText={setDate} />
          <Field label="Horário da ingestão (HH:mm)" value={time} onChangeText={setTime} />
          <Text style={s.small}>
            Horário local do aparelho. Você pode registrar uma ingestão anterior.
          </Text>
          <IntakeSupplementNotice supplements={supplements} substanceIds={[ingest.id]} />
          <FormulaError message={error} />
          <Button
            label="Salvar ingestão"
            onPress={() => {
              try {
                const current = items.find((i) => i.id === ingest.id);
                if (!current) throw new Error('Acompanhamento não encontrado.');
                save(
                  recordDose(current, {
                    id: uid(),
                    amount: Number(amount.replace(',', '.')),
                    at: doseTime(date, time),
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
      {importing && (
        <EditSheet title="Importar modelo" onClose={() => setImporting(false)}>
          <FormulaText
            label="JSON do modelo da substância"
            value={json}
            onChange={setJson}
            limit={12_000}
          />
          <FormulaError message={error} />
          <Button
            label="Conferir modelo importado"
            onPress={() => {
              try {
                const parsed = JSON.parse(json);
                if (
                  !parsed ||
                  typeof parsed !== 'object' ||
                  Array.isArray(parsed) ||
                  Object.keys(parsed).some((k) => !['name', 'unit', 'model'].includes(k))
                )
                  throw new Error('Use name, unit e model, sem ingestões ou outros campos.');
                const candidate = { ...parsed, id: uid(), doses: [] };
                if (!validSubstance(candidate))
                  throw new Error(substanceModelError(parsed.model) || 'Confira nome e unidade.');
                setEditor(toEditor(candidate));
                setImporting(false);
                setError('');
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          />
        </EditSheet>
      )}
      {remove && (
        <EditSheet
          dirty={false}
          title={remove.doseId ? 'Excluir ingestão?' : 'Excluir acompanhamento?'}
          onClose={() => setRemove(null)}
        >
          <Text style={s.body}>
            {removingBlendIntake
              ? 'A ingestão inteira do blend será excluída de todas as substâncias. As projeções e residuais seguintes serão recalculados.'
              : remove.doseId
                ? 'A projeção e os residuais seguintes serão recalculados preservando as fórmulas de cada ingestão.'
                : 'As ingestões deste acompanhamento serão removidas. Os suplementos diários permanecem.'}
          </Text>
          {remove.doseId && (
            <Text style={s.small}>
              As marcações diárias dos suplementos permanecem. Você pode desfazê-las em Suplementos.
            </Text>
          )}
          {removingBlendIntake?.components.map((component) => (
            <Text key={component.substanceId} style={s.small}>
              {component.name} · {formatSubstanceQuantity(component.amount)} {component.unit}
            </Text>
          ))}
          <FormulaError message={error} />
          <Button
            label="Confirmar exclusão"
            danger
            onPress={() => {
              try {
                if (removingBlendIntake) {
                  onChange(removeBlendIntake(items, removingBlendIntake.intakeId));
                  setNow(Date.now());
                } else if (remove.doseId) save(removeDose(remove.item, remove.doseId));
                else onChange(items.filter((i) => i.id !== remove.item.id));
                setRemove(null);
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          />
        </EditSheet>
      )}
    </ScrollView>
  );
}
