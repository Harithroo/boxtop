// Ordering and delivery: a pinned, full-screen story through the five order states the back office uses
// (pending, confirmed, packed, dispatched, delivered), one animated scene per state, then the order itself.
// A server component: its markup costs no client code. The motion is JourneyMotion's, and the one link that needs a
// script to glide is JumpLink.
import Link from "next/link";
import { getSiteTheme } from "@/lib/settings";
import { JourneyMotion } from "./JourneyMotion";
import { JumpLink } from "./JumpLink";
import { SCENE_DOOR, SCENE_MESSAGE, SCENE_PAY, SCENE_VAN, themed } from "./scenes";
import { STK } from "./stickers";
import { Pic } from "@/components/Pic";
import { CAFE, cutSources } from "@/lib/srcset";

// How wide the packing scene is drawn (home.css .jr-scene): at most 680px and short enough to fit the screen,
// and on phones also no wider than the page minus gutters. The cut-outs scale with the photo, so they share it.
const PK_STAGE = "(max-width: 899px) min(90vw, calc((100vh - 470px) * 1.25)), min(680px, calc((100vh - 290px) * 1.25))";

type Props = {
  wa: string; waDisplay: string; instagram: string; igHandle: string; facebook: string; hours: string; payLine: string;
  proof: string; areas: string[]; quotes: { text: string; by: string }[];
};

const listOf = (a: string[]) => (a.length <= 1 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);

export async function Journey({ wa, waDisplay, instagram, igHandle, facebook, hours, payLine, proof, areas, quotes }: Props) {
  const theme = await getSiteTheme();
  const waHref = wa ? `https://wa.me/${wa}` : "/contact";
  const near = areas.slice(0, 3);
  const [lead, ...notes] = quotes;


  const step = (n: number, status: string, title: string, text: string, meta: string, scene: React.ReactNode) => (
    <article className="jr-step" data-i={n}>
      <div className="jr-text">
        <span className="jr-num">0{n + 1}<small>/ 05</small></span>
        <span className="status">{status}</span>
        <h3>{title}</h3>
        <p>{text}</p>
        <span className="jr-meta">{meta}</span>
      </div>
      {scene}
    </article>
  );
  const drawn = (svg: string) => <div className="jr-scene" dangerouslySetInnerHTML={{ __html: themed(svg, theme).replaceAll("{{wa}}", waDisplay || "WhatsApp") }} />;

  return (
    <JourneyMotion theme={theme}>
      <div className="dr-head">
        <div>
          <p className="eyebrow">Ordering and delivery</p>
          <h2 id="dr-title">From our table to <em>their doorstep</em></h2>
        </div>
        {lead && <blockquote>&ldquo;{lead.text}&rdquo;<cite>{lead.by}</cite></blockquote>}
      </div>

      <div className="journey" id="journey">
        {step(0, "Pending", "Message us", "Pick a box from this page, or describe your own on WhatsApp. Tell us who it's for, your budget and the day it should arrive.", waDisplay ? `WhatsApp · ${waDisplay}` : "WhatsApp", drawn(SCENE_MESSAGE))}
        {step(1, "Confirmed", "Pay your way", `${payLine === "Cash on delivery or bank transfer" ? "Cash on delivery, or a bank transfer with a photo of the slip." : `${payLine}.`} We confirm the price and the delivery day before anything is packed.`, payLine.replace(" or ", " · ").replace(/· b/, "· B"), drawn(SCENE_PAY))}
        {step(2, "Packed", "Packed by hand", "Every item goes in by hand, swaps included. The card gets written, the lid goes on and the ribbon gets tied.", "The café box, from our Instagram",
          <div className="jr-scene pack" role="img" aria-label="Items from a real BOXTOP photo dropping into the box, then a ribbon tied across it">
            <div className="pk-stage" id="pkStage">
              <Pic className="pk-photo" src="/home/cafe-treat.webp" sources={CAFE} sizes={PK_STAGE} alt="" width={900} height={675} loading="lazy" />
              <div className="pk-veil" />
              {STK.map((s) => (
                <Pic key={s.k} className="pk-st" src={`/home/cut/${s.k}.webp`} sources={cutSources(s.k)} sizes={PK_STAGE} alt="" loading="lazy" style={{ left: `${s.l}%`, top: `${s.t}%`, width: `${s.w}%`, height: `${s.h}%` }} />
              ))}
              <span className="pk-band pk-h" /><span className="pk-band pk-v" />
              <svg className="pk-bow" viewBox="0 0 300 190" aria-hidden="true">
                <g fill="#D5136F">
                  <path d="M150 112 C 112 66, 46 38, 30 76 C 16 110, 76 128, 150 112 Z" /><path d="M150 112 C 188 66, 254 38, 270 76 C 284 110, 224 128, 150 112 Z" />
                  <path d="M146 116 L 104 186 L 122 178 L 132 190 L 156 120 Z" /><path d="M154 116 L 196 186 L 178 178 L 168 190 L 144 120 Z" />
                </g>
                <rect x="134" y="98" width="32" height="28" rx="9" fill="#b50f5e" />
              </svg>
              <div className="pk-tag"><span className="str" /><div>For Nimmi<br /><em>happy birthday!</em></div></div>
            </div>
          </div>)}
        {step(3, "Dispatched", "On its way", `Out for delivery around ${listOf(near) || "Colombo"}. We'll message you when it leaves, so you know when to expect the call.`, near.join(" · ") || "Colombo", drawn(SCENE_VAN))}
        {step(4, "Delivered", "At their door", "Handed to the person it's for. The surprise, and the credit, are all yours.", proof || "Delivered by hand", drawn(SCENE_DOOR))}

        <div className="jr-track" aria-hidden="true">
          <div className="jr-line"><i id="jrFill" /></div>
          <ol className="jr-nodes">
            {["Pending", "Confirmed", "Packed", "Dispatched", "Delivered"].map((l, n) => <li key={l} className={n === 0 ? "jr-node is-done" : "jr-node"}><span />{l}</li>)}
          </ol>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="jr-trav" id="jrTrav"><img src="/brand/logo-96.webp" alt="" width={40} height={40} /></div>
        </div>
      </div>

      <div className="or-final">
        <div className="or-copy">
          <p className="eyebrow">Order</p>
          <h2>Tied, tagged, <em>on its way</em></h2>
          <p>Pick a box above or build your own, then message us. We&apos;ll confirm the price and the delivery day before anything is packed.</p>
          <div className="or-cta">
            <a className="btn btn-ribbon" href={waHref} target="_blank" rel="noopener">Order on WhatsApp</a>
            <JumpLink className="btn btn-ghost" to="build">Build a box first</JumpLink>
          </div>
          {notes.length > 0 && (
            <div className="reviews">
              {notes.slice(0, 2).map((r, n) => <figure className="rv" key={n}><blockquote>&ldquo;{r.text}&rdquo;</blockquote><figcaption>{r.by}</figcaption></figure>)}
            </div>
          )}
        </div>
        <div className="or-side">
          <div className="fact">
            <p className="eyebrow">Where we deliver</p>
            <h3>Around Colombo and the Western Province</h3>
            <ul className="areas">{areas.map((a) => <li key={a}>{a}</li>)}</ul>
            <p>Colombo, Gampaha and Kalutara make up the Western Province, home to <b>6.1 million people</b>. We deliver within Sri Lanka; fees and time slots are on the <Link href="/delivery">delivery page</Link>.</p>
            <small>2024 Census of Population and Housing. Ask us about anywhere else.</small>
          </div>
          <div className="fact">
            <p className="eyebrow">Reach us</p>
            <dl className="facts">
              {wa && <><dt>WhatsApp</dt><dd><a href={waHref} target="_blank" rel="noopener">{waDisplay}</a><small>{hours}</small></dd></>}
              {/* named in full: read aloud, the bare handle is the same word as the BOXTOP home link */}
              {instagram && <><dt>Instagram</dt><dd><a href={instagram} target="_blank" rel="noopener" aria-label={`Instagram ${igHandle}`}>{igHandle}</a><small>Every box we pack, as it leaves</small></dd></>}
              {facebook && <><dt>Facebook</dt><dd><a href={facebook} target="_blank" rel="noopener">BOX TOP</a><small>{proof}</small></dd></>}
              <dt>Payment</dt><dd>{payLine}</dd>
            </dl>
          </div>
        </div>
      </div>
    </JourneyMotion>
  );
}
