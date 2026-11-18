import type { CantonOption, ElectionYear } from "../lib/data";
import { href } from "../lib/routes";

const YEARS: ElectionYear[] = [2020, 2024];

type YearSwitchProps = {
  year: ElectionYear;
  mode: "home" | "cantones";
  canton?: CantonOption;
};

export function YearSwitch({ year, mode, canton }: YearSwitchProps) {
  return (
    <nav className="year-switch" aria-label="Cambiar de año">
      {YEARS.map((option) => (
        <a
          key={option}
          href={
            mode === "home"
              ? href.home(option)
              : href.cantones(option, canton)
          }
          aria-current={option === year ? "page" : undefined}
        >
          {option}
        </a>
      ))}
    </nav>
  );
}
