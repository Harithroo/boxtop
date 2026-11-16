// The seeded photos in public/ have smaller copies beside them (scripts/thumbs.mjs): AVIF at every size the pages
// show, and the older WebP copies, which stay as the fallback for browsers without AVIF.
// Photos uploaded in the back office have no copies, so they get no sources and load as they are.

/** Candidate lists for a <picture>: `avif` for <source type="image/avif">, `webp` for the <img> itself. */
export type PicSources = { avif: string; webp?: string };

// "2000w" stands for "the original": only the order matters, and no original here is that wide
const FULL = "2000w";

/** A seeded box photo, shown anywhere from a 100px hero print to a phone-wide card. */
export function boxSources(src: string | null | undefined): PicSources | undefined {
  const m = src?.match(/^(\/catalog\/boxes\/[^/?#]+)\.webp$/);
  if (!m) return undefined;
  const b = m[1];
  return { avif: `${b}-240.avif 240w, ${b}-400.avif 400w, ${b}-560.avif 560w, ${b}.avif ${FULL}`, webp: `${b}-400.webp 400w, ${src} ${FULL}` };
}

/** A seeded builder item (240px square originals). */
export function itemSources(src: string | null | undefined): PicSources | undefined {
  const m = src?.match(/^(\/catalog\/items\/[^/?#]+)\.webp$/);
  return m ? { avif: `${m[1]}-160.avif 160w, ${m[1]}.avif 240w` } : undefined;
}

/** The café photo in the hero, the unboxing stage and the packing scene (900px original). */
export const CAFE: PicSources = {
  avif: "/home/cafe-treat-320.avif 320w, /home/cafe-treat-480.avif 480w, /home/cafe-treat-680.avif 680w, /home/cafe-treat.avif 900w",
  webp: "/home/cafe-treat-480.webp 480w, /home/cafe-treat.webp 900w",
};

/** One cut-out lying on the café photo. Cut-outs scale with that photo, so their candidates are described in its
    widths (680 / 900) and they take the same `sizes` as the photo under them. */
export const cutSources = (name: string): PicSources => ({ avif: `/home/cut/${name}-680.avif 680w, /home/cut/${name}.avif 900w` });
