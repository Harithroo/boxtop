// Placeholder art for a box that has no photo yet: a gift box in the site's colours.
// The four tones (.ga-0 … .ga-3, light and dark) live in globals.css, so the art follows the site theme.
const TONES = 4;

export function GiftArt({ seed = 0, className = "" }: { seed?: number; className?: string }) {
  const tone = `ga-${Math.abs(seed) % TONES}`;
  const bg = { fill: "var(--ga-bg)" }, box = { fill: "var(--ga-box)" }, bow = { fill: "var(--ga-bow)" };
  return (
    <svg viewBox="0 0 200 200" className={`${tone} ${className}`} role="img" aria-label="Gift box illustration" preserveAspectRatio="xMidYMid slice">
      <rect width="200" height="200" style={bg} />
      <rect x="45" y="80" width="110" height="80" rx="6" style={box} />
      <rect x="38" y="64" width="124" height="24" rx="5" style={box} opacity=".85" />
      <rect x="92" y="64" width="16" height="96" style={bow} />
      <path d="M100 64c-18-26-44-18-36-4 6 10 24 6 36 4zm0 0c18-26 44-18 36-4-6 10-24 6-36 4z" style={bow} />
    </svg>
  );
}
