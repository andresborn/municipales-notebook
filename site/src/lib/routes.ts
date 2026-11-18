import type { CantonOption, CantonSlug, ElectionYear } from "./data";

export type { CantonSlug } from "./data";

export type Page = "landing" | "home" | "cantones" | "soon";

export type Route =
  | { page: "landing" }
  | { page: "home"; year: ElectionYear }
  | { page: "cantones"; year: ElectionYear; cantonSlug?: CantonSlug }
  | { page: "soon" };

export const DEFAULT_YEAR: ElectionYear = 2024;
export const SOON_YEAR = 2026;

export type CantonLink = Pick<CantonOption, "slugProvincia" | "slugCanton">;

export const href = {
  landing: () => "#/",
  home: (year: ElectionYear) => `#/${year}`,
  cantones: (year: ElectionYear, canton?: CantonLink) =>
    `#/${year}/cantones${
      canton ? `/${canton.slugProvincia}/${canton.slugCanton}` : ""
    }`,
  soon: () => `#/${SOON_YEAR}`,
};

const parseYear = (value: string | undefined): ElectionYear | null => {
  if (value === "2020") return 2020;
  if (value === "2024") return 2024;
  return null;
};

export const routeFromHash = (hash = window.location.hash): Route => {
  const segments = hash
    .replace(/^#\/?/, "")
    .split("/")
    .filter(Boolean);

  if (segments.length === 0) return { page: "landing" };

  const [first, second, third, fourth] = segments;

  // Enlaces anteriores al selector de año.
  if (first === "cantones") {
    return { page: "cantones", year: DEFAULT_YEAR };
  }

  if (first === String(SOON_YEAR)) {
    return { page: "soon" };
  }

  const year = parseYear(first);
  if (!year) return { page: "landing" };

  if (second === "cantones") {
    return third && fourth
      ? {
          page: "cantones",
          year,
          cantonSlug: {
            provincia: third.toLowerCase(),
            canton: fourth.toLowerCase(),
          },
        }
      : { page: "cantones", year };
  }

  return { page: "home", year };
};
