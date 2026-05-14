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
        className="flex h-5 w-5 items-center justify-center rounded-full"
        style={{
          background: dark ? "#1e1a16" : "#f5f1eb",
          color: dark ? "#c8bfb4" : "#1e1a14",
          boxShadow: dark ? "none" : "0 0 0 1px rgba(30,26,20,0.12)",
        }}
      >
        {dark ? "☀" : "☽"}
      </span>
    </button>
  );
}
