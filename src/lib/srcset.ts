// The seeded box photos in public/catalog/boxes each have a 400px copy beside them (scripts/thumbs.mjs).
// Photos uploaded in the back office have no smaller copy, so they get no srcset and load as they are.

/** srcset for a box photo shown small (a hero print, a pegged card), or undefined when there is no smaller copy. */
export function boxSrcSet(src: string | null | undefined): string | undefined {
  const m = src?.match(/^(\/catalog\/boxes\/[^/?#]+)\.webp$/);
  // 2000w stands for "the original": only its order matters, and no original here is wider
  return m ? `${m[1]}-400.webp 400w, ${src} 2000w` : undefined;
}
