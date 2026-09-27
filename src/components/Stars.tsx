export function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return <span className="text-accent" aria-label={`${value.toFixed(1)} out of 5 stars`}>{"★".repeat(full)}<span className="text-line">{"★".repeat(5 - full)}</span></span>;
}
