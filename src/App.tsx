import { useCallback, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { clearApkgObjectUrls, type Flashcard } from "./lib/apkg";
import { sfx } from "./lib/sfx";
import { UploadScreen } from "./components/game/UploadScreen";
import { BattleScreen } from "./components/game/BattleScreen";
import { ResultScreen } from "./components/game/ResultScreen";
import { useTheme } from "./hooks/useTheme";
import { useSound } from "./hooks/useSound";
import { DUNGEONS, FOLKLORES, getDungeon, getFolklore, type DungeonId, type FolkloreId } from "./lib/gameConfig";
import {
  isNewBestRun,
  loadPayoffProgress,
  rememberPayoffSelection,
  savePayoffProgress,
  updatePayoffProgress,
  type RunSummary,
} from "./lib/payoff";

type Stage = "upload" | "battle" | "victory" | "defeat";

export function App() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [stage, setStage] = useState<Stage>("upload");
  const [defeated, setDefeated] = useState(0);
  const [progress, setProgress] = useState(loadPayoffProgress);
  const [folkloreId, setFolkloreId] = useState<FolkloreId>(() =>
    progress.lastFolkloreId && FOLKLORES.some((lore) => lore.id === progress.lastFolkloreId)
      ? progress.lastFolkloreId
      : FOLKLORES[0].id,
  );
  const [dungeonId, setDungeonId] = useState<DungeonId>(() =>
    progress.lastDungeonId && DUNGEONS.some((dungeon) => dungeon.id === progress.lastDungeonId)
      ? progress.lastDungeonId
      : DUNGEONS[0].id,
  );
  const [lastRun, setLastRun] = useState<RunSummary | null>(null);
  const [newBestRun, setNewBestRun] = useState(false);
  const { dark, toggle } = useTheme();
  const { muted, toggle: toggleSound } = useSound();

  const folklore = getFolklore(folkloreId);
  const dungeon = getDungeon(dungeonId);

  useEffect(() => {
    sfx.prime();
  }, []);

  const restart = () => {
    clearApkgObjectUrls();
    setStage("upload");
    setCards([]);
    setDefeated(0);
    setLastRun(null);
    setNewBestRun(false);
  };

  const replay = () => {
    setDefeated(0);
    setLastRun(null);
    setNewBestRun(false);
    setStage("battle");
  };

  const rememberSelection = useCallback((nextFolkloreId: FolkloreId, nextDungeonId: DungeonId) => {
    setProgress((current) => {
      const next = rememberPayoffSelection(current, {
        folkloreId: nextFolkloreId,
        dungeonId: nextDungeonId,
      });
      savePayoffProgress(next);
      return next;
    });
  }, []);

  const selectFolklore = useCallback((id: FolkloreId) => {
    setFolkloreId(id);
    rememberSelection(id, dungeonId);
  }, [dungeonId, rememberSelection]);

  const selectDungeon = useCallback((id: DungeonId) => {
    setDungeonId(id);
    rememberSelection(folkloreId, id);
  }, [folkloreId, rememberSelection]);

  const completeRun = useCallback((summary: RunSummary, nextStage: "victory" | "defeat") => {
    const nextProgress = updatePayoffProgress(progress, summary);
    savePayoffProgress(nextProgress);

    flushSync(() => {
      setDefeated(summary.hits);
      setLastRun(summary);
      setNewBestRun(isNewBestRun(progress, summary));
      setProgress(nextProgress);
      setStage(nextStage);
    });
  }, [progress]);

  const handleGameOver = useCallback((summary: RunSummary) => {
    completeRun(summary, "defeat");
  }, [completeRun]);

  const handleGiveUp = useCallback((summary: RunSummary) => {
    try {
      sfx.defeat();
    } catch {
      /* audio optional */
    }
    handleGameOver(summary);
  }, [handleGameOver]);

  const handleVictory = useCallback((summary: RunSummary) => {
    completeRun(summary, "victory");
  }, [completeRun]);

  const completedDungeonsLabel = progress.completedDungeonIds
    .map((id) => getDungeon(id).shortLabel)
    .join(" / ");

  if (stage === "upload") {
    return (
      <UploadScreen
        dark={dark}
        onToggleTheme={toggle}
        soundMuted={muted}
        onToggleSound={toggleSound}
        folkloreId={folkloreId}
        dungeonId={dungeonId}
        onSelectFolklore={selectFolklore}
        onSelectDungeon={selectDungeon}
        onLoaded={(c) => {
          setCards(c);
          setStage("battle");
        }}
      />
    );
  }

  if (stage === "battle") {
    return (
      <BattleScreen
        cards={cards}
        dark={dark}
        onToggleTheme={toggle}
        soundMuted={muted}
        onToggleSound={toggleSound}
        folklore={folklore}
        dungeon={dungeon}
        onGameOver={handleGameOver}
        onGiveUp={handleGiveUp}
        onVictory={handleVictory}
      />
    );
  }

  if (stage === "victory") {
    return (
      <ResultScreen
        variant="victory"
        glyph={folklore.victoryGlyph}
        backgroundGlyphVertical={folklore.id === "japanese"}
        title="Dungeon cleared"
        subtitle={`Every ${folklore.heroName.toLowerCase()} encounter has fallen. The knowledge is yours.`}
        detail={`${cards.length} cards · ${lastRun?.hits ?? cards.length} hits`}
        runSummary={lastRun}
        progress={progress}
        newBestRun={newBestRun}
        completedDungeonsLabel={completedDungeonsLabel}
        primaryLabel="Enter again"
        onPrimary={replay}
        secondaryLabel="New deck"
        onSecondary={restart}
        dark={dark}
        onToggleTheme={toggle}
        soundMuted={muted}
        onToggleSound={toggleSound}
        accent={folklore.accent}
      />
    );
  }

  return (
    <ResultScreen
      variant="defeat"
      glyph={folklore.defeatGlyph}
      backgroundGlyphVertical={folklore.id === "japanese"}
      title="You gave in"
      subtitle="Leave the dungeon, study the answer, and come back sharper."
      detail={`${defeated} of ${cards.length} ${folklore.heroName.toLowerCase()} encounters defeated`}
      runSummary={lastRun}
      progress={progress}
      newBestRun={newBestRun}
      completedDungeonsLabel={completedDungeonsLabel}
      primaryLabel="Try again"
      onPrimary={replay}
      secondaryLabel="New deck"
      onSecondary={restart}
      dark={dark}
      onToggleTheme={toggle}
      soundMuted={muted}
      onToggleSound={toggleSound}
      accent={folklore.accent}
    />
  );
}
