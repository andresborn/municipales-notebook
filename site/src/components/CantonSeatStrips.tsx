import { useMemo } from "react";

import type {
  CantonOption,
  ElectionYear,
  EscanoPartidoRow,
} from "../lib/data";
import { fmtInt } from "../lib/format";
import {
  displayName,
  displayParty,
  hasOwnColor,
  partyClass,
} from "../lib/parties";
import { href } from "../lib/routes";

type CantonSeatStripsProps = {
  year: ElectionYear;
  cantones: CantonOption[];
  escanosPorCanton: Map<string, EscanoPartidoRow[]>;
};

const seatLabel = (value: number) =>
  `${fmtInt(value)} ${value === 1 ? "regiduría" : "regidurías"}`;

export function CantonSeatStrips({
  year,
  cantones,
  escanosPorCanton,
}: CantonSeatStripsProps) {
  const groups = useMemo(() => {
    const map = new Map<string, CantonOption[]>();

    for (const canton of cantones) {
      const current = map.get(canton.provincia) ?? [];
      current.push(canton);
      map.set(canton.provincia, current);
    }

    return [...map.entries()];
  }, [cantones]);

  const { coloredParties, otherSeats } = useMemo(() => {
    const seatsByParty = new Map<string, number>();
    let other = 0;

    for (const rows of escanosPorCanton.values()) {
      for (const row of rows) {
        if (row.escanos <= 0) continue;

        if (hasOwnColor(row.partido)) {
          seatsByParty.set(
            row.partido,
            (seatsByParty.get(row.partido) ?? 0) + row.escanos,
          );
        } else {
          other += row.escanos;
        }
      }
    }

    return {
      coloredParties: [...seatsByParty.entries()].sort(
        (a, b) => b[1] - a[1],
      ),
      otherSeats: other,
    };
  }, [escanosPorCanton]);

  return (
    <details className="disclosure canton-seat-disclosure">
      <summary>Ver regidurías por cantón</summary>

      <div className="canton-seat-content">
        <div
          className="legend"
          role="group"
          aria-label="Partidos con color propio"
        >
          {coloredParties.map(([partido, seats]) => (
            <span key={partido}>
              <i className={partyClass(partido)} aria-hidden="true" />
              {displayParty(partido)} ({fmtInt(seats)})
            </span>
          ))}
          {otherSeats > 0 ? (
            <span>
              <i className="p-otro" aria-hidden="true" />
              Otros partidos ({fmtInt(otherSeats)})
            </span>
          ) : null}
        </div>

        <div className="canton-seat-groups">
          {groups.map(([provincia, list]) => (
            <div className="canton-seat-group" key={provincia}>
              <p className="canton-seat-province">
                {displayName(provincia)}
                <em>{list.length}</em>
              </p>

              {list.map((canton) => {
                const partyRows = (
                  escanosPorCanton.get(canton.key) ?? []
                ).filter((row) => row.escanos > 0);
                const total = partyRows.reduce(
                  (sum, row) => sum + row.escanos,
                  0,
                );
                const summary = partyRows.length
                  ? partyRows
                      .map((row) => `${displayParty(row.partido)} ${row.escanos}`)
                      .join(", ")
                  : "sin regidurías";

                return (
                  <div className="canton-seat-row" key={canton.key}>
                    <a
                      className="canton-seat-name"
                      href={href.cantones(year, canton)}
                    >
                      {displayName(canton.canton)}
                    </a>
                    <div
                      className="canton-seat-strip"
                      role="img"
                      aria-label={`${displayName(canton.canton)}: ${summary}.`}
                    >
                      {partyRows.flatMap((row) =>
                        Array.from({ length: row.escanos }, (_, index) => (
                          <i
                            key={`${row.partido}-${index}`}
                            className={partyClass(row.partido)}
                            title={`${displayParty(
                              row.partido,
                            )} · ${seatLabel(row.escanos)}`}
                            aria-hidden="true"
                          />
                        )),
                      )}
                    </div>
                    <span className="canton-seat-total">{fmtInt(total)}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <p className="figure-note">
          Cada cuadro es una regiduría. El color identifica al partido; los
          partidos sin color propio aparecen en gris. En escritorio, pasa el
          cursor sobre un cuadro para ver el partido; en móvil, abre el cantón
          para ver el detalle completo.
        </p>
      </div>
    </details>
  );
}
