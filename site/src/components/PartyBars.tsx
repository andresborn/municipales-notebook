import { fmtInt } from "../lib/format";
import { partyClass } from "../lib/parties";

export type PartyBarRow = {
  key: string;
  label: string;
  partido: string;
  value: number;
  note?: string;
  aside?: string;
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
  inlineValue?: boolean;
};

export function PartyBars({
  rows,
  max,
  unit,
  ticks,
  highlight,
  inlineValue = false,
}: PartyBarsProps) {
  const safeMax = Math.max(max, 1);

  return (
    <div className={`bars${inlineValue ? " bars--inline" : ""}`}>
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
              aria-label={`${row.label}: ${fmtInt(row.value)} ${unit}${
                row.note ? `, ${row.note}` : ""
              }${row.aside ? `, ${row.aside}` : ""}`}
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
              {inlineValue ? (
                <span className="bar-inline" aria-hidden="true">
                  <b>{fmtInt(row.value)}</b>
                  {row.note ? <em>{row.note}</em> : null}
                </span>
              ) : null}
            </div>
            <p className="bar-value">
              {inlineValue ? (
                row.aside ? (
                  <span className="bar-aside-main">{row.aside}</span>
                ) : null
              ) : (
                <>
                  {fmtInt(row.value)}
                  {row.note ? <small>{row.note}</small> : null}
                  {row.aside ? (
                    <small className="bar-aside">{row.aside}</small>
                  ) : null}
                </>
              )}
            </p>
          </div>
        );
      })}
    </div>
  );
}
