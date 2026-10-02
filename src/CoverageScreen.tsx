import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { Routine } from './model';
import {
  ancestors,
  muscleById,
  muscleCatalog,
  muscleCoverage,
  muscleGroups,
  musclePath,
  roleName,
  searchMuscles,
} from './muscles';
import { BodyMap, muscleColors } from './BodyMap';
import { bodyDetails } from './bodyMapData';
import { Button, Empty, Field, Icon, PageHeader, s } from './ui';
import { colors as c } from './theme';

export type CoverageScope = { kind: 'routine' | 'division'; id: string };
export function CoverageScreen({
  routines,
  initialScope,
  onBack,
  onEdit,
}: {
  routines: Routine[];
  initialScope?: CoverageScope;
  onBack: () => void;
  onEdit: (routine: Routine) => void;
}) {
  const divisions = [
    ...new Map(
      routines
        .filter((routine) => routine.division)
        .map((routine) => [routine.division!.id, routine.division!]),
    ).values(),
  ];
  const options = [
    ...divisions.map((division) => ({
      kind: 'division' as const,
      id: division.id,
      name: `Divisão · ${division.name}`,
    })),
    ...routines.map((routine) => ({
      kind: 'routine' as const,
      id: routine.id,
      name: `Rotina · ${routine.name}`,
    })),
  ];
  const [scope, setScope] = useState(initialScope ?? options[0]);
  const selectedScope =
    options.find((option) => option.kind === scope?.kind && option.id === scope?.id) ?? options[0];
  const selectedRoutines = routines.filter((routine) =>
    selectedScope?.kind === 'division'
      ? routine.division?.id === selectedScope.id
      : routine.id === selectedScope?.id,
  );
  const [selectedId, setSelectedId] = useState('chest');
  const scroll = useRef<ScrollView>(null);
  const detailY = useRef(0);
  function selectNode(id: string) {
    setSelectedId(id);
    scroll.current?.scrollTo({ y: detailY.current, animated: false });
  }
  const [query, setQuery] = useState('');
  const [showScopes, setShowScopes] = useState(!initialScope);
  const links = selectedRoutines.flatMap((routine) =>
    routine.exercises.flatMap((exercise) => exercise.muscles ?? []),
  );
  const pending = selectedRoutines.flatMap((routine) =>
    routine.exercises
      .filter((exercise) => !exercise.muscles?.length)
      .map((exercise) => ({ routine, exercise })),
  );
  const groupsWithLinks = muscleGroups.filter(
    (group) => muscleCoverage(selectedRoutines, group.id).entries.length,
  ).length;
  const node = muscleById.get(selectedId)!;
  const coverage = muscleCoverage(selectedRoutines, selectedId);
  const children = muscleCatalog.filter((item) => item.parentId === selectedId);
  const rows = query.trim() ? searchMuscles(query) : muscleGroups;
  return (
    <ScrollView ref={scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <PageHeader
        title="Cobertura muscular"
        subtitle="Veja como seu planejamento se distribui pelo corpo."
        onBack={onBack}
      />
      {!options.length ? (
        <Empty
          icon="activity"
          title="Comece por uma rotina"
          message="Cadastre exercícios e vincule grupos ou músculos para analisar sua cobertura."
          action={<Button label="Ver rotinas" onPress={onBack} />}
        />
      ) : (
        <>
          <View style={s.card}>
            <Text style={s.cardTitle}>{selectedScope.name}</Text>
            <Button
              label={showScopes ? 'Ocultar seleção' : 'Trocar rotina ou divisão'}
              secondary
              icon="layers"
              onPress={() => setShowScopes(!showScopes)}
            />
            {showScopes &&
              options.map((option) => (
                <Pressable
                  key={`${option.kind}-${option.id}`}
                  accessibilityRole="radio"
                  accessibilityLabel={`Analisar ${option.name}`}
                  accessibilityState={{
                    checked: option.id === selectedScope.id && option.kind === selectedScope.kind,
                  }}
                  aria-checked={
                    option.id === selectedScope.id && option.kind === selectedScope.kind
                  }
                  onPress={() => {
                    setScope(option);
                    setShowScopes(false);
                  }}
                  style={{
                    padding: 12,
                    minHeight: 44,
                    borderRadius: 10,
                    backgroundColor:
                      option.id === selectedScope.id && option.kind === selectedScope.kind
                        ? c.lime
                        : c.soft,
                  }}
                >
                  <Text style={s.fieldLabel}>{option.name}</Text>
                </Pressable>
              ))}
            <Text style={s.fieldLabel}>
              {groupsWithLinks} de {muscleGroups.length} regiões com algum vínculo
            </Text>
            {!!pending.length && (
              <Text accessibilityRole="alert" style={s.small}>
                Análise parcial: {pending.length} exercícios ainda sem vínculo muscular.
              </Text>
            )}
            <Text style={s.small}>
              Cada treino do conjunto é contado uma vez. As séries são planejadas, sem multiplicar
              pelos dias da semana.
            </Text>
            <Text style={s.small}>
              Ter vínculo numa região não significa trabalhar todos os músculos dela nem atingir uma
              quantidade suficiente de treino.
            </Text>
          </View>
          <View style={s.card} testID="coverage-map">
            <Text style={s.cardTitle}>Seu mapa muscular</Text>
            <BodyMap links={links} selectedId={selectedId} onSelect={selectNode} />
            <Text style={s.small}>Região selecionada: {node.name}</Text>
          </View>
          <View
            style={s.card}
            testID="coverage-detail"
            onLayout={(event) => {
              detailY.current = event.nativeEvent.layout.y;
            }}
          >
            <Text style={s.eyebrow}>REGIÃO SELECIONADA</Text>
            <Text style={s.cardTitle}>{node.name}</Text>
            <Text style={s.small}>
              {musclePath(node.id)}
              {node.deep ? ' · músculo profundo; localização projetada' : ''}
            </Text>
            {node.kind !== 'group' && !bodyDetails[node.id] && (
              <Text style={s.small}>
                Este músculo aparece por localização aproximada no mapa, sem contorno individual.
              </Text>
            )}
            <Text style={s.fieldLabel}>
              {coverage.primary} séries principais · {coverage.secondary} séries secundárias
            </Text>
            <Text style={s.small}>
              Cada exercício conta uma vez nesta seleção. Se tiver vínculo principal e secundário
              dentro dela, prevalece o principal.
            </Text>
            {!!coverage.broadAncestors.length && (
              <Text style={s.small}>
                Há vínculo com um grupo acima, sem detalhamento. Ele não confirma este músculo ou
                porção e não entra na contagem específica.
              </Text>
            )}
            {!coverage.entries.length && (
              <Text style={s.small}>Sem vínculo específico registrado para esta seleção.</Text>
            )}
            {coverage.entries.map((entry) => (
              <View
                key={`${entry.routineId}-${entry.exerciseId}`}
                style={{ gap: 5, borderTopWidth: 1, borderColor: c.line, paddingTop: 10 }}
              >
                <Text style={s.fieldLabel}>
                  {entry.exerciseName} · {entry.routineName}
                </Text>
                <Text style={s.small}>
                  {entry.sets} séries · {roleName(entry.role)}
                </Text>
                <Text style={s.small}>
                  {entry.links
                    .map(
                      (link) =>
                        `${muscleById.get(link.nodeId)?.name} (${roleName(link.role).toLowerCase()})`,
                    )
                    .join(' · ')}
                </Text>
              </View>
            ))}
            {!!children.length && (
              <>
                <Text style={s.fieldLabel}>Detalhar esta região</Text>
                {children.map((child) => (
                  <Button
                    key={child.id}
                    label={child.name}
                    accessibilityLabel={`Analisar músculo ${child.name}`}
                    secondary
                    onPress={() => selectNode(child.id)}
                  />
                ))}
              </>
            )}
            {!!node.parentId && (
              <Button
                label={`Voltar para ${muscleById.get(node.parentId)?.name}`}
                secondary
                icon="arrow-up"
                onPress={() => selectNode(node.parentId!)}
              />
            )}
          </View>
          <View style={s.card}>
            <Text style={s.cardTitle}>Grupos e músculos</Text>
            <View style={{ minHeight: 84, flexShrink: 0 }}>
              <Field
                label="Buscar na cobertura"
                value={query}
                onChangeText={setQuery}
                placeholder="Ex.: peitoral, vasto lateral"
              />
            </View>
            {rows.map((item) => {
              const info = muscleCoverage(selectedRoutines, item.id);
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Analisar músculo ${item.name}`}
                  onPress={() => selectNode(item.id)}
                  style={{ paddingVertical: 12, borderBottomWidth: 1, borderColor: c.line, gap: 5 }}
                >
                  <View style={s.row}>
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: info.primary
                          ? muscleColors.primary
                          : info.secondary
                            ? muscleColors.secondary
                            : muscleColors.empty,
                      }}
                    />
                    <Text style={[s.fieldLabel, { flex: 1 }]}>{item.name}</Text>
                    <Icon name="chevron-right" size={16} />
                  </View>
                  <Text style={s.small}>
                    {info.primary} principais · {info.secondary} secundárias (séries)
                  </Text>
                  <Text style={s.small}>
                    {info.entries.length
                      ? info.direct && muscleCatalog.some((child) => child.parentId === item.id)
                        ? 'Inclui vínculo amplo, sem detalhamento'
                        : 'Vínculos específicos nesta região'
                      : info.broadAncestors.length
                        ? 'Grupo informado; detalhe não especificado'
                        : 'Sem vínculo registrado'}
                  </Text>
                  {!!query && !!ancestors(item.id).length && (
                    <Text style={s.small}>{musclePath(item.id)}</Text>
                  )}
                </Pressable>
              );
            })}
            {!rows.length && <Text style={s.small}>Nenhum resultado para esta busca.</Text>}
          </View>
          <View style={s.card} testID="coverage-unlinked">
            <Text style={s.cardTitle}>{pending.length} exercícios sem vínculo</Text>
            <Text style={s.small}>
              {pending.length
                ? 'A análise está incompleta. Sem vínculo não significa que o exercício não trabalhe músculos.'
                : 'Todos os exercícios desta seleção têm ao menos um vínculo.'}
            </Text>
            {pending.map(({ routine, exercise }) => (
              <Text key={`${routine.id}-${exercise.id}`} style={s.small}>
                {routine.name} · {exercise.name}
              </Text>
            ))}
            {selectedRoutines.map((routine) => (
              <Button
                key={routine.id}
                label={`Editar vínculos de ${routine.name}`}
                secondary
                icon="edit-2"
                onPress={() => onEdit(routine)}
              />
            ))}
          </View>
          <Text style={s.small}>
            Catálogo voltado à musculação. A lista é uma referência de localização, não uma
            recomendação de exercícios ou um atlas anatômico completo.
          </Text>
        </>
      )}
    </ScrollView>
  );
}
