import { sfx } from "@/lib/sfx";
import { SoundToggle } from "@/components/ui/SoundToggle";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import type { PayoffProgress, RunSummary } from "@/lib/payoff";
import type { CSSProperties } from "react";

interface Props {
  title: string;
  glyph: string;
  /** Vertical stack for multi-glyph Japanese; runes stay horizontal */
  backgroundGlyphVertical?: boolean;
  subtitle: string;
  detail?: string;
  runSummary?: RunSummary | null;
  progress?: PayoffProgress;
  newBestRun?: boolean;
  completedDungeonsLabel?: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  variant?: "victory" | "defeat";
  dark: boolean;
  onToggleTheme: () => void;
  soundMuted: boolean;
  onToggleSound: () => void;
  accent: string;
}

export function ResultScreen({
  title,
  glyph,
  backgroundGlyphVertical = false,
  subtitle,
  detail,
  runSummary,
  progress,
  newBestRun = false,
  completedDungeonsLabel,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  variant = "victory",
  dark,
  onToggleTheme,
  soundMuted,
  onToggleSound,
  accent,
}: Props) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ "--lore-accent": accent } as CSSProperties}
    >
      {/* Toggle - top right */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
        <SoundToggle muted={soundMuted} onToggle={onToggleSound} />
        <ThemeToggle dark={dark} onToggle={onToggleTheme} />
      </div>

      {/* Massive BG glyph */}
      <div
        aria-hidden
        className={`folklore-deco ${backgroundGlyphVertical ? "vertical-jp" : ""} absolute inset-0 flex items-center justify-center select-none pointer-events-none bg-kanji`}
        style={{ fontSize: "28rem" }}
      >
        {glyph}
      </div>

      <div className="card-surface relative p-10 max-w-lg w-full text-center animate-fade-in-soft">
        <p className="text-[0.55rem] uppercase tracking-[0.4em] text-fg-dim mb-3">
          {variant === "victory" ? "Victory" : "Defeat"}
        </p>
        <h1 className="font-display font-light text-4xl mb-4">{title}</h1>

        {/* Thin center rule */}
        <div
          className="w-8 mx-auto mb-4"
          style={{ height: "1px", background: "var(--rule)" }}
        />

        <p className="text-sm text-fg-mid leading-relaxed mb-2">{subtitle}</p>
        {detail && <p className="text-sm mb-6" style={{ color: "var(--fg-dim)" }}>{detail}</p>}

        {runSummary && (
          <div className="result-stats" aria-label="Run statistics">
            {newBestRun && <p className="result-callout">New best run sealed</p>}
            <div className="result-stat-grid">
              <span>
                Hits
                <strong>{runSummary.hits}</strong>
              </span>
              <span>
                Misses
                <strong>{runSummary.misses}</strong>
              </span>
              <span>
                Accuracy
                <strong>{runSummary.accuracy}%</strong>
              </span>
              <span>
                Streak
                <strong>{runSummary.bestStreak}</strong>
              </span>
            </div>
          </div>
        )}

        {progress && (
          <div className="progress-summary" aria-label="Long term progress">
            <div>
              <span>Best run</span>
              <strong>
                {progress.bestRun
                  ? `${progress.bestRun.accuracy}% · ${progress.bestRun.hits}/${progress.bestRun.totalCards}`
                  : "None yet"}
              </strong>
            </div>
            <div>
              <span>Highest floor</span>
              <strong>{progress.highestFloor || "None"}</strong>
            </div>
            <div>
              <span>Dungeons cleared</span>
              <strong>{completedDungeonsLabel || "None yet"}</strong>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => { sfx.click(); onPrimary(); }}
            className="ui-button px-6 py-3 font-display font-light tracking-widest text-[0.55rem] uppercase"
            style={{ background: "var(--foreground)", color: "var(--background)" }}
          >
            {primaryLabel}
          </button>
          {secondaryLabel && onSecondary && (
            <button
              onClick={() => { sfx.click(); onSecondary(); }}
              className="ui-button px-6 py-3 font-display font-light tracking-widest text-[0.55rem] uppercase"
              style={{ border: "1px solid var(--card-border)", color: "var(--fg-mid)" }}
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
