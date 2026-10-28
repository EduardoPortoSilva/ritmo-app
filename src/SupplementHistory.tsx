import React, { useState } from 'react';
import { Text, View } from 'react-native';
import type { Database } from './model';
import type { Supplement } from './supplements';
import { previewSupplementHistory, type SupplementHistoryPlan } from './supplementDoses';
import { ExplanationModal } from './ExplanationModal';
import { Button, Field, s } from './ui';
import { colors as c } from './theme';

export function SupplementHistory({
  database,
  supplement,
  saving,
  onApply,
}: {
  database: Database;
  supplement: Supplement;
  saving: boolean;
  onApply: (plan: SupplementHistoryPlan) => Promise<void>;
}) {
  const [time, setTime] = useState('');
  const [from, setFrom] = useState('');
  const [plan, setPlan] = useState<SupplementHistoryPlan | null>(null);
  const [error, setError] = useState('');
  if (!supplement.takenOn.length) return null;
  const added = plan?.entries.filter((e) => e.status === 'add').length ?? 0;
  return (
    <View style={s.card} testID="supplement-history">
      <Text style={s.cardTitle}>Aproveitar o histórico</Text>
      <Text style={s.small}>
        {supplement.takenOn.length} dias já marcados. Horários de confirmação salvos serão usados.
        Para os dias antigos sem horário, informe a hora média de ingestão.
      </Text>
      <Field
        label="Hora média de ingestão (HH:mm)"
        value={time}
        placeholder="Ex.: 08:30"
        onChangeText={setTime}
      />
      <Field
        label="Importar a partir de (AAAA-MM-DD, opcional)"
        value={from}
        placeholder="Ex.: 2026-10-01"
        onChangeText={setFrom}
      />
      <Text style={s.small}>
        A prévia usa a dose configurada e o modelo atual. Cada dia antigo equivale a uma ingestão; o
        horário médio ficará identificado como estimado. Dias que já têm ingestão da substância
        serão ignorados para evitar duplicação.
      </Text>
      {!!error && (
        <Text style={{ color: c.danger }} accessibilityRole="alert">
          {error}
        </Text>
      )}
      <Button
        secondary
        label="Conferir histórico de ingestões"
        onPress={() => {
          setError('');
          try {
            setPlan(previewSupplementHistory(database, supplement, time.trim(), from.trim()));
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      />
      {plan && (
        <ExplanationModal
          title="Prévia das doses anteriores"
          testID="supplement-history-preview"
          onClose={() => setPlan(null)}
          footer={
            <View style={{ gap: 10 }}>
              <Button
                label={
                  saving
                    ? 'Salvando…'
                    : `Salvar vínculo e importar ${added} ${added === 1 ? 'dose' : 'doses'}`
                }
                disabled={saving || !added}
                onPress={() => {
                  void onApply(plan);
                }}
              />
              <Button
                secondary
                label="Voltar à edição"
                disabled={saving}
                onPress={() => setPlan(null)}
              />
            </View>
          }
        >
          <Text style={s.body}>
            Novas doses: {added}. Itens com ingestão no dia:{' '}
            {plan.entries.filter((e) => e.status === 'existing').length}. Horários futuros
            ignorados: {plan.entries.filter((e) => e.status === 'future').length}.
          </Text>
          <Text style={s.small}>
            Dose e fórmula atuais serão usadas nas novas ingestões. As já existentes preservam dose
            e modelo. Os dias sem horário não ganham uma confirmação retroativa; só as doses recebem
            o horário médio informado.
          </Text>
          {plan.entries.slice(0, 50).map((e) => (
            <View key={JSON.stringify([e.substanceId, e.day])} style={{ gap: 4 }}>
              <Text style={s.fieldLabel}>
                {e.name} · {e.amount} {e.unit}
              </Text>
              <Text style={s.small}>
                {new Date(e.at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}{' '}
                · {e.estimatedTime ? 'hora média' : 'horário da confirmação'}
              </Text>
              <Text style={s.small}>
                {e.status === 'add'
                  ? 'Criar ingestão'
                  : e.status === 'existing'
                    ? 'Ignorar: já há ingestão no dia'
                    : 'Ignorar: horário futuro'}
              </Text>
            </View>
          ))}
          {plan.entries.length > 50 && (
            <Text style={s.small}>
              Mostrando 50 de {plan.entries.length} itens. As contagens acima incluem todos. Use a
              data inicial para conferir um período menor.
            </Text>
          )}
        </ExplanationModal>
      )}
    </View>
  );
}
