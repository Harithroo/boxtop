// A tiny message board between the store header and the home page sections.
// The header lives in the layout and the sections in the page, so they can't pass props to each other:
// the header posts "start the builder from this box", and the builder, if it is on screen, picks it up.

type Events = {
  preset: number; // box id: load this box into the builder
  occasion: string; // occasion label: set the builder's occasion
  chapter: string; // collection slug: jump the box strip to this shelf
  occ: string; // occasion slug: turn the year dial to it
  replay: true; // play the intro again
};
type Handler<K extends keyof Events> = (value: Events[K]) => void;

const handlers: { [K in keyof Events]?: Set<Handler<K>> } = {};

export const homeBus = {
  /** Listen. Returns the function that stops listening. */
  on<K extends keyof Events>(event: K, fn: Handler<K>) {
    const set = (handlers[event] ??= new Set() as never) as Set<Handler<K>>;
    set.add(fn);
    return () => { set.delete(fn); };
  },
  /** Post. True when somebody was listening (so the caller knows the home page handled it). */
  emit<K extends keyof Events>(event: K, value: Events[K]) {
    const set = handlers[event] as Set<Handler<K>> | undefined;
    if (!set?.size) return false;
    set.forEach((fn) => fn(value));
    return true;
  },
};
