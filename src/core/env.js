// env.js — environment flags read once. The feel slices branch on
// prefers-reduced-motion (fewer particles, calmer FX); honor it everywhere.

// Live binding: importers that use `reduce` directly see updates after
// setReduce() (ESM live-binding semantics), so the in-game Reduced Motion
// toggle takes effect without a reload. Defaults to the OS preference.
export let reduce =
  typeof matchMedia !== 'undefined' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches;

export function setReduce(v) { reduce = !!v; }
