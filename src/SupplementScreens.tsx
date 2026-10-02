import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { colors as c } from './theme';
import { Button, Field, Icon, IconButton, PageHeader, s } from './ui';
import { dayKey, recentSupplementDays, supplementStreak, type Supplement } from './supplements';
import { remindersAvailable } from './reminders';

export function SupplementCard({
  supplement,
  today,
  onToggle,
  onEdit,
  onDelete,
}: {
  supplement: Supplement;
  today: Date;
  onToggle: (taken: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const taken = supplement.takenOn.includes(dayKey(today));
  const streak = supplementStreak(supplement, today);
  return (
    <View style={s.card} testID={`supplement-${supplement.id}`}>
      <View style={s.cardHeader}>
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={s.cardTitle}>{supplement.name}</Text>
          <Text style={s.small}>
            {supplement.reminderTime
              ? `Todos os dias · lembrete às ${supplement.reminderTime}`
              : 'Todos os dias · sem notificação'}
          </Text>
        </View>
        {onEdit && (
          <IconButton
            name="edit-2"
            label={`Editar suplemento ${supplement.name}`}
            onPress={onEdit}
          />
        )}
        {onDelete && (
          <IconButton
            name="trash-2"
            label={`Excluir suplemento ${supplement.name}`}
            onPress={onDelete}
          />
        )}
      </View>
      {!!supplement.note && <Text style={s.small}>{supplement.note}</Text>}
      <View style={s.row}>
        <Icon name="zap" color={c.dark} />
        <Text
          style={[s.body, { fontWeight: '700' }]}
          accessibilityLabel={`Sequência de ${supplement.name}: ${streak} dias`}
        >
          {streak} {streak === 1 ? 'dia seguido' : 'dias seguidos'}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {recentSupplementDays(today).map((day) => {
          const done = supplement.takenOn.includes(day);
          const isToday = day === dayKey(today);
          const date = new Date(`${day}T12:00:00`);
          return (
            <View
              key={day}
              accessibilityLabel={`${supplement.name}, ${date.toLocaleDateString('pt-BR')}: ${done ? 'tomado' : 'sem registro'}`}
              style={{ flex: 1, alignItems: 'center', gap: 6 }}
            >
              <Text style={[s.small, { fontSize: 11 }]}>
                {isToday
                  ? 'Hoje'
                  : date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
              </Text>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: done ? c.lime : c.soft,
                  borderWidth: isToday ? 1 : 0,
                  borderColor: c.dark,
                }}
              >
                {done ? (
                  <Icon name="check" size={16} />
                ) : (
                  <Text style={s.small}>{date.getDate()}</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={`Tomei ${supplement.name} hoje`}
        accessibilityState={{ checked: taken }}
        aria-checked={taken}
        onPress={() => onToggle(!taken)}
        style={[s.button, { backgroundColor: taken ? c.dark : c.soft }]}
      >
        <Icon name={taken ? 'check-circle' : 'circle'} color={taken ? c.lime : c.ink} />
        <Text style={[s.buttonText, { color: taken ? c.lime : c.ink }]}>
          {taken ? 'Tomado hoje' : 'Tomei hoje'}
        </Text>
      </Pressable>
      {taken && <Text style={s.small}>Marcou sem querer? Toque novamente para desfazer.</Text>}
    </View>
  );
}

export function SupplementEditor({
  initial,
  onBack,
  onSave,
  onDirtyChange,
}: {
  initial: Supplement;
  onBack: () => void;
  onSave: (supplement: Supplement) => Promise<void>;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [reminder, setReminder] = useState(!!initial.reminderTime);
  const [hour, setHour] = useState(initial.reminderTime?.split(':')[0] ?? '08');
  const [minute, setMinute] = useState(initial.reminderTime?.split(':')[1] ?? '00');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const time = reminder ? `${hour}:${minute}` : undefined;
    onDirtyChange(
      draft.name !== initial.name || draft.note !== initial.note || time !== initial.reminderTime,
    );
  }, [draft, reminder, hour, minute, initial, onDirtyChange]);
  return (
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <PageHeader
        title={initial.name ? 'Editar suplemento' : 'Novo suplemento'}
        subtitle="Um pequeno hábito, todos os dias."
        onBack={onBack}
      />
      <View style={s.card}>
        <Field
          label="Nome do suplemento"
          value={draft.name}
          placeholder="Ex.: Creatina"
          onChangeText={(name) => setDraft({ ...draft, name })}
        />
        <Field
          label="Observação (opcional)"
          value={draft.note}
          placeholder="Ex.: Junto do café da manhã"
          multiline
          onChangeText={(note) => setDraft({ ...draft, note })}
        />
      </View>
      <View style={s.card}>
        <Text style={s.cardTitle}>Lembrete diário</Text>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel="Ativar lembrete diário"
          accessibilityState={{ checked: reminder, disabled: !remindersAvailable }}
          aria-checked={reminder}
          disabled={!remindersAvailable}
          onPress={() => setReminder(!reminder)}
          style={[s.row, { minHeight: 48 }]}
        >
          <Icon name={reminder ? 'check-square' : 'square'} />
          <Text style={s.body}>Me lembrar todos os dias</Text>
        </Pressable>
        {remindersAvailable ? (
          <Text style={s.small}>
            Uma notificação para este suplemento. Se já tiver marcado hoje, o próximo lembrete será
            amanhã.
          </Text>
        ) : (
          <Text style={s.small}>
            As notificações estão disponíveis no aplicativo Android instalado.
          </Text>
        )}
        {reminder && (
          <>
            <View style={s.row}>
              <Field
                label="Hora (00–23)"
                accessibilityLabel="Hora do lembrete"
                value={hour}
                onChangeText={setHour}
                numeric
              />
              <Text style={s.cardTitle}>:</Text>
              <Field
                label="Minutos (00–59)"
                accessibilityLabel="Minutos do lembrete"
                value={minute}
                onChangeText={setMinute}
                numeric
              />
            </View>
            <Text style={s.small}>
              Horário do aparelho. O Android pode atrasar o aviso em economia de bateria.
            </Text>
          </>
        )}
      </View>
      <Button
        label={saving ? 'Salvando…' : 'Salvar suplemento'}
        icon="check"
        disabled={saving}
        onPress={async () => {
          setSaving(true);
          try {
            await onSave({
              ...draft,
              reminderTime: reminder
                ? `${hour.trim() ? hour.trim().padStart(2, '0') : ''}:${minute.trim() ? minute.trim().padStart(2, '0') : ''}`
                : undefined,
            });
          } finally {
            setSaving(false);
          }
        }}
      />
    </ScrollView>
  );
}
