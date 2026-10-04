const COLOR_HEX: Record<string, string> = {
  ivory: "#F5F0E8",
  taupe: "#A69A89",
  espresso: "#2A2521",
  olive: "#737963",
  black: "#1A1A1A",
  white: "#FFFFFF",
  beige: "#D8CBB8",
  grey: "#8A8A8A",
  gray: "#8A8A8A",
  brown: "#6B4F3A",
  navy: "#2B3A4A",
  maroon: "#5C2E2E",
  pink: "#D9A7A0",
  blue: "#7A93A8",
  green: "#6E7F5C",
  cream: "#EFE6D4",
  stone: "#B8AE9E",
  sand: "#D6C7A8",
  charcoal: "#3A3A3A",
};

export function colorHex(name: string): string {
  return COLOR_HEX[name.toLowerCase().trim()] ?? "#C6BBA8";
}

export function ColorSwatch({
  color,
  selected,
  onSelect,
  size = "md",
}: {
  color: string;
  selected?: boolean;
  onSelect?: () => void;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const el = (
    <span
      title={color}
      className={`${dim} inline-block rounded-full border transition-all ${
        selected
          ? "scale-110 border-espresso ring-2 ring-espresso ring-offset-2 ring-offset-ivory"
          : "border-espresso/20"
      }`}
      style={{ backgroundColor: colorHex(color) }}
    />
  );
  if (!onSelect) return el;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Select colour ${color}`}
      aria-pressed={selected}
      className="rounded-full"
    >
      {el}
    </button>
  );
}
