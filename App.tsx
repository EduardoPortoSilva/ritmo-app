import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  BackHandler,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Feather from '@expo/vector-icons/Feather';
import { useFonts } from 'expo-font';
import { colors as c } from './src/theme';
import {
  allSets,
  cleanRoutine,
  newDivision,
  saveDivision,
  type DivisionDraft,
  emptyDatabase,
  finishWorkout,
  formatNumber,
  newRoutine,
  previousBodyWeight,
  routineError,
  routineDays,
  routinesForDate,
  startWorkout,
  uid,
  volume,
  workoutError,
  type Database,
  type Routine,
  type RoutineSet,
  type Workout,
} from './src/model';
import { loadDatabase, restoreDatabase, saveDatabase } from './src/storage';
import { BodyWeightChart } from './src/LoadHistoryChart';
import { DivisionEditor } from './src/DivisionEditor';
import { ChartsScreen } from './src/ChartsScreen';
import { CoverageScreen, type CoverageScope } from './src/CoverageScreen';
import {
  CardioEditor,
  CardioFinish,
  CardioHistoryCard,
  CardioHistoryDetail,
  CardioPlayer,
  CardioRoutineCard,
} from './src/CardioScreens';
import { BulkImportScreen } from './src/BulkImportScreen';
import { BackupScreen } from './src/BackupScreen';
import type { BackupPreview } from './src/backup';
import { shouldDeferSupplementLink } from './src/navigation';
import { RoutineSetsScreen } from './src/RoutineSetsScreen';
import {
  activeRoutines,
  activateRoutineSet,
  attachToActiveSet,
  deleteRoutineSet,
  pruneRoutineSetLinks,
  removeRoutineFromSets,
  saveRoutineSet,
  setStrengthPaused,
} from './src/routineSets';
import { applyBulkImport, type BulkPlan } from './src/bulkImport';
import {
  cardioForDate,
  cardioProgress,
  cardioRoutineError,
  cleanCardioRoutine,
  finishCardio,
  newCardioRoutine,
  pauseCardio,
  resumeCardio,
  startCardio,
  type CardioRoutine,
  type CardioSession,
} from './src/cardio';
import { requestWidget, widgetAvailable } from './src/widget';
import { SupplementCard, SupplementEditor } from './src/SupplementScreens';
import { dayKey, setSupplementTaken, supplementError, type Supplement } from './src/supplements';
import {
  enableNotifications,
  notificationsEnabled,
  openNotificationSettings,
  remindersAvailable,
  requestSupplementWidget,
} from './src/reminders';
import { Button, Empty, Icon, Metric, PageHeader, SectionTitle, s } from './src/ui';
import {
  HistoryCard,
  RoutineCard,
  RoutineEditor,
  RoutineDetail,
  WorkoutDetail,
  WorkoutScreen,
  FinishWorkoutScreen,
  type RoutineViewState,
} from './src/screens';

type RoutineDetailRoute = {
  page: 'routine-detail';
  routine: Routine;
  viewState?: RoutineViewState;
};
type Route =
  | { page: 'cardio' | 'cardio-player' | 'cardio-finish' }
  | { page: 'cardio-detail'; session: CardioSession }
  | { page: 'cardio-editor'; routine: CardioRoutine }
  | {
      page: 'coverage';
      scope?: CoverageScope;
      returnTo?: RoutineDetailRoute | { page: 'division-detail'; divisionId: string };
    }
  | {
      page:
        | 'home'
        | 'routines'
        | 'routine-sets'
        | 'history'
        | 'workout'
        | 'supplements'
        | 'charts'
        | 'bulk-import'
        | 'backup';
    }
  | { page: 'division-editor'; division: DivisionDraft }
  | { page: 'division-detail'; divisionId: string }
  | { page: 'supplement-editor'; supplement: Supplement }
  | { page: 'finish'; initialWeight: string }
  | { page: 'editor'; routine: Routine; returnTo?: RoutineDetailRoute }
  | RoutineDetailRoute
  | { page: 'detail'; workout: Workout };
type Dialog = {
  title: string;
  message: string;
  label?: string;
  danger?: boolean;
  onConfirm?: () => void;
};

export default function App() {
  return (
    <SafeAreaProvider>
      <Ritmo />
    </SafeAreaProvider>
  );
}
function Ritmo() {
  const [fontsLoaded, fontError] = useFonts(Feather.font);
  const [db, setDb] = useState<Database>(emptyDatabase);
  const dbRef = useRef(db);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState(false);
  const [saveErrorReason, setSaveErrorReason] = useState('');
  const [restoring, setRestoring] = useState(false);
  const restoringRef = useRef(false);
  const revision = useRef(0);
  const [route, setRoute] = useState<Route>({ page: 'home' });
  const routeRef = useRef(route);
  const editorDirty = useRef(false);
  const onDirtyChange = useCallback((dirty: boolean) => {
    editorDirty.current = dirty;
  }, []);
  routeRef.current = route;
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [toast, setToast] = useState('');
  const [today, setToday] = useState(() => new Date());
  const [notificationsAllowed, setNotificationsAllowed] = useState(notificationsEnabled);
  useEffect(() => {
    const openSupplements = (url: string | null) => {
      if (url !== 'ritmo://suplementos') return;
      if (shouldDeferSupplementLink(routeRef.current.page)) {
        setToast('Seus suplementos estão na aba Suplementos.');
      } else setRoute({ page: 'supplements' });
    };
    void Linking.getInitialURL()
      .then(openSupplements)
      .catch(() => undefined);
    const subscription = Linking.addEventListener('url', ({ url }) => openSupplements(url));
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setToday(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  async function load() {
    setLoadError('');
    try {
      const data = await loadDatabase();
      dbRef.current = data;
      setDb(data);
      setReady(true);
    } catch {
      setLoadError('Não foi possível abrir seus dados. Eles foram preservados. Tente novamente.');
    }
  }
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  async function persist(data: Database) {
    if (restoringRef.current) return;
    const current = ++revision.current;
    try {
      await saveDatabase(data);
      if (current === revision.current) {
        setSaveError(false);
        setSaveErrorReason('');
      }
    } catch (error) {
      if (current === revision.current) {
        setSaveError(true);
        const message = (error as Error).message;
        setSaveErrorReason(message.startsWith('Os dados ultrapassam') ? message : '');
      }
    }
  }
  function update(next: Database | ((previous: Database) => Database)) {
    if (restoringRef.current) return;
    const data = typeof next === 'function' ? next(dbRef.current) : next;
    dbRef.current = data;
    setDb(data);
    void persist(data);
  }
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setToday(new Date());
        setNotificationsAllowed(notificationsEnabled());
      }
      if (state !== 'active' && ready && !restoringRef.current) void persist(dbRef.current);
    });
    return () => subscription.remove();
  }, [ready]);
  function back() {
    if (restoringRef.current) return;
    if (route.page === 'backup') {
      setRoute({ page: 'routines' });
      return;
    }
    if (route.page === 'routine-sets') {
      if (!editorDirty.current) setRoute({ page: 'routines' });
      else
        setDialog({
          title: 'Sair da edição?',
          message: 'As alterações deste conjunto ainda não foram salvas.',
          label: 'Descartar alterações',
          danger: true,
          onConfirm: () => setRoute({ page: 'routines' }),
        });
      return;
    }
    if (route.page === 'bulk-import') {
      if (!editorDirty.current) setRoute({ page: 'routines' });
      else
        setDialog({
          title: 'Sair da importação?',
          message: 'O texto colado ainda não foi importado.',
          label: 'Descartar texto',
          danger: true,
          onConfirm: () => setRoute({ page: 'routines' }),
        });
      return;
    }
    if (route.page === 'cardio-finish') {
      setRoute({ page: 'cardio-player' });
      return;
    }
    if (route.page === 'cardio-detail') {
      setRoute({ page: 'history' });
      return;
    }
    if (route.page === 'cardio-player' || route.page === 'cardio-editor') {
      if (route.page === 'cardio-player' || !editorDirty.current) setRoute({ page: 'cardio' });
      else
        setDialog({
          title: 'Sair da edição?',
          message: 'As alterações deste cardio ainda não foram salvas.',
          label: 'Descartar alterações',
          danger: true,
          onConfirm: () => setRoute({ page: 'cardio' }),
        });
      return;
    }
    if (route.page === 'cardio') {
      setRoute({ page: 'routines' });
      return;
    }
    if (route.page === 'coverage') {
      setRoute(route.returnTo ?? { page: 'routines' });
      return;
    }
    if (route.page === 'division-editor') {
      const destination: Route = db.routines.some(
        (routine) => routine.division?.id === route.division.id,
      )
        ? { page: 'division-detail', divisionId: route.division.id }
        : { page: 'routines' };
      if (!editorDirty.current) setRoute(destination);
      else
        setDialog({
          title: 'Sair da edição?',
          message: 'As alterações desta divisão ainda não foram salvas.',
          label: 'Descartar alterações',
          danger: true,
          onConfirm: () => setRoute(destination),
        });
      return;
    }
    if ((route.page === 'editor' || route.page === 'supplement-editor') && !editorDirty.current) {
      setRoute(
        route.page === 'editor'
          ? (route.returnTo ?? { page: 'routines' })
          : { page: 'supplements' },
      );
      return;
    }
    if (route.page === 'supplement-editor')
      setDialog({
        title: 'Sair da edição?',
        message: 'As alterações deste suplemento ainda não foram salvas.',
        label: 'Descartar alterações',
        danger: true,
        onConfirm: () => setRoute({ page: 'supplements' }),
      });
    else if (route.page === 'editor')
      setDialog({
        title: 'Sair da edição?',
        message: 'As alterações desta rotina ainda não foram salvas.',
        label: 'Descartar alterações',
        danger: true,
        onConfirm: () => setRoute(route.returnTo ?? { page: 'routines' }),
      });
    else
      setRoute({
        page:
          route.page === 'finish'
            ? 'workout'
            : route.page === 'detail'
              ? 'history'
              : route.page === 'routine-detail' || route.page === 'division-detail'
                ? 'routines'
                : 'home',
      });
  }
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (restoringRef.current) return true;
      if (dialog) {
        setDialog(null);
        return true;
      }
      if (route.page !== 'home') {
        back();
        return true;
      }
      return false;
    });
    return () => listener.remove();
  }, [route, dialog]);
  function begin(routine: Routine) {
    if (db.active) {
      setRoute({ page: 'workout' });
      setToast('Continue ou descarte o treino em andamento antes de iniciar outro.');
      return;
    }
    update((previous) => ({ ...previous, active: startWorkout(routine, previous.workouts) }));
    setRoute({ page: 'workout' });
  }
  function beginCardio(routine: CardioRoutine) {
    if (db.activeCardio) {
      setRoute({ page: 'cardio-player' });
      setToast('Continue ou encerre o cardio em andamento antes de iniciar outro.');
      return;
    }
    update((previous) => ({ ...previous, activeCardio: startCardio(routine) }));
    setRoute({ page: 'cardio-player' });
  }
  function saveCardio(routine: CardioRoutine) {
    const error = cardioRoutineError(routine);
    if (error) {
      setDialog({ title: 'Confira o cardio', message: error });
      return;
    }
    const cleaned = cleanCardioRoutine(routine);
    update((previous) => ({
      ...previous,
      cardioRoutines: (previous.cardioRoutines ?? []).some((item) => item.id === cleaned.id)
        ? previous.cardioRoutines!.map((item) => (item.id === cleaned.id ? cleaned : item))
        : [...(previous.cardioRoutines ?? []), cleaned],
    }));
    setRoute({ page: 'cardio' });
    setToast('Cardio salvo. Sequência pronta!');
  }
  function removeCardio(routine: CardioRoutine) {
    setDialog({
      title: 'Excluir cardio?',
      message: `“${routine.name}” será removido do planejamento.`,
      label: 'Excluir cardio',
      danger: true,
      onConfirm: () =>
        update((previous) => ({
          ...previous,
          cardioRoutines: (previous.cardioRoutines ?? []).filter((item) => item.id !== routine.id),
        })),
    });
  }
  function stopCardio() {
    if (!db.activeCardio) return;
    const proceed = () => {
      update((previous) => ({
        ...previous,
        activeCardio: previous.activeCardio ? pauseCardio(previous.activeCardio) : null,
      }));
      setRoute({ page: 'cardio-finish' });
    };
    if (cardioProgress(db.activeCardio).elapsedMs < 1000) {
      setDialog({
        title: 'Descartar cardio?',
        message: 'A sequência ainda não foi iniciada.',
        label: 'Descartar cardio',
        danger: true,
        onConfirm: () => {
          update((previous) => ({ ...previous, activeCardio: null }));
          setRoute({ page: 'cardio' });
        },
      });
    } else if (cardioProgress(db.activeCardio).complete) proceed();
    else
      setDialog({
        title: 'Encerrar cardio?',
        message: 'A sequência parcial será salva no histórico.',
        label: 'Encerrar cardio',
        onConfirm: proceed,
      });
  }
  function removeRoutine(routine: Routine) {
    setDialog({
      title: 'Excluir rotina?',
      message: `“${routine.name}” será removida. Os treinos já registrados serão mantidos.`,
      label: 'Excluir rotina',
      danger: true,
      onConfirm: () => {
        update((previous) =>
          removeRoutineFromSets(
            { ...previous, routines: previous.routines.filter((item) => item.id !== routine.id) },
            routine.id,
          ),
        );
        setToast('Rotina excluída.');
        if (route.page === 'routine-detail') setRoute({ page: 'routines' });
      },
    });
  }
  function saveRoutine(routine: Routine) {
    const error = routineError(routine);
    if (error) {
      setDialog({ title: 'Confira a rotina', message: error });
      return;
    }
    const cleaned = cleanRoutine(routine);
    update((previous) =>
      attachToActiveSet(
        {
          ...previous,
          routines: previous.routines.some((item) => item.id === cleaned.id)
            ? previous.routines.map((item) => (item.id === cleaned.id ? cleaned : item))
            : [...previous.routines, cleaned],
        },
        previous.routines.some((item) => item.id === cleaned.id) ? [] : [cleaned.id],
      ),
    );
    setRoute({
      page: 'routine-detail',
      routine: cleaned,
      viewState: route.page === 'editor' ? route.returnTo?.viewState : undefined,
    });
    setToast('Rotina salva. Bora treinar!');
  }
  function complete() {
    if (!db.active) return;
    const error = workoutError(db.active);
    if (error) {
      setDialog({ title: 'Falta registrar suas séries', message: error });
      return;
    }
    setRoute({ page: 'finish', initialWeight: previousBodyWeight(db.workouts) });
  }
  function addSupplement() {
    setRoute({
      page: 'supplement-editor',
      supplement: {
        id: uid(),
        name: '',
        note: '',
        createdAt: new Date().toISOString(),
        takenOn: [],
      },
    });
  }
  async function saveSupplement(supplement: Supplement) {
    const error = supplementError(supplement);
    if (error) {
      setDialog({ title: 'Confira o suplemento', message: error });
      return;
    }
    if (supplement.reminderTime) {
      try {
        const allowed = await enableNotifications();
        setNotificationsAllowed(allowed);
        if (!allowed) {
          setDialog({
            title: 'Permita as notificações',
            message:
              'Ative as notificações do Ritmo nas configurações do Android ou desmarque o lembrete para salvar sem aviso.',
            label: 'Abrir configurações',
            onConfirm: openNotificationSettings,
          });
          return;
        }
      } catch {
        setDialog({
          title: 'Não foi possível ativar o lembrete',
          message: 'Tente novamente ou desmarque o lembrete para salvar sem aviso.',
        });
        return;
      }
    }
    update((previous) => {
      const items = previous.supplements ?? [];
      const existing = items.find((item) => item.id === supplement.id);
      const cleaned = {
        ...supplement,
        name: supplement.name.trim(),
        note: supplement.note.trim(),
        takenOn: existing?.takenOn ?? [],
      };
      return {
        ...previous,
        supplements: existing
          ? items.map((item) => (item.id === cleaned.id ? cleaned : item))
          : [...items, cleaned],
      };
    });
    setRoute({ page: 'supplements' });
    setToast('Suplemento salvo. Um dia de cada vez!');
  }
  function toggleSupplement(id: string, taken: boolean) {
    const now = new Date();
    setToday(now);
    update((previous) => ({
      ...previous,
      supplements: (previous.supplements ?? []).map((item) =>
        item.id === id ? setSupplementTaken(item, taken, now) : item,
      ),
    }));
  }
  function removeSupplement(supplement: Supplement) {
    setDialog({
      title: 'Excluir suplemento?',
      message: `“${supplement.name}”, seus registros e seu lembrete serão removidos.`,
      label: 'Excluir suplemento',
      danger: true,
      onConfirm: () =>
        update((previous) => ({
          ...previous,
          supplements: (previous.supplements ?? []).filter((item) => item.id !== supplement.id),
        })),
    });
  }
  const supplements = db.supplements ?? [];
  const takenToday = supplements.filter((item) => item.takenOn.includes(dayKey(today))).length;
  const visibleRoutines = activeRoutines(db);
  const pausedStrength = db.strengthPaused === true;
  const hasStoredRoutines = db.routines.length > 0;
  const todayRoutines = routinesForDate(visibleRoutines, today);
  const cardioRoutines = db.cardioRoutines ?? [];
  const todayCardio = cardioForDate(cardioRoutines, today);
  const hasSchedule = visibleRoutines.some((routine) => routine.weekdays?.length);
  const completedThisWeek = db.workouts.filter((workout) => {
    const monday = new Date();
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    return new Date(workout.finishedAt!) >= monday;
  }).length;
  const completedSets = db.workouts.reduce(
    (sum, workout) => sum + allSets(workout).filter((set) => set.done).length,
    0,
  );
  if ((!fontsLoaded && !fontError) || !ready)
    return (
      <SafeAreaView style={s.safe}>
        <View style={[s.empty, { flex: 1, justifyContent: 'center' }]}>
          <Text style={s.brand}>ritmo.</Text>
          {loadError ? (
            <>
              <Text style={s.body}>{loadError}</Text>
              <Button label="Tentar novamente" onPress={() => void load()} />
            </>
          ) : (
            <ActivityIndicator color={c.dark} />
          )}
        </View>
      </SafeAreaView>
    );
  const subpage = [
    'coverage',
    'cardio',
    'cardio-editor',
    'cardio-player',
    'cardio-finish',
    'cardio-detail',
    'bulk-import',
    'backup',
    'routine-sets',
    'editor',
    'division-editor',
    'workout',
    'detail',
    'finish',
    'supplement-editor',
  ].includes(route.page);
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="dark" />
      <View style={s.shell}>
        <View style={s.header}>
          <View style={s.row}>
            <View style={s.brandIcon}>
              <Icon name="activity" color={c.lime} size={24} />
            </View>
            <Text style={s.brand}>
              ritmo<Text style={{ color: '#6A9347' }}>.</Text>
            </Text>
          </View>
          <View style={s.offlineBadge}>
            <View style={s.dot} />
            <Text style={s.offlineText}>SEU ESPAÇO DE TREINO</Text>
          </View>
        </View>
        {saveError && (
          <Pressable
            accessibilityRole="button"
            onPress={() => void persist(dbRef.current)}
            style={s.errorBanner}
          >
            <Text style={{ color: c.danger }}>
              {saveErrorReason ||
                'Não foi possível salvar no aparelho. Toque para tentar novamente.'}
            </Text>
          </Pressable>
        )}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {route.page === 'backup' ? (
            <BackupScreen
              database={db}
              onBack={back}
              restoring={restoring}
              onRestore={(backup: BackupPreview) =>
                setDialog({
                  title: 'Substituir todos os dados?',
                  message:
                    'O backup escolhido substituirá rotinas, históricos, cardios, suplementos e sessões em andamento deste aparelho. Essa ação não pode ser desfeita. Confirme que você guardou uma cópia dos dados atuais.',
                  label: 'Restaurar dados',
                  danger: true,
                  onConfirm: () => {
                    if (restoringRef.current) return;
                    restoringRef.current = true;
                    setRestoring(true);
                    revision.current += 1;
                    void restoreDatabase(backup.database)
                      .then(() => {
                        dbRef.current = backup.database;
                        setDb(backup.database);
                        setRoute({ page: 'home' });
                        setSaveError(false);
                        setSaveErrorReason('');
                        setToast('Backup restaurado. Confira seus dados.');
                      })
                      .catch((error) =>
                        setDialog({
                          title: 'N\u00e3o foi poss\u00edvel restaurar',
                          message: (error as Error).message,
                        }),
                      )
                      .finally(() => {
                        restoringRef.current = false;
                        setRestoring(false);
                      });
                  },
                })
              }
            />
          ) : route.page === 'routine-sets' ? (
            <RoutineSetsScreen
              db={db}
              onBack={back}
              onDirtyChange={onDirtyChange}
              onSave={(draft: RoutineSet) => {
                try {
                  update((previous) => saveRoutineSet(previous, draft));
                  setToast('Conjunto salvo.');
                  return true;
                } catch (error) {
                  setDialog({ title: 'Confira o conjunto', message: (error as Error).message });
                  return false;
                }
              }}
              onActivate={(id) => {
                update((previous) => activateRoutineSet(previous, id));
                setToast('Conjunto ativado. Seu planejamento foi atualizado.');
              }}
              onDelete={(set) =>
                setDialog({
                  title: 'Excluir conjunto?',
                  message: `“${set.name}” será removido. Suas rotinas e seu histórico serão mantidos.`,
                  label: 'Excluir conjunto',
                  danger: true,
                  onConfirm: () => update((previous) => deleteRoutineSet(previous, set.id)),
                })
              }
              onOpenRoutine={(routine) => setRoute({ page: 'routine-detail', routine })}
            />
          ) : route.page === 'bulk-import' ? (
            <BulkImportScreen
              database={db}
              onBack={back}
              onDirtyChange={onDirtyChange}
              onImport={(plan: BulkPlan) => {
                const count =
                  plan.routines.length +
                  plan.divisions.reduce((sum, group) => sum + group.routines.length, 0) +
                  plan.cardios.length;
                setDialog({
                  title: `Importar ${count} ${count === 1 ? 'rotina' : 'rotinas'}?`,
                  message:
                    'As rotinas da prévia serão acrescentadas ao planejamento. Seu histórico e treinos em andamento serão mantidos.',
                  label: 'Importar rotinas',
                  onConfirm: () => {
                    try {
                      update((previous) => {
                        const imported = applyBulkImport(previous, plan);
                        return attachToActiveSet(
                          imported,
                          imported.routines
                            .filter(
                              (routine) =>
                                !previous.routines.some((item) => item.id === routine.id),
                            )
                            .map((routine) => routine.id),
                        );
                      });
                      setRoute({ page: 'routines' });
                      setToast('Rotinas importadas. Confira seu planejamento.');
                    } catch (error) {
                      setDialog({
                        title: 'Não foi possível importar',
                        message: (error as Error).message,
                      });
                    }
                  },
                });
              }}
            />
          ) : route.page === 'cardio-editor' ? (
            <CardioEditor
              key={route.routine.id}
              initial={route.routine}
              onBack={back}
              onSave={saveCardio}
              onDirtyChange={onDirtyChange}
            />
          ) : route.page === 'cardio-player' && db.activeCardio ? (
            <CardioPlayer
              run={db.activeCardio}
              onBack={back}
              onPause={() =>
                update((previous) => ({
                  ...previous,
                  activeCardio: previous.activeCardio ? pauseCardio(previous.activeCardio) : null,
                }))
              }
              onResume={() =>
                update((previous) => ({
                  ...previous,
                  activeCardio: previous.activeCardio ? resumeCardio(previous.activeCardio) : null,
                }))
              }
              onStop={stopCardio}
            />
          ) : route.page === 'cardio-finish' && db.activeCardio ? (
            <CardioFinish
              run={db.activeCardio}
              onBack={back}
              onError={(message) => setDialog({ title: 'Confira a distância', message })}
              onSave={(distance) => {
                update((previous) => ({
                  ...previous,
                  activeCardio: null,
                  cardioHistory: previous.activeCardio
                    ? [
                        finishCardio(previous.activeCardio, distance),
                        ...(previous.cardioHistory ?? []),
                      ]
                    : previous.cardioHistory,
                }));
                setRoute({ page: 'history' });
                setToast('Cardio salvo no histórico.');
              }}
            />
          ) : route.page === 'cardio-detail' ? (
            <CardioHistoryDetail
              session={route.session}
              onBack={back}
              onDelete={() =>
                setDialog({
                  title: 'Excluir registro?',
                  message: 'Este cardio será removido do histórico. A rotina será mantida.',
                  label: 'Excluir cardio',
                  danger: true,
                  onConfirm: () => {
                    update((previous) => ({
                      ...previous,
                      cardioHistory: (previous.cardioHistory ?? []).filter(
                        (item) => item.id !== route.session.id,
                      ),
                    }));
                    setRoute({ page: 'history' });
                  },
                })
              }
            />
          ) : route.page === 'coverage' ? (
            <CoverageScreen
              routines={route.scope ? db.routines : visibleRoutines}
              initialScope={route.scope}
              onBack={back}
              onEdit={(routine) =>
                setRoute({ page: 'editor', routine, returnTo: { page: 'routine-detail', routine } })
              }
            />
          ) : route.page === 'charts' ? (
            <ChartsScreen history={db.workouts} />
          ) : route.page === 'division-editor' ? (
            <DivisionEditor
              initial={route.division}
              onBack={back}
              onDirtyChange={onDirtyChange}
              onSave={(division) => {
                try {
                  update((previous) => {
                    const saved = saveDivision(previous, division);
                    return attachToActiveSet(
                      pruneRoutineSetLinks(saved),
                      saved.routines
                        .filter(
                          (routine) => !previous.routines.some((item) => item.id === routine.id),
                        )
                        .map((routine) => routine.id),
                    );
                  });
                  setRoute({ page: 'division-detail', divisionId: division.id });
                  setToast('Divisão salva. Confira seus treinos.');
                } catch (error) {
                  setDialog({ title: 'Confira a divisão', message: (error as Error).message });
                }
              }}
            />
          ) : route.page === 'supplement-editor' ? (
            <SupplementEditor
              key={route.supplement.id}
              initial={route.supplement}
              onBack={back}
              onSave={saveSupplement}
              onDirtyChange={onDirtyChange}
            />
          ) : route.page === 'editor' ? (
            <RoutineEditor
              key={route.routine.id}
              initial={route.routine}
              onBack={back}
              onSave={saveRoutine}
              onDirtyChange={onDirtyChange}
            />
          ) : route.page === 'routine-detail' ? (
            <RoutineDetail
              key={route.routine.id}
              routine={route.routine}
              initialViewState={route.viewState}
              onBack={back}
              onEdit={(viewState) =>
                setRoute({
                  page: 'editor',
                  routine: route.routine,
                  returnTo: { ...route, viewState },
                })
              }
              onStart={() => begin(route.routine)}
              onDelete={() => removeRoutine(route.routine)}
              onCoverage={() =>
                setRoute({
                  page: 'coverage',
                  scope: { kind: 'routine', id: route.routine.id },
                  returnTo: route,
                })
              }
            />
          ) : route.page === 'workout' && db.active ? (
            <WorkoutScreen
              workout={db.active}
              history={db.workouts}
              onBack={back}
              onChange={(active) => update((previous) => ({ ...previous, active }))}
              onFinish={complete}
              onError={(message) => setDialog({ title: 'Confira a série', message })}
              onCancel={() =>
                setDialog({
                  title: 'Descartar este treino?',
                  message:
                    'As séries deste treino em andamento serão removidas. Sua rotina será mantida.',
                  label: 'Descartar treino',
                  danger: true,
                  onConfirm: () => {
                    update((previous) => ({ ...previous, active: null }));
                    setRoute({ page: 'home' });
                  },
                })
              }
            />
          ) : route.page === 'finish' && db.active ? (
            <FinishWorkoutScreen
              key={db.active.id}
              workout={db.active}
              initialWeight={route.initialWeight}
              onBack={back}
              onSave={(weight) => {
                update((previous) => finishWorkout(previous, weight));
                setRoute({ page: 'history' });
                setToast('Mais um treino na conta. Mandou bem!');
              }}
            />
          ) : route.page === 'detail' ? (
            <WorkoutDetail
              workout={route.workout}
              onBack={back}
              onDelete={() =>
                setDialog({
                  title: 'Excluir registro?',
                  message: 'Este treino será removido do histórico. Sua rotina será mantida.',
                  label: 'Excluir treino',
                  danger: true,
                  onConfirm: () => {
                    update((previous) => ({
                      ...previous,
                      workouts: previous.workouts.filter((w) => w.id !== route.workout.id),
                    }));
                    setRoute({ page: 'history' });
                  },
                })
              }
            />
          ) : (
            <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
              {route.page === 'cardio' && (
                <>
                  <PageHeader
                    title="Cardio"
                    subtitle="Monte sequências de velocidade e escolha os dias."
                    onBack={back}
                  />
                  <Button
                    label="Novo cardio"
                    icon="plus"
                    onPress={() => setRoute({ page: 'cardio-editor', routine: newCardioRoutine() })}
                  />
                  {db.activeCardio && (
                    <Button
                      label={`Continuar cardio: ${db.activeCardio.name}`}
                      icon="play"
                      secondary
                      onPress={() => setRoute({ page: 'cardio-player' })}
                    />
                  )}
                  {cardioRoutines.length ? (
                    cardioRoutines.map((routine) => (
                      <CardioRoutineCard
                        key={routine.id}
                        routine={routine}
                        onStart={() => beginCardio(routine)}
                        onEdit={() => setRoute({ page: 'cardio-editor', routine })}
                        onDelete={() => removeCardio(routine)}
                      />
                    ))
                  ) : (
                    <Empty
                      icon="activity"
                      title="Seu cardio começa aqui"
                      message="Crie etapas com duração e velocidade para acompanhar na esteira."
                    />
                  )}
                </>
              )}
              {route.page === 'home' && (
                <>
                  <View>
                    <Text style={s.eyebrow}>
                      {new Date()
                        .toLocaleDateString('pt-BR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })
                        .toLocaleUpperCase('pt-BR')}
                    </Text>
                    <Text style={s.title}>Um treino de cada vez.</Text>
                    <Text style={s.body}>Seu próximo passo começa aqui.</Text>
                  </View>
                  <View style={s.hero}>
                    <View style={s.heroTop}>
                      <Text style={s.heroEyebrow}>
                        {db.active ? 'VAMOS CONTINUAR?' : 'CONSTÂNCIA É O CAMINHO'}
                      </Text>
                      <Icon name="zap" color={c.lime} size={25} />
                    </View>
                    <Text style={s.heroTitle}>
                      {db.active ? db.active.name : 'Encontre seu ritmo.'}
                    </Text>
                    <Text style={s.heroBody}>
                      {db.active
                        ? `${allSets(db.active).filter((set) => set.done).length} de ${allSets(db.active).length} séries concluídas. Seu treino está salvo aqui.`
                        : pausedStrength
                          ? 'Treinos de força pausados. Cardios e histórico continuam disponíveis.'
                          : 'Planeje seus exercícios. Registre cada série.\nFaça espaço para a sua evolução.'}
                    </Text>
                    <Button
                      label={
                        db.active
                          ? 'Continuar treino'
                          : pausedStrength
                            ? 'Retomar treinos de força'
                            : visibleRoutines.length
                              ? 'Escolher treino'
                              : hasStoredRoutines
                                ? 'Criar rotina neste conjunto'
                                : 'Criar minha primeira rotina'
                      }
                      icon={db.active ? 'play' : 'arrow-up-right'}
                      onPress={() => {
                        if (!db.active && pausedStrength) {
                          update((previous) => setStrengthPaused(previous, false));
                          setToast('Treinos de força retomados.');
                        } else
                          setRoute(
                            db.active
                              ? { page: 'workout' }
                              : visibleRoutines.length
                                ? { page: 'routines' }
                                : { page: 'editor', routine: newRoutine() },
                          );
                      }}
                    />
                  </View>
                  {hasSchedule && (
                    <View style={s.card} testID="today-routines">
                      <Text style={s.cardTitle}>Treinos de hoje</Text>
                      <Text style={s.small}>
                        {today.toLocaleDateString('pt-BR', { weekday: 'long' })}
                      </Text>
                      {todayRoutines.length ? (
                        todayRoutines.map((routine) => (
                          <Button
                            key={routine.id}
                            label={`Iniciar ${routine.name}`}
                            secondary
                            icon="play"
                            onPress={() => begin(routine)}
                          />
                        ))
                      ) : (
                        <Text style={s.small}>Nenhuma rotina programada para hoje.</Text>
                      )}
                    </View>
                  )}
                  {(cardioRoutines.length > 0 || db.activeCardio) && (
                    <View style={s.card} testID="today-cardio">
                      <Text style={s.cardTitle}>Cardio de hoje</Text>
                      {db.activeCardio && (
                        <Button
                          label={`Continuar cardio: ${db.activeCardio.name}`}
                          icon="play"
                          onPress={() => setRoute({ page: 'cardio-player' })}
                        />
                      )}
                      {todayCardio.length ? (
                        todayCardio.map((routine) => (
                          <Button
                            key={routine.id}
                            label={`Iniciar cardio ${routine.name}`}
                            secondary
                            icon="activity"
                            onPress={() => beginCardio(routine)}
                          />
                        ))
                      ) : (
                        <Text style={s.small}>Nenhum cardio programado para hoje.</Text>
                      )}
                      <Button
                        label="Ver cardios"
                        secondary
                        onPress={() => setRoute({ page: 'cardio' })}
                      />
                    </View>
                  )}
                  <View style={s.metrics}>
                    <Metric
                      value={String(completedThisWeek).padStart(2, '0')}
                      label="treinos nesta semana"
                    />
                    <View style={s.divider} />
                    <Metric
                      value={String(db.workouts.length).padStart(2, '0')}
                      label="treinos no total"
                    />
                    <View style={s.divider} />
                    <Metric
                      value={String(completedSets).padStart(2, '0')}
                      label="séries concluídas"
                    />
                  </View>
                  <View style={s.card} testID="supplements-today">
                    <Text style={s.cardTitle}>Suplementos de hoje</Text>
                    <Text style={s.body}>
                      {supplements.length
                        ? `${takenToday} de ${supplements.length} registrados hoje.`
                        : 'Crie seus hábitos diários e acompanhe sua sequência.'}
                    </Text>
                    <Button
                      label={supplements.length ? 'Ver suplementos' : 'Cadastrar suplemento'}
                      icon="check-circle"
                      secondary
                      onPress={() =>
                        supplements.length ? setRoute({ page: 'supplements' }) : addSupplement()
                      }
                    />
                  </View>
                  <BodyWeightChart history={db.workouts} />
                  <SectionTitle
                    title="Suas rotinas"
                    aside={visibleRoutines.length ? 'Ver todas' : undefined}
                    onPress={() => setRoute({ page: 'routines' })}
                  />
                  {visibleRoutines.length ? (
                    visibleRoutines
                      .slice(0, 2)
                      .map((routine, i) => (
                        <RoutineCard
                          key={routine.id}
                          routine={routine}
                          index={i}
                          onStart={() => begin(routine)}
                          onEdit={() => setRoute({ page: 'editor', routine })}
                          onView={() => setRoute({ page: 'routine-detail', routine })}
                        />
                      ))
                  ) : pausedStrength ? (
                    <Empty
                      icon="pause-circle"
                      title="Treinos de força pausados"
                      message="Suas rotinas estão guardadas. Cardios e histórico continuam disponíveis."
                      action={
                        <Button
                          label="Retomar treinos de força"
                          icon="play"
                          secondary
                          onPress={() => update((previous) => setStrengthPaused(previous, false))}
                        />
                      }
                    />
                  ) : hasStoredRoutines ? (
                    <Empty
                      icon="layers"
                      title="Nenhuma rotina neste conjunto"
                      message="Crie uma rotina aqui ou ative um dos conjuntos guardados."
                      action={
                        <Button
                          label="Ver conjuntos de rotinas"
                          icon="archive"
                          secondary
                          onPress={() => setRoute({ page: 'routine-sets' })}
                        />
                      }
                    />
                  ) : (
                    <Empty
                      icon="layers"
                      title="O primeiro passo é seu"
                      message="Monte uma rotina com seus exercícios, séries e repetições. Ela fica pronta para o próximo treino."
                      action={
                        <Button
                          label="Criar rotina"
                          icon="plus"
                          secondary
                          onPress={() => setRoute({ page: 'editor', routine: newRoutine() })}
                        />
                      }
                    />
                  )}
                  <SectionTitle
                    title="Última atividade"
                    aside={db.workouts.length || db.cardioHistory?.length ? 'Histórico' : undefined}
                    onPress={() => setRoute({ page: 'history' })}
                  />
                  {db.cardioHistory?.[0] &&
                  (!db.workouts[0] ||
                    Date.parse(db.cardioHistory[0].finishedAt) >
                      Date.parse(db.workouts[0].finishedAt!)) ? (
                    <CardioHistoryCard
                      session={db.cardioHistory[0]}
                      onPress={() =>
                        setRoute({ page: 'cardio-detail', session: db.cardioHistory![0] })
                      }
                    />
                  ) : db.workouts.length ? (
                    <HistoryCard
                      workout={db.workouts[0]}
                      onPress={() => setRoute({ page: 'detail', workout: db.workouts[0] })}
                    />
                  ) : (
                    <View style={s.noteCard}>
                      <Icon name="sun" color={c.muted} />
                      <Text style={[s.body, { flex: 1 }]}>
                        Cada treino conta. Seu primeiro registro vai aparecer aqui.
                      </Text>
                    </View>
                  )}
                  {widgetAvailable && (
                    <View style={s.card}>
                      <Text style={s.cardTitle}>Seu treino na tela inicial</Text>
                      <Text style={s.body}>
                        Uma carinha esperando seu treino e um sorriso quando o dia estiver
                        concluído.
                      </Text>
                      <Button
                        label="Adicionar widget"
                        icon="smile"
                        secondary
                        onPress={async () => {
                          try {
                            const requested = await requestWidget();
                            if (!requested)
                              setDialog({
                                title: 'Adicionar widget',
                                message:
                                  'Na tela inicial do Android, toque e segure um espaço vazio, escolha Widgets e procure Ritmo.',
                              });
                          } catch {
                            setDialog({
                              title: 'Não foi possível adicionar o widget',
                              message:
                                'Tente pela tela inicial do Android: toque e segure um espaço vazio, escolha Widgets e procure Ritmo.',
                            });
                          }
                        }}
                      />
                    </View>
                  )}
                  <View style={s.localNote}>
                    <Icon name="smartphone" size={14} color={c.muted} />
                    <Text style={s.small}>Seus dados ficam neste aparelho. Sem login.</Text>
                  </View>
                </>
              )}
              {route.page === 'supplements' && (
                <>
                  <View>
                    <Text style={s.eyebrow}>UM HÁBITO POR DIA</Text>
                    <Text style={s.title}>Suplementos</Text>
                    <Text style={s.body}>Marque o que tomou hoje e mantenha sua sequência.</Text>
                  </View>
                  <Button label="Novo suplemento" icon="plus" onPress={addSupplement} />
                  {remindersAvailable && (
                    <Button
                      label="Adicionar widget de suplementos"
                      icon="grid"
                      secondary
                      onPress={async () => {
                        try {
                          if (await requestSupplementWidget()) return;
                        } catch {
                          /* Show the manual launcher path below. */
                        }
                        setDialog({
                          title: 'Widget de suplementos',
                          message:
                            'Na tela inicial do Android, toque e segure um espaço vazio, escolha Widgets e procure Ritmo · Suplementos.',
                        });
                      }}
                    />
                  )}
                  {remindersAvailable &&
                    !notificationsAllowed &&
                    supplements.some((item) => item.reminderTime) && (
                      <View style={s.card}>
                        <Text style={s.cardTitle}>Notificações desativadas</Text>
                        <Text style={s.small}>
                          Seus horários estão salvos. Permita as notificações do Ritmo para receber
                          os lembretes.
                        </Text>
                        <Button
                          label="Abrir configurações de notificações"
                          secondary
                          icon="bell"
                          onPress={openNotificationSettings}
                        />
                      </View>
                    )}
                  {supplements.length ? (
                    <>
                      <Text style={s.body}>
                        {takenToday} de {supplements.length} registrados hoje.
                      </Text>
                      {supplements.map((item) => (
                        <SupplementCard
                          key={item.id}
                          supplement={item}
                          today={today}
                          onToggle={(taken) => toggleSupplement(item.id, taken)}
                          onEdit={() => setRoute({ page: 'supplement-editor', supplement: item })}
                          onDelete={() => removeSupplement(item)}
                        />
                      ))}
                      <Text style={s.small}>
                        Cada suplemento tem sua própria sequência. Ela permanece enquanto hoje
                        estiver em aberto e reinicia se um dia inteiro ficar sem registro.
                      </Text>
                    </>
                  ) : (
                    <Empty
                      icon="sun"
                      title="Pequenos hábitos contam"
                      message="Cadastre seus suplementos, como Creatina ou Whey, e confirme uma vez por dia quando tomar."
                    />
                  )}
                </>
              )}
              {route.page === 'division-detail' &&
                (() => {
                  const allDivisionRoutines = db.routines.filter(
                    (routine) => routine.division?.id === route.divisionId,
                  );
                  const routines = allDivisionRoutines.filter((routine) =>
                    visibleRoutines.some((item) => item.id === routine.id),
                  );
                  const name = allDivisionRoutines[0]?.division?.name ?? 'Divisão';
                  return (
                    <>
                      <PageHeader
                        title={name}
                        subtitle="Confira os treinos da sua divisão"
                        onBack={back}
                      />
                      {!!routines.length && (
                        <Button
                          label="Editar divisão"
                          secondary
                          icon="edit-2"
                          onPress={() =>
                            setRoute({
                              page: 'division-editor',
                              division: {
                                id: route.divisionId,
                                name,
                                routines: allDivisionRoutines,
                              },
                            })
                          }
                        />
                      )}
                      {!!routines.length && (
                        <Button
                          label="Cobertura muscular da divisão"
                          secondary
                          icon="activity"
                          onPress={() =>
                            setRoute({
                              page: 'coverage',
                              scope: { kind: 'division', id: route.divisionId },
                              returnTo: route,
                            })
                          }
                        />
                      )}
                      {routines.map((routine, index) => (
                        <RoutineCard
                          key={routine.id}
                          routine={routine}
                          index={index}
                          onStart={() => begin(routine)}
                          onEdit={() => setRoute({ page: 'editor', routine })}
                          onView={() => setRoute({ page: 'routine-detail', routine })}
                          onDelete={() => removeRoutine(routine)}
                        />
                      ))}
                      {!routines.length && <Text style={s.body}>Nenhum treino nesta divisão.</Text>}
                    </>
                  );
                })()}
              {route.page === 'routines' && (
                <>
                  <View>
                    <Text style={s.eyebrow}>SEU PLANEJAMENTO</Text>
                    <Text style={s.title}>Minhas rotinas</Text>
                    <Text style={s.body}>
                      {pausedStrength
                        ? 'Treinos de força pausados. Cardios e histórico continuam disponíveis.'
                        : hasStoredRoutines && !visibleRoutines.length
                          ? 'Este conjunto está sem treinos de força. Suas outras rotinas continuam guardadas.'
                          : 'Tudo pronto para chegar e treinar.'}
                    </Text>
                  </View>
                  {db.routineSets && (
                    <Text style={s.body}>
                      Conjunto ativo:{' '}
                      {db.routineSets.find((set) => set.id === db.activeRoutineSetId)?.name}
                    </Text>
                  )}
                  {pausedStrength ? (
                    <View style={s.card} testID="strength-paused">
                      <Text style={s.cardTitle}>Planejamento de força pausado</Text>
                      <Text style={s.body}>
                        As rotinas saem do planejamento e o widget de musculação deixa de mostrar
                        treinos programados. Treinos em andamento, cardios e histórico continuam
                        disponíveis.
                      </Text>
                      <Button
                        label="Retomar treinos de força"
                        icon="play"
                        onPress={() => {
                          update((previous) => setStrengthPaused(previous, false));
                          setToast('Treinos de força retomados.');
                        }}
                      />
                    </View>
                  ) : visibleRoutines.length ? (
                    <View style={{ gap: 6 }}>
                      <Button
                        label="Pausar treinos de força"
                        secondary
                        icon="pause-circle"
                        onPress={() => {
                          update((previous) => setStrengthPaused(previous, true));
                          setToast('Treinos de força pausados.');
                        }}
                      />
                      <Text style={s.small}>
                        Oculta apenas o planejamento de força. Cardios e histórico continuam
                        disponíveis.
                      </Text>
                    </View>
                  ) : null}
                  <Button
                    label="Cobertura muscular"
                    secondary
                    icon="activity"
                    onPress={() => setRoute({ page: 'coverage' })}
                  />
                  <Button
                    label="Rotinas de cardio"
                    secondary
                    icon="heart"
                    onPress={() => setRoute({ page: 'cardio' })}
                  />
                  <Button
                    label="Importar treinos por texto"
                    secondary
                    icon="download"
                    onPress={() => setRoute({ page: 'bulk-import' })}
                  />
                  <Button
                    label="Backup e restauração"
                    secondary
                    icon="save"
                    onPress={() => setRoute({ page: 'backup' })}
                  />
                  <Button
                    label="Conjuntos de rotinas"
                    secondary
                    icon="archive"
                    onPress={() => setRoute({ page: 'routine-sets' })}
                  />
                  <Button
                    label="Nova divisão"
                    icon="layers"
                    onPress={() => setRoute({ page: 'division-editor', division: newDivision() })}
                  />
                  <Button
                    label="Nova rotina"
                    icon="plus"
                    secondary
                    onPress={() => setRoute({ page: 'editor', routine: newRoutine() })}
                  />
                  {db.active && (
                    <Button
                      label={`Continuar: ${db.active.name}`}
                      secondary
                      icon="play"
                      onPress={() => setRoute({ page: 'workout' })}
                    />
                  )}
                  {[
                    ...new Map(
                      visibleRoutines
                        .filter((routine) => routine.division)
                        .map((routine) => [routine.division!.id, routine.division!]),
                    ).values(),
                  ].map((division) => {
                    const routines = visibleRoutines.filter(
                      (routine) => routine.division?.id === division.id,
                    );
                    return (
                      <View key={division.id} style={s.card}>
                        <Text style={s.eyebrow}>DIVISÃO · {routines.length} TREINOS</Text>
                        <Text style={s.cardTitle}>{division.name}</Text>
                        {routines.map((routine) => (
                          <Text key={routine.id} style={s.body}>
                            {routine.name} · {routineDays(routine)}
                          </Text>
                        ))}
                        <Button
                          label={`Ver divisão ${division.name}`}
                          secondary
                          icon="layers"
                          onPress={() =>
                            setRoute({ page: 'division-detail', divisionId: division.id })
                          }
                        />
                      </View>
                    );
                  })}
                  {visibleRoutines.length ? (
                    visibleRoutines
                      .filter((routine) => !routine.division)
                      .map((routine, i) => (
                        <RoutineCard
                          key={routine.id}
                          routine={routine}
                          index={i}
                          onStart={() => begin(routine)}
                          onEdit={() => setRoute({ page: 'editor', routine })}
                          onView={() => setRoute({ page: 'routine-detail', routine })}
                          onDelete={() => removeRoutine(routine)}
                        />
                      ))
                  ) : pausedStrength ? (
                    <Empty
                      icon="pause-circle"
                      title="Treinos de força pausados"
                      message="Retome o planejamento acima para ver as rotinas deste conjunto."
                    />
                  ) : hasStoredRoutines ? (
                    <Empty
                      icon="layers"
                      title="Nenhuma rotina neste conjunto"
                      message="Crie uma rotina aqui, importe treinos ou ative outro conjunto."
                    />
                  ) : (
                    <Empty
                      icon="layers"
                      title="Uma rotina, muitas possibilidades"
                      message="Crie uma divisão com vários treinos ou uma rotina avulsa."
                    />
                  )}
                </>
              )}
              {route.page === 'history' && (
                <>
                  <View>
                    <Text style={s.eyebrow}>CADA TREINO CONTA</Text>
                    <Text style={s.title}>Seu histórico</Text>
                    <Text style={s.body}>O registro do esforço que você colocou aqui.</Text>
                  </View>
                  <View style={s.metrics}>
                    <Metric value={String(db.workouts.length)} label="treinos de força" />
                    <View style={s.divider} />
                    <Metric value={String(db.cardioHistory?.length ?? 0)} label="cardios" />
                    <View style={s.divider} />
                    <Metric
                      value={formatNumber(db.workouts.reduce((sum, w) => sum + volume(w), 0))}
                      label="volume total (kg)"
                    />
                  </View>
                  {db.workouts.length || db.cardioHistory?.length ? (
                    [
                      ...db.workouts.map((workout) => ({
                        id: workout.id,
                        date: workout.finishedAt!,
                        workout,
                      })),
                      ...(db.cardioHistory ?? []).map((session) => ({
                        id: session.id,
                        date: session.finishedAt,
                        session,
                      })),
                    ]
                      .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
                      .map((item) =>
                        'workout' in item && item.workout ? (
                          <HistoryCard
                            key={item.id}
                            workout={item.workout}
                            onPress={() => setRoute({ page: 'detail', workout: item.workout! })}
                          />
                        ) : 'session' in item && item.session ? (
                          <CardioHistoryCard
                            key={item.id}
                            session={item.session}
                            onPress={() =>
                              setRoute({ page: 'cardio-detail', session: item.session! })
                            }
                          />
                        ) : null,
                      )
                  ) : (
                    <Empty
                      icon="clock"
                      title="Sua história começa no próximo treino"
                      message="Inicie uma rotina e registre suas séries. Os treinos finalizados ficarão aqui para você consultar."
                      action={
                        <Button
                          label="Ver minhas rotinas"
                          icon="arrow-right"
                          secondary
                          onPress={() => setRoute({ page: 'routines' })}
                        />
                      }
                    />
                  )}
                </>
              )}
            </ScrollView>
          )}
        </KeyboardAvoidingView>
        {toast ? (
          <View accessibilityLiveRegion="polite" style={s.toast}>
            <Icon name="check-circle" size={17} color={c.lime} />
            <Text style={s.toastText}>{toast}</Text>
          </View>
        ) : null}
        {!subpage && (
          <View style={s.nav}>
            {(
              [
                { page: 'home', label: 'Início', icon: 'grid' },
                { page: 'routines', label: 'Rotinas', icon: 'layers' },
                { page: 'charts', label: 'Gráficos', icon: 'trending-up' },
                { page: 'supplements', label: 'Suplementos', icon: 'check-circle' },
                { page: 'history', label: 'Histórico', icon: 'clock' },
              ] as const
            ).map((item) => (
              <Pressable
                key={item.page}
                accessibilityRole="tab"
                accessibilityLabel={item.label}
                accessibilityState={{
                  selected:
                    (['routine-detail', 'division-detail'].includes(route.page)
                      ? 'routines'
                      : route.page) === item.page,
                }}
                aria-selected={
                  (['routine-detail', 'division-detail'].includes(route.page)
                    ? 'routines'
                    : route.page) === item.page
                }
                onPress={() => setRoute({ page: item.page })}
                style={s.navItem}
              >
                <View
                  style={[
                    s.navIcon,
                    (['routine-detail', 'division-detail'].includes(route.page)
                      ? 'routines'
                      : route.page) === item.page && {
                      backgroundColor: c.lime,
                    },
                  ]}
                >
                  <Icon
                    name={item.icon}
                    color={
                      (['routine-detail', 'division-detail'].includes(route.page)
                        ? 'routines'
                        : route.page) === item.page
                        ? c.ink
                        : c.muted
                    }
                  />
                </View>
                <Text
                  style={[
                    s.navLabel,
                    (['routine-detail', 'division-detail'].includes(route.page)
                      ? 'routines'
                      : route.page) === item.page && {
                      color: c.ink,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
      <Modal
        visible={!!dialog}
        transparent
        animationType="fade"
        onRequestClose={() => setDialog(null)}
      >
        <View style={s.modalOverlay}>
          <View accessibilityViewIsModal style={s.modalCard}>
            <Text style={s.sectionTitle}>{dialog?.title}</Text>
            <Text style={s.body}>{dialog?.message}</Text>
            <Button
              label={dialog?.label ?? 'Entendi'}
              danger={dialog?.danger}
              onPress={() => {
                const action = dialog?.onConfirm;
                setDialog(null);
                action?.();
              }}
            />
            {dialog?.onConfirm && (
              <Button label="Voltar" secondary onPress={() => setDialog(null)} />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
