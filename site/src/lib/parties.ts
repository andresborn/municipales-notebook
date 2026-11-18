export type PartySwatch = {
  className: string;
  color: string;
};

/**
 * Paleta fija para los partidos que compiten en todo el país. Cualquier otro
 * partido (sobre todo los locales) usa el gris de "otros".
 */
const PARTY_SWATCHES: Record<string, PartySwatch> = {
  "LIBERACIÓN NACIONAL": { className: "p-pln", color: "var(--pln)" },
  "UNIDAD SOCIAL CRISTIANA": { className: "p-pusc", color: "var(--pusc)" },
  "UNIDOS PODEMOS": { className: "p-up", color: "var(--up)" },
  "ACCIÓN CIUDADANA": { className: "p-pac", color: "var(--pac)" },
  "NUEVA GENERACIÓN": { className: "p-png", color: "var(--png)" },
  "LIBERAL PROGRESISTA": { className: "p-plp", color: "var(--plp)" },
  "NUEVA REPÚBLICA": { className: "p-pnr", color: "var(--pnr)" },
  "PROGRESO SOCIAL DEMOCRÁTICO": { className: "p-psd", color: "var(--psd)" },
  "REPUBLICANO SOCIAL CRISTIANO": { className: "p-prsc", color: "var(--prsc)" },
  "FRENTE AMPLIO": { className: "p-fa", color: "var(--fa)" },
};

const OTHER_SWATCH: PartySwatch = {
  className: "p-otro",
  color: "var(--otro)",
};

export const partySwatch = (partido: string): PartySwatch =>
  PARTY_SWATCHES[partido] ?? OTHER_SWATCH;

export const partyClass = (partido: string) => partySwatch(partido).className;

/** Indica si el partido tiene un color propio en la paleta fija. */
export const hasOwnColor = (partido: string) => partido in PARTY_SWATCHES;

const CONNECTORS = new Set([
  "de",
  "del",
  "la",
  "las",
  "los",
  "el",
  "y",
  "e",
  "por",
  "con",
  "en",
]);

/**
 * Pasa nombres en mayúsculas del TSE a caja de título. Funciona igual para
 * partidos y lugares: "LIBERACIÓN NACIONAL" → "Liberación Nacional",
 * "VÁZQUEZ DE CORONADO" → "Vázquez de Coronado".
 */
export const displayName = (value: string) =>
  value
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (index > 0 && CONNECTORS.has(word)) return word;
      return word
        .split("-")
        .map((part) =>
          part ? `${part.charAt(0).toUpperCase()}${part.slice(1)}` : part,
        )
        .join("-");
    })
    .join(" ");

export const displayParty = displayName;
