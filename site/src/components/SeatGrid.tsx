import { useMemo, useRef, useState } from "react";

import type {
  CantonOption,
  EscanoPartidoRow,
  PartidoNacionalRow,
} from "../lib/data";
import { fmtInt } from "../lib/format";
import { displayName, displayParty, partyClass } from "../lib/parties";

type SeatGridProps = {
  rows: PartidoNacionalRow[];
  total: number;
  cantones: CantonOption[];
  escanosPorCanton: Map<string, EscanoPartidoRow[]>;
};

type SeatEntry = {
  key: string;
  partido: string;
  canton: CantonOption | null;
  escanos: number;
};

type TooltipState = {
  canton: string;
  partido: string;
  escanos: number;
  x: number;
  y: number;
  below: boolean;
};

const seatLabel = (value: number) =>
  `${fmtInt(value)} ${value === 1 ? "regiduría" : "regidurías"}`;

export function SeatGrid({
  rows,
  total,
  cantones,
  escanosPorCanton,
}: SeatGridProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const insetRef = useRef<HTMLDivElement>(null);

  const seatEntries = useMemo(() => {
    const byParty = new Map<
      string,
      { canton: CantonOption; escanos: number }[]
    >();

    for (const canton of cantones) {
      for (const row of escanosPorCanton.get(canton.key) ?? []) {
        if (row.escanos <= 0) continue;

        const current = byParty.get(row.partido) ?? [];
        current.push({ canton, escanos: row.escanos });
        byParty.set(row.partido, current);
      }
    }

    return rows.flatMap((row) => {
      const entries: SeatEntry[] = [];

      for (const place of byParty.get(row.partido) ?? []) {
        for (let index = 0; index < place.escanos; index += 1) {
          entries.push({
            key: `${row.partido}-${place.canton.key}-${index}`,
            partido: row.partido,
            canton: place.canton,
            escanos: place.escanos,
          });
        }
      }

      // La asignación por cantón debe sumar el total del partido. Si faltara
      // algún escaño, se conserva el cuadro sin cantón para no alterar el total.
      for (let index = entries.length; index < row.escanos; index += 1) {
        entries.push({
          key: `${row.partido}-sin-canton-${index}`,
          partido: row.partido,
          canton: null,
          escanos: 1,
        });
      }

      return entries;
    });
  }, [rows, cantones, escanosPorCanton]);

  const showTooltip = (entry: SeatEntry, element: HTMLElement) => {
    const inset = insetRef.current;
    if (!inset || !entry.canton) return;

    const insetRect = inset.getBoundingClientRect();
    const dotRect = element.getBoundingClientRect();
    const half = 110;
    const rawX =
      dotRect.left - insetRect.left + dotRect.width / 2;
    const minX = Math.min(half + 8, inset.clientWidth / 2);
    const maxX = Math.max(minX, inset.clientWidth - half - 8);

    const y = dotRect.top - insetRect.top;

    setTooltip({
      canton: entry.canton.canton,
      partido: entry.partido,
      escanos: entry.escanos,
      x: Math.min(Math.max(rawX, minX), maxX),
      y,
      below: y < 82,
    });
  };

  const summary = rows
    .map((row) => `${displayParty(row.partido)}: ${row.escanos}`)
    .join("; ");

  return (
    <div className="seat-inset" ref={insetRef}>
      <div className="seat-inset-head">
        <span>
          <b>{fmtInt(total)} regidurías</b>, una por cuadro
        </span>
        <span>Ordenadas por partido · de mayor a menor</span>
      </div>
      <div className="seat-grid" aria-hidden="true">
        {seatEntries.map((entry) => (
          <span
            key={entry.key}
            className={`dot ${partyClass(entry.partido)}`}
            onMouseEnter={(event) => showTooltip(entry, event.currentTarget)}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
      </div>
      {tooltip ? (
        <span
          className={`seat-tooltip${tooltip.below ? " seat-tooltip--below" : ""}`}
          aria-hidden="true"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <b>{displayName(tooltip.canton)}</b>
          <span>{displayParty(tooltip.partido)}</span>
          <em>{seatLabel(tooltip.escanos)} del partido en el cantón</em>
        </span>
      ) : null}
      <p className="sr-only">
        Distribución de las {fmtInt(total)} regidurías. {summary}.
      </p>
    </div>
  );
}
