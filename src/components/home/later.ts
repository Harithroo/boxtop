// Setup that can wait for a quiet moment, so the work done while the page first comes alive stays short.
// Jobs run one per idle slice, in the order they were queued.
type Job = () => void;

const queue: Job[] = [];
let waiting = false;

function pump() {
  waiting = false;
  queue.shift()?.();
  if (queue.length) wait();
}
function wait() {
  if (waiting) return;
  waiting = true;
  // Safari has no requestIdleCallback: a short timeout is close enough there
  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(pump, { timeout: 2000 });
  else window.setTimeout(pump, 80);
}

/** Queue a job for an idle moment. Returns a function that takes it back off the queue. */
export function later(job: Job): () => void {
  queue.push(job);
  wait();
  return () => { const i = queue.indexOf(job); if (i > -1) queue.splice(i, 1); };
}

/** Run a job in an idle moment, or at once if `near` is about to scroll into view, whichever comes first. */
export function soon(near: Element, job: Job): () => void {
  let done = false;
  const stop = () => { done = true; io.disconnect(); drop(); };
  const run = () => { if (done) return; stop(); job(); };
  // "about to": within one screen of the viewport, above or below
  const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) run(); }, { rootMargin: "100% 0px" });
  const drop = later(run);
  io.observe(near);
  return stop;
}
