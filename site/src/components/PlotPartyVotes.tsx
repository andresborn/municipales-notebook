import { barX, text } from "@observablehq/plot";

import { fmtInt } from "../lib/format";
import { partySwatch } from "../lib/parties";
import type { PartyBarRow } from "./PartyBars";
import { PlotFigure } from "./PlotFigure";

type PlotPartyVotesProps = {
  rows: PartyBarRow[];
  max: number;
  unit: string;
};

/**
 * Versión Observable Plot de las barras de votación por partido.
 *
 * No se importa desde las páginas por defecto: el sitio usa PartyBars para
 * mantener el bundle liviano. Para activarla, sigue la nota de cambio en
 * CantonPage.tsx.
 */
export function PlotPartyVotes({ rows, max, unit }: PlotPartyVotesProps) {
  const ariaLabel = `Votación por partido. ${rows
    .map((row) => `${row.label}: ${fmtInt(row.value)} ${unit}`)
    .join("; ")}.`;

  return (
    <PlotFigure
      ariaLabel={ariaLabel}
      options={{
        height: Math.max(260, rows.length * 34),
        marginLeft: 190,
        marginRight: 80,
        x: { domain: [0, max], label: unit, grid: true },
        y: { domain: rows.map((row) => row.label), label: null },
        marks: [
          barX(rows, {
            x: "value",
            y: "label",
            fill: (row: PartyBarRow) => partySwatch(row.partido).color,
            inset: 2,
          }),
          text(rows, {
            x: "value",
            y: "label",
            dx: 6,
            text: (row: PartyBarRow) => fmtInt(row.value),
            textAnchor: "start",
            fill: "var(--ink)",
            fontSize: 11,
          }),
        ],
      }}
    />
  );
}
