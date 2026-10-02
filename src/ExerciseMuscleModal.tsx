import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { BodyMap } from './BodyMap';
import { bodyDetails } from './bodyMapData';
import {
  belongsTo,
  muscleById,
  muscleCatalog,
  musclePath,
  roleName,
  type MuscleLink,
} from './muscles';
import { Button, IconButton, s } from './ui';
import { colors as c } from './theme';

type ExerciseWithMuscles = { id: string; name: string; muscles?: MuscleLink[] };

export function ExerciseMuscleModal({
  exercise,
  onClose,
}: {
  exercise: ExerciseWithMuscles | null;
  onClose: () => void;
}) {
  if (!exercise) return null;
  return <OpenExerciseMuscleModal key={exercise.id} exercise={exercise} onClose={onClose} />;
}

function OpenExerciseMuscleModal({
  exercise,
  onClose,
}: {
  exercise: ExerciseWithMuscles;
  onClose: () => void;
}) {
  const links = exercise.muscles ?? [];
  const [selectedId, setSelectedId] = useState(links[0]?.nodeId);
  const node = selectedId ? muscleById.get(selectedId) : undefined;
  const direct = links.find((link) => link.nodeId === selectedId);
  const broad =
    node && links.find((link) => link.nodeId !== node.id && belongsTo(node.id, link.nodeId));
  const specific =
    node && links.some((link) => link.nodeId !== node.id && belongsTo(link.nodeId, node.id));
  const children = node ? muscleCatalog.filter((item) => item.parentId === node.id) : [];
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={[s.modalOverlay, { padding: 12 }]}>
        <View
          accessibilityViewIsModal
          testID="exercise-muscle-modal"
          style={[s.modalCard, { maxWidth: 680, maxHeight: '92%', padding: 0, gap: 0 }]}
        >
          <View
            style={[s.sectionHeader, { padding: 18, borderBottomWidth: 1, borderColor: c.line }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.eyebrow}>MÚSCULOS DO EXERCÍCIO</Text>
              <Text style={s.sectionTitle}>{exercise.name || 'Exercício sem nome'}</Text>
            </View>
            <IconButton name="x" label="Fechar mapa muscular" onPress={onClose} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 18, gap: 18 }}>
            <Text style={s.small}>
              O desenho mostra os vínculos informados para este exercício, sem inferir músculos pelo
              nome ou medir intensidade.
            </Text>
            <BodyMap links={links} selectedId={selectedId} onSelect={setSelectedId} />
            <View style={{ gap: 10 }}>
              <Text style={s.cardTitle}>Vínculos informados</Text>
              {!links.length && (
                <Text style={s.body}>
                  Nenhum músculo foi vinculado a este exercício. Você pode adicioná-lo na edição da
                  rotina.
                </Text>
              )}
              {links.map((link) => {
                const linkedNode = muscleById.get(link.nodeId)!;
                return (
                  <Pressable
                    key={link.nodeId}
                    accessibilityRole="button"
                    accessibilityLabel={`Ver ${linkedNode.name} · ${roleName(link.role)}`}
                    onPress={() => setSelectedId(link.nodeId)}
                    style={{
                      minHeight: 44,
                      borderRadius: 10,
                      padding: 12,
                      backgroundColor: selectedId === link.nodeId ? c.soft : c.background,
                    }}
                  >
                    <Text style={s.fieldLabel}>
                      {linkedNode.name} · {roleName(link.role)}
                    </Text>
                    <Text style={s.small}>{musclePath(link.nodeId)}</Text>
                  </Pressable>
                );
              })}
            </View>
            {node && (
              <View style={[s.card, { backgroundColor: c.soft }]} testID="exercise-muscle-detail">
                <Text style={s.eyebrow}>REGIÃO SELECIONADA</Text>
                <Text style={s.cardTitle}>{node.name}</Text>
                <Text style={s.small}>{musclePath(node.id)}</Text>
                <Text style={s.body}>
                  {direct
                    ? `Vínculo ${roleName(direct.role).toLowerCase()} informado neste exercício.`
                    : broad
                      ? `Você vinculou ${muscleById.get(broad.nodeId)?.name} de forma ampla; ${node.name} não foi especificado.`
                      : specific
                        ? 'Há vínculo específico em parte desta região; isso não marca a região inteira.'
                        : 'Nenhum vínculo informado para esta região.'}
                </Text>
                {node.kind !== 'group' && (node.deep || !bodyDetails[node.id]) && (
                  <Text style={s.small}>
                    Localização aproximada no desenho, sem contorno individual deste músculo.
                  </Text>
                )}
                {children.map((child) => (
                  <Button
                    key={child.id}
                    label={child.name}
                    accessibilityLabel={`Explorar ${child.name}`}
                    secondary
                    onPress={() => setSelectedId(child.id)}
                  />
                ))}
                {node.parentId && (
                  <Button
                    label={`Voltar para ${muscleById.get(node.parentId)?.name}`}
                    secondary
                    onPress={() => setSelectedId(node.parentId!)}
                  />
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
