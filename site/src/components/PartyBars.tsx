import { fmtInt } from "../lib/format";
import { partyClass } from "../lib/parties";

export type PartyBarRow = {
  key: string;
  label: string;
  partido: string;
  value: number;
  note?: string;
};

type BarTick = {
  value: number;
  label: string;
  soft?: boolean;
};

type PartyBarsProps = {
  rows: PartyBarRow[];
  max: number;
  unit: string;
  ticks?: BarTick[];
  highlight?: string;
};

export function PartyBars({
  rows,
  max,
  unit,
  ticks,
  highlight,
}: PartyBarsProps) {
  const safeMax = Math.max(max, 1);

  return (
    <div className="bars">
      {rows.map((row) => {
        const width = Math.max(1.2, (row.value / safeMax) * 100);

        return (
          <div
            key={row.key}
            className={`bar-row${
              highlight && highlight === row.partido ? " is-winner" : ""
            }`}
          >
            <p className="bar-label">{row.label}</p>
            <div
              className="bar-track"
              role="img"
              aria-label={`${row.label}: ${fmtInt(row.value)} ${unit}`}
            >
              <span
                className={`bar-fill ${partyClass(row.partido)}`}
                style={{ width: `${width}%` }}
              />
              {ticks?.map((tick) => (
                <span
                  key={tick.label}
                  className={`bar-tick${tick.soft ? " bar-tick--soft" : ""}`}
                  style={{ left: `${(tick.value / safeMax) * 100}%` }}
                  title={tick.label}
                />
              ))}
            </div>
            <p className="bar-value">
              {fmtInt(row.value)}
              {row.note ? <small>{row.note}</small> : null}
            </p>
          </div>
        );
      })}
    </div>
  );
}
