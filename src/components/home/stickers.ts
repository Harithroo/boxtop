// The nine stickers cut from the café box photo (public/home/cafe-treat.webp, 900×675).
// l/t/w/h place each cut-out exactly over the photo, in % of it. bl/bt/bw/bh place its shadowed twin.
// tx/ty are where it floats to when the box unpacks, in photo pixels; r and s are its tilt and scale there.
// g is the group it lifts out with: 0 the sticker, 1 made in Sri Lanka, 2 everyone's favourites.
export type Sticker = {
  k: string; g: 0 | 1 | 2; l: number; t: number; w: number; h: number; cx: number; cy: number;
  bl: number; bt: number; bw: number; bh: number; tx: number; ty: number; r: number; s: number;
  side: "r" | "l" | "t" | "b"; name: string; note: string; local?: boolean;
};

export const STK: Sticker[] = [
  { k: "sticker", g: 0, l: 11.333, t: 13.926, w: 11.444, h: 13.63, cx: 153.5, cy: 140, bl: -25.243, bt: -28.261, bw: 150.485, bh: 156.522, tx: -60, ty: 60, r: -10, s: 1.25, side: "r", name: "BOXTOP sticker", note: "On the lid of every box." },
  { k: "hope", g: 1, l: 22, t: 17.63, w: 36.333, h: 63.852, cx: 361.5, cy: 334.5, bl: -7.951, bt: -6.032, bw: 115.902, bh: 112.065, tx: 90, ty: 420, r: -7, s: 0.82, side: "t", name: "Hope Sesame Cookies", note: "Baked by differently-abled bakers at CBL's Sahan Sevana factory in Kaduwela.", local: true },
  { k: "soul", g: 1, l: 45.556, t: 23.704, w: 17.778, h: 39.111, cx: 490, cy: 292, bl: -16.25, bt: -9.848, bw: 132.5, bh: 119.697, tx: 370, ty: 60, r: 9, s: 0.95, side: "r", name: "Soul Coffee cold brew", note: "100% Arabica from Sri Lanka's highlands. Soul started roasting in 2014.", local: true },
  { k: "dilmah", g: 1, l: 69.556, t: 18.963, w: 20.444, h: 33.481, cx: 718, cy: 241, bl: -14.13, bt: -11.504, bw: 128.261, bh: 123.009, tx: 960, ty: 120, r: 8, s: 0.95, side: "b", name: "Dilmah peach iced tea", note: "Brewed from tea picked at Dilmah's own Rilhena garden.", local: true },
  { k: "richlife", g: 1, l: 65.889, t: 55.556, w: 19.778, h: 22.074, cx: 682, cy: 449.5, bl: -14.607, bt: -17.45, bw: 129.213, bh: 134.899, tx: 840, ty: 600, r: -6, s: 1, side: "r", name: "Richlife cheese spread", note: "From a Sri Lankan dairy founded in 1995.", local: true },
  { k: "ferrero", g: 2, l: 54.889, t: 13.037, w: 18.333, h: 12, cx: 576.5, cy: 128.5, bl: -15.758, bt: -32.099, bw: 131.515, bh: 164.198, tx: 600, ty: -40, r: -6, s: 1.1, side: "r", name: "Ferrero Rocher", note: "Three, wrapped in gold." },
  { k: "marsh", g: 2, l: 54.778, t: 23.407, w: 28.556, h: 36.444, cx: 621.5, cy: 281, bl: -10.117, bt: -10.569, bw: 120.233, bh: 121.138, tx: 640, ty: 300, r: 4, s: 1.05, side: "l", name: "Marshmallows", note: "Pink and white, for sharing." },
  { k: "kitkat", g: 2, l: 83.333, t: 43.556, w: 16.667, h: 23.407, cx: 825, cy: 373, bl: -17.333, bt: -16.456, bw: 134.667, bh: 132.911, tx: 1000, ty: 420, r: 12, s: 1, side: "r", name: "KitKat", note: "The four-finger classic." },
  { k: "bueno", g: 2, l: 39.778, t: 67.111, w: 28.889, h: 26.222, cx: 488, cy: 541.5, bl: -10, bt: -14.689, bw: 120, bh: 129.379, tx: 380, ty: 640, r: 4, s: 1, side: "r", name: "Kinder Bueno", note: "Two bars to a pack." },
];

/** When each group starts lifting (0–1 through the scroll) and the gap between its stickers. */
export const GROUPS = [{ at: 0.04, stg: 0 }, { at: 0.17, stg: 0.045 }, { at: 0.43, stg: 0.04 }];

/** The media queries every pinned section branches on. */
export const MM = { desk: "(min-width: 900px)", phone: "(max-width: 899px)", motion: "(prefers-reduced-motion: no-preference)" };
