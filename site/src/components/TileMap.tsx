import { useMemo, useRef, useState } from "react";

import type { CantonOption } from "../lib/data";
import {
  displayName,
  displayParty,
  hasOwnColor,
  partyClass,
} from "../lib/parties";

export type TileMapLegendRow = {
  partido: string;
  cantones: number;
};

type TileMapProps = {
  cantones: CantonOption[];
  winnerForCanton: (canton: CantonOption) => string | undefined;
  hrefForCanton: (canton: CantonOption) => string;
  ariaLabel: string;
  legend: TileMapLegendRow[];
};

type TooltipState = {
  name: string;
  x: number;
  y: number;
};

/** Ancho máximo estimado del tooltip para no salirse del mapa. */
const TOOLTIP_WIDTH = 180;

export function TileMap({
  cantones,
  winnerForCanton,
  hrefForCanton,
  ariaLabel,
  legend,
}: TileMapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const groups = useMemo(() => {
    const map = new Map<string, CantonOption[]>();
    for (const canton of cantones) {
      const group = map.get(canton.provincia) ?? [];
      group.push(canton);
      map.set(canton.provincia, group);
    }
    return [...map.entries()];
  }, [cantones]);

  const showTooltip = (name: string, element: HTMLElement) => {
    const map = mapRef.current;
    if (!map) return;

    const maxX = Math.max(0, map.clientWidth - TOOLTIP_WIDTH);
    setTooltip({
      name,
      x: Math.min(element.offsetLeft, maxX),
      y: element.offsetTop,
    });
  };

  const coloredParties = legend.filter((row) => hasOwnColor(row.partido));
  const otherCount = legend
    .filter((row) => !hasOwnColor(row.partido))
    .reduce((total, row) => total + row.cantones, 0);

  return (
    <>
      <div
        className="tile-map"
        role="group"
        aria-label={ariaLabel}
        ref={mapRef}
      >
        {groups.map(([provincia, cantonesDeProvincia]) => (
          <div className="province-row" key={provincia}>
            <span className="province-label">
              {displayName(provincia)}
              <em>{cantonesDeProvincia.length}</em>
            </span>
            <div className="tiles">
              {cantonesDeProvincia.map((canton) => {
                const winner = winnerForCanton(canton);
                if (!winner) return null;

                const cantonName = displayName(canton.canton);

                return (
                  <a
                    key={canton.key}
                    className={`tile ${partyClass(winner)}`}
                    href={hrefForCanton(canton)}
                    aria-label={`${cantonName}: ${displayParty(
                      winner,
                    )}. Ver la ficha del cantón.`}
                    onMouseEnter={(event) =>
                      showTooltip(cantonName, event.currentTarget)
                    }
                    onMouseLeave={() => setTooltip(null)}
                    onFocus={(event) =>
                      showTooltip(cantonName, event.currentTarget)
                    }
                    onBlur={() => setTooltip(null)}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {tooltip ? (
          <span
            className="tile-tooltip"
            aria-hidden="true"
            style={{ left: tooltip.x, top: tooltip.y - 8 }}
          >
            {tooltip.name}
          </span>
        ) : null}
      </div>
      <div className="legend" role="group" aria-label="Partidos ganadores">
        {coloredParties.map((row) => (
          <span key={row.partido}>
            <i className={partyClass(row.partido)} aria-hidden="true" />
            {displayParty(row.partido)} ({row.cantones})
          </span>
        ))}
        {otherCount > 0 ? (
          <span>
            <i className="p-otro" aria-hidden="true" />
            Otros partidos ({otherCount})
          </span>
        ) : null}
      </div>
    </>
  );
}
