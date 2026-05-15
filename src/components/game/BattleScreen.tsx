import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { Flashcard } from "@/lib/apkg";
import { sfx } from "@/lib/sfx";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SoundToggle } from "@/components/ui/SoundToggle";
import {
  getDungeonLives,
  getNextLivesAfterMiss,
  hasInfiniteLives,
  type DungeonConfig,
  type FolkloreTheme,
} from "@/lib/gameConfig";
import {
  createRunStats,
  getAccuracy,
  recordHit,
  recordMiss,
  type RunOutcome,
  type RunStats,
  type RunSummary,
} from "@/lib/payoff";

type Phase = "question" | "reveal" | "resolved";

interface Props {
  cards: Flashcard[];
  dark: boolean;
  onToggleTheme: () => void;
  soundMuted: boolean;
  onToggleSound: () => void;
  folklore: FolkloreTheme;
  dungeon: DungeonConfig;
  onGameOver: (summary: RunSummary) => void;
  onGiveUp: (summary: RunSummary) => void;
  onVictory: (summary: RunSummary) => void;
}

export function BattleScreen({
  cards,
  dark,
  onToggleTheme,
  soundMuted,
  onToggleSound,
  folklore,
  dungeon,
  onGameOver,
  onGiveUp,
  onVictory,
}: Props) {
  const queue = useMemo(() => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    if (shuffled.length < 2) return shuffled;
    let bossIdx = 0;
    let bossLen = -1;
    for (let i = 0; i < shuffled.length; i++) {
      const len = shuffled[i].answerHtml?.length ?? 0;
      if (len > bossLen) { bossLen = len; bossIdx = i; }
    }
    const [boss] = shuffled.splice(bossIdx, 1);
    shuffled.push(boss);
    return shuffled;
  }, [cards]);
  const [index, setIndex] = useState(0);
  const [lives, setLives] = useState<number | null>(() => getDungeonLives(dungeon));
  const [phase, setPhase] = useState<Phase>("question");
  const [slashing, setSlashing] = useState(false);
  const [dying, setDying] = useState(false);
  const [damaged, setDamaged] = useState(false);
  const [exiting, setExiting] = useState<null | "victory" | "defeat">(null);
  const [runStats, setRunStats] = useState<RunStats>(() => createRunStats());
  const topRef = useRef<HTMLDivElement>(null);
  const judgeRef = useRef<HTMLDivElement>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runEndedRef = useRef(false);
  const runStatsRef = useRef<RunStats>(runStats);
  const pendingExitRef = useRef<{ kind: "victory" | "defeat"; summary: RunSummary } | null>(null);

  const card = queue[index];
  const enemy = folklore.enemies[index % folklore.enemies.length];
  const glyphLength = Array.from(enemy.glyph).length;
  const glyphFontSize =
    glyphLength === 1 ? "9rem" :
    glyphLength === 2 ? "5.5rem" :
    glyphLength === 3 ? "3.8rem" :
    "3rem";

  const floor = index + 1;
  const isBossFloor = floor === queue.length;

  const scrollToTop = useCallback(() => {
    topRef.current?.scrollIntoView({ behavior: "instant", block: "start" });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => { scrollToTop(); }, [index, scrollToTop]);

  useEffect(() => () => {
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
  }, []);

  useEffect(() => {
    if (!exiting || !pendingExitRef.current) return;

    const { kind, summary } = pendingExitRef.current;
    exitTimerRef.current = setTimeout(() => {
      exitTimerRef.current = null;
      pendingExitRef.current = null;
      if (kind === "victory") onVictory(summary);
      else onGameOver(summary);
    }, 900);

    return () => {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    };
  }, [exiting, onGameOver, onVictory]);

  const updateRunStats = useCallback((next: (stats: RunStats) => RunStats) => {
    const updated = next(runStatsRef.current);
    runStatsRef.current = updated;
    setRunStats(updated);
    return updated;
  }, []);

  const makeRunSummary = useCallback(
    (outcome: RunOutcome, floorReached: number, stats: RunStats = runStatsRef.current): RunSummary => ({
      ...stats,
      outcome,
      accuracy: getAccuracy(stats),
      totalCards: queue.length,
      floorReached,
      dungeonId: dungeon.id,
      dungeonLabel: dungeon.label,
      folkloreId: folklore.id,
      folkloreLabel: folklore.label,
      completedAt: new Date().toISOString(),
    }),
    [dungeon.id, dungeon.label, folklore.id, folklore.label, queue.length],
  );

  const finish = useCallback(
    (kind: "victory" | "defeat", floorReached: number, stats?: RunStats) => {
      if (runEndedRef.current) return;
      runEndedRef.current = true;

      if (kind === "victory") sfx.victory();
      else sfx.defeat();

      pendingExitRef.current = {
        kind,
        summary: makeRunSummary(kind, floorReached, stats),
      };
      setExiting(kind);
    },
    [makeRunSummary],
  );

  const giveUp = useCallback(() => {
    if (runEndedRef.current) return;
    runEndedRef.current = true;

    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    pendingExitRef.current = null;
    setExiting(null);
    onGiveUp(makeRunSummary("defeat", floor));
  }, [floor, makeRunSummary, onGiveUp]);

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-fg-mid text-sm">
        No cards in this deck.
      </div>
    );
  }

  const reveal = () => {
    sfx.reveal();
    setPhase("reveal");
    const scrollToJudge = () => {
      const el = judgeRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const target = window.scrollY + rect.bottom - window.innerHeight + 24;
      window.scrollTo({ top: Math.max(target, 0), behavior: "smooth" });
    };
    requestAnimationFrame(() => requestAnimationFrame(scrollToJudge));
    setTimeout(scrollToJudge, 180);
  };

  const judge = (correct: boolean) => {
    if (phase === "resolved") return;
    setPhase("resolved");

    if (correct) {
      const nextStats = updateRunStats(recordHit);
      scrollToTop();
      sfx.slash();
      setTimeout(() => setSlashing(true), 20);
      setTimeout(() => setDying(true), 740);
      setTimeout(() => setSlashing(false), 1000);
      setTimeout(() => {
        setDying(false);
        if (index + 1 >= queue.length) { finish("victory", queue.length, nextStats); return; }
        setIndex((i) => i + 1);
        setPhase("question");
      }, 1220);
    } else {
      const nextStats = updateRunStats(recordMiss);
      sfx.miss();
      setDamaged(true);
      setTimeout(() => setDamaged(false), 750);
      if (isBossFloor) {
        setLives(0);
        setTimeout(() => finish("defeat", floor, nextStats), 400);
        return;
      }
      const nextLives = getNextLivesAfterMiss(dungeon, lives);
      setLives(nextLives);
      if (nextLives !== null && nextLives <= 0) { setTimeout(() => finish("defeat", floor, nextStats), 400); return; }
      setTimeout(() => { setIndex((i) => (i + 1) % queue.length); setPhase("question"); }, 750);
    }
  };

  return (
    <div
      ref={topRef}
      className={`min-h-screen flex flex-col p-5 md:p-8 relative overflow-hidden transition-opacity duration-700 ${
        exiting ? "opacity-0" : "opacity-100"
      }`}
      style={{
        "--lore-accent": folklore.accent,
        "--glyph-ui-scale": folklore.glyphTuning.uiScale,
        "--glyph-ui-x": folklore.glyphTuning.uiX,
        "--glyph-ui-y": folklore.glyphTuning.uiY,
        "--glyph-battle-scale": folklore.glyphTuning.battleScale,
        "--glyph-battle-x": folklore.glyphTuning.battleX,
        "--glyph-battle-y": folklore.glyphTuning.battleY,
        "--glyph-seal-x": folklore.glyphTuning.sealX,
        "--glyph-seal-y": folklore.glyphTuning.sealY,
      } as CSSProperties}
    >
      {/* Damage vignette */}
      {damaged && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-50 animate-damage-vignette"
          style={{ boxShadow: "inset 0 0 120px 60px rgba(139, 26, 16, 0.55)" }}
        />
      )}

      {/* HUD */}
      <header className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <span className="seal h-9 w-9">
            <span
              className="seal-glyph"
              style={{
                transform: `translate(${folklore.glyphTuning.sealX}, ${folklore.glyphTuning.sealY})`,
              }}
            >
              {folklore.sealGlyph}
            </span>
          </span>
          <div>
            <p className="text-[0.5rem] uppercase tracking-[0.4em] text-fg-dim">{dungeon.label}</p>
            <p className="font-display font-light text-xl leading-none">
              {String(floor).padStart(2, "0")}{" "}
              <span className="text-fg-dim text-sm">/ {queue.length}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SoundToggle muted={soundMuted} onToggle={onToggleSound} />
          <ThemeToggle dark={dark} onToggle={onToggleTheme} />
          <button
            onClick={giveUp}
            className="ui-button danger-button px-3 py-1.5 font-display font-light tracking-widest text-[0.5rem] uppercase"
            style={{
              border: "1px solid rgba(139, 26, 16, 0.38)",
              color: "var(--foreground)",
            }}
          >
            Give up
          </button>
          {hasInfiniteLives(dungeon) ? (
            <div className="font-display text-lg leading-none" aria-label="Infinite lives">∞</div>
          ) : (
            <div className="flex items-center gap-2" aria-label={`${lives ?? 0} lives`}>
              {Array.from({ length: dungeon.lives ?? 0 }).map((_, i) => (
                <span
                  key={i}
                  className="h-3 w-3 rotate-45 inline-block transition-all duration-300"
                  style={{
                    background: i < (lives ?? 0) ? "var(--lore-accent, var(--shu))" : "transparent",
                    border: i < (lives ?? 0) ? "none" : "1px solid var(--card-border)",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </header>

      <section className="run-payoff-hud relative z-10 mb-5" aria-label="Run statistics">
        <span>
          Hits <strong>{runStats.hits}</strong>
        </span>
        <span>
          Misses <strong>{runStats.misses}</strong>
        </span>
        <span>
          Accuracy <strong>{getAccuracy(runStats)}%</strong>
        </span>
        <span className={runStats.currentStreak >= 3 ? "streak-hot" : ""}>
          Streak <strong>{runStats.currentStreak >= 3 ? `${runStats.currentStreak} hits` : runStats.currentStreak}</strong>
        </span>
        {isBossFloor && <span className="boss-chip">Boss floor</span>}
      </section>

      {/* Enemy stage — identical structure in all phases */}
      <section
        className={`flex flex-col items-center justify-center flex-1 relative ${
          damaged ? "animate-shake" : ""
        }`}
      >
        <div className="relative flex flex-col items-center gap-0">
          {/* Ambient glow */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 blur-3xl opacity-40"
            style={{
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--lore-accent, var(--shu)) 28%, transparent) 0%, transparent 70%)",
            }}
          />

          {/* Enemy — re-mounted per index for ink-bleed */}
          <div
            key={`enemy-${index}`}
            className={`flex flex-col items-center animate-ink ${dying ? "animate-enemy-die" : ""}`}
            style={{ animationFillMode: "forwards" }}
          >
            {/* Top line */}
            <div className="enemy-line" />
            <div className="h-2" />

            {/* Glyph + folklore tooltip */}
            <div
              className="enemy-tooltip-wrapper"
              tabIndex={0}
              aria-describedby={`enemy-tooltip-${index}`}
            >
              <span
                className="lore-glyph enemy-glyph font-light select-none leading-none"
                style={{
                  fontSize: glyphFontSize,
                  writingMode: glyphLength > 1 ? "vertical-rl" : "horizontal-tb",
                  textOrientation: "upright",
                  textShadow: "0 0 40px rgba(139, 26, 16, 0.2)",
                  transform: `translate(${glyphLength > 1 ? (folklore.id === "japanese" ? "-0.18em" : "0em") : folklore.glyphTuning.battleX}, ${glyphLength > 1 ? "0em" : folklore.glyphTuning.battleY}) scale(${folklore.glyphTuning.battleScale})`,
                }}
              >
                {enemy.glyph}
              </span>
              <div id={`enemy-tooltip-${index}`} className="enemy-tooltip" role="tooltip">
                <p className="enemy-tooltip-name">{enemy.name}</p>
                <p className="enemy-tooltip-desc">{enemy.description}</p>
              </div>
            </div>

            {/* Sword slash */}
            {slashing && (
              <span
                aria-hidden
                className="absolute inset-0 slash-mark animate-slash"
              />
            )}

            <div className="h-2" />
            {/* Bottom line */}
            <div className="enemy-line" />
            <div className="h-2.5" />

            {/* English name */}
            <p className="text-[0.5rem] uppercase tracking-[0.5em] text-fg-dim">
              {enemy.name}
            </p>
            {isBossFloor && <p className="boss-badge">Boss</p>}
          </div>
        </div>
      </section>

      {/* Card */}
      <section
        className="card-surface p-5 md:p-8 max-w-3xl mx-auto w-full relative z-10 animate-ink mt-8"
        key={`card-${index}-${phase}`}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[0.5rem] uppercase tracking-[0.35em] text-accent">Q</span>
          <span className="text-[0.5rem] uppercase tracking-[0.35em] text-fg-dim">Question</span>
        </div>
        <div
          className="font-display font-light text-lg md:text-xl leading-relaxed anki-content"
          dangerouslySetInnerHTML={{ __html: card.questionHtml }}
        />

        {phase !== "question" && (
          <div className="animate-ink">
            <hr className="rule-solid" />
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[0.5rem] uppercase tracking-[0.35em] text-accent">A</span>
              <span className="text-[0.5rem] uppercase tracking-[0.35em] text-fg-dim">Answer</span>
            </div>
            <div
              className="font-light text-base md:text-lg leading-relaxed anki-content"
              dangerouslySetInnerHTML={{ __html: card.answerHtml }}
            />
          </div>
        )}

        <div ref={judgeRef} className="mt-8 flex flex-wrap gap-3 justify-end">
          {phase === "question" && (
            <button
              onClick={reveal}
              className="ui-button px-6 py-2.5 font-display font-light tracking-widest text-[0.55rem] uppercase"
              style={{
                background: "var(--foreground)",
                color: "var(--background)",
              }}
            >
              Draw blade · Reveal
            </button>
          )}
          {phase === "reveal" && (
            <>
              <button
                onClick={() => judge(false)}
                className="ui-button px-6 py-2.5 font-display font-light tracking-widest text-[0.55rem] uppercase"
                style={{
                  border: "1px solid var(--card-border)",
                  color: "var(--fg-mid)",
                }}
              >
                Miss
              </button>
              <button
                onClick={() => judge(true)}
                className="ui-button px-6 py-2.5 font-display font-light tracking-widest text-[0.55rem] uppercase"
                style={{
                  background: "var(--lore-accent, var(--shu))",
                  color: "#f5f1eb",
                  boxShadow: "0 2px 8px color-mix(in srgb, var(--lore-accent, var(--shu)) 40%, transparent)",
                }}
              >
                Hit
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
