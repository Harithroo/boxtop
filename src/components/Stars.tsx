export function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return <span className="text-brand dark:text-accent" aria-label={`${value.toFixed(1)} out of 5 stars`}>{"★".repeat(full)}<span className="text-ink/25 dark:text-line">{"★".repeat(5 - full)}</span></span>;
}
