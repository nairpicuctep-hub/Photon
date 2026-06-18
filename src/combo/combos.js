// combos.js — ComboDef data (brief §6). Adding a combo is meant to be pure data
// + a small effect hook in ComboEngine. The thesis ("power alone fails; together
// it breaks through") is carried by the captions.

export const COMBO_DEFS = {
  light_lance: {
    id: 'light_lance', name: 'Light Lance', participants: ['radu', 'victor'],
    title: '✦  LIGHT LANCE', subtitle: 'Radu × Victor — combo',
    caption: 'Friendship is stronger than power.', c1: '#ffd24a', c2: '#3fd6c8',
  },
  bastion_dawn: {
    id: 'bastion_dawn', name: 'Bastion Dawn', participants: ['radu', 'manu'],
    title: '☀  BASTION DAWN', subtitle: 'Radu × Manu — combo',
    caption: 'Shielded by a friend, the light grows.', c1: '#ffd24a', c2: '#ffb15a',
  },
  exposed: {
    id: 'exposed', name: 'Exposed', participants: ['floris'],
    title: '◆  EXPOSED', subtitle: 'Floris reveals — strike the marked',
    caption: 'Knowledge is the first light.', c1: '#7df0bf', c2: '#ffcf6e',
  },
  frozen_volley: {
    id: 'frozen_volley', name: 'Frozen Volley', participants: ['andreea'],
    title: '❄  FROZEN VOLLEY', subtitle: 'Andreea × any — combo',
    caption: 'Time bends to the patient mind.', c1: '#7fb0ff', c2: '#cfe0ff',
  },
  morale_surge: {
    id: 'morale_surge', name: 'Morale Surge', participants: ['pissy', 'radu'],
    title: '★  MORALE SURGE', subtitle: 'Pissy × Radu — combo',
    caption: 'Together, nothing is impossible.', c1: '#b6ff5a', c2: '#ffd24a',
  },
  prismatic_aegis: {
    id: 'prismatic_aegis', name: 'Prismatic Aegis', participants: ['victor', 'manu'],
    title: '◈  PRISMATIC AEGIS', subtitle: 'Victor × Manu — combo',
    caption: 'A shield of bent light.', c1: '#7fe9dd', c2: '#ffd24a',
  },
  insight_barrage: {
    id: 'insight_barrage', name: 'Insight Barrage', participants: ['andreea', 'floris'],
    title: '✶  INSIGHT BARRAGE', subtitle: 'Andreea × Floris — combo',
    caption: 'Foreseen, revealed, and struck.', c1: '#8e7ff0', c2: '#7df0bf',
  },
  photon_overdrive: {
    id: 'photon_overdrive', name: 'Photon Overdrive', participants: ['radu'],
    title: '☀  PHOTON OVERDRIVE', subtitle: 'Radu × the whole team',
    caption: 'Infinite potential — together.', c1: '#fff7d6', c2: '#ffd24a',
  },
};
