// Shared by sync-shell.mjs and check-shell.mjs.
// Each variant maps a partial marker name to the partial file that fills it (null = marker is emptied / not required).
export const MARKERS = ['head', 'styles', 'sprite', 'header', 'footer', 'scripts'];

export const VARIANTS = {
  full:     { head: 'head', styles: 'styles', sprite: 'sprite', header: 'header',          footer: 'footer', scripts: 'scripts' },
  checkout: { head: 'head', styles: 'styles', sprite: 'sprite', header: 'header-checkout', footer: null,     scripts: 'scripts' },
  error:    { head: 'head', styles: 'styles', sprite: 'sprite', header: 'header-error',    footer: null,     scripts: null },
  none:     { head: 'head', styles: 'styles', sprite: null,     header: null,              footer: null,     scripts: null },
};

export const markerRe = (name) =>
  new RegExp(`<!-- partial: ${name} -->[\\s\\S]*?<!-- /partial: ${name} -->`);
