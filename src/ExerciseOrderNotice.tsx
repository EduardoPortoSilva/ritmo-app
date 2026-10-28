import React, { useState } from 'react';
import { Keyboard, Pressable, Text, View } from 'react-native';
import { ExplanationModal } from './ExplanationModal';
import { ExerciseOrderSymbol } from './ExerciseOrderSymbol';
import { type ExerciseOrderChange } from './exerciseOrder';
import { Button, s } from './ui';
import { colors as c } from './theme';

function OrderPairs({ changes }: { changes: readonly ExerciseOrderChange[] }) {
  return (
    <View style={{ gap: 12 }}>
      {changes.map((change) => (
        <View
          key={JSON.stringify([change.beforeId, change.afterId])}
          style={{ backgroundColor: c.warningSoft, borderRadius: 12, padding: 14, gap: 8 }}
        >
          <Text style={s.small}>Ordem no cadastro daquele treino</Text>
          <Text style={s.fieldLabel}>
            {change.beforeName} → {change.afterName}
          </Text>
          <Text style={s.small}>Ordem realizada</Text>
          <Text style={s.fieldLabel}>
            {change.afterName} → {change.beforeName}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function OrderConfirmation({
  changes,
  onAnswer,
}: {
  changes: readonly ExerciseOrderChange[];
  onAnswer: (confirmed: boolean) => void;
}) {
  return (
    <ExplanationModal
      title="A ordem dos exercícios mudou?"
      testID="exercise-order-confirmation"
      onClose={() => onAnswer(false)}
      footer={
        <View style={{ gap: 10 }}>
          <Button label="Sim, a ordem mudou" onPress={() => onAnswer(true)} />
          <Button label="Não, só registrei depois" secondary onPress={() => onAnswer(false)} />
        </View>
      }
    >
      <Text style={s.body}>
        Você marcou a primeira série de {changes[0]?.beforeName} depois de concluir todas as séries
        do exercício abaixo, que vem depois no cadastro. Você fez nesta ordem?
      </Text>
      <OrderPairs changes={changes} />
      <Text style={s.small}>
        A ordem pode afetar as cargas. Confirmar guarda essa informação neste treino e mostra um
        aviso no próximo, sem mudar a ordem do cadastro ou as cargas.
      </Text>
    </ExplanationModal>
  );
}

export function OrderChangesExplanation({
  changes,
  previous = true,
  onClose,
}: {
  changes: readonly ExerciseOrderChange[];
  previous?: boolean;
  onClose: () => void;
}) {
  return (
    <ExplanationModal
      title={previous ? 'Ordem diferente no último treino' : 'Ordem alterada neste treino'}
      testID="exercise-order-explanation"
      onClose={onClose}
    >
      <Text style={s.body}>
        {previous
          ? 'No último treino desta rotina, você confirmou estas mudanças na ordem dos exercícios.'
          : 'Você confirmou estas mudanças na ordem dos exercícios deste treino.'}
      </Text>
      <OrderPairs changes={changes} />
      <Text style={s.body}>
        Fazer um exercício antes ou depois de outro pode afetar a carga que você consegue usar.
        Considere essa diferença ao comparar as cargas com o último treino.
      </Text>
      <Text style={s.small}>
        As cargas e a ordem do cadastro continuam como estavam. Cada símbolo amarelo representa uma
        troca; toque nele para consultar o par novamente.
      </Text>
    </ExplanationModal>
  );
}

export function ExerciseOrderStatus({
  change,
  previous,
}: {
  change: ExerciseOrderChange;
  previous: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ordem alterada: ${change.beforeName} e ${change.afterName}`}
        accessibilityHint="Mostra a ordem cadastrada e a ordem realizada."
        hitSlop={4}
        testID="exercise-order-status"
        onPress={() => {
          Keyboard.dismiss();
          setOpen(true);
        }}
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: c.warningSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ExerciseOrderSymbol />
      </Pressable>
      {open && (
        <OrderChangesExplanation
          changes={[change]}
          previous={previous}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
