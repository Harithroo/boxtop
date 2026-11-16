/* eslint-disable @next/next/no-img-element */
import type { PicSources } from "@/lib/srcset";

type Props = React.ImgHTMLAttributes<HTMLImageElement> & { alt: string; sources?: PicSources };

/** An <img>, wrapped in a <picture> that offers AVIF first when the photo has AVIF copies (src/lib/srcset.ts).
    Styles and scripts keep targeting the <img>: a <picture> is an inline box, so the image still sizes and
    positions against the same parent it would without it. */
export function Pic({ sources, srcSet, sizes, alt, ...img }: Props) {
  if (!sources) return <img srcSet={srcSet} sizes={sizes} alt={alt} {...img} />;
  return (
    <picture>
      <source type="image/avif" srcSet={sources.avif} sizes={sizes} />
      <img srcSet={sources.webp ?? srcSet} sizes={sizes} alt={alt} {...img} />
    </picture>
  );
}
