import type { CantonOption, ElectionYear } from "../lib/data";
import { type CantonLink } from "../lib/routes";
import { Brand } from "./Brand";
import { CantonSelect } from "./CantonSelect";
import { YearSwitch } from "./YearSwitch";

type CantonBarProps = {
  year: ElectionYear;
  cantones: CantonOption[];
  selected: CantonOption;
  onSelect: (key: string) => void;
  cantonByYear?: Partial<Record<ElectionYear, CantonLink>>;
};

export function CantonBar({
  year,
  cantones,
  selected,
  onSelect,
  cantonByYear,
}: CantonBarProps) {
  return (
    <header className="canton-bar">
      <div className="wrap canton-bar-inner">
        <div
          className="canton-path"
          role="group"
          aria-label={`Estás viendo Costa Rica, elecciones municipales ${year}`}
        >
          <Brand />
          <span className="path-country">Costa Rica</span>
          <span className="sep path-sep" aria-hidden="true">
            |
          </span>
          <span className="path-election">Municipal</span>
        </div>
        <div className="canton-bar-actions">
          <YearSwitch
            year={year}
            mode="cantones"
            canton={selected}
            cantonByYear={cantonByYear}
          />
          <span className="select-label" aria-hidden="true">
            Cantón
          </span>
          <CantonSelect
            options={cantones}
            value={selected.key}
            onChange={onSelect}
          />
        </div>
      </div>
    </header>
  );
}
