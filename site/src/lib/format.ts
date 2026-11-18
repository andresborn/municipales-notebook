const integerFormat = new Intl.NumberFormat("es-ES", {
  maximumFractionDigits: 0,
});

const decimalFormat = (digits: number) =>
  new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const compactFormat = new Intl.NumberFormat("es-ES", {
  notation: "compact",
  compactDisplay: "long",
  maximumFractionDigits: 1,
});

export const fmtInt = (value: number) => integerFormat.format(value);

export const fmtDecimal = (value: number, digits = 2) =>
  decimalFormat(digits).format(value);

/** Formats a value already expressed in percentage points (0–100). */
export const fmtPct = (value: number, digits = 1) =>
  `${decimalFormat(digits).format(value)}%`;

/** Formats a value already expressed in percentage points, with a pp suffix. */
export const fmtPp = (value: number, digits = 1) =>
  `${decimalFormat(digits).format(value)} pp`;

export const fmtCompact = (value: number) => compactFormat.format(value);

export const truncate = (value: string, maxLength = 24) =>
  value.length > maxLength
    ? `${value.slice(0, maxLength - 1).trimEnd()}…`
    : value;

export const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
