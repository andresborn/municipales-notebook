import type { CantonOption } from "../lib/data";
import { Brand } from "./Brand";
import { CantonSelect } from "./CantonSelect";

type PresidentialCantonBarProps = {
  cantones: CantonOption[];
  selected: CantonOption;
  onSelect: (key: string) => void;
};

export function PresidentialCantonBar({
  cantones,
  selected,
  onSelect,
}: PresidentialCantonBarProps) {
  return (
    <header className="canton-bar">
      <div className="wrap canton-bar-inner">
        <div
          className="canton-path"
          role="group"
          aria-label="Estás viendo Costa Rica, elecciones nacionales 2026"
        >
          <Brand />
          <span className="path-country">Costa Rica</span>
          <span className="sep path-sep" aria-hidden="true">
            |
          </span>
          <span className="path-election">Nacional 2026</span>
        </div>
        <div className="canton-bar-actions">
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
