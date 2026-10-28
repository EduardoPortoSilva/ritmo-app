import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { KeyboardScrollView as ScrollView } from './KeyboardScrollView';
import {
  energyModelError,
  estimateWorkoutEnergy,
  loadBases,
  validProfile,
  type BodyProfile,
  type EnergyModel,
} from './energy';
import type { Workout, BodyWeightRecord } from './model';
import { formulaDraft, readFormula, FormulaFields, FormulaError, EditSheet } from './FormulaFields';
import { Button, Field, PageHeader, s } from './ui';

export function EnergyModelControl({
  model,
  onChange,
  name,
}: {
  model?: EnergyModel;
  onChange: (m: EnergyModel | undefined) => void;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => formulaDraft(model?.formula));
  const [basis, setBasis] = useState<EnergyModel['loadBasis']>(model?.loadBasis ?? 'total');
  const [multiplier, setMultiplier] = useState(String(model?.loadMultiplier ?? 1));
  const [cadence, setCadence] = useState(String(model?.secondsPerRep ?? 3));
  const [error, setError] = useState('');
  return (
    <>
      <Button
        secondary
        icon="zap"
        label={`${model ? 'Editar' : 'Definir'} calorias de ${name || 'exercício'}`}
        onPress={() => {
          setDraft(formulaDraft(model?.formula));
          setBasis(model?.loadBasis ?? 'total');
          setMultiplier(String(model?.loadMultiplier ?? 1));
          setCadence(String(model?.secondsPerRep ?? 3));
          setError('');
          setOpen(true);
        }}
      />
      {open && (
        <EditSheet title="Calorias nas séries" onClose={() => setOpen(false)}>
          <Text style={s.small}>
            Modelo por série concluída, com saída em kcal. O tempo é estimado pela cadência;
            descansos e gasto após o treino ficam fora desta conta.
          </Text>
          <View style={{ gap: 8 }}>
            {Object.entries(loadBases).map(([key, label]) => (
              <Button
                key={key}
                label={label}
                secondary={basis !== key}
                onPress={() => setBasis(key as EnergyModel['loadBasis'])}
              />
            ))}
          </View>
          <Field
            label="Multiplicador do equipamento"
            value={multiplier}
            onChangeText={setMultiplier}
            numeric
          />
          <Field label="Segundos por repetição" value={cadence} onChangeText={setCadence} numeric />
          <FormulaFields
            draft={draft}
            onChange={setDraft}
            variables="bodyWeight: kg; height: cm; load: carga digitada (kg); sides: 1 ou 2; totalLoad: load × sides × multiplicador; reps: repetições; seconds: reps × segundos por repetição."
          />
          <FormulaError message={error} />
          <Button
            label="Salvar modelo de calorias"
            onPress={() => {
              try {
                const next: EnergyModel = {
                  formula: readFormula(draft),
                  loadBasis: basis,
                  loadMultiplier: Number(multiplier.replace(',', '.')),
                  secondsPerRep: Number(cadence.replace(',', '.')),
                };
                const error = energyModelError(next);
                if (error) throw new Error(error);
                onChange(next);
                setOpen(false);
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          />
          {model && (
            <Button
              label="Remover modelo de calorias"
              secondary
              danger
              onPress={() => {
                onChange(undefined);
                setOpen(false);
              }}
            />
          )}
        </EditSheet>
      )}
    </>
  );
}
export function EnergySummary({ workout }: { workout: Workout }) {
  const [details, setDetails] = useState(false);
  if (!workout.exercises.some((e) => e.energyModel)) return null;
  const estimate = estimateWorkoutEnergy(workout);
  return (
    <View style={s.progressCard} testID="strength-energy">
      <Text style={s.fieldLabel}>Calorias estimadas nas séries</Text>
      <Text style={s.cardTitle}>
        {estimate.kcal === null
          ? 'Sem estimativa disponível'
          : `≈ ${Math.round(estimate.kcal)} kcal`}
      </Text>
      <Text style={s.small}>
        {estimate.covered} de {estimate.total} séries concluídas com estimativa. Descansos não
        incluídos.
      </Text>
      {estimate.issues.slice(0, 4).map((message) => (
        <Text key={message} style={s.small}>
          {message}
        </Text>
      ))}
      <Button
        label={details ? 'Recolher cálculo de calorias' : 'Ver cálculo de calorias'}
        secondary
        onPress={() => setDetails(!details)}
      />
      {details && (
        <>
          <Text style={s.small}>
            Peso: {workout.bodyWeight || 'não informado'} kg · Altura:{' '}
            {workout.bodyHeight || 'não informada'} cm. Fórmulas copiadas para este treino.
          </Text>
          {workout.exercises
            .filter((e) => e.energyModel)
            .map((e) => (
              <View key={e.id} style={{ gap: 4 }}>
                <Text style={s.fieldLabel}>
                  {e.name} · {loadBases[e.energyModel!.loadBasis]}
                </Text>
                <Text selectable style={s.small}>
                  {JSON.stringify(e.energyModel!.formula, null, 2)}
                </Text>
                <Text style={s.small}>
                  Multiplicador: {e.energyModel!.loadMultiplier} · {e.energyModel!.secondsPerRep}{' '}
                  s/rep.
                </Text>
              </View>
            ))}
        </>
      )}
    </View>
  );
}
export function BodyProfileScreen({
  initial,
  latestWeight,
  onSave,
  onBack,
  onDirtyChange,
}: {
  initial?: BodyProfile;
  latestWeight?: BodyWeightRecord;
  onSave: (p: BodyProfile) => void;
  onBack: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const baseline: BodyProfile = {
    weightKg: latestWeight?.weight ?? initial?.weightKg ?? '',
    heightCm: initial?.heightCm ?? '',
    weightRecordedAt: latestWeight?.recordedAt ?? initial?.weightRecordedAt,
  };
  const [profile, setProfile] = useState(baseline);
  const [confirmedWeight, setConfirmedWeight] = useState(false);
  const [error, setError] = useState('');
  useEffect(
    () =>
      onDirtyChange(
        confirmedWeight ||
          profile.weightKg !== baseline.weightKg ||
          profile.heightCm !== baseline.heightCm,
      ),
    [profile, baseline.weightKg, baseline.heightCm, confirmedWeight, onDirtyChange],
  );
  return (
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <PageHeader
        title="Dados para estimativas"
        subtitle="Usados nos próximos treinos de força."
        onBack={onBack}
      />
      <View style={s.card}>
        <Field
          label="Peso de referência (kg)"
          numeric
          value={profile.weightKg}
          onChangeText={(weightKg) => setProfile({ ...profile, weightKg })}
        />
        <Field
          label="Altura de referência (cm)"
          numeric
          value={profile.heightCm}
          onChangeText={(heightCm) => setProfile({ ...profile, heightCm })}
        />
        {!!profile.weightKg && (
          <>
            <Text style={s.small}>
              {confirmedWeight || profile.weightKg !== baseline.weightKg
                ? 'Este peso será registrado com a data de hoje.'
                : baseline.weightRecordedAt
                  ? `Peso registrado em ${new Date(baseline.weightRecordedAt).toLocaleDateString('pt-BR')}.`
                  : 'Peso sem data de registro. Confirme se ele ainda está atualizado.'}
            </Text>
            {!confirmedWeight && profile.weightKg === baseline.weightKg && (
              <Button
                label="Confirmar este peso para hoje"
                secondary
                icon="check"
                onPress={() => setConfirmedWeight(true)}
              />
            )}
          </>
        )}
        <Text style={s.small}>
          Os dados são opcionais. Cada fórmula pede suas variáveis; dados ausentes aparecem como
          pendências. Editar aqui preserva o histórico e o treino já iniciado.
        </Text>
        <FormulaError message={error} />
        <Button
          label="Salvar dados de referência"
          onPress={() => {
            const next = {
              ...profile,
              weightRecordedAt: !profile.weightKg
                ? undefined
                : confirmedWeight || profile.weightKg !== baseline.weightKg
                  ? new Date().toISOString()
                  : baseline.weightRecordedAt,
            };
            if (!validProfile(next)) {
              setError(
                'Confira peso (mais de 0 até 999 kg) e altura (50 a 250 cm), ou deixe em branco.',
              );
              return;
            }
            onSave(next);
          }}
        />
      </View>
    </ScrollView>
  );
}
