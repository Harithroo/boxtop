// The drawn scenes of the delivery story, kept as SVG markup so GSAP can animate their parts by class.
// Lifted from the design prototype. "{{wa}}" is replaced with the store's WhatsApp number when rendered.

export const SCENE_MESSAGE = `<svg class="sc1" viewBox="0 0 600 480" role="img" aria-label="A WhatsApp chat: a customer asks BOXTOP for a birthday box and gets a photo and a price">
  <defs>
    <clipPath id="c1scr"><rect x="196" y="38" width="208" height="414" rx="26"/></clipPath>
    <clipPath id="c1av"><circle cx="232" cy="69" r="15"/></clipPath>
    <clipPath id="c1img"><rect x="216" y="195" width="130" height="92" rx="8"/></clipPath>
  </defs>
  <ellipse cx="300" cy="250" rx="236" ry="206" fill="#CBB7E0" opacity=".55"/>
  <g class="floaty"><path d="M96 150c-8-14-30-10-28 6 2 12 28 26 28 26s26-14 28-26c2-16-20-20-28-6z" fill="#D5136F"/></g>
  <g class="floaty" style="animation-delay:-1.4s"><path d="M486 340c-6-10-22-7-20 4 1 9 20 19 20 19s19-10 20-19c2-11-14-14-20-4z" fill="#5B3A87"/></g>
  <g class="floaty" style="animation-delay:-.7s"><rect x="76" y="318" width="44" height="36" rx="5" fill="#5B3A87"/><rect x="72" y="310" width="52" height="12" rx="3" fill="#6B47A0"/><rect x="94" y="310" width="8" height="44" fill="#D5136F"/></g>
  <g class="s1-phone">
    <rect x="184" y="26" width="232" height="438" rx="38" fill="#3B2E22"/>
    <rect x="196" y="38" width="208" height="414" rx="26" fill="#F4EEF8"/>
    <g clip-path="url(#c1scr)">
      <rect x="196" y="38" width="208" height="62" fill="#5B3A87"/>
      <image href="/brand/logo.jpg" x="217" y="54" width="30" height="30" clip-path="url(#c1av)"/>
      <text x="256" y="68" fill="#fff" font-size="13" font-weight="600" letter-spacing="1.5">BOXTOP</text>
      <text x="256" y="84" fill="#CBB7E0" font-size="10" font-weight="500">online</text>
      <g class="s1-b1"><rect x="258" y="112" width="134" height="48" rx="13" fill="#D5136F"/><text fill="#fff" font-size="11" font-weight="500"><tspan x="270" y="132">Hi! A box for my</tspan><tspan x="270" y="148">sister's birthday?</tspan></text></g>
      <g class="s1-t1 typing"><rect x="208" y="172" width="50" height="26" rx="13" fill="#fff"/><circle cx="222" cy="185" r="3.5" fill="#6B5D48"/><circle cx="233" cy="185" r="3.5" fill="#6B5D48"/><circle cx="244" cy="185" r="3.5" fill="#6B5D48"/></g>
      <g class="s1-b2"><rect x="208" y="172" width="146" height="124" rx="13" fill="#fff"/><text x="218" y="188" fill="#3B2E22" font-size="10.5" font-weight="500">Here's one we packed:</text><image href="/home/birthday-mug.webp" x="216" y="195" width="130" height="92" preserveAspectRatio="xMidYMid slice" clip-path="url(#c1img)"/></g>
      <g class="s1-b3"><rect x="246" y="306" width="146" height="48" rx="13" fill="#D5136F"/><text fill="#fff" font-size="11" font-weight="500"><tspan x="258" y="326">Love it. Swap the</tspan><tspan x="258" y="342">spray for body mist?</tspan></text></g>
      <g class="s1-t2 typing"><rect x="208" y="364" width="50" height="26" rx="13" fill="#fff"/><circle cx="222" cy="377" r="3.5" fill="#6B5D48"/><circle cx="233" cy="377" r="3.5" fill="#6B5D48"/><circle cx="244" cy="377" r="3.5" fill="#6B5D48"/></g>
      <g class="s1-b4"><rect x="208" y="364" width="156" height="50" rx="13" fill="#fff"/><text fill="#3B2E22" font-size="11" font-weight="500"><tspan x="220" y="384">Done! Rs 5,600,</tspan><tspan x="220" y="400">delivered Saturday.</tspan></text></g>
      <rect x="206" y="424" width="188" height="20" rx="10" fill="#fff"/>
    </g>
    <rect x="262" y="44" width="76" height="9" rx="4.5" fill="#3B2E22"/>
  </g>
  <g class="s1-tag"><rect x="428" y="92" width="152" height="44" rx="22" fill="#fff"/><circle class="pulse" cx="450" cy="114" r="8" fill="#D5136F" opacity=".5"/><circle cx="450" cy="114" r="6" fill="#D5136F"/><text x="466" y="119" font-size="13" font-weight="600" fill="#5B3A87">{{wa}}</text></g>
</svg>`;

export const SCENE_PAY = `<svg class="sc2" viewBox="0 0 600 480" role="img" aria-label="Cash notes beside a bank transfer slip being photographed and stamped confirmed">
  <ellipse cx="300" cy="246" rx="250" ry="205" fill="#CBB7E0" opacity=".5"/>
  <g class="s2-notes">
    <g class="s2-n"><rect x="62" y="196" width="180" height="96" rx="10" fill="#CBB7E0"/><rect x="70" y="204" width="164" height="80" rx="6" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/><circle cx="110" cy="244" r="22" fill="#5B3A87"/><text x="110" y="249" text-anchor="middle" fill="#fff" font-size="13" font-weight="600">Rs</text><rect x="146" y="228" width="74" height="8" rx="4" fill="#fff" opacity=".75"/><rect x="146" y="246" width="50" height="8" rx="4" fill="#fff" opacity=".55"/></g>
    <g class="s2-n"><rect x="62" y="196" width="180" height="96" rx="10" fill="#EFE6F7"/><rect x="70" y="204" width="164" height="80" rx="6" fill="none" stroke="#CBB7E0" stroke-width="2"/><circle cx="110" cy="244" r="22" fill="#D5136F"/><text x="110" y="249" text-anchor="middle" fill="#fff" font-size="13" font-weight="600">Rs</text><rect x="146" y="228" width="74" height="8" rx="4" fill="#CBB7E0"/><rect x="146" y="246" width="50" height="8" rx="4" fill="#CBB7E0" opacity=".7"/></g>
    <g class="s2-n"><rect x="62" y="196" width="180" height="96" rx="10" fill="#5B3A87"/><rect x="70" y="204" width="164" height="80" rx="6" fill="none" stroke="#CBB7E0" stroke-width="2" opacity=".7"/><circle cx="110" cy="244" r="22" fill="#CBB7E0"/><text x="110" y="249" text-anchor="middle" fill="#5B3A87" font-size="13" font-weight="600">Rs</text><rect x="146" y="228" width="74" height="8" rx="4" fill="#CBB7E0" opacity=".8"/><rect x="146" y="246" width="50" height="8" rx="4" fill="#CBB7E0" opacity=".5"/></g>
  </g>
  <text x="152" y="352" text-anchor="middle" font-size="15" font-weight="600" fill="#3B2E22">Cash on delivery</text>
  <g class="s2-or"><circle cx="292" cy="246" r="24" fill="#5B3A87"/><text x="292" y="252" text-anchor="middle" fill="#fff" font-size="15" font-weight="600">or</text></g>
  <g class="s2-slip">
    <path d="M352 96 H498 V318 L488.88 328 L479.75 318 L470.62 328 L461.50 318 L452.38 328 L443.25 318 L434.12 328 L425.00 318 L415.88 328 L406.75 318 L397.62 328 L388.50 318 L379.38 328 L370.25 318 L361.12 328 L352.00 318 Z" fill="#fff"/>
    <text x="368" y="124" font-size="11" font-weight="600" fill="#5B3A87" letter-spacing="1.5">BANK TRANSFER</text>
    <rect x="368" y="136" width="114" height="2" fill="#3B2E22" opacity=".15"/>
    <text x="368" y="160" font-size="10.5" fill="#6B5D48">To</text><text x="482" y="160" text-anchor="end" font-size="10.5" font-weight="600" fill="#3B2E22">BOXTOP</text>
    <text x="368" y="180" font-size="10.5" fill="#6B5D48">Ref</text><text x="482" y="180" text-anchor="end" font-size="10.5" font-weight="600" fill="#3B2E22">Teddy box</text>
    <text x="368" y="208" font-size="10.5" fill="#6B5D48">Amount</text>
    <text x="368" y="236" font-size="24" font-weight="600" fill="#3B2E22">Rs 5,600</text>
    <g fill="#3B2E22"><rect x="368.0" y="262" width="2" height="34"/><rect x="372.0" y="262" width="1.5" height="34"/><rect x="376.5" y="262" width="4" height="34"/><rect x="382.5" y="262" width="2" height="34"/><rect x="386.0" y="262" width="1.5" height="34"/><rect x="389.0" y="262" width="4" height="34"/><rect x="396.0" y="262" width="3" height="34"/><rect x="400.5" y="262" width="2" height="34"/><rect x="405.5" y="262" width="3" height="34"/><rect x="410.5" y="262" width="2" height="34"/><rect x="414.0" y="262" width="3" height="34"/><rect x="418.5" y="262" width="1.5" height="34"/><rect x="423.0" y="262" width="3" height="34"/><rect x="428.0" y="262" width="2" height="34"/><rect x="431.5" y="262" width="3" height="34"/><rect x="436.5" y="262" width="3" height="34"/><rect x="441.0" y="262" width="3" height="34"/><rect x="447.0" y="262" width="4" height="34"/><rect x="454.0" y="262" width="2" height="34"/><rect x="457.5" y="262" width="2" height="34"/><rect x="461.5" y="262" width="3" height="34"/><rect x="466.0" y="262" width="3" height="34"/><rect x="470.5" y="262" width="3" height="34"/><rect x="476.5" y="262" width="3" height="34"/></g>
  </g>
  <g class="s2-corners" stroke="#5B3A87" stroke-width="5" fill="none" stroke-linecap="round"><path d="M336 112 V84 H364"/><path d="M486 84 H514 V112"/><path d="M514 312 V340 H486"/><path d="M364 340 H336 V312"/></g>
  <rect class="s2-flash" x="330" y="78" width="190" height="268" rx="8" fill="#fff" opacity="0"/>
  <g class="s2-stamp"><g transform="rotate(-10 425 272)"><rect x="343" y="247" width="164" height="50" rx="10" fill="#fff" fill-opacity=".7" stroke="#D5136F" stroke-width="4"/><text x="425" y="280" text-anchor="middle" font-size="20" font-weight="600" fill="#D5136F" letter-spacing="1.5">CONFIRMED</text></g></g>
  <text x="425" y="384" text-anchor="middle" font-size="15" font-weight="600" fill="#3B2E22">Bank transfer + slip photo</text>
</svg>`;

export const SCENE_VAN = `<svg class="sc4" viewBox="0 0 600 480" role="img" aria-label="A purple BOXTOP delivery van driving past palm trees and the Colombo skyline with the Lotus Tower">
  <defs>
    <clipPath id="c4win"><rect x="0" y="20" width="600" height="440" rx="28"/></clipPath>
    <linearGradient id="g4sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9DEF4"/><stop offset="1" stop-color="#FFFDF7"/></linearGradient>
    <clipPath id="c4logo"><rect x="18" y="18" width="78" height="78" rx="10"/></clipPath>
    <g id="s4sky">
      <g fill="#CBB7E0"><rect x="14" y="298" width="40" height="76"/><rect x="58" y="266" width="34" height="108"/><rect x="96" y="314" width="52" height="60"/><rect x="154" y="246" width="30" height="128"/><rect x="190" y="290" width="44" height="84"/><rect x="246" y="320" width="62" height="54"/><rect x="316" y="278" width="36" height="96"/><rect x="468" y="298" width="44" height="76"/><rect x="518" y="258" width="32" height="116"/><rect x="556" y="308" width="40" height="66"/></g>
      <g fill="#A98FCB"><rect x="405" y="176" width="10" height="198"/><path d="M386 192 Q410 150 434 192 Z"/><ellipse cx="410" cy="194" rx="25" ry="9"/><rect x="408.5" y="112" width="3" height="66"/><circle cx="410" cy="110" r="4"/></g>
    </g>
    <g id="s4palm"><path d="M0 0 Q7 -52 -4 -104" stroke="#7A5C3F" stroke-width="7" fill="none" stroke-linecap="round"/><g fill="#5B3A87"><path d="M-4 -104 q-36 -14 -60 8 q30 -4 60 -8z"/><path d="M-4 -104 q36 -16 62 4 q-30 -2 -62 -4z"/><path d="M-4 -104 q-22 -30 -52 -28 q24 10 52 28z"/><path d="M-4 -104 q20 -32 54 -28 q-28 10 -54 28z"/><path d="M-4 -104 q-4 -32 10 -48 q-4 24 -10 48z"/></g></g>
  </defs>
  <g clip-path="url(#c4win)">
    <rect x="0" y="20" width="600" height="440" fill="url(#g4sky)"/>
    <circle cx="470" cy="112" r="46" fill="#D5136F" opacity=".16"/>
    <g class="s4-far"><use href="#s4sky"/><use href="#s4sky" x="600"/></g>
    <g class="s4-mid"><use href="#s4palm" x="70" y="378"/><use href="#s4palm" x="350" y="380"/><use href="#s4palm" x="530" y="376"/><use href="#s4palm" x="670" y="378"/><use href="#s4palm" x="950" y="380"/><use href="#s4palm" x="1130" y="376"/></g>
    <rect x="0" y="372" width="600" height="88" fill="#3B2E22"/>
    <rect x="0" y="372" width="600" height="6" fill="#6B5D48"/>
    <line class="s4-dash" x1="0" y1="424" x2="620" y2="424" stroke="#F5EFE3" stroke-width="5" stroke-dasharray="34 26"/>
    <g transform="translate(140 236)">
      <g class="s4-van">
        <ellipse cx="156" cy="154" rx="150" ry="9" fill="#000" opacity=".28"/>
        <g class="s4-speed" stroke="#5B3A87" stroke-width="5" stroke-linecap="round" stroke-dasharray="26 16" opacity=".55"><line x1="-80" y1="26" x2="-14" y2="26"/><line x1="-100" y1="58" x2="-14" y2="58"/><line x1="-70" y1="90" x2="-14" y2="90"/></g>
        <g class="van-bob">
          <rect x="0" y="0" width="210" height="124" rx="12" fill="#5B3A87"/>
          <rect x="0" y="100" width="210" height="10" fill="#D5136F"/>
          <path d="M210 30 H262 Q286 30 294 56 L306 92 Q310 104 310 114 V124 H210 Z" fill="#6B47A0"/>
          <path d="M222 42 H258 Q274 42 280 58 L290 84 H222 Z" fill="#EFE6F7"/>
          <rect x="286" y="60" width="10" height="14" rx="3" fill="#45296A"/>
          <path d="M246 92 V118" stroke="#000" stroke-opacity=".18" stroke-width="2"/>
          <rect x="252" y="96" width="14" height="4" rx="2" fill="#CBB7E0"/>
          <rect x="298" y="98" width="12" height="10" rx="3" fill="#F2D488"/>
          <rect x="200" y="120" width="118" height="10" rx="5" fill="#3B2E22"/>
          <rect x="16" y="16" width="82" height="82" rx="12" fill="#fff"/>
          <image href="/brand/logo.jpg" x="18" y="18" width="78" height="78" clip-path="url(#c4logo)"/>
          <text x="112" y="50" fill="#fff" font-size="20" font-weight="600" letter-spacing="2">BOXTOP</text>
          <text x="112" y="70" fill="#CBB7E0" font-size="9.5" font-weight="500">packed by hand</text>
          <text x="112" y="88" fill="#fff" font-size="10" font-weight="600">box-top.lk</text>
        </g>
        <g transform="translate(58 130)"><g class="wheel"><circle r="24" fill="#3B2E22"/><circle r="12" fill="#CBB7E0"/><path d="M-12 0 H12 M0 -12 V12" stroke="#5B3A87" stroke-width="3"/></g></g>
        <g transform="translate(252 130)"><g class="wheel"><circle r="24" fill="#3B2E22"/><circle r="12" fill="#CBB7E0"/><path d="M-12 0 H12 M0 -12 V12" stroke="#5B3A87" stroke-width="3"/></g></g>
      </g>
    </g>
    <g class="s4-card"><rect x="32" y="50" width="222" height="58" rx="29" fill="#fff"/><circle class="pulse" cx="62" cy="79" r="9" fill="#D5136F" opacity=".5"/><circle cx="62" cy="79" r="7" fill="#D5136F"/><text x="80" y="75" font-size="13" font-weight="600" fill="#3B2E22">Out for delivery</text><text x="80" y="93" font-size="10.5" font-weight="500" fill="#6B5D48">Colombo · Gampaha · Kalutara</text></g>
  </g>
</svg>`;

export const SCENE_DOOR = `<svg class="sc5" viewBox="0 0 600 480" role="img" aria-label="A BOXTOP gift box on a doormat as the front door opens and confetti bursts">
  <defs><linearGradient id="g5in" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4DA"/><stop offset="1" stop-color="#F6D7A6"/></linearGradient></defs>
  <rect x="40" y="24" width="520" height="390" rx="22" fill="#E8DAC2"/>
  <g fill="#3B2E22" opacity=".05"><rect x="64" y="236" width="44" height="14" rx="2"/><rect x="112" y="252" width="44" height="14" rx="2"/><rect x="440" y="208" width="44" height="14" rx="2"/><rect x="488" y="224" width="44" height="14" rx="2"/><rect x="70" y="60" width="44" height="14" rx="2"/><rect x="470" y="300" width="44" height="14" rx="2"/></g>
  <rect x="80" y="92" width="100" height="112" rx="8" fill="#EFE6F7" stroke="#fff" stroke-width="6"/><path d="M130 92 V204 M80 148 H180" stroke="#fff" stroke-width="5"/>
  <circle class="s5-lamp" cx="200" cy="138" r="26" fill="#F2D488" opacity=".35"/><rect x="194" y="124" width="12" height="22" rx="4" fill="#45296A"/>
  <rect x="226" y="74" width="148" height="340" rx="6" fill="#45296A"/>
  <rect x="236" y="84" width="128" height="330" fill="url(#g5in)"/>
  <g class="s5-door"><rect x="236" y="84" width="128" height="330" fill="#5B3A87"/><rect x="252" y="104" width="96" height="122" rx="6" fill="none" stroke="#CBB7E0" stroke-width="3" opacity=".6"/><rect x="252" y="246" width="96" height="146" rx="6" fill="none" stroke="#CBB7E0" stroke-width="3" opacity=".6"/><circle cx="346" cy="240" r="7" fill="#F2D488"/></g>
  <rect x="394" y="108" width="62" height="32" rx="6" fill="#fff"/><text x="425" y="129" text-anchor="middle" font-size="12" font-weight="600" fill="#5B3A87">No. 12</text>
  <rect x="0" y="414" width="600" height="56" fill="#D9C6A5"/>
  <rect x="206" y="408" width="188" height="12" rx="4" fill="#CDB78F"/>
  <rect x="244" y="410" width="112" height="14" rx="4" fill="#B98F62"/><text x="300" y="421" text-anchor="middle" font-size="8.5" font-weight="600" letter-spacing="2" fill="#FFFDF7">HELLO</text>
  <g fill="#6E8B5E"><ellipse cx="138" cy="362" rx="11" ry="30" transform="rotate(-24 138 362)"/><ellipse cx="160" cy="356" rx="11" ry="32" transform="rotate(14 160 356)"/><ellipse cx="149" cy="350" rx="9" ry="30"/><ellipse cx="452" cy="362" rx="11" ry="30" transform="rotate(-18 452 362)"/><ellipse cx="474" cy="356" rx="11" ry="32" transform="rotate(20 474 356)"/><ellipse cx="463" cy="348" rx="9" ry="30"/></g>
  <path d="M126 414 L132 380 H168 L174 414 Z" fill="#B07A55"/><path d="M440 414 L446 380 H482 L488 414 Z" fill="#B07A55"/>
  <g class="s5-gift">
    <rect x="266" y="352" width="68" height="58" rx="4" fill="#22388F"/>
    <rect x="260" y="342" width="80" height="16" rx="3" fill="#2D47A6"/>
    <rect x="294" y="342" width="12" height="68" fill="#D5136F"/>
    <path d="M300 340 C 286 322, 264 322, 270 336 C 274 344, 292 344, 300 340 Z M300 340 C 314 322, 336 322, 330 336 C 326 344, 308 344, 300 340 Z" fill="#D5136F"/>
    <circle cx="300" cy="340" r="5" fill="#b50f5e"/>
    <image href="/brand/logo.jpg" x="271" y="366" width="18" height="18"/>
  </g>
  <g class="s5-conf"><circle cx="300" cy="336" r="4" fill="#D5136F" opacity="0"/><rect x="296" y="330" width="8" height="13" rx="1.5" fill="#5B3A87" opacity="0"/><rect x="296" y="330" width="10" height="16" rx="1.5" fill="#CBB7E0" opacity="0"/><circle cx="300" cy="336" r="4" fill="#45296A" opacity="0"/><rect x="296" y="330" width="6" height="13" rx="1.5" fill="#FFFDF7" opacity="0"/><rect x="296" y="330" width="8" height="16" rx="1.5" fill="#D5136F" opacity="0"/><circle cx="300" cy="336" r="4" fill="#5B3A87" opacity="0"/><rect x="296" y="330" width="12" height="13" rx="1.5" fill="#CBB7E0" opacity="0"/><rect x="296" y="330" width="6" height="16" rx="1.5" fill="#45296A" opacity="0"/><circle cx="300" cy="336" r="4" fill="#FFFDF7" opacity="0"/><rect x="296" y="330" width="10" height="13" rx="1.5" fill="#D5136F" opacity="0"/><rect x="296" y="330" width="12" height="16" rx="1.5" fill="#5B3A87" opacity="0"/><circle cx="300" cy="336" r="4" fill="#CBB7E0" opacity="0"/><rect x="296" y="330" width="8" height="13" rx="1.5" fill="#45296A" opacity="0"/><rect x="296" y="330" width="10" height="16" rx="1.5" fill="#FFFDF7" opacity="0"/><circle cx="300" cy="336" r="4" fill="#D5136F" opacity="0"/><rect x="296" y="330" width="6" height="13" rx="1.5" fill="#5B3A87" opacity="0"/><rect x="296" y="330" width="8" height="16" rx="1.5" fill="#CBB7E0" opacity="0"/><circle cx="300" cy="336" r="4" fill="#45296A" opacity="0"/><rect x="296" y="330" width="12" height="13" rx="1.5" fill="#FFFDF7" opacity="0"/><rect x="296" y="330" width="6" height="16" rx="1.5" fill="#D5136F" opacity="0"/><circle cx="300" cy="336" r="4" fill="#5B3A87" opacity="0"/><rect x="296" y="330" width="10" height="13" rx="1.5" fill="#CBB7E0" opacity="0"/><rect x="296" y="330" width="12" height="16" rx="1.5" fill="#45296A" opacity="0"/><circle cx="300" cy="336" r="4" fill="#FFFDF7" opacity="0"/><rect x="296" y="330" width="8" height="13" rx="1.5" fill="#D5136F" opacity="0"/><rect x="296" y="330" width="10" height="16" rx="1.5" fill="#5B3A87" opacity="0"/><circle cx="300" cy="336" r="4" fill="#CBB7E0" opacity="0"/><rect x="296" y="330" width="6" height="13" rx="1.5" fill="#45296A" opacity="0"/><rect x="296" y="330" width="8" height="16" rx="1.5" fill="#FFFDF7" opacity="0"/></g>
  <g class="s5-badge"><rect x="380" y="40" width="160" height="50" rx="25" fill="#fff"/><circle cx="407" cy="65" r="15" fill="#D5136F"/><path d="M400 65 l5 5 9 -10" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><text x="430" y="71" font-size="16" font-weight="600" fill="#3B2E22">Delivered</text></g>
  <g class="s5-quote"><rect x="54" y="226" width="170" height="80" rx="16" fill="#fff"/><path d="M196 304 l16 18 -2 -20z" fill="#fff"/><text font-size="13" font-weight="500" font-style="italic" fill="#3B2E22"><tspan x="70" y="254">"Thank you so</tspan><tspan x="70" y="272">much Box Top"</tspan></text><text x="70" y="293" font-size="9" font-weight="600" letter-spacing="1" fill="#5B3A87">CHANAKA, ON FACEBOOK</text></g>
</svg>`;

// The scenes were drawn for the light theme. On the dark site the halo behind each scene is violet, the
// captions are cream and the confetti is pink, violet and gold; nothing else changes.
const CONF_DARK: Record<string, string> = { "#D5136F": "#ff3d8b", "#5B3A87": "#7b5bff", "#45296A": "#f2c46d" };
export function themed(svg: string, theme: "light" | "dark") {
  if (theme === "light") return svg;
  return svg
    .replace(/(<ellipse cx="300" cy="2(?:50|46)" rx="2(?:36|50)" ry="20[56]" fill=")#CBB7E0"/g, '$1#3f2894"')
    .replace(/fill="#3B2E22">(Cash on delivery|Bank transfer \+ slip photo)<\/text>/g, 'fill="#f8effb">$1</text>')
    .replace(/<g class="s5-conf">.*?<\/g>/, (g) => g.replace(/#(D5136F|5B3A87|45296A)/g, (c) => CONF_DARK[c]));
}
