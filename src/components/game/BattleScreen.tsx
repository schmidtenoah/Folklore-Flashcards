import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Flashcard } from "@/lib/apkg";
import { sfx } from "@/lib/sfx";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const ENEMIES = [
  { kanji: "鬼",   name: "Oni",        description: "Iron-club demons born from corrupt souls, tasked with staffing the underworld's torture chambers. During Setsubun, roasted soybeans are hurled to drive them from homes." },
  { kanji: "天狗", name: "Tengu",      description: "Winged mountain spirits and master swordsmen said to have trained legendary warriors. Once feared as harbingers of war, they became fierce guardians of the peaks." },
  { kanji: "河童", name: "Kappa",      description: "River creatures with a water-filled dish on their heads. Bowing can make one bow back, spill the water, and lose its strength. Dangerous to swimmers, but bound by strict honor." },
  { kanji: "雪女", name: "Yuki-onna", description: "A pale woman who materialises in blizzards and breathes lethal cold. She sometimes spares those she finds beautiful, and legends tell of her living undetected as a mortal wife for years." },
  { kanji: "木霊", name: "Kodama",     description: "Tree spirits dwelling in ancient forests, their presence said to explain the echoes heard in mountain passes. Felling a tree that houses one was believed to bring devastating misfortune." },
  { kanji: "狐",   name: "Kitsune",   description: "Fox spirits that grow wiser and more powerful with age, sometimes gaining up to nine tails. Some serve Inari as messengers, and many tales give them the power to take human form." },
  { kanji: "狸",   name: "Tanuki",    description: "Magical raccoon dogs famed for shapeshifting and their jolly nature. Skilled tricksters rather than malicious ones, they are symbols of good fortune throughout Japan." },
  { kanji: "絡新婦", name: "Jorogumo", description: "A spider that, after four hundred years, gains the power to transform into a beautiful woman. She lures men with the sound of a biwa before binding them in silk." },
  { kanji: "塗壁", name: "Nurikabe",  description: "An invisible wall that blocks travellers on lonely roads at night, impossible to walk around or climb. Folklore holds that striking its very base with a stick causes it to vanish." },
  { kanji: "垢嘗", name: "Akaname",   description: "A grime-licker that slips into neglected bathrooms at night to feed on built-up filth. Its existence in folklore served as a simple warning: keep your bathroom clean." },
  { kanji: "鎌鼬", name: "Kamaitachi", description: "Weasel-like yokai riding sudden whirlwinds and cutting people with sickle-like claws. In one three-part tradition, one knocks you down, one cuts, and one seals the wound." },
  { kanji: "海坊主", name: "Umibozu", description: "A vast dark shape that rises from calm seas to capsize ships. Believed to be the spirit of a drowned monk; sailors hoped that throwing it a barrel might buy enough time to flee." },
];

type Phase = "question" | "reveal" | "resolved";

interface Props {
  cards: Flashcard[];
  dark: boolean;
  onToggleTheme: () => void;
  onGameOver: (defeated: number) => void;
  onVictory: () => void;
}

export function BattleScreen({ cards, dark, onToggleTheme, onGameOver, onVictory }: Props) {
  const queue = useMemo(() => [...cards].sort(() => Math.random() - 0.5), [cards]);
  const [index, setIndex] = useState(0);
  const [lives, setLives] = useState(3);
  const [phase, setPhase] = useState<Phase>("question");
  const [slashing, setSlashing] = useState(false);
  const [dying, setDying] = useState(false);
  const [damaged, setDamaged] = useState(false);
  const [exiting, setExiting] = useState<null | "victory" | "defeat">(null);
  const topRef = useRef<HTMLDivElement>(null);

  const card = queue[index];
  const enemy = ENEMIES[index % ENEMIES.length];
  const glyphLength = Array.from(enemy.kanji).length;
  const glyphFontSize =
    glyphLength === 1 ? "9rem" :
    glyphLength === 2 ? "5.5rem" :
    glyphLength === 3 ? "3.8rem" :
    "3rem";

  const floor = index + 1;

  const scrollToTop = useCallback(() => {
    topRef.current?.scrollIntoView({ behavior: "instant", block: "start" });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => { scrollToTop(); }, [index, scrollToTop]);

  const finish = useCallback(
    (kind: "victory" | "defeat", defeatedCount: number) => {
      if (kind === "victory") sfx.victory();
      else sfx.defeat();
      setExiting(kind);
      setTimeout(() => {
        if (kind === "victory") onVictory();
        else onGameOver(defeatedCount);
      }, 900);
    },
    [onGameOver, onVictory],
  );

  if (!card) return null;

  const reveal = () => { sfx.reveal(); setPhase("reveal"); };

  const giveUp = () => {
    if (phase === "resolved" || exiting) return;
    setPhase("resolved");
    finish("defeat", index);
  };

  const judge = (correct: boolean) => {
    if (phase === "resolved") return;
    setPhase("resolved");

    if (correct) {
      scrollToTop();
      sfx.slash();
      setTimeout(() => sfx.slash(), 280);
      setSlashing(true);
      setTimeout(() => setDying(true), 720);
      setTimeout(() => setSlashing(false), 980);
      setTimeout(() => {
        setDying(false);
        if (index + 1 >= queue.length) { finish("victory", queue.length); return; }
        setIndex((i) => i + 1);
        setPhase("question");
      }, 1220);
    } else {
      sfx.miss();
      setDamaged(true);
      setTimeout(() => setDamaged(false), 750);
      const nextLives = lives - 1;
      setLives(nextLives);
      if (nextLives <= 0) { setTimeout(() => finish("defeat", index), 400); return; }
      setTimeout(() => { setIndex((i) => (i + 1) % queue.length); setPhase("question"); }, 750);
    }
  };

  return (
    <div
      ref={topRef}
      className={`min-h-screen flex flex-col p-5 md:p-8 relative overflow-hidden transition-opacity duration-700 ${
        exiting ? "opacity-0" : "opacity-100"
      }`}
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
          <span className="seal h-9 w-9 text-sm">鬼</span>
          <div>
            <p className="text-[0.5rem] uppercase tracking-[0.4em] text-fg-dim">Floor</p>
            <p className="font-display font-light text-xl leading-none">
              {String(floor).padStart(2, "0")}{" "}
              <span className="text-fg-dim text-sm">/ {queue.length}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
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
          <div className="flex items-center gap-2" aria-label={`${lives} lives`}>
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className="h-3 w-3 rotate-45 inline-block transition-all duration-300"
                style={{
                  background: i < lives ? "var(--shu)" : "transparent",
                  border: i < lives ? "none" : "1px solid var(--card-border)",
                }}
              />
            ))}
          </div>
        </div>
      </header>

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
                "radial-gradient(circle, rgba(139,26,16,0.25) 0%, transparent 70%)",
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

            {/* Kanji + folklore tooltip */}
            <div
              className="enemy-tooltip-wrapper"
              tabIndex={0}
              aria-describedby={`enemy-tooltip-${index}`}
            >
              <span
                className="font-display font-light select-none leading-none"
                style={{
                  fontSize: glyphFontSize,
                  writingMode: glyphLength > 1 ? "vertical-rl" : "horizontal-tb",
                  textOrientation: "upright",
                  textShadow: "0 0 40px rgba(139, 26, 16, 0.2)",
                }}
              >
                {enemy.kanji}
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

        <div className="mt-8 flex flex-wrap gap-3 justify-end">
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
                  background: "var(--shu)",
                  color: "#f5f1eb",
                  boxShadow: "0 2px 8px rgba(139,26,16,0.4)",
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
