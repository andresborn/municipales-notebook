import type { CantonOption, ElectionYear } from "../lib/data";
import { href } from "../lib/routes";
import { CantonSelect } from "./CantonSelect";
import { YearSwitch } from "./YearSwitch";

type CantonBarProps = {
  year: ElectionYear;
  cantones: CantonOption[];
  selected: CantonOption;
  onSelect: (key: string) => void;
  cantonForSwitch?: CantonOption;
};

export function CantonBar({
  year,
  cantones,
  selected,
  onSelect,
  cantonForSwitch,
}: CantonBarProps) {
  return (
    <header className="canton-bar">
      <div className="wrap canton-bar-inner">
        <div
          className="canton-path"
          aria-label={`Estás viendo Costa Rica, elecciones municipales ${year}`}
        >
          <a className="bar-brand" href={href.landing()}>
            Elecciones <span>Costa Rica</span>
          </a>
          <span className="path-country">Costa Rica</span>
          <span className="sep path-sep" aria-hidden="true">
            |
          </span>
          <span className="path-election">Municipal</span>
          <span className="sep path-sep" aria-hidden="true">
            |
          </span>
          <span className="path-year">{year}</span>
        </div>
        <div className="canton-bar-actions">
          <YearSwitch
            year={year}
            mode="cantones"
            canton={cantonForSwitch ?? selected}
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
