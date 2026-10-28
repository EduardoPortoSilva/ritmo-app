import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import {
  KeyboardScrollView as ScrollView,
  KeyboardTextInput as TextInput,
} from './KeyboardScrollView';
import * as Clipboard from 'expo-clipboard';
import type { Database } from './model';
import {
  exportFormulaCatalog,
  formulaBulkCorrectionPrompt,
  parseFormulaBulk,
  applyFormulaBulk,
  MAX_FORMULA_BULK_CHARS,
  type FormulaBulkPlan,
} from './formulaBulk';
import { Button, Field, PageHeader, s } from './ui';
import { FormulaError } from './FormulaFields';

export function FormulaBulkScreen({
  database,
  onBack,
  onApply,
  onDirtyChange,
}: {
  database: Database;
  onBack: () => void;
  onApply: (plan: FormulaBulkPlan) => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [text, setText] = useState('');
  const [plan, setPlan] = useState<FormulaBulkPlan | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [correction, setCorrection] = useState('');
  useEffect(
    () => onDirtyChange(!!text.trim() || !!correction.trim()),
    [text, correction, onDirtyChange],
  );
  const change = (value: string) => {
    if (value.length > MAX_FORMULA_BULK_CHARS) {
      setError('Limite de 250.000 caracteres.');
      return;
    }
    setText(value);
    setPlan(null);
    setError('');
    setMessage('');
  };
  const copy = async (instructions: boolean) => {
    try {
      const catalog = exportFormulaCatalog(database);
      if (catalog.length > MAX_FORMULA_BULK_CHARS)
        throw new Error(
          'Catálogo muito grande. Exporte um backup e prepare um lote menor com os IDs desejados.',
        );
      await Clipboard.setStringAsync(
        instructions
          ? `${formulaBulkCorrectionPrompt}\n\nPedido do usuário:\n${correction.trim() || 'Revise os modelos existentes e corrija os problemas encontrados.'}\n\nCatálogo atual:\n${catalog}`
          : catalog,
      );
      setError('');
      setMessage(
        instructions
          ? 'Pedido de correção copiado. Cole na sua IA e traga o JSON de volta.'
          : 'Catálogo copiado.',
      );
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <PageHeader
        title="Fórmulas em lote"
        subtitle="Adicione ou corrija modelos de cálculo por JSON."
        onBack={onBack}
      />
      <View style={s.card}>
        <Text style={s.body}>
          Para corrigir as fórmulas com ajuda de uma IA, descreva o ajuste e copie o pedido abaixo.
          Ele inclui o catálogo atual e as regras do app, sem histórico ou ingestões.
        </Text>
        <Field
          label="Correção desejada (opcional)"
          value={correction}
          onChangeText={setCorrection}
          placeholder="Ex.: revisar as variáveis das fórmulas do Supino."
          multiline
        />
        <Button label="Corrigir fórmulas com IA" icon="copy" onPress={() => void copy(true)} />
        <Text style={s.small}>
          Cole o pedido na IA que você usa. Depois, cole aqui o JSON devolvido, confira a prévia e
          aplique. O app não envia dados automaticamente nem modifica fórmulas ao copiar.
        </Text>
        {!!message && <Text style={s.small}>{message}</Text>}
        <Button
          label="Copiar catálogo de fórmulas (JSON)"
          icon="copy"
          secondary
          onPress={() => void copy(false)}
        />
        <Button
          label="Carregar catálogo no editor"
          secondary
          onPress={() => change(exportFormulaCatalog(database))}
        />
        <Text style={s.small}>
          Exercícios são identificados por rotinaId + exercicioId; substâncias por id. Itens
          omitidos permanecem. calorias: null remove um modelo. Nomes e IDs dos treinos, séries,
          cargas e repetições são preservados. Mudanças valem para os próximos treinos e ingestões.
        </Text>
      </View>
      <View style={s.card}>
        <TextInput
          accessibilityLabel="JSON de fórmulas em lote"
          value={text}
          onChangeText={change}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={MAX_FORMULA_BULK_CHARS}
          style={[s.input, { minHeight: 260, textAlignVertical: 'top', fontFamily: 'monospace' }]}
        />
        <Button
          label="Colar JSON de fórmulas"
          secondary
          onPress={() => {
            void Clipboard.getStringAsync()
              .then(change)
              .catch(() => setError('Não foi possível colar. Cole diretamente no campo.'));
          }}
        />
        <FormulaError message={error} />
        <Button
          label="Conferir alterações de fórmulas"
          onPress={() => {
            try {
              const next = parseFormulaBulk(text, database);
              applyFormulaBulk(database, next);
              setPlan(next);
              setError('');
            } catch (e) {
              setPlan(null);
              setError((e as Error).message);
            }
          }}
        />
      </View>
      {plan && (
        <View style={s.card} testID="formula-bulk-preview">
          <Text style={s.eyebrow}>PRÉVIA · NADA FOI ALTERADO</Text>
          <Text style={s.cardTitle}>
            {plan.exercises.length} {plan.exercises.length === 1 ? 'exercício' : 'exercícios'} ·{' '}
            {plan.substances.length} {plan.substances.length === 1 ? 'substância' : 'substâncias'}
          </Text>
          {plan.exercises.map((u) => (
            <View key={`${u.routineId}/${u.exerciseId}`}>
              <Text style={s.fieldLabel}>{u.name}</Text>
              <Text selectable style={s.small}>
                {u.model ? JSON.stringify(u.model, null, 2) : 'Remover modelo de calorias'}
              </Text>
            </View>
          ))}
          {plan.substances.map((u) => (
            <View key={u.id}>
              <Text style={s.fieldLabel}>{u.name}</Text>
              <Text selectable style={s.small}>
                {JSON.stringify(u.model, null, 2)}
              </Text>
            </View>
          ))}
          <Button label="Aplicar fórmulas da prévia" onPress={() => onApply(plan)} />
        </View>
      )}
    </ScrollView>
  );
}
