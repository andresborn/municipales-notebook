import { useEffect, useMemo } from "react";

import { PageFooter } from "../components/PageFooter";
import {
  cantones,
  participacionNacional,
  partidosNacional,
  validosAlcaldesNacional,
} from "../lib/data";
import { fmtInt, fmtPct } from "../lib/format";

export function HomePage() {
  useEffect(() => {
    document.title =
      "Resultados de las elecciones municipales 2024 · Costa Rica";
  }, []);

  const nationalParties = useMemo(
    () =>
      [...partidosNacional]
        .filter((row) => row.votos > 0)
        .sort((a, b) => b.escanos - a.escanos || b.votos - a.votos),
    [],
  );

  const nationalTotals = useMemo(
    () =>
      partidosNacional.reduce(
        (totals, row) => ({
          votos: totals.votos + row.votos,
          escanos: totals.escanos + row.escanos,
        }),
        { votos: 0, escanos: 0 },
      ),
    [],
  );

  const maxNationalSeats = nationalParties[0]?.escanos ?? 1;

  const participacionPctNacional =
    (participacionNacional.votosRecibidos /
      participacionNacional.electorado) *
    100;
  const abstencionismoPctNacional =
    ((participacionNacional.electorado -
      participacionNacional.votosRecibidos) /
      participacionNacional.electorado) *
    100;
  const validosAlcaldesSobreRecibidosPct =
    (validosAlcaldesNacional / participacionNacional.votosRecibidos) * 100;
  const votosNoValidosAlcaldes =
    participacionNacional.votosRecibidos - validosAlcaldesNacional;
  const noValidosAlcaldesSobreRecibidosPct =
    (votosNoValidosAlcaldes / participacionNacional.votosRecibidos) * 100;

  return (
    <main className="app-shell">
      <header className="page-header home-header">
        <p className="eyebrow">Elecciones municipales · Costa Rica 2024</p>
        <h1>Resultados de las elecciones municipales 2024</h1>
        <p className="lede">
          Este sitio reúne los resultados de las elecciones municipales de Costa
          Rica de 2024.
        </p>

        <div className="hero-actions">
          <a className="button-link" href="#/cantones">
            Explorar resultados por cantón
            <span aria-hidden="true">→</span>
          </a>
        </div>

        <div className="home-facts">
          <div>
            <strong>{cantones.length}</strong>
            <span>cantones</span>
          </div>
          <div>
            <strong>{fmtInt(nationalTotals.escanos)}</strong>
            <span>regidurías</span>
          </div>
          <div>
            <strong>{nationalParties.length}</strong>
            <span>partidos con votos</span>
          </div>
        </div>
      </header>

      <section
        id="contexto-nacional"
        className="section"
        aria-labelledby="contexto-heading"
      >
        <div className="section-heading">
          <div>
            <p className="section-kicker">Contexto nacional</p>
            <h2 id="contexto-heading">Resultados en los 84 cantones</h2>
            <p className="section-subtitle">
              Participación en alcaldías y asignación agregada de regidurías en
              todo el país.
            </p>
          </div>
        </div>

        <div className="national-card">
          <div className="participation-panel">
            <div className="participation-heading">
              <h4>Participación nacional en alcaldías</h4>
              <p>
                Estos datos corresponden a la elección de alcaldías. Los
                porcentajes se calculan sobre el electorado inscrito; los
                indicadores de regidurías usan solo votos válidos.
              </p>
            </div>

            <div className="participation-grid">
              <article className="metric-card">
                <p className="metric-label">Electorado</p>
                <p className="metric-value">
                  {fmtInt(participacionNacional.electorado)}
                </p>
                <p className="metric-note">total inscrito</p>
              </article>
              <article className="metric-card">
                <p className="metric-label">Votos recibidos</p>
                <p className="metric-value">
                  {fmtInt(participacionNacional.votosRecibidos)}
                </p>
                <p className="metric-note">incluye votos válidos y no válidos</p>
              </article>
              <article className="metric-card">
                <p className="metric-label">Participación</p>
                <p className="metric-value participation-value">
                  {fmtPct(participacionPctNacional, 2)}
                </p>
                <p className="metric-note">del electorado</p>
              </article>
              <article className="metric-card">
                <p className="metric-label">Abstencionismo</p>
                <p className="metric-value abstention-value">
                  {fmtPct(abstencionismoPctNacional, 2)}
                </p>
                <p className="metric-note">del electorado</p>
              </article>
            </div>

            <div
              className="participation-bar"
              role="img"
              aria-label={`Participación ${fmtPct(
                participacionPctNacional,
                2,
              )}; abstencionismo ${fmtPct(abstencionismoPctNacional, 2)}.`}
            >
              <span style={{ width: `${participacionPctNacional}%` }} />
            </div>
            <p className="participation-note">
              La porción azul de la barra corresponde a los votos recibidos en
              las alcaldías y la gris al abstencionismo. Los votos válidos para
              alcaldías ({fmtInt(validosAlcaldesNacional)}) representan el{" "}
              {fmtPct(validosAlcaldesSobreRecibidosPct, 2)} de los votos
              recibidos; la diferencia ({fmtInt(votosNoValidosAlcaldes)} votos,{" "}
              {fmtPct(noValidosAlcaldesSobreRecibidosPct, 2)}) corresponde a
              votos no válidos.
            </p>
          </div>

          <div className="card-heading">
            <div>
              <h3>Regidurías por partido</h3>
              <p>
                Resultados agregados de regidurías en los 84 cantones. Se
                muestran todos los partidos que recibieron al menos un voto.
              </p>
            </div>
          </div>

          <div className="national-stats">
            <span className="stat-chip">
              <strong>{fmtInt(nationalTotals.escanos)}</strong> regidurías
            </span>
            <span className="stat-chip">
              <strong>{nationalParties.length}</strong> partidos con votos
            </span>
            <span className="stat-chip">
              <strong>{fmtInt(nationalTotals.votos)}</strong> votos válidos para
              regidurías
            </span>
          </div>

          <div className="table-wrap national-table-wrap">
            <table>
              <caption className="sr-only">
                Contexto nacional de regidurías por partido
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
                {nationalParties.map((row) => (
                  <tr key={row.partido}>
                    <th scope="row">{row.partido}</th>
                    <td className="num">{fmtInt(row.votos)}</td>
                    <td className="num">
                      <span className="seat-cell">
                        <span className="strong">{row.escanos}</span>
                        <span className="seat-bar" aria-hidden="true">
                          <span
                            style={{
                              width: `${
                                (row.escanos / maxNationalSeats) * 100
                              }%`,
                            }}
                          />
                        </span>
                      </span>
                    </td>
                    <td className="num">{fmtPct(row.porcentajeVotos)}</td>
                    <td className="num">{fmtPct(row.porcentajeEscanos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="table-note">
            Porcentajes calculados sobre el total nacional de votos válidos y de
            escaños. La tabla incluye los {nationalParties.length} partidos que
            recibieron al menos un voto, ordenados por escaños y luego por
            votos.
          </p>
        </div>
      </section>

      <PageFooter />
    </main>
  );
}
