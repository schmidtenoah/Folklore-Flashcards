interface Props {
  dark: boolean;
  onToggle: () => void;
}

export function ThemeToggle({ dark, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="ui-button subtle-button flex h-8 w-8 items-center justify-center rounded-full text-[0.65rem]"
      style={{
        background: "var(--toggle-bg)",
        border: "1px solid var(--toggle-border)",
        color: "var(--toggle-text)",
        cursor: "pointer",
      }}
    >
      <span
        aria-hidden
        className="flex h-5 w-5 items-center justify-center"
        style={{ color: "var(--toggle-text)" }}
      >
        {dark ? "☀" : "☽"}
      </span>
    </button>
  );
}
