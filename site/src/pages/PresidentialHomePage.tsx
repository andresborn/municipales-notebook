import { useEffect, useState } from "react";

import { ArrowIcon } from "../components/ArrowIcon";
import { PartyBars, type PartyBarRow } from "../components/PartyBars";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { TileMap } from "../components/TileMap";
import { ppLabel } from "../lib/classification";
import { defaultCantonKey } from "../lib/data";
import { fmtInt, fmtPct, fmtPp } from "../lib/format";
import { displayName, displayParty, partyClass } from "../lib/parties";
import { presidential2026 } from "../lib/presidential";
import { href } from "../lib/routes";

export function PresidentialHomePage() {
  const data = presidential2026;
  const [showAllParties, setShowAllParties] = useState(false);

  const winner = data.partidosNacional[0];
  const second = data.partidosNacional[1];
  const marginVotes = winner.votos - second.votos;
  const marginPp = winner.porcentajeVotos - second.porcentajeVotos;
  const votosExtranjero = data.partidosNacional.reduce(
    (total, row) => total + row.votosExtranjero,
    0,
  );
  const defaultCanton =
    data.cantones.find((canton) => canton.key === defaultCantonKey) ??
    data.cantones[0];

  const abstencionismoVotos =
    data.nacional.electorado - data.nacional.votosRecibidos;
  const votosNoValidos =
    data.nacional.votosRecibidos - data.nacional.votosValidos;

  const partyBars: PartyBarRow[] = data.partidosNacional.map((row) => ({
    key: row.partido,
    label: displayParty(row.partido),
    partido: row.partido,
    value: row.votos,
    note: fmtPct(row.porcentajeVotos, 2),
    aside:
      row.cantonesGanados > 0
        ? `${fmtInt(row.cantonesGanados)} ${
            row.cantonesGanados === 1 ? "cantón" : "cantones"
          }`
        : undefined,
  }));

  const partyMax = winner.votos || 1;

  const mapLegend = data.partidosNacional
    .filter((row) => row.cantonesGanados > 0)
    .map((row) => ({
      partido: row.partido,
      cantones: row.cantonesGanados,
    }));

  useEffect(() => {
    document.title =
      "Resultados presidenciales 2026 · Elecciones Costa Rica";
  }, []);

  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        <div className="wrap page-body">
          <header className="election-head">
            <div className="election-head-top">
              <nav className="crumbs" aria-label="Ruta">
                <a href={href.landing()}>Inicio</a>
                <span className="sep" aria-hidden="true">
                  /
                </span>
                <span>Nacional</span>
                <span className="sep" aria-hidden="true">
                  /
                </span>
                <span>2026</span>
              </nav>
            </div>

            <div className="election-title">
              <p className="kicker">Nacional · Costa Rica 2026</p>
              <h1>Resultados de las elecciones presidenciales 2026</h1>
              <p className="deck">
                Con {fmtInt(winner.votos)} votos (
                {fmtPct(winner.porcentajeVotos, 2)}),{" "}
                <strong>{displayParty(winner.partido)}</strong> ganó la
                presidencia y {fmtInt(winner.cantonesGanados)} de los{" "}
                {data.cantones.length} cantones. Su ventaja sobre{" "}
                {displayParty(second.partido)} fue de {fmtInt(marginVotes)}{" "}
                votos ({fmtPp(marginPp)}).
              </p>
              <div className="election-title-link">
                <a
                  className="link-arrow head-link"
                  href={href.presidentialCantones(defaultCanton)}
                >
                  Ver resultados por cantón
                  <ArrowIcon />
                </a>
              </div>
              <p className="byline">
                <span>
                  Resultados oficiales · <b>TSE</b>
                </span>
                <span>
                  {data.cantones.length} cantones ·{" "}
                  {data.partidosNacional.length} partidos
                </span>
                <span>{fmtInt(votosExtranjero)} votos en el extranjero</span>
              </p>
            </div>
          </header>

          <section
            className="stat-band"
            aria-label="Cifras nacionales de la presidencial 2026"
          >
            <div className="stat">
              <p className="stat-label">Cantones</p>
              <p className="stat-value">{data.cantones.length}</p>
              <p className="stat-note">Incluye Monteverde y Puerto Jiménez.</p>
            </div>
            <div className="stat">
              <p className="stat-label">Electorado</p>
              <p className="stat-value">
                {fmtInt(data.nacional.electorado)}
              </p>
              <p className="stat-note">
                Personas inscritas, incluido el extranjero.
              </p>
            </div>
            <div className="stat">
              <p className="stat-label">Participación</p>
              <p className="stat-value">
                {fmtPct(data.nacional.participacion, 2)}
              </p>
              <p className="stat-note">Del electorado inscrito.</p>
            </div>
            <div className="stat">
              <p className="stat-label">Votos válidos</p>
              <p className="stat-value">
                {fmtInt(data.nacional.votosValidos)}
              </p>
              <p className="stat-note">
                Base de los porcentajes de votación.
              </p>
            </div>
            <div className="stat">
              <p className="stat-label">Partidos</p>
              <p className="stat-value">{data.partidosNacional.length}</p>
              <p className="stat-note">Con candidatura presidencial.</p>
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
                <h2 id="participacion-heading">
                  Participación en la papeleta presidencial
                </h2>
                <p className="figure-sub">
                  Porcentaje del electorado inscrito que emitió un voto. El
                  resto de la barra es abstencionismo.
                </p>
              </figcaption>

              <div className="turnout">
                <div className="turnout-row">
                  <p className="turnout-year">2026</p>
                  <div
                    className="turnout-track"
                    role="img"
                    aria-label={`Participación ${fmtPct(
                      data.nacional.participacion,
                      2,
                    )}; abstencionismo ${fmtPct(
                      data.nacional.abstencionismo,
                      2,
                    )}.`}
                  >
                    <span
                      className="turnout-fill is-current"
                      style={{ width: `${data.nacional.participacion}%` }}
                    >
                      {fmtPct(data.nacional.participacion, 2)}
                    </span>
                  </div>
                  <div className="turnout-side">
                    <b>{fmtPct(data.nacional.abstencionismo, 2)}</b>
                    se abstuvo · {fmtInt(abstencionismoVotos)} personas
                  </div>
                </div>
              </div>

              <p className="figure-note">
                La participación se calcula sobre el electorado inscrito, no
                sobre los votos válidos. Los votos recibidos incluyen votos
                válidos y no válidos; en 2026, {fmtInt(votosNoValidos)} votos
                no fueron válidos.
              </p>
              <p className="source">
                Fuente: TSE · Participación en la papeleta presidencial. Incluye
                el voto en el extranjero.
              </p>
            </figure>
          </section>

          <section
            className="section"
            id="partidos"
            aria-labelledby="partidos-heading"
          >
            <figure className="figure">
              <figcaption className="figure-head">
                <p className="kicker">Votación · Presidencial</p>
                <h2 id="partidos-heading">Votos por partido</h2>
                <p className="figure-sub">
                  Votos válidos obtenidos por cada partido. El porcentaje se
                  calcula sobre los {fmtInt(data.nacional.votosValidos)} votos
                  válidos. Los votos y el porcentaje aparecen dentro de la
                  barra; los cantones ganados, fuera.
                </p>
              </figcaption>

              <div className="bar-toolbar">
                <p>
                  {showAllParties
                    ? `Mostrando los ${partyBars.length} partidos`
                    : `Mostrando 10 de ${partyBars.length} partidos`}
                </p>
                <button
                  type="button"
                  className="bar-expand"
                  aria-expanded={showAllParties}
                  aria-controls="partidos-bars"
                  onClick={() => setShowAllParties((value) => !value)}
                >
                  {showAllParties
                    ? "Ver solo los 10 primeros"
                    : `Ver los ${partyBars.length} partidos`}
                </button>
              </div>

              <div id="partidos-bars">
                <PartyBars
                  rows={
                    showAllParties ? partyBars : partyBars.slice(0, 10)
                  }
                  max={partyMax}
                  unit="votos"
                  highlight={winner.partido}
                  inlineValue
                />
              </div>

              <details className="disclosure">
                <summary>
                  Ver la tabla de los {data.partidosNacional.length} partidos
                </summary>
                <div className="table-wrap">
                  <table>
                    <caption className="sr-only">
                      Votos nacionales por partido en 2026
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Partido</th>
                        <th scope="col" className="num">
                          Votos
                        </th>
                        <th scope="col" className="num">
                          % votos
                        </th>
                        <th scope="col" className="num">
                          Cantones ganados
                        </th>
                        <th scope="col" className="num">
                          Provincias ganadas
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.partidosNacional.map((row) => (
                        <tr key={row.partido}>
                          <th scope="row">
                            <span
                              className={`party-dot ${partyClass(
                                row.partido,
                              )}`}
                              aria-hidden="true"
                            />
                            {displayParty(row.partido)}
                          </th>
                          <td className="num">{fmtInt(row.votos)}</td>
                          <td className="num">
                            {fmtPct(row.porcentajeVotos, 2)}
                          </td>
                          <td className="num strong">
                            {row.cantonesGanados}
                          </td>
                          <td className="num">{row.provinciasGanadas}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>

              <p className="figure-note">
                El total nacional incluye {fmtInt(votosExtranjero)} votos
                emitidos en el extranjero. Los cantones y provincias ganados se
                calculan solo con el territorio nacional.
              </p>
              <p className="source">
                Fuente: TSE · Cómputo de votos para presidencia y
                vicepresidencias.
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
                <p className="kicker">Mapa nacional · 2026</p>
                <h2 id="mapa-heading">Cada cuadro es un cantón</h2>
                <p className="deck">
                  El color indica el partido que ganó la presidencial en cada
                  cantón. Selecciona un cuadro para abrir la ficha del cantón.
                </p>
              </div>
              <p className="section-head-side">
                Presidencial 2026
                <br />
                Fuente: TSE
              </p>
            </div>

            <TileMap
              cantones={data.cantones}
              winnerForCanton={(canton) =>
                data.resumenPorCanton.get(canton.key)?.ganador
              }
              hrefForCanton={(canton) =>
                href.presidentialCantones(canton)
              }
              ariaLabel="Mapa de cantones ganados por partido en la presidencial 2026"
              legend={mapLegend}
            />
            <p className="source">
              Fuente: TSE · Resumen presidencial por cantón. Los partidos sin
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
                  Partido ganador, votos del ganador, margen y participación.
                  Cada nombre abre la ficha del cantón.
                </p>
              </div>
              <p className="section-head-side">Fuente: TSE</p>
            </div>

            <details className="disclosure">
              <summary>Ver los {data.cantones.length} cantones</summary>
              <div className="table-wrap">
                <table>
                  <caption className="sr-only">
                    Resultados presidenciales por cantón en 2026
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Provincia</th>
                      <th scope="col">Cantón</th>
                      <th scope="col">Ganador</th>
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
                      const resumen = data.resumenPorCanton.get(canton.key);
                      if (!resumen) return null;

                      const margen = ppLabel(
                        resumen.margenPp,
                        resumen.margenVotos,
                      );

                      return (
                        <tr key={canton.key}>
                          <td>{displayName(canton.provincia)}</td>
                          <th scope="row">
                            <a href={href.presidentialCantones(canton)}>
                              {displayName(canton.canton)}
                            </a>
                          </th>
                          <td>
                            <span
                              className={`party-dot ${partyClass(
                                resumen.ganador,
                              )}`}
                              aria-hidden="true"
                            />
                            {displayParty(resumen.ganador)}
                          </td>
                          <td className="num">
                            {fmtInt(resumen.votosGanador)}
                          </td>
                          <td className="num">{margen}</td>
                          <td className="num">
                            {fmtPct(resumen.participacion, 2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </details>

            <p className="source">
              Fuente: TSE · Resumen presidencial por cantón. La participación se
              calcula sobre el electorado inscrito.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
