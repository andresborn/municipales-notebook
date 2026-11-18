import { useEffect, useState } from "react";

import { ArrowIcon } from "../components/ArrowIcon";
import { CantonSeatStrips } from "../components/CantonSeatStrips";
import { PartyBars, type PartyBarRow } from "../components/PartyBars";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { TileMap } from "../components/TileMap";
import { YearSwitch } from "../components/YearSwitch";
import { elections, type ElectionYear } from "../lib/data";
import { fmtDecimal, fmtInt, fmtPct, fmtPp } from "../lib/format";
import {
  displayName,
  displayParty,
  partyClass,
} from "../lib/parties";
import { href } from "../lib/routes";

type HomePageProps = {
  year: ElectionYear;
};

export function HomePage({ year }: HomePageProps) {
  const data = elections[year];
  const [showAllAlcaldias, setShowAllAlcaldias] = useState(false);

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

  const alcaldiaBars: PartyBarRow[] = data.partidosAlcaldiaNacional.map(
    (row) => ({
      key: row.partido,
      label: displayParty(row.partido),
      partido: row.partido,
      value: row.votos,
      note: fmtPct(row.porcentajeVotos, 2),
      aside: `${fmtInt(row.alcaldias)} ${
        row.alcaldias === 1 ? "alcaldía" : "alcaldías"
      }`,
    }),
  );

  const alcaldiaMax = data.partidosAlcaldiaNacional[0]?.votos ?? 1;

  useEffect(() => {
    document.title = `Resultados municipales ${year} · Elecciones Costa Rica`;
  }, [year]);

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
              <h1>
                Resumen nacional de resultados de las elecciones municipales{" "}
                {year}
              </h1>
              <p className="deck">
                Alcaldías, regidurías y participación en los{" "}
                {data.cantones.length} cantones.
              </p>
              <div className="election-title-link">
                <a className="link-arrow head-link" href={href.cantones(year)}>
                  Ver fichas por cantón
                  <ArrowIcon />
                </a>
              </div>
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
              <p className="stat-note">
                Base de cálculo de alcaldías, márgenes y porcentajes de votos.
              </p>
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
                <h2 id="participacion-heading">
                  Participación en la papeleta de alcaldía
                </h2>
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
                <p className="kicker">Votación · Alcaldía</p>
                <h2 id="alcaldias-heading">Votos y alcaldías por partido</h2>
                <p className="figure-sub">
                  Votos válidos obtenidos por cada partido en los{" "}
                  {data.cantones.length} cantones. El porcentaje se calcula
                  sobre los {fmtInt(data.validosAlcaldesNacional)} votos válidos
                  a alcaldía. Los votos y el porcentaje aparecen dentro de la
                  barra; las alcaldías ganadas, fuera.
                </p>
              </figcaption>

              <div className="bar-toolbar">
                <p>
                  {showAllAlcaldias
                    ? `Mostrando los ${alcaldiaBars.length} partidos`
                    : `Mostrando 10 de ${alcaldiaBars.length} partidos`}
                </p>
                <button
                  type="button"
                  className="bar-expand"
                  aria-expanded={showAllAlcaldias}
                  aria-controls="alcaldias-bars"
                  onClick={() => setShowAllAlcaldias((value) => !value)}
                >
                  {showAllAlcaldias
                    ? "Ver solo los 10 primeros"
                    : `Ver los ${alcaldiaBars.length} partidos`}
                </button>
              </div>

              <div id="alcaldias-bars">
                <PartyBars
                  rows={
                    showAllAlcaldias ? alcaldiaBars : alcaldiaBars.slice(0, 10)
                  }
                  max={alcaldiaMax}
                  unit="votos"
                  inlineValue
                />
              </div>

              <details className="disclosure">
                <summary>
                  Ver la tabla de los {data.partidosAlcaldiaNacional.length}{" "}
                  partidos
                </summary>
                <div className="table-wrap">
                  <table>
                    <caption className="sr-only">
                      Votos y alcaldías por partido en {year}
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
                          Cantones con votos
                        </th>
                        <th scope="col" className="num">
                          Alcaldías
                        </th>
                        <th scope="col" className="num">
                          % de cantones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.partidosAlcaldiaNacional.map((row) => (
                        <tr key={row.partido}>
                          <th scope="row">
                            <span
                              className={`party-dot ${partyClass(row.partido)}`}
                              aria-hidden="true"
                            />
                            {displayParty(row.partido)}
                          </th>
                          <td className="num">{fmtInt(row.votos)}</td>
                          <td className="num">
                            {fmtPct(row.porcentajeVotos, 2)}
                          </td>
                          <td className="num">{row.cantonesConVotos}</td>
                          <td className="num strong">{row.alcaldias}</td>
                          <td className="num">
                            {fmtPct(row.porcentajeAlcaldias, 2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>

              <p className="figure-note">
                Cada alcaldía se decide en su cantón; por eso el porcentaje de
                votos y la cantidad de alcaldías miden cosas distintas. No todos
                los partidos presentan candidaturas en todos los cantones:
                «Cantones con votos» indica en cuántos cantones recibió votos
                cada partido.
              </p>
              <p className="source">
                Fuente: TSE · Cómputo de votos para alcaldías y resumen de
                alcaldías por cantón.
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
                <p className="kicker">Votación · Regidurías</p>
                <h2 id="regidurias-heading">Votos y regidurías por partido</h2>
                <p className="figure-sub">
                  Votos válidos obtenidos por cada partido y regidurías
                  asignadas por cociente, subcociente y resto en los{" "}
                  {data.cantones.length} cantones. El porcentaje se calcula
                  sobre los {fmtInt(data.validosRegiduriasNacional)} votos
                  válidos a regidurías.
                </p>
              </figcaption>

              <CantonSeatStrips
                year={year}
                cantones={data.cantones}
                escanosPorCanton={data.escanosPorCanton}
                defaultOpen
              />

              <details className="disclosure">
                <summary>
                  Ver votos por regidurías de los{" "}
                  {data.partidosRegiduriaNacional.length} partidos
                </summary>
                <div className="table-wrap">
                  <table>
                    <caption className="sr-only">
                      Votos y regidurías por partido en {year}
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Partido</th>
                        <th scope="col" className="num">
                          Votos
                        </th>
                        <th scope="col" className="num">
                          Regidurías
                        </th>
                        <th scope="col" className="num">
                          % votos
                        </th>
                        <th scope="col" className="num">
                          % regidurías
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.partidosRegiduriaNacional.map((row) => (
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
                La tabla incluye los {data.partidosRegiduriaNacional.length}{" "}
                partidos que recibieron al menos un voto. Las regidurías se
                asignan por cantón, no en una circunscripción nacional.
              </p>
              <p className="source">
                Fuente: TSE · Cómputo de votos y asignación de regidurías por
                cantón.
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
