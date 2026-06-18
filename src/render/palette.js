// palette.js — all hex tokens (shared + per-hero), PORTED from the feel slices.
// Per the brief these live in one place so the look is tunable without touching
// drawing code. Confirmed against the feel slices.
//
// NOTE: the figure toolkit's function bodies are identical across every slice,
// but each hero defines its OWN ink (outline) and rim-light colors — they are
// NOT shared. So figure.js takes the active ink/rim via setFigureStyle(); the
// defaults below are only fallbacks (e.g. for the Trooper).

// ---- figure defaults (fallback only) ---------------------------------------
export const DEFAULT_INK = '#161208';
export const DEFAULT_RIM = '#eafcff';

// ---- scene / world tokens --------------------------------------------------
export const VOID = '#06070f';
export const GOLD = '#ffd24a';
export const DAWN_WARM = '#ff9d54';

// ---- Radu Photon (LEADER / STRIKER) ----------------------------------------
// Gold suit + cyan photon eyes (complementary accent), streaming light-mantle.
export const RADU = {
  SUIT_HI: '#ffe7a6', SUIT_LO: '#b9781f', SUIT_SH: '#7c4f15',
  SKIN_HI: '#fff3d6', SKIN_LO: '#d59a45',
  SEAM: '#fffdf5', HAIR: '#ffcf5e', HAIR_HI: '#fff0c0',
  EYE: '#dffaff', // cyan photon eyes
  RIM: '#eafcff', INK: '#241606',
};
