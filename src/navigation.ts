const protectedPages = new Set([
  'substances',
  'editor',
  'division-editor',
  'supplement-editor',
  'cardio-editor',
  'routine-sets',
  'bulk-import',
  'backup',
  'finish',
  'cardio-finish',
  'workout',
  'cardio-player',
]);

export const shouldDeferSupplementLink = (page: string) => protectedPages.has(page);
