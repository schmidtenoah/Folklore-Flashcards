import type { DungeonId, FolkloreId } from "./gameConfig";

const PAYOFF_STORAGE_KEY = "anki-lore-payoff-v1";

export type RunOutcome = "victory" | "defeat";

export interface RunStats {
  hits: number;
  misses: number;
  currentStreak: number;
  bestStreak: number;
}

export interface RunSummary extends RunStats {
  outcome: RunOutcome;
  accuracy: number;
  totalCards: number;
  floorReached: number;
  dungeonId: DungeonId;
  dungeonLabel: string;
  folkloreId: FolkloreId;
  folkloreLabel: string;
  completedAt: string;
}

export interface BestRun {
  accuracy: number;
  hits: number;
  misses: number;
  totalCards: number;
  dungeonId: DungeonId;
  dungeonLabel: string;
  folkloreId: FolkloreId;
  folkloreLabel: string;
  completedAt: string;
}

export interface PayoffProgress {
  bestRun: BestRun | null;
  bestStreak: number;
  highestFloor: number;
  completedDungeonIds: DungeonId[];
  lastDungeonId: DungeonId | null;
  lastFolkloreId: FolkloreId | null;
}

export const EMPTY_PAYOFF_PROGRESS: PayoffProgress = {
  bestRun: null,
  bestStreak: 0,
  highestFloor: 0,
  completedDungeonIds: [],
  lastDungeonId: null,
  lastFolkloreId: null,
};

export function createRunStats(): RunStats {
  return {
    hits: 0,
    misses: 0,
    currentStreak: 0,
    bestStreak: 0,
  };
}

export function recordHit(stats: RunStats): RunStats {
  const currentStreak = stats.currentStreak + 1;
  return {
    hits: stats.hits + 1,
    misses: stats.misses,
    currentStreak,
    bestStreak: Math.max(stats.bestStreak, currentStreak),
  };
}

export function recordMiss(stats: RunStats): RunStats {
  return {
    hits: stats.hits,
    misses: stats.misses + 1,
    currentStreak: 0,
    bestStreak: stats.bestStreak,
  };
}

export function getAccuracy(stats: Pick<RunStats, "hits" | "misses">): number {
  const attempts = stats.hits + stats.misses;
  if (attempts === 0) return 0;
  return Math.round((stats.hits / attempts) * 100);
}

export function isNewBestRun(progress: PayoffProgress, summary: RunSummary): boolean {
  if (!progress.bestRun) return summary.hits + summary.misses > 0;
  if (summary.accuracy !== progress.bestRun.accuracy) {
    return summary.accuracy > progress.bestRun.accuracy;
  }
  if (summary.hits !== progress.bestRun.hits) return summary.hits > progress.bestRun.hits;
  return summary.misses < progress.bestRun.misses;
}

export function updatePayoffProgress(progress: PayoffProgress, summary: RunSummary): PayoffProgress {
  const completedDungeonIds =
    summary.outcome === "victory" && !progress.completedDungeonIds.includes(summary.dungeonId)
      ? [...progress.completedDungeonIds, summary.dungeonId]
      : progress.completedDungeonIds;

  return {
    bestRun: isNewBestRun(progress, summary)
      ? {
          accuracy: summary.accuracy,
          hits: summary.hits,
          misses: summary.misses,
          totalCards: summary.totalCards,
          dungeonId: summary.dungeonId,
          dungeonLabel: summary.dungeonLabel,
          folkloreId: summary.folkloreId,
          folkloreLabel: summary.folkloreLabel,
          completedAt: summary.completedAt,
        }
      : progress.bestRun,
    bestStreak: Math.max(progress.bestStreak, summary.bestStreak),
    highestFloor: Math.max(progress.highestFloor, summary.floorReached),
    completedDungeonIds,
    lastDungeonId: summary.dungeonId,
    lastFolkloreId: summary.folkloreId,
  };
}

export function rememberPayoffSelection(
  progress: PayoffProgress,
  selection: { dungeonId: DungeonId; folkloreId: FolkloreId },
): PayoffProgress {
  return {
    ...progress,
    lastDungeonId: selection.dungeonId,
    lastFolkloreId: selection.folkloreId,
  };
}

function getBrowserStorage(): Storage | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage;
}

function normalizeProgress(value: unknown): PayoffProgress {
  if (!value || typeof value !== "object") return EMPTY_PAYOFF_PROGRESS;
  const candidate = value as Partial<PayoffProgress>;
  return {
    bestRun: candidate.bestRun ?? null,
    bestStreak: Number(candidate.bestStreak ?? 0),
    highestFloor: Number(candidate.highestFloor ?? 0),
    completedDungeonIds: Array.isArray(candidate.completedDungeonIds)
      ? candidate.completedDungeonIds
      : [],
    lastDungeonId: candidate.lastDungeonId ?? null,
    lastFolkloreId: candidate.lastFolkloreId ?? null,
  };
}

export function loadPayoffProgress(storage: Storage | null = getBrowserStorage()): PayoffProgress {
  if (!storage) return EMPTY_PAYOFF_PROGRESS;
  try {
    const raw = storage.getItem(PAYOFF_STORAGE_KEY);
    if (!raw) return EMPTY_PAYOFF_PROGRESS;
    return normalizeProgress(JSON.parse(raw));
  } catch {
    return EMPTY_PAYOFF_PROGRESS;
  }
}

export function savePayoffProgress(
  progress: PayoffProgress,
  storage: Storage | null = getBrowserStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(PAYOFF_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    /* local persistence is optional */
  }
}
