// Placeholder art for a box that has no photo yet: a gift box in the site's colours.
const TONES = [
  ["#efe6f7", "#5b3a87", "#d5136f"],
  ["#e8dac2", "#45296a", "#d5136f"],
  ["#f1e9f8", "#22388f", "#d5136f"],
  ["#eee6d6", "#5b3a87", "#cbb7e0"],
];

export function GiftArt({ seed = 0, className = "" }: { seed?: number; className?: string }) {
  const [bg, box, bow] = TONES[Math.abs(seed) % TONES.length];
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label="Gift box illustration" preserveAspectRatio="xMidYMid slice">
      <rect width="200" height="200" fill={bg} />
      <rect x="45" y="80" width="110" height="80" rx="6" fill={box} />
      <rect x="38" y="64" width="124" height="24" rx="5" fill={box} opacity=".85" />
      <rect x="92" y="64" width="16" height="96" fill={bow} />
      <path d="M100 64c-18-26-44-18-36-4 6 10 24 6 36 4zm0 0c18-26 44-18 36-4-6 10-24 6-36 4z" fill={bow} />
    </svg>
  );
}
