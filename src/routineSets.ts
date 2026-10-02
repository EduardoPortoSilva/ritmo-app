import { uid, type Database, type Routine, type RoutineSet } from './model.ts';

export function activeRoutines(db: Database): Routine[] {
  if (db.strengthPaused) return [];
  if (!db.routineSets) return db.routines;
  const active = db.routineSets.find((set) => set.id === db.activeRoutineSetId);
  const ids = new Set(active?.routineIds ?? []);
  return db.routines.filter((routine) => ids.has(routine.id));
}

export function setStrengthPaused(db: Database, paused: boolean): Database {
  if (paused) return { ...db, strengthPaused: true };
  const { strengthPaused: _paused, ...rest } = db;
  return rest;
}

export function saveRoutineSet(db: Database, draft: RoutineSet): Database {
  const name = draft.name.trim();
  if (!name || name.length > 80) throw new Error('Dê um nome de até 80 caracteres ao conjunto.');
  if (!draft.id.trim()) throw new Error('Identificador do conjunto inválido.');
  const ids = new Set(draft.routineIds);
  const known = new Set(db.routines.map((routine) => routine.id));
  if (ids.size !== draft.routineIds.length || [...ids].some((id) => !known.has(id)))
    throw new Error('Confira as rotinas selecionadas.');

  const prior = db.routineSets ?? [];
  if (
    prior.some(
      (set) =>
        set.id !== draft.id &&
        set.name.toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR'),
    )
  )
    throw new Error('Já existe um conjunto com esse nome.');
  const cleaned = { ...draft, name, routineIds: [...draft.routineIds] };
  if (prior.some((set) => set.id === draft.id))
    return {
      ...db,
      routineSets: prior.map((set) => (set.id === draft.id ? cleaned : set)),
    };

  // Legacy plans remain available as an active set when the first alternative is created.
  if (!prior.length && db.routines.length) {
    const original = {
      id: uid(),
      name:
        name.toLocaleLowerCase('pt-BR') === 'planejamento atual'
          ? 'Rotinas anteriores'
          : 'Planejamento atual',
      routineIds: db.routines.map((routine) => routine.id),
    };
    return {
      ...db,
      routineSets: [original, cleaned],
      activeRoutineSetId: original.id,
    };
  }
  return {
    ...db,
    routineSets: [...prior, cleaned],
    activeRoutineSetId: db.activeRoutineSetId ?? cleaned.id,
  };
}

export function activateRoutineSet(db: Database, id: string): Database {
  if (!db.routineSets?.some((set) => set.id === id)) throw new Error('Conjunto não encontrado.');
  return setStrengthPaused({ ...db, activeRoutineSetId: id }, false);
}

export function deleteRoutineSet(db: Database, id: string): Database {
  if (!db.routineSets?.some((set) => set.id === id)) throw new Error('Conjunto não encontrado.');
  const remaining = db.routineSets.filter((set) => set.id !== id);
  if (!remaining.length) {
    const { routineSets: _sets, activeRoutineSetId: _active, ...legacy } = db;
    return legacy;
  }
  return {
    ...db,
    routineSets: remaining,
    activeRoutineSetId: db.activeRoutineSetId === id ? remaining[0].id : db.activeRoutineSetId,
  };
}

export function attachToActiveSet(db: Database, routineIds: readonly string[]): Database {
  if (!db.routineSets || !routineIds.length) return db;
  return {
    ...db,
    routineSets: db.routineSets.map((set) =>
      set.id === db.activeRoutineSetId
        ? { ...set, routineIds: [...new Set([...set.routineIds, ...routineIds])] }
        : set,
    ),
  };
}

export function removeRoutineFromSets(db: Database, routineId: string): Database {
  if (!db.routineSets) return db;
  return {
    ...db,
    routineSets: db.routineSets.map((set) => ({
      ...set,
      routineIds: set.routineIds.filter((id) => id !== routineId),
    })),
  };
}

export function pruneRoutineSetLinks(db: Database): Database {
  if (!db.routineSets) return db;
  const known = new Set(db.routines.map((routine) => routine.id));
  return {
    ...db,
    routineSets: db.routineSets.map((set) => ({
      ...set,
      routineIds: set.routineIds.filter((id) => known.has(id)),
    })),
  };
}
