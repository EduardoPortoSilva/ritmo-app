import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  applyBulkImport,
  bulkImportExample,
  bulkImportPrompt,
  MAX_BULK_IMPORT_CHARS,
  parseBulkImport,
  type BulkPlan,
} from './bulkImport';
import { routineDays, weekdays, type Database, type Routine } from './model';
import { muscleById } from './muscles';
import { colors as c } from './theme';
import { Button, PageHeader, s } from './ui';

export function BulkImportScreen({
  database,
  onBack,
  onImport,
  onDirtyChange,
}: {
  database: Database;
  onBack: () => void;
  onImport: (plan: BulkPlan) => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<BulkPlan | null>(null);
  const [message, setMessage] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  useEffect(() => onDirtyChange(!!text.trim()), [text, onDirtyChange]);
  const totalStrength = preview
    ? preview.routines.length +
      preview.divisions.reduce((sum, group) => sum + group.routines.length, 0)
    : 0;
  const renderRoutine = (item: Routine) => (
    <View key={item.id} style={{ gap: 8 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ver detalhes do treino ${item.name}`}
        onPress={() => setExpanded(expanded === item.id ? null : item.id)}
        style={s.historyCard}
      >
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{item.name}</Text>
          <Text style={s.small}>
            {routineDays(item)} · {item.exercises.length} exercícios
          </Text>
        </View>
      </Pressable>
      {expanded === item.id && (
        <View style={{ paddingHorizontal: 10, gap: 8 }}>
          {!!item.note && <Text style={s.small}>Nota: {item.note}</Text>}
          {item.exercises.map((exercise) => (
            <View key={exercise.id}>
              <Text style={s.body}>
                {exercise.name} · {exercise.reps.join(' / ')} reps
              </Text>
              <Text style={s.small}>
                Descanso: {exercise.rests ? `${exercise.rests.join(' / ')} s` : 'não definido'}
              </Text>
              {!!exercise.muscles?.length && (
                <Text style={s.small}>
                  Músculos:{' '}
                  {exercise.muscles
                    .map(
                      (link) =>
                        `${muscleById.get(link.nodeId)?.name} (${link.role === 'primary' ? 'principal' : 'secundário'})`,
                    )
                    .join(' · ')}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
  return (
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <PageHeader
        title="Importar por texto"
        subtitle="Cole o plano gerado por uma IA e confira tudo antes de salvar."
        onBack={onBack}
      />
      <View style={s.card}>
        <Text style={s.cardTitle}>Instruções para a IA</Text>
        <Text style={s.body}>
          Copie a gramática completa, envie à sua IA com o treino que deseja e cole aqui apenas o
          JSON retornado. As instruções incluem os IDs musculares aceitos.
        </Text>
        <Button
          label="Copiar instruções para IA"
          secondary
          icon="copy"
          onPress={() => {
            void Clipboard.setStringAsync(bulkImportPrompt)
              .then(() => setMessage('Instruções copiadas.'))
              .catch(() => setMessage('Não foi possível copiar.'));
          }}
        />
        <Button
          label={showGuide ? 'Ocultar explicação' : 'Entender a gramática'}
          secondary
          icon="help-circle"
          onPress={() => setShowGuide(!showGuide)}
        />
        {showGuide && (
          <View style={{ gap: 14 }} testID="bulk-import-guide">
            <Text style={s.body}>
              O texto é um JSON: use aspas duplas, sem comentários. Cada chave diz ao app o que
              criar. Você pode combinar divisões, treinos avulsos e cardios no mesmo texto.
            </Text>
            {[
              {
                title: 'Estrutura do plano',
                fields: [
                  ['formato', 'Sempre "ritmo/1"; identifica esta versão da gramática.'],
                  ['divisoes', 'Grupos de treinos. Cada divisão tem nome e uma lista treinos.'],
                  [
                    'treinos',
                    'Na raiz, são treinos avulsos; dentro de uma divisão, pertencem a ela.',
                  ],
                  ['cardios', 'Rotinas de cardio separadas dos treinos de força.'],
                ],
              },
              {
                title: 'Treino de força',
                fields: [
                  ['nome', 'Nome da divisão, do treino, do exercício ou do cardio.'],
                  ['dias', 'Opcional: seg, ter, qua, qui, sex, sab ou dom. Ex.: ["seg", "qui"].'],
                  ['nota', 'Observação opcional do treino.'],
                  ['exercicios', 'Lista de exercícios do treino.'],
                  ['repeticoes', 'Lista com a meta de cada série. [12, 10, 8] são três séries.'],
                  [
                    'descanso',
                    'Segundos entre séries: um número para todas ou uma lista por série.',
                  ],
                  [
                    'musculos',
                    'Vínculos opcionais com os músculos usados pelo exercício. Se não souber, omita.',
                  ],
                  ['id', 'ID muscular do catálogo copiado nas instruções. Ex.: "chest".'],
                  ['papel', '"principal" ou "secundario" para cada músculo vinculado.'],
                ],
              },
              {
                title: 'Cardio',
                fields: [
                  ['etapas', 'Lista de faixas de velocidade, na ordem de execução.'],
                  ['minutos', 'Duração de cada etapa em minutos. Ex.: 0.5 é meio minuto.'],
                  ['velocidade', 'Velocidade indicada naquela etapa, em km/h.'],
                ],
              },
            ].map((section) => (
              <View key={section.title} style={{ gap: 7 }}>
                <Text style={s.cardTitle}>{section.title}</Text>
                {section.fields.map(([field, description]) => (
                  <Text key={field} style={s.small}>
                    <Text style={{ color: c.ink, fontWeight: '700' }}>{field}</Text>
                    {' — '}
                    {description}
                  </Text>
                ))}
              </View>
            ))}
            <Text style={s.small}>
              Os campos não listados são recusados. A prévia confere o lote inteiro antes de salvar;
              qualquer erro mostra o campo que precisa de correção.
            </Text>
          </View>
        )}
        <Button
          label={showExample ? 'Ocultar exemplo' : 'Ver exemplo do formato'}
          secondary
          icon="file-text"
          onPress={() => setShowExample(!showExample)}
        />
        {showExample && (
          <Text selectable style={[s.small, { fontFamily: 'monospace' }]}>
            {bulkImportExample}
          </Text>
        )}
      </View>
      <View style={s.card}>
        <Text style={s.cardTitle}>Texto para importar</Text>
        <TextInput
          accessibilityLabel="JSON de importação"
          testID="bulk-import-input"
          value={text}
          onChangeText={(value) => {
            if (value.length > MAX_BULK_IMPORT_CHARS) {
              setMessage('O texto pode ter no máximo 100.000 caracteres.');
              return;
            }
            setText(value);
            setPreview(null);
            setMessage('');
          }}
          multiline
          numberOfLines={12}
          maxLength={MAX_BULK_IMPORT_CHARS}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder='{"formato":"ritmo/1", "treinos":[...]}'
          placeholderTextColor={c.muted}
          style={[s.input, { minHeight: 260, textAlignVertical: 'top', fontFamily: 'monospace' }]}
        />
        <Button
          label="Colar texto copiado"
          secondary
          icon="clipboard"
          onPress={() => {
            void Clipboard.getStringAsync()
              .then((value) => {
                if (value.length > MAX_BULK_IMPORT_CHARS) {
                  setMessage('O texto copiado tem mais de 100.000 caracteres. Nada foi colado.');
                  return;
                }
                setText(value);
                setPreview(null);
                setMessage('');
              })
              .catch(() =>
                setMessage('Não foi possível ler a área de transferência. Cole no campo acima.'),
              );
          }}
        />
        <Button
          label="Conferir texto"
          icon="check-circle"
          onPress={() => {
            try {
              const plan = parseBulkImport(text);
              applyBulkImport(database, plan);
              setPreview(plan);
              setMessage('');
            } catch (error) {
              setPreview(null);
              setMessage((error as Error).message);
            }
          }}
        />
        {!!message && (
          <Text
            accessibilityRole="alert"
            style={[s.small, { color: message.includes('copiadas') ? c.dark : c.danger }]}
          >
            {message}
          </Text>
        )}
      </View>
      {preview && (
        <View style={s.card} testID="bulk-import-preview">
          <Text style={s.eyebrow}>PRÉVIA · NADA FOI SALVO AINDA</Text>
          <Text style={s.cardTitle}>
            {totalStrength} {totalStrength === 1 ? 'treino' : 'treinos'} · {preview.cardios.length}{' '}
            {preview.cardios.length === 1 ? 'cardio' : 'cardios'}
          </Text>
          {preview.divisions.map((group) => (
            <View key={group.id} style={{ gap: 10 }}>
              <Text style={s.cardTitle}>Divisão {group.name}</Text>
              {group.routines.map(renderRoutine)}
            </View>
          ))}
          {preview.routines.length > 0 && <Text style={s.cardTitle}>Treinos avulsos</Text>}
          {preview.routines.map(renderRoutine)}
          {preview.cardios.map((item) => (
            <View key={item.id} style={{ gap: 8 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Ver detalhes do cardio ${item.name}`}
                onPress={() => setExpanded(expanded === item.id ? null : item.id)}
                style={s.historyCard}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>Cardio: {item.name}</Text>
                  <Text style={s.small}>{item.steps.length} etapas</Text>
                </View>
              </Pressable>
              {expanded === item.id && (
                <View style={{ paddingHorizontal: 10, gap: 5 }}>
                  <Text style={s.small}>
                    {weekdays
                      .filter((day) => item.weekdays?.includes(day.value))
                      .map((day) => day.short)
                      .join(' · ') || 'Sem dia definido'}
                  </Text>
                  {item.steps.map((step, index) => (
                    <Text key={step.id} style={s.body}>
                      Etapa {index + 1}: {step.minutes} min · {step.speed} km/h
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
          <Text style={s.small}>
            Serão adicionadas novas rotinas. Treinos ativos e histórico não serão alterados.
          </Text>
          <Button
            label="Importar rotinas da prévia"
            icon="download"
            onPress={() => onImport(preview)}
          />
        </View>
      )}
    </ScrollView>
  );
}
