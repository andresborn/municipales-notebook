import { useEffect } from "react";

import { PartyBars, type PartyBarRow } from "../components/PartyBars";
import { SeatGrid } from "../components/SeatGrid";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { TileMap } from "../components/TileMap";
import { YearSwitch } from "../components/YearSwitch";
import { elections, type ElectionYear } from "../lib/data";
import { fmtDecimal, fmtInt, fmtPct, fmtPp } from "../lib/format";
import {
  displayName,
  displayParty,
  hasOwnColor,
  partyClass,
} from "../lib/parties";
import { href } from "../lib/routes";

type HomePageProps = {
  year: ElectionYear;
};

export function HomePage({ year }: HomePageProps) {
  const data = elections[year];

  const totalRegidurias = data.regiduriasCanton.reduce(
    (total, row) => total + row.regidurias,
    0,
  );
  const participacionPct =
    (data.participacionNacional.votosRecibidos /
      data.participacionNacional.electorado) *
    100;
  const abstencionismoPct = 100 - participacionPct;
  const abstencionismoVotos =
    data.participacionNacional.electorado -
    data.participacionNacional.votosRecibidos;
  const votosNoValidos =
    data.participacionNacional.votosRecibidos - data.validosAlcaldesNacional;

  const alcaldiasColoreadas = data.alcaldiasPorPartido.filter((row) =>
    hasOwnColor(row.partido),
  );
  const otrosCantones = data.alcaldiasPorPartido
    .filter((row) => !hasOwnColor(row.partido))
    .reduce((total, row) => total + row.cantones, 0);

  const alcaldiaBars: PartyBarRow[] = alcaldiasColoreadas.map((row) => ({
    key: row.partido,
    label: displayParty(row.partido),
    partido: row.partido,
    value: row.cantones,
    note: "cantones",
  }));

  if (otrosCantones > 0) {
    alcaldiaBars.push({
      key: "otros",
      label: "Otros partidos",
      partido: "OTROS PARTIDOS",
      value: otrosCantones,
      note: "cantones",
    });
  }

  const alcaldiaMax = Math.max(...alcaldiaBars.map((row) => row.value), 1);

  const regidurias = [...data.partidosNacional].sort(
    (a, b) => b.escanos - a.escanos || b.votos - a.votos,
  );
  const totalEscanos = regidurias.reduce(
    (total, row) => total + row.escanos,
    0,
  );
  const topRegidurias = regidurias.slice(0, 10);
  const restoRegidurias = regidurias.slice(10);
  const restoEscanos = restoRegidurias.reduce(
    (total, row) => total + row.escanos,
    0,
  );

  const regiduriaBars: PartyBarRow[] = topRegidurias.map((row) => ({
    key: row.partido,
    label: displayParty(row.partido),
    partido: row.partido,
    value: row.escanos,
    note: fmtPct(row.porcentajeEscanos, 2),
  }));

  if (restoRegidurias.length > 0) {
    regiduriaBars.push({
      key: "resto",
      label: `Resto (${restoRegidurias.length} partidos)`,
      partido: "OTROS PARTIDOS",
      value: restoEscanos,
      note: fmtPct((restoEscanos / totalEscanos) * 100, 2),
    });
  }

  const regiduriaMax = regidurias[0]?.escanos ?? 1;

  useEffect(() => {
    document.title = `Resultados municipales ${year} · Elecciones Costa Rica`;
  }, [year]);

  return (
    <>
      <SiteHeader currentYear={year} />
      <main id="main" tabIndex={-1}>
        <div className="wrap page-body">
          <header className="election-head">
            <div className="election-head-top">
              <nav className="crumbs" aria-label="Ruta">
                <a href={href.landing()}>Inicio</a>
                <span className="sep" aria-hidden="true">
                  /
                </span>
                <span>Municipales</span>
                <span className="sep" aria-hidden="true">
                  /
                </span>
                <span>{year}</span>
              </nav>
              <YearSwitch year={year} mode="home" />
            </div>

            <div className="election-title">
              <p className="kicker">Municipales · Costa Rica</p>
              <h1>Resultados de las elecciones municipales {year}</h1>
              <p className="deck">
                Alcaldías, regidurías y participación en los{" "}
                {data.cantones.length} cantones.
              </p>
              <p className="byline">
                <span>
                  Resultados oficiales · <b>TSE</b>
                </span>
                <span>
                  {data.cantones.length} cantones ·{" "}
                  {fmtInt(totalRegidurias)} regidurías
                </span>
              </p>
            </div>
          </header>

          <section
            className="stat-band"
            aria-label={`Cifras nacionales de ${year}`}
          >
            <div className="stat">
              <p className="stat-label">Cantones</p>
              <p className="stat-value">{data.cantones.length}</p>
              <p className="stat-note">
                {year === 2024
                  ? "Incluye a Monteverde y Puerto Jiménez."
                  : "Monteverde y Puerto Jiménez aún no existían."}
              </p>
            </div>
            <div className="stat">
              <p className="stat-label">Electorado</p>
              <p className="stat-value">
                {fmtInt(data.participacionNacional.electorado)}
              </p>
              <p className="stat-note">Personas inscritas en el padrón.</p>
            </div>
            <div className="stat">
              <p className="stat-label">Participación</p>
              <p className="stat-value">
                {fmtDecimal(participacionPct, 2)}
                <small>%</small>
              </p>
              <p className="stat-note">Del electorado inscrito.</p>
            </div>
            <div className="stat">
              <p className="stat-label">Votos válidos</p>
              <p className="stat-value">{fmtInt(data.validosAlcaldesNacional)}</p>
              <p className="stat-note">Base de cálculo de alcaldías y márgenes.</p>
            </div>
            <div className="stat">
              <p className="stat-label">Regidurías</p>
              <p className="stat-value">{fmtInt(totalRegidurias)}</p>
              <p className="stat-note">
                Repartidas en los {data.cantones.length} concejos municipales.
              </p>
            </div>
          </section>

          <section
            className="section"
            id="participacion"
            aria-labelledby="participacion-heading"
          >
            <figure className="figure">
              <figcaption className="figure-head">
                <p className="kicker">Participación</p>
                <h3 id="participacion-heading">
                  Participación en la papeleta de alcaldía
                </h3>
                <p className="figure-sub">
                  Porcentaje del electorado inscrito que emitió un voto. El
                  resto de la barra es abstencionismo.
                </p>
              </figcaption>

              <div className="turnout">
                <div className="turnout-row">
                  <p className="turnout-year">{year}</p>
                  <div
                    className="turnout-track"
                    role="img"
                    aria-label={`Participación ${fmtPct(
                      participacionPct,
                      2,
                    )}; abstencionismo ${fmtPct(abstencionismoPct, 2)}.`}
                  >
                    <span
                      className="turnout-fill is-current"
                      style={{ width: `${participacionPct}%` }}
                    >
                      {fmtPct(participacionPct, 2)}
                    </span>
                  </div>
                  <div className="turnout-side">
                    <b>{fmtPct(abstencionismoPct, 2)}</b>
                    se abstuvo · {fmtInt(abstencionismoVotos)} personas
                  </div>
                </div>
              </div>

              <p className="figure-note">
                La participación se calcula sobre el electorado inscrito, no
                sobre los votos válidos. Los votos recibidos incluyen votos
                válidos y no válidos; en {year}, {fmtInt(votosNoValidos)} votos
                no fueron válidos.
              </p>
              <p className="source">
                Fuente: TSE · Participación en la papeleta de alcaldía.
              </p>
            </figure>
          </section>

          <section
            className="section"
            id="alcaldias"
            aria-labelledby="alcaldias-heading"
          >
            <figure className="figure">
              <figcaption className="figure-head">
                <p className="kicker">Alcaldías</p>
                <h3 id="alcaldias-heading">Alcaldías ganadas por partido</h3>
                <p className="figure-sub">
                  Cantones ganados por cada partido en {year}. Los partidos sin
                  color propio se agrupan en «Otros partidos».
                </p>
              </figcaption>

              <PartyBars
                rows={alcaldiaBars}
                max={alcaldiaMax}
                unit="cantones"
              />

              <details className="disclosure">
                <summary>
                  Ver los {data.partidosConAlcaldias} partidos con alcaldías
                </summary>
                <div className="table-wrap">
                  <table>
                    <caption className="sr-only">
                      Alcaldías ganadas por partido en {year}
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Partido</th>
                        <th scope="col" className="num">
                          Cantones
                        </th>
                        <th scope="col" className="num">
                          Votos del ganador
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.alcaldiasPorPartido.map((row) => (
                        <tr key={row.partido}>
                          <th scope="row">
                            <span
                              className={`party-dot ${partyClass(row.partido)}`}
                              aria-hidden="true"
                            />
                            {displayParty(row.partido)}
                          </th>
                          <td className="num">{row.cantones}</td>
                          <td className="num">{fmtInt(row.votos)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>

              <p className="source">
                Fuente: TSE · Resumen de alcaldías por cantón. Los votos son los
                del partido ganador en cada cantón.
              </p>
            </figure>
          </section>

          <section
            className="section"
            id="regidurias"
            aria-labelledby="regidurias-heading"
          >
            <figure className="figure">
              <figcaption className="figure-head">
                <p className="kicker">Regidurías</p>
                <h3 id="regidurias-heading">Regidurías por partido</h3>
                <p className="figure-sub">
                  Escaños asignados por cociente, subcociente y resto en los{" "}
                  {data.cantones.length} cantones. Los porcentajes se calculan
                  sobre el total de regidurías.
                </p>
              </figcaption>

              <PartyBars
                rows={regiduriaBars}
                max={regiduriaMax}
                unit="regidurías"
              />

              <SeatGrid rows={regidurias} total={totalEscanos} />

              <details className="disclosure">
                <summary>
                  Ver los {regidurias.length} partidos con regidurías
                </summary>
                <div className="table-wrap">
                  <table>
                    <caption className="sr-only">
                      Regidurías por partido en {year}
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Partido</th>
                        <th scope="col" className="num">
                          Votos
                        </th>
                        <th scope="col" className="num">
                          Escaños
                        </th>
                        <th scope="col" className="num">
                          % votos
                        </th>
                        <th scope="col" className="num">
                          % escaños
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {regidurias.map((row) => (
                        <tr key={row.partido}>
                          <th scope="row">
                            <span
                              className={`party-dot ${partyClass(row.partido)}`}
                              aria-hidden="true"
                            />
                            {displayParty(row.partido)}
                          </th>
                          <td className="num">{fmtInt(row.votos)}</td>
                          <td className="num strong">{row.escanos}</td>
                          <td className="num">
                            {fmtPct(row.porcentajeVotos, 2)}
                          </td>
                          <td className="num">
                            {fmtPct(row.porcentajeEscanos, 2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>

              <p className="figure-note">
                La tabla incluye los {regidurias.length} partidos que obtuvieron
                al menos una regiduría. Los escaños se asignan por cantón, no en
                una circunscripción nacional.
              </p>
              <p className="source">
                Fuente: TSE · Asignación de regidurías por cantón.
              </p>
            </figure>
          </section>

          <section
            className="section"
            id="mapa"
            aria-labelledby="mapa-heading"
          >
            <div className="section-head">
              <div>
                <p className="kicker">Mapa municipal · {year}</p>
                <h2 id="mapa-heading">Cada cuadro es un cantón</h2>
                <p className="deck">
                  El color indica el partido que ganó la alcaldía en {year}.
                  Selecciona un cuadro para abrir la ficha del cantón.
                </p>
              </div>
              <p className="section-head-side">
                Alcaldías {year}
                <br />
                Fuente: TSE
              </p>
            </div>

            <TileMap key={year} data={data} />
            <p className="source">
              Fuente: TSE · Resumen de alcaldías por cantón. Los partidos sin
              color propio se agrupan en «Otros partidos».
            </p>
          </section>

          <section
            className="section"
            id="cantones"
            aria-labelledby="cantones-heading"
          >
            <div className="section-head">
              <div>
                <p className="kicker">Resultados por cantón</p>
                <h2 id="cantones-heading">
                  Los {data.cantones.length} cantones
                </h2>
                <p className="deck">
                  Alcaldía ganada, votos del ganador, margen y participación en
                  la papeleta de alcaldía. Cada nombre abre la ficha del cantón.
                </p>
              </div>
              <p className="section-head-side">Fuente: TSE</p>
            </div>

            <details className="disclosure">
              <summary>Ver los {data.cantones.length} cantones</summary>
              <div className="table-wrap">
                <table>
                  <caption className="sr-only">
                    Resultados de alcaldía por cantón en {year}
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Provincia</th>
                      <th scope="col">Cantón</th>
                      <th scope="col">Alcaldía ganada por</th>
                      <th scope="col" className="num">
                        Votos
                      </th>
                      <th scope="col" className="num">
                        Margen
                      </th>
                      <th scope="col" className="num">
                        Participación
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.cantones.map((canton) => {
                      const alcalde = data.alcaldePorCanton.get(canton.key);
                      if (!alcalde) return null;

                      const margen =
                        alcalde.margenVotos > 0 && alcalde.margenPp < 0.1
                          ? "<0,1 pp"
                          : fmtPp(alcalde.margenPp);

                      return (
                        <tr key={canton.key}>
                          <td>{displayName(canton.provincia)}</td>
                          <th scope="row">
                            <a href={href.cantones(year, canton)}>
                              {displayName(canton.canton)}
                            </a>
                          </th>
                          <td>
                            <span
                              className={`party-dot ${partyClass(
                                alcalde.ganador,
                              )}`}
                              aria-hidden="true"
                            />
                            {displayParty(alcalde.ganador)}
                          </td>
                          <td className="num">
                            {fmtInt(alcalde.votosGanador)}
                          </td>
                          <td className="num">{margen}</td>
                          <td className="num">
                            {fmtPct(alcalde.participacion, 2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </details>

            <p className="source">
              Fuente: TSE · Resumen de alcaldías por cantón. La participación se
              calcula sobre el electorado inscrito.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
