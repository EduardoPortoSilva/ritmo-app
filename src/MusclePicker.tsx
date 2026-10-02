import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  ancestors,
  muscleById,
  muscleCatalog,
  muscleGroups,
  musclePath,
  roleName,
  searchMuscles,
  type MuscleLink,
  type MuscleNode,
} from './muscles';
import { Button, Field, Icon, IconButton, s } from './ui';
import { colors as c } from './theme';

export function MuscleLinksSummary({ links }: { links?: MuscleLink[] }) {
  return (
    <Text style={s.small}>
      {links?.length
        ? links
            .map(
              (link) =>
                `${muscleById.get(link.nodeId)?.name} (${roleName(link.role).toLowerCase()})`,
            )
            .join(' · ')
        : 'Músculos: sem vínculo'}
    </Text>
  );
}

export function MusclePicker({
  links = [],
  onChange,
  exerciseNumber,
}: {
  links?: MuscleLink[];
  onChange: (links: MuscleLink[]) => void;
  exerciseNumber: number;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string[]>([]);
  const nodes = query.trim()
    ? searchMuscles(query)
    : muscleCatalog.filter(
        (node) =>
          !node.parentId || ancestors(node.id).every((parent) => expanded.includes(parent.id)),
      );
  function choose(node: MuscleNode, role: MuscleLink['role']) {
    onChange([...links.filter((link) => link.nodeId !== node.id), { nodeId: node.id, role }]);
  }
  return (
    <View style={{ gap: 10 }} testID={`muscle-picker-${exerciseNumber}`}>
      <MuscleLinksSummary links={links} />
      <Button
        label={open ? 'Fechar vínculos musculares' : 'Vincular músculos'}
        accessibilityLabel={`${open ? 'Fechar vínculos' : 'Vincular músculos'} · exercício ${exerciseNumber}`}
        secondary
        icon="activity"
        onPress={() => setOpen(!open)}
      />
      {open && (
        <View style={{ gap: 12 }}>
          <Text style={s.small}>
            Escolha um grupo, músculo ou porção. Principal e secundário são vínculos informados por
            você; não são sugestões automáticas.
          </Text>
          {!!links.length && (
            <View style={{ gap: 8 }}>
              <Text style={s.fieldLabel}>Vínculos deste exercício</Text>
              {links.map((link) => (
                <View key={link.nodeId} style={s.row}>
                  <Text style={[s.small, { flex: 1 }]}>
                    {muscleById.get(link.nodeId)?.name} · {roleName(link.role)}
                  </Text>
                  <IconButton
                    name="x"
                    label={`Remover vínculo ${muscleById.get(link.nodeId)?.name}`}
                    onPress={() => onChange(links.filter((item) => item.nodeId !== link.nodeId))}
                  />
                </View>
              ))}
            </View>
          )}
          <View style={{ minHeight: 84, flexShrink: 0 }}>
            <Field
              label="Buscar grupo ou músculo"
              value={query}
              onChangeText={setQuery}
              placeholder="Ex.: peitoral ou vasto lateral"
            />
          </View>
          <Text testID="muscle-search-count" style={s.small}>
            {query
              ? `${nodes.length} resultados`
              : `${muscleGroups.length} grupos · abra os detalhes ou use a busca`}
          </Text>
          <ScrollView
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            style={{ height: nodes.length === 1 ? 200 : 360, flexGrow: 0, flexShrink: 0 }}
            contentContainerStyle={{ gap: 12 }}
          >
            {nodes.map((node) => {
              const children = muscleCatalog.some((item) => item.parentId === node.id);
              const selected = links.find((link) => link.nodeId === node.id);
              return (
                <View
                  key={node.id}
                  style={{
                    borderWidth: 1,
                    borderColor: c.line,
                    borderRadius: 12,
                    padding: 12,
                    gap: 8,
                    marginLeft: !query && node.parentId ? 12 : 0,
                  }}
                >
                  <Text style={s.fieldLabel}>{node.name}</Text>
                  <Text style={s.small}>
                    {node.kind === 'group'
                      ? 'Grupo · sem detalhamento'
                      : node.kind === 'portion'
                        ? 'Porção muscular'
                        : 'Músculo'}
                    {node.deep ? ' · profundo' : ''}
                  </Text>
                  {!!node.parentId && <Text style={s.small}>{musclePath(node.id)}</Text>}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {(['primary', 'secondary'] as const).map((role) => (
                      <Pressable
                        key={role}
                        accessibilityRole="radio"
                        accessibilityLabel={`${node.name} · ${roleName(role)}`}
                        accessibilityState={{ checked: selected?.role === role }}
                        aria-checked={selected?.role === role}
                        onPress={() => choose(node, role)}
                        style={{
                          flex: 1,
                          padding: 10,
                          minHeight: 44,
                          borderRadius: 9,
                          backgroundColor: selected?.role === role ? c.lime : c.soft,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={s.small}>
                          {selected?.role === role ? '✓ ' : ''}
                          {roleName(role)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  {children && !query && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Detalhes de ${node.name}`}
                      accessibilityState={{ expanded: expanded.includes(node.id) }}
                      aria-expanded={expanded.includes(node.id)}
                      onPress={() =>
                        setExpanded(
                          expanded.includes(node.id)
                            ? expanded.filter((id) => id !== node.id)
                            : [...expanded, node.id],
                        )
                      }
                      style={[s.row, { minHeight: 44 }]}
                    >
                      <Icon
                        name={expanded.includes(node.id) ? 'chevron-up' : 'chevron-down'}
                        size={16}
                      />
                      <Text style={s.link}>Detalhar</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </ScrollView>
          {!nodes.length && (
            <Text style={s.small}>
              Nenhum resultado. Tente outro nome ou selecione um grupo mais amplo.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
