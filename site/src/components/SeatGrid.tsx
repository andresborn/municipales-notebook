import type { PartidoNacionalRow } from "../lib/data";
import { fmtInt } from "../lib/format";
import { displayParty, partyClass } from "../lib/parties";

type SeatGridProps = {
  rows: PartidoNacionalRow[];
  total: number;
};

export function SeatGrid({ rows, total }: SeatGridProps) {
  const summary = rows
    .map((row) => `${displayParty(row.partido)}: ${row.escanos}`)
    .join("; ");

  return (
    <div className="seat-inset">
      <div className="seat-inset-head">
        <span>
          <b>{fmtInt(total)} regidurías</b>, una por cuadro
        </span>
        <span>Ordenadas por partido · de mayor a menor</span>
      </div>
      <div className="seat-grid" aria-hidden="true">
        {rows.flatMap((row) =>
          Array.from({ length: row.escanos }, (_, index) => (
            <span
              key={`${row.partido}-${index}`}
              className={`dot ${partyClass(row.partido)}`}
            />
          )),
        )}
      </div>
      <p className="sr-only">
        Distribución de las {fmtInt(total)} regidurías. {summary}.
      </p>
    </div>
  );
}
