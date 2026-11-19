import { useEffect, useMemo, useRef, useState } from "react";

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
  defaultOpen?: boolean;
};

const seatLabel = (value: number) =>
  `${fmtInt(value)} ${value === 1 ? "regiduría" : "regidurías"}`;

type SeatTip = {
  cantonKey: string;
  partido: string;
  escanos: number;
  x: number;
  y: number;
  below: boolean;
};

const sameSeat = (a: SeatTip | null, b: SeatTip) =>
  a !== null && a.cantonKey === b.cantonKey && a.partido === b.partido;

export function CantonSeatStrips({
  year,
  cantones,
  escanosPorCanton,
  defaultOpen = false,
}: CantonSeatStripsProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<SeatTip | null>(null);
  const [pinned, setPinned] = useState<SeatTip | null>(null);
  const tip = hover ?? pinned;

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

  const makeTip = (
    partido: string,
    escanos: number,
    cantonKey: string,
    element: HTMLElement,
  ): SeatTip | null => {
    const content = contentRef.current;
    if (!content) return null;

    const contentRect = content.getBoundingClientRect();
    const cellRect = element.getBoundingClientRect();
    const half = 110;
    const minX = Math.min(half + 8, content.clientWidth / 2);
    const maxX = Math.max(minX, content.clientWidth - half - 8);
    const rawX = cellRect.left - contentRect.left + cellRect.width / 2;
    const below = cellRect.top < 100;

    return {
      cantonKey,
      partido,
      escanos,
      x: Math.min(Math.max(rawX, minX), maxX),
      y: below
        ? cellRect.bottom - contentRect.top
        : cellRect.top - contentRect.top,
      below,
    };
  };

  useEffect(() => {
    if (!pinned) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(".canton-seat-strip i")
      ) {
        return;
      }

      setPinned(null);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [pinned]);

  useEffect(() => {
    if (!hover && !pinned) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      setHover(null);
      setPinned(null);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [hover, pinned]);

  return (
    <details
      className="disclosure canton-seat-disclosure"
      open={defaultOpen || undefined}
    >
      <summary>Ver regidurías por cantón</summary>

      <div className="canton-seat-content" ref={contentRef}>
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
                            className={`${partyClass(row.partido)}${
                              tip?.cantonKey === canton.key &&
                              tip.partido === row.partido
                                ? " is-active"
                                : ""
                            }`}
                            aria-hidden="true"
                            onPointerEnter={(event) => {
                              if (event.pointerType !== "mouse") return;

                              const next = makeTip(
                                row.partido,
                                row.escanos,
                                canton.key,
                                event.currentTarget,
                              );
                              if (next) setHover(next);
                            }}
                            onPointerLeave={(event) => {
                              if (event.pointerType !== "mouse") return;
                              setHover(null);
                            }}
                            onClick={(event) => {
                              const next = makeTip(
                                row.partido,
                                row.escanos,
                                canton.key,
                                event.currentTarget,
                              );
                              if (!next) return;

                              setPinned((prev) =>
                                sameSeat(prev, next) ? null : next,
                              );
                            }}
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

        {tip ? (
          <span
            className={`canton-seat-tooltip${
              tip.below ? " canton-seat-tooltip--below" : ""
            }`}
            aria-hidden="true"
            style={{ left: tip.x, top: tip.y }}
          >
            <b>{displayParty(tip.partido)}</b>
            <span>{seatLabel(tip.escanos)}</span>
          </span>
        ) : null}

        <p className="figure-note">
          Cada cuadro es una regiduría. El color identifica al partido; los
          partidos sin color propio aparecen en gris. Pasa el cursor sobre un
          cuadro para ver el partido; en móvil, toca un cuadro. El enlace del
          cantón abre la ficha completa.
        </p>
      </div>
    </details>
  );
}
