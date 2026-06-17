/** Dimensions et réglages du moteur de simulation (espace logique de la carte). */

/** La carte est un carré logique [0, MAP_SIZE] sur les deux axes. */
export const MAP_SIZE = 1000;

/** Distance parcourue par tour = speedKnots * MOVEMENT_SCALE (unités carte). */
export const MOVEMENT_SCALE = 2;

/** Seuil de suspicion à partir duquel un contact est "sous surveillance". */
export const WATCH_THRESHOLD = 0.4;

/** Seuil de suspicion à partir duquel un contact est mis en évidence (halo). */
export const HIGHLIGHT_THRESHOLD = 0.65;
