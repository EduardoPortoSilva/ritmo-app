import React, { useId } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Line, Path, Pattern, Rect } from 'react-native-svg';
import { ancestors, muscleById, muscleGroups, muscleCatalog, type MuscleLink } from './muscles';
import {
  bodyDetails,
  bodyOutline,
  bodyRegions,
  bodySurface,
  bodySurfaceLines,
  type BodyView,
} from './bodyMapData';
import { s } from './ui';

export const muscleColors = {
  primary: '#387A53',
  secondary: '#CB8B32',
  empty: '#CBD3CC',
  outline: '#98A39A',
};
export function BodyMap({
  links,
  selectedId,
  onSelect,
}: {
  links: MuscleLink[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const patternId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const unique = [...new Map(links.map((link) => [link.nodeId, link])).values()].map((link) => ({
    ...link,
    role: links.some((item) => item.nodeId === link.nodeId && item.role === 'primary')
      ? ('primary' as const)
      : ('secondary' as const),
  }));
  function layer(id: string) {
    const node = muscleById.get(id)!;
    if (node.kind === 'group' || muscleCatalog.some((item) => item.parentId === id))
      return ancestors(id).length / 100;
    return !bodyDetails[id] || node.deep ? 1 : 2;
  }
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {(['front', 'back'] as const).map((view: BodyView) => (
          <View key={view} style={{ flex: 1 }}>
            <Text style={[s.fieldLabel, { textAlign: 'center' }]}>
              {view === 'front' ? 'Frente' : 'Costas'}
            </Text>
            <Svg
              width="100%"
              height={365}
              viewBox="0 0 200 430"
              testID={`body-map-${view}`}
              accessibilityLabel={`Mapa corporal · ${view === 'front' ? 'frente' : 'costas'}`}
            >
              <Defs>
                {(['primary', 'secondary'] as const).map((role) => (
                  <Pattern
                    key={`projected-${role}`}
                    id={`${patternId}-${view}-projected-${role}`}
                    patternUnits="userSpaceOnUse"
                    width={7}
                    height={7}
                  >
                    <Rect width={7} height={7} fill={muscleColors.empty} />
                    <Circle cx={3} cy={3} r={1.6} fill={muscleColors[role]} />
                  </Pattern>
                ))}
                {(['primary', 'secondary'] as const).map((role) => (
                  <Pattern
                    key={role}
                    id={`${patternId}-${view}-${role}`}
                    patternUnits="userSpaceOnUse"
                    width={7}
                    height={7}
                  >
                    <Rect width={7} height={7} fill={muscleColors.empty} />
                    <Path
                      d="M-2 2 L2 -2 M0 7 L7 0 M5 9 L9 5"
                      stroke={muscleColors[role]}
                      strokeWidth={2}
                    />
                  </Pattern>
                ))}
              </Defs>
              <Ellipse
                cx={100}
                cy={27}
                rx={17}
                ry={22}
                fill="#BBC4BC"
                stroke={muscleColors.outline}
              />
              <Path
                d="M85 21 Q86 6 100 5 Q114 6 115 21 Q106 17 100 15 Q94 17 85 21 Z"
                fill="#A7B2A9"
                pointerEvents="none"
              />
              <Path
                d="M88 31 Q92 42 100 43 Q108 42 112 31"
                fill="none"
                stroke="#F7F8F4"
                strokeWidth={1.3}
                pointerEvents="none"
              />
              {[false, true].map((mirror) => (
                <G
                  key={String(mirror)}
                  transform={mirror ? 'translate(200 0) scale(-1 1)' : undefined}
                >
                  <Path
                    d={bodyOutline}
                    fill="#DAE0DA"
                    stroke={muscleColors.outline}
                    strokeWidth={1.2}
                  />
                  {muscleGroups.map((group) => {
                    const path = bodyRegions[group.id]?.[view];
                    return path ? (
                      <Path
                        key={group.id}
                        d={path}
                        fill={muscleColors.empty}
                        stroke="#FCFCF7"
                        strokeWidth={1.6}
                        onPress={() => onSelect(group.id)}
                        accessibilityLabel={`Selecionar ${group.name}`}
                      />
                    ) : null;
                  })}
                  {bodySurface[view].map((path, index) => (
                    <Path
                      key={`surface-${index}`}
                      d={path}
                      fill={index % 3 === 0 ? '#ACB8AE' : '#BCC7BD'}
                      stroke="#F7F8F4"
                      strokeWidth={1.1}
                      pointerEvents="none"
                    />
                  ))}
                  {/* Broad links first; specific areas remain visible over the group's hatching. */}
                  {[...unique]
                    .sort(
                      (a, b) =>
                        layer(a.nodeId) - layer(b.nodeId) ||
                        Number(a.role === 'primary') - Number(b.role === 'primary'),
                    )
                    .map((link) => {
                      const node = muscleById.get(link.nodeId)!;
                      const root = ancestors(node.id).at(-1)?.id ?? node.id;
                      const path = (bodyDetails[node.id] ?? bodyRegions[root])?.[view];
                      if (!path) return null;
                      const broad =
                        node.kind === 'group' ||
                        muscleCatalog.some((item) => item.parentId === node.id);
                      return (
                        <Path
                          key={link.nodeId}
                          testID={!mirror ? `body-${view}-${node.id}` : undefined}
                          d={path}
                          fill={
                            broad
                              ? `url(#${patternId}-${view}-${link.role})`
                              : !bodyDetails[node.id] || node.deep
                                ? `url(#${patternId}-${view}-projected-${link.role})`
                                : muscleColors[link.role]
                          }
                          fillOpacity={node.deep ? 0.55 : 1}
                          stroke={selectedId === node.id ? '#182F23' : '#FCFCF7'}
                          strokeWidth={selectedId === node.id ? 2.4 : 1}
                          strokeDasharray={node.deep ? '3 2' : undefined}
                          onPress={() => onSelect(node.id)}
                          accessibilityLabel={`Selecionar ${node.name}`}
                        />
                      );
                    })}
                  {bodySurfaceLines[view].map((path, index) => (
                    <Path
                      key={`anatomy-${index}`}
                      d={path}
                      fill="none"
                      stroke="#F7F8F4"
                      strokeOpacity={0.9}
                      strokeWidth={0.85}
                      strokeLinecap="round"
                      pointerEvents="none"
                    />
                  ))}
                  {selectedId &&
                    !unique.some((link) => link.nodeId === selectedId) &&
                    (() => {
                      const root = ancestors(selectedId).at(-1)?.id ?? selectedId;
                      const path = (bodyDetails[selectedId] ?? bodyRegions[root])?.[view];
                      return path ? (
                        <Path
                          d={path}
                          fill="none"
                          stroke="#182F23"
                          strokeWidth={2.4}
                          pointerEvents="none"
                        />
                      ) : null;
                    })()}
                </G>
              ))}
              {view === 'front' &&
                [132, 147, 163].map((y) => (
                  <Line
                    key={y}
                    x1={84}
                    y1={y}
                    x2={116}
                    y2={y}
                    stroke="#FCFCF7"
                    strokeWidth={1}
                    pointerEvents="none"
                  />
                ))}
            </Svg>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {(
          [
            ['Principal', muscleColors.primary],
            ['Secundário', muscleColors.secondary],
            ['Sem vínculo', muscleColors.empty],
          ] as const
        ).map(([label, color]) => (
          <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: color }} />
            <Text style={s.small}>{label}</Text>
          </View>
        ))}
      </View>
      <Text style={s.small}>
        Listras: vínculo amplo. Pontos: localização aproximada de músculo sem desenho individual.
        Toque numa região ou use a lista abaixo.
      </Text>
      <Text style={s.small}>
        Mapa esquemático: músculos profundos e áreas sem desenho individual usam a localização
        aproximada do grupo. As cores mostram vínculos, não intensidade.
      </Text>
    </View>
  );
}
