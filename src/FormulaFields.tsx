import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Text, View } from 'react-native';
import {
  KeyboardScrollView as ScrollView,
  KeyboardTextInput as TextInput,
} from './KeyboardScrollView';
import type { Formula } from './formulas';
import { Button, s } from './ui';
import { colors as c } from './theme';

export type FormulaDraft = {
  expression: string;
  steps: string;
  parameters: string;
  reference: string;
};
export const formulaDraft = (f?: Formula): FormulaDraft => ({
  expression: f?.expression ?? '',
  steps: f?.steps?.join('\n') ?? '',
  parameters: JSON.stringify(f?.parameters ?? {}, null, 2),
  reference: f?.reference ?? '',
});
export function readFormula(d: FormulaDraft): Formula {
  let parameters;
  try {
    parameters = JSON.parse(d.parameters);
  } catch {
    throw new Error('Parâmetros: use um objeto JSON, como {"k": 0.5}.');
  }
  return {
    expression: d.expression.trim(),
    steps: d.steps.trim()
      ? d.steps
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    parameters,
    reference: d.reference.trim(),
  };
}
export function FormulaText({
  label,
  value,
  onChange,
  limit = 1200,
  multiline = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  limit?: number;
  multiline?: boolean;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        maxLength={limit}
        autoCapitalize="none"
        autoCorrect={false}
        multiline={multiline}
        style={[s.input, multiline && { minHeight: 72, textAlignVertical: 'top' }]}
      />
    </View>
  );
}
export function FormulaFields({
  draft,
  onChange,
  variables,
}: {
  draft: FormulaDraft;
  onChange: (d: FormulaDraft) => void;
  variables: string;
}) {
  return (
    <View style={{ gap: 12 }}>
      <Text style={s.small}>{variables}</Text>
      <FormulaText
        label="Expressão"
        value={draft.expression}
        onChange={(expression) => onChange({ ...draft, expression })}
      />
      <FormulaText
        label="Passos intermediários (opcional)"
        value={draft.steps}
        onChange={(steps) => onChange({ ...draft, steps })}
        limit={4800}
      />
      <Text style={s.small}>
        Até 4 linhas, em ordem: v1, v2, v3, v4. Cada passo usa somente os anteriores. A expressão
        final pode usar esses valores.
      </Text>
      <FormulaText
        label="Parâmetros (JSON)"
        value={draft.parameters}
        onChange={(parameters) => onChange({ ...draft, parameters })}
        limit={1200}
      />
      <FormulaText
        label="Referência e hipóteses"
        value={draft.reference}
        onChange={(reference) => onChange({ ...draft, reference })}
        limit={500}
      />
      <Text style={s.small}>
        Use ponto decimal; + − * / ^, comparações, exp, ln, sqrt, abs, min, max, pow, clamp e
        if(condição, sim, não). Resultado finito; sem funções recursivas.
      </Text>
    </View>
  );
}
export const FormulaError = ({ message }: { message: string }) =>
  message ? (
    <Text accessibilityRole="alert" style={{ color: c.danger }}>
      {message}
    </Text>
  ) : null;

export function EditSheet({
  title,
  children,
  onClose,
  dirty = true,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  dirty?: boolean;
}) {
  const [discard, setDiscard] = useState(false);
  const close = () => (dirty ? setDiscard(true) : onClose());
  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView
        style={[s.modalOverlay, { padding: 16 }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View
          style={[s.modalCard, { maxWidth: 520, maxHeight: '90%', padding: 0 }]}
          accessibilityViewIsModal
          accessibilityLabel={title}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 20, gap: 16 }}
          >
            <Text style={s.sectionTitle}>{title}</Text>
            {discard ? (
              <>
                <Text style={s.body}>Descartar as alterações que ainda não foram salvas?</Text>
                <Button label="Continuar editando" onPress={() => setDiscard(false)} />
                <Button label="Descartar alterações" secondary danger onPress={onClose} />
              </>
            ) : (
              <>
                {children}
                <Button label={dirty ? 'Cancelar edição' : 'Fechar'} secondary onPress={close} />
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
