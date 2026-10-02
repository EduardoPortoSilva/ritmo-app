// Stable, curated IDs. Anatomical sources and scope: docs/MUSCULOS.md.
export type MuscleNode = {
  id: string;
  name: string;
  kind: 'group' | 'muscle' | 'portion';
  parentId?: string;
  aliases?: string;
  deep?: boolean;
};
export type MuscleLink = { nodeId: string; role: 'primary' | 'secondary' };
const group = (id: string, name: string, aliases = ''): MuscleNode => ({
  id,
  name,
  kind: 'group',
  aliases,
});
const muscle = (id: string, name: string, parentId: string, deep = false): MuscleNode => ({
  id,
  name,
  parentId,
  kind: 'muscle',
  deep,
});
const portion = (id: string, name: string, parentId: string): MuscleNode => ({
  id,
  name,
  parentId,
  kind: 'portion',
});
export const muscleCatalog: readonly MuscleNode[] = [
  group('chest', 'Peitoral', 'peito'),
  muscle('pectoralis-major', 'Peitoral maior', 'chest'),
  portion('pectoralis-clavicular', 'Peitoral maior · porção clavicular', 'pectoralis-major'),
  portion('pectoralis-sternocostal', 'Peitoral maior · porção esternocostal', 'pectoralis-major'),
  muscle('pectoralis-minor', 'Peitoral menor', 'chest', true),
  group('shoulders', 'Ombros / deltoides'),
  portion('deltoid-anterior', 'Deltoide anterior', 'shoulders'),
  portion('deltoid-lateral', 'Deltoide lateral', 'shoulders'),
  portion('deltoid-posterior', 'Deltoide posterior', 'shoulders'),
  group('cuff', 'Manguito rotador'),
  muscle('supraspinatus', 'Supraespinal', 'cuff', true),
  muscle('infraspinatus', 'Infraespinal', 'cuff'),
  muscle('teres-minor', 'Redondo menor', 'cuff'),
  muscle('subscapularis', 'Subescapular', 'cuff', true),
  group('lats', 'Dorsais', 'costas dorsal'),
  muscle('latissimus', 'Latíssimo do dorso', 'lats'),
  muscle('teres-major', 'Redondo maior', 'lats'),
  group('trapezius', 'Trapézio', 'costas'),
  portion('trapezius-upper', 'Trapézio superior', 'trapezius'),
  portion('trapezius-middle', 'Trapézio médio', 'trapezius'),
  portion('trapezius-lower', 'Trapézio inferior', 'trapezius'),
  group('scapular', 'Romboides e elevador da escápula', 'costas escapulares'),
  muscle('rhomboid-major', 'Romboide maior', 'scapular', true),
  muscle('rhomboid-minor', 'Romboide menor', 'scapular', true),
  muscle('levator-scapulae', 'Elevador da escápula', 'scapular', true),
  group('serratus', 'Serrátil', 'torax'),
  muscle('serratus-anterior', 'Serrátil anterior', 'serratus'),
  group('elbow-flexors', 'Bíceps e flexores do cotovelo', 'bracos biceps'),
  muscle('biceps', 'Bíceps braquial', 'elbow-flexors'),
  muscle('brachialis', 'Braquial', 'elbow-flexors', true),
  muscle('brachioradialis', 'Braquiorradial', 'elbow-flexors'),
  group('triceps', 'Tríceps', 'bracos triceps'),
  portion('triceps-long', 'Tríceps · cabeça longa', 'triceps'),
  portion('triceps-lateral', 'Tríceps · cabeça lateral', 'triceps'),
  portion('triceps-medial', 'Tríceps · cabeça medial', 'triceps'),
  group('forearms', 'Antebraços', 'punho pegada'),
  muscle('flexor-carpi-radialis', 'Flexor radial do carpo', 'forearms'),
  muscle('flexor-carpi-ulnaris', 'Flexor ulnar do carpo', 'forearms'),
  muscle('flexor-digitorum', 'Flexor superficial dos dedos', 'forearms'),
  muscle('extensor-carpi-radialis', 'Extensor radial longo do carpo', 'forearms'),
  muscle('extensor-carpi-ulnaris', 'Extensor ulnar do carpo', 'forearms'),
  muscle('extensor-digitorum', 'Extensor dos dedos', 'forearms'),
  muscle('pronator-teres', 'Pronador redondo', 'forearms'),
  muscle('supinator', 'Supinador', 'forearms', true),
  group('abs', 'Abdômen', 'abdominal core barriga'),
  muscle('rectus-abdominis', 'Reto abdominal', 'abs'),
  muscle('external-oblique', 'Oblíquo externo', 'abs'),
  muscle('internal-oblique', 'Oblíquo interno', 'abs', true),
  muscle('transversus', 'Transverso do abdômen', 'abs', true),
  group('spinal', 'Paravertebrais e lombar', 'costas core eretores coluna'),
  muscle('iliocostalis', 'Iliocostal', 'spinal'),
  muscle('longissimus', 'Longuíssimo', 'spinal'),
  muscle('spinalis', 'Espinal', 'spinal'),
  muscle('multifidus', 'Multífidos', 'spinal', true),
  muscle('quadratus-lumborum', 'Quadrado lombar', 'spinal', true),
  group('glutes', 'Glúteos', 'quadril abdutores'),
  muscle('gluteus-maximus', 'Glúteo máximo', 'glutes'),
  muscle('gluteus-medius', 'Glúteo médio', 'glutes'),
  muscle('gluteus-minimus', 'Glúteo mínimo', 'glutes', true),
  group('quads', 'Quadríceps', 'coxas pernas anterior'),
  muscle('rectus-femoris', 'Reto femoral', 'quads'),
  muscle('vastus-lateralis', 'Vasto lateral', 'quads'),
  muscle('vastus-medialis', 'Vasto medial', 'quads'),
  muscle('vastus-intermedius', 'Vasto intermédio', 'quads', true),
  group('hamstrings', 'Posteriores da coxa', 'isquiotibiais pernas'),
  muscle('biceps-femoris', 'Bíceps femoral', 'hamstrings'),
  muscle('semitendinosus', 'Semitendíneo', 'hamstrings'),
  muscle('semimembranosus', 'Semimembranáceo', 'hamstrings'),
  group('adductors', 'Adutores', 'coxa interna quadril'),
  muscle('adductor-magnus', 'Adutor magno', 'adductors'),
  muscle('adductor-longus', 'Adutor longo', 'adductors'),
  muscle('adductor-brevis', 'Adutor curto', 'adductors', true),
  muscle('gracilis', 'Grácil', 'adductors'),
  muscle('pectineus', 'Pectíneo', 'adductors'),
  group('hip-flexors', 'Flexores do quadril', 'iliopsoas'),
  muscle('psoas-major', 'Psoas maior', 'hip-flexors', true),
  muscle('iliacus', 'Ilíaco', 'hip-flexors', true),
  muscle('sartorius', 'Sartório', 'hip-flexors'),
  muscle('tensor-fasciae', 'Tensor da fáscia lata', 'hip-flexors'),
  group('calves', 'Panturrilhas', 'gemeos pernas'),
  muscle('gastrocnemius', 'Gastrocnêmio', 'calves'),
  muscle('soleus', 'Sóleo', 'calves', true),
  group('lower-leg', 'Tibiais e fibulares', 'canela pernas tornozelo'),
  muscle('tibialis-anterior', 'Tibial anterior', 'lower-leg'),
  muscle('tibialis-posterior', 'Tibial posterior', 'lower-leg', true),
  muscle('fibularis-longus', 'Fibular longo', 'lower-leg'),
  muscle('fibularis-brevis', 'Fibular curto', 'lower-leg'),
  group('neck', 'Pescoço', 'cervical'),
  muscle('sternocleidomastoid', 'Esternocleidomastóideo', 'neck'),
  muscle('splenius-capitis', 'Esplênio da cabeça', 'neck'),
  muscle('scalene-anterior', 'Escaleno anterior', 'neck', true),
];
export const muscleById = new Map(muscleCatalog.map((node) => [node.id, node]));
export const muscleGroups = muscleCatalog.filter((node) => !node.parentId);
export function ancestors(id: string): MuscleNode[] {
  const result: MuscleNode[] = [];
  let parent = muscleById.get(id)?.parentId;
  while (parent) {
    const node = muscleById.get(parent);
    if (!node) break;
    result.push(node);
    parent = node.parentId;
  }
  return result;
}
export const belongsTo = (id: string, parent: string) =>
  id === parent || ancestors(id).some((node) => node.id === parent);
export const musclePath = (id: string) =>
  [...ancestors(id).reverse(), muscleById.get(id)]
    .filter(Boolean)
    .map((node) => node!.name)
    .join(' › ');
export const searchKey = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
export function searchMuscles(query: string) {
  const terms = searchKey(query).split(/\s+/).filter(Boolean);
  return muscleCatalog.filter((node) =>
    terms.every((term) =>
      searchKey(
        `${musclePath(node.id)} ${node.aliases ?? ''} ${ancestors(node.id)
          .map((item) => item.aliases ?? '')
          .join(' ')}`,
      ).includes(term),
    ),
  );
}
export function validMuscleLinks(value: unknown): value is MuscleLink[] {
  return (
    Array.isArray(value) &&
    value.every(
      (link) =>
        link &&
        typeof link === 'object' &&
        muscleById.has(link.nodeId) &&
        ['primary', 'secondary'].includes(link.role),
    ) &&
    new Set(value.map((link) => link.nodeId)).size === value.length
  );
}
export const muscleLinksKey = (links?: readonly MuscleLink[]) =>
  JSON.stringify([...(links ?? [])].sort((a, b) => a.nodeId.localeCompare(b.nodeId)));
export const roleName = (role: MuscleLink['role']) =>
  role === 'primary' ? 'Principal' : 'Secundário';

type CoverageRoutine = {
  id: string;
  name: string;
  exercises: { id: string; name: string; reps: string[]; muscles?: MuscleLink[] }[];
};
export function muscleCoverage(routines: readonly CoverageRoutine[], nodeId: string) {
  const entries = routines.flatMap((routine) =>
    routine.exercises.flatMap((exercise) => {
      const links = (exercise.muscles ?? []).filter((link) => belongsTo(link.nodeId, nodeId));
      if (!links.length) return [];
      return [
        {
          routineId: routine.id,
          routineName: routine.name,
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          sets: exercise.reps.length,
          role: links.some((link) => link.role === 'primary')
            ? ('primary' as const)
            : ('secondary' as const),
          links,
        },
      ];
    }),
  );
  // Each exercise contributes once per selected node, even with a parent and a child linked.
  const unique = [
    ...new Map(
      entries.map((entry) => [JSON.stringify([entry.routineId, entry.exerciseId]), entry]),
    ).values(),
  ];
  const primary = unique
    .filter((entry) => entry.role === 'primary')
    .reduce((sum, entry) => sum + entry.sets, 0);
  const secondary = unique
    .filter((entry) => entry.role === 'secondary')
    .reduce((sum, entry) => sum + entry.sets, 0);
  const broadAncestors = routines.flatMap((routine) =>
    routine.exercises.flatMap((exercise) =>
      (exercise.muscles ?? []).filter(
        (link) => link.nodeId !== nodeId && belongsTo(nodeId, link.nodeId),
      ),
    ),
  );
  return {
    entries: unique,
    primary,
    secondary,
    broadAncestors,
    direct: unique.some((entry) => entry.links.some((link) => link.nodeId === nodeId)),
  };
}
