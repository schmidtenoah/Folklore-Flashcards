import { describe, expect, it } from "vitest";
import {
  createRunStats,
  getAccuracy,
  recordHit,
  recordMiss,
  updatePayoffProgress,
  type PayoffProgress,
  type RunSummary,
} from "./payoff";

describe("run payoff stats", () => {
  it("tracks hits, misses, current streak, best streak, and accuracy", () => {
    const afterRun = [
      recordHit,
      recordHit,
      recordHit,
      recordMiss,
      recordHit,
    ].reduce((stats, next) => next(stats), createRunStats());

    expect(afterRun).toEqual({
      hits: 4,
      misses: 1,
      currentStreak: 1,
      bestStreak: 3,
    });
    expect(getAccuracy(afterRun)).toBe(80);
  });

  it("uses zero accuracy before the learner has judged a card", () => {
    expect(getAccuracy(createRunStats())).toBe(0);
  });
});

describe("payoff progress", () => {
  const previous: PayoffProgress = {
    bestRun: null,
    bestStreak: 2,
    highestFloor: 4,
    completedDungeonIds: ["dungeon-0"],
    lastDungeonId: "dungeon-0",
    lastFolkloreId: "japanese",
  };

  const summary: RunSummary = {
    outcome: "victory",
    hits: 7,
    misses: 1,
    accuracy: 88,
    bestStreak: 5,
    currentStreak: 5,
    totalCards: 8,
    floorReached: 8,
    dungeonId: "dungeon-2",
    dungeonLabel: "Dungeon 2",
    folkloreId: "celtic",
    folkloreLabel: "Celtic",
    completedAt: "2026-05-15T10:00:00.000Z",
  };

  it("records best run, highest floor, completed dungeons, and last selections", () => {
    const next = updatePayoffProgress(previous, summary);

    expect(next.bestRun).toMatchObject({
      accuracy: 88,
      hits: 7,
      misses: 1,
      totalCards: 8,
      dungeonId: "dungeon-2",
      folkloreId: "celtic",
    });
    expect(next.bestStreak).toBe(5);
    expect(next.highestFloor).toBe(8);
    expect(next.completedDungeonIds).toEqual(["dungeon-0", "dungeon-2"]);
    expect(next.lastDungeonId).toBe("dungeon-2");
    expect(next.lastFolkloreId).toBe("celtic");
  });

  it("does not duplicate completed dungeons or replace a stronger best run", () => {
    const first = updatePayoffProgress(previous, summary);
    const weakerDefeat = updatePayoffProgress(first, {
      ...summary,
      outcome: "defeat",
      hits: 3,
      misses: 4,
      accuracy: 43,
      bestStreak: 2,
      currentStreak: 0,
      floorReached: 5,
      completedAt: "2026-05-15T10:05:00.000Z",
    });

    expect(weakerDefeat.bestRun).toEqual(first.bestRun);
    expect(weakerDefeat.completedDungeonIds).toEqual(["dungeon-0", "dungeon-2"]);
    expect(weakerDefeat.highestFloor).toBe(8);
  });
});
