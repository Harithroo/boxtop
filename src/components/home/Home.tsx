// The home page: the sections in order. A server component; each section owns its own animation and cleans it up,
// and HomeShell provides what they share on the client.
import type { HomeBox, HomeChapter, HomeItem, HomeOccasion, HomeStyle } from "@/lib/home-data";
import { Abroad } from "./Abroad";
import { Builder } from "./Builder";
import { Collection } from "./Collection";
import { Hero, type HeroCard } from "./Hero";
import { Journey } from "./Journey";
import { HomeShell } from "./HomeShell";
import { NOSCRIPT_CSS } from "./noscript-css";
import { Unbox } from "./Unbox";
import { YearDial } from "./YearDial";

export type HomeProps = {
  today: string; wa: string; waDisplay: string; instagram: string; igHandle: string; facebook: string; hours: string; payLine: string;
  proof: string; areas: string[]; quotes: { text: string; by: string }[]; abroad: boolean; fromPrice: string | null;
  hero: [HeroCard, HeroCard, HeroCard];
  chapters: HomeChapter[]; shelved: HomeBox[]; boxes: HomeBox[]; occasions: HomeOccasion[]; occasionNames: string[];
  items: HomeItem[]; styles: HomeStyle[]; starter: number[];
};

export function Home(p: HomeProps) {
  const hasShelf = p.shelved.length > 0, hasYear = p.occasions.length > 0;
  const secs = ["unbox", ...(hasShelf ? ["collection"] : []), "build", ...(hasYear ? ["year"] : []), ...(p.abroad ? ["abroad"] : []), "order"];

  return (
    <HomeShell secs={secs} boxes={p.boxes.map((b) => ({ id: b.id, slug: b.slug }))}>
      <Hero cards={p.hero} proof={p.proof} fromPrice={p.fromPrice} next={p.occasions[0] ? { name: p.occasions[0].name, when: p.occasions[0].when } : null} />
      <Unbox />
      {hasShelf && <Collection chapters={p.chapters} boxes={p.shelved} />}
      <Builder styles={p.styles} items={p.items} occasions={p.occasionNames} boxes={p.boxes} starter={p.starter} wa={p.wa} waDisplay={p.waDisplay} />
      {hasYear && <YearDial occasions={p.occasions} boxes={p.boxes} today={p.today} />}
      {p.abroad && <Abroad wa={p.wa} />}
      <Journey wa={p.wa} waDisplay={p.waDisplay} instagram={p.instagram} igHandle={p.igHandle} facebook={p.facebook} hours={p.hours} payLine={p.payLine} proof={p.proof} areas={p.areas} quotes={p.quotes} />
      <noscript><style dangerouslySetInnerHTML={{ __html: NOSCRIPT_CSS }} /></noscript>
    </HomeShell>
  );
}
