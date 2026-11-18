import type { CantonOption, ElectionYear } from "../lib/data";
import { href, type CantonLink } from "../lib/routes";

const YEARS: ElectionYear[] = [2020, 2024];

type YearSwitchProps = {
  year: ElectionYear;
  mode: "home" | "cantones";
  canton?: CantonOption;
  cantonByYear?: Partial<Record<ElectionYear, CantonLink>>;
};

export function YearSwitch({
  year,
  mode,
  canton,
  cantonByYear,
}: YearSwitchProps) {
  return (
    <nav className="year-switch" aria-label="Cambiar de año">
      {YEARS.map((option) => {
        const target =
          cantonByYear?.[option] ?? (option === year ? canton : undefined);

        return (
          <a
            key={option}
            href={
              mode === "home"
                ? href.home(option)
                : href.cantones(option, target)
            }
            aria-current={option === year ? "page" : undefined}
          >
            {option}
          </a>
        );
      })}
    </nav>
  );
}
