import { sfx } from "@/lib/sfx";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface Props {
  title: string;
  kanji: string;
  subtitle: string;
  detail?: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  variant?: "victory" | "defeat";
  dark: boolean;
  onToggleTheme: () => void;
}

export function ResultScreen({
  title,
  kanji,
  subtitle,
  detail,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  variant = "victory",
  dark,
  onToggleTheme,
}: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Toggle — top right */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle dark={dark} onToggle={onToggleTheme} />
      </div>

      {/* Massive BG kanji */}
      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center vertical-jp font-display select-none pointer-events-none bg-kanji"
        style={{ fontSize: "28rem" }}
      >
        {kanji}
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

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => { sfx.click(); onPrimary(); }}
            className="px-6 py-3 font-display font-light tracking-widest text-[0.55rem] uppercase transition hover:opacity-90"
            style={{ background: "var(--foreground)", color: "var(--background)" }}
          >
            {primaryLabel}
          </button>
          {secondaryLabel && onSecondary && (
            <button
              onClick={() => { sfx.click(); onSecondary(); }}
              className="px-6 py-3 font-display font-light tracking-widest text-[0.55rem] uppercase transition hover:opacity-70"
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
