import { useEffect } from "react";

import { PartyBars, type PartyBarRow } from "../components/PartyBars";
import { PresidentialCantonBar } from "../components/PresidentialCantonBar";
import { SiteFooter } from "../components/SiteFooter";
import { CLASSIFICATION_INFO, ppLabel } from "../lib/classification";
import { defaultCantonKey, type CantonSlug } from "../lib/data";
import { fmtDecimal, fmtInt, fmtPct } from "../lib/format";
import { displayName, displayParty, partyClass } from "../lib/parties";
import {
  findPresidentialCantonBySlug,
  presidential2026,
} from "../lib/presidential";
import { href } from "../lib/routes";

type PresidentialCantonPageProps = {
  cantonSlug?: CantonSlug;
};

export function PresidentialCantonPage({
  cantonSlug,
}: PresidentialCantonPageProps) {
  const data = presidential2026;
  const routeCanton = findPresidentialCantonBySlug(cantonSlug);
  const isFallback = Boolean(cantonSlug) && !routeCanton;
  const selectedCanton =
    routeCanton ??
    data.cantones.find((canton) => canton.key === defaultCantonKey) ??
    data.cantones[0];

  const resumen = selectedCanton
    ? data.resumenPorCanton.get(selectedCanton.key)
    : undefined;

  const partidos = selectedCanton
    ? (data.votosPorCanton.get(selectedCanton.key) ?? []).filter(
        (row) => row.votos > 0,
      )
    : [];

  useEffect(() => {
    const title = selectedCanton
      ? `${displayName(selectedCanton.canton)} · Presidencial 2026 · Elecciones Costa Rica`
      : "Presidencial 2026 · Elecciones Costa Rica";
    // oxlint-disable-next-line react/immutability
    document.title = title;
  }, [selectedCanton]);

  const handleSelect = (key: string) => {
    const canton = data.cantones.find((option) => option.key === key);
    if (!canton) return;
    window.location.hash = href.presidentialCantones(canton);
  };

  if (!selectedCanton || !resumen) {
    return (
      <>
        <main id="main" className="wrap page-body" tabIndex={-1}>
          <p>No hay datos disponibles para el cantón seleccionado.</p>
        </main>
        <SiteFooter />
      </>
    );
  }

  const shareOfValid = (votos: number) =>
    resumen.validos > 0 ? (votos / resumen.validos) * 100 : 0;

  const classification = CLASSIFICATION_INFO[resumen.clasificacion] ?? {
    className: "",
    threshold: "",
  };

  const winnerShare = shareOfValid(resumen.votosGanador);
  const secondShare = shareOfValid(resumen.votosSegundo);

  const topParties = partidos.slice(0, 10);
  const restParties = partidos.slice(10);
  const restVotes = restParties.reduce((total, row) => total + row.votos, 0);

  const partyBars: PartyBarRow[] = topParties.map((row) => ({
    key: row.partido,
    label: displayParty(row.partido),
    partido: row.partido,
    value: row.votos,
    note: fmtPct(shareOfValid(row.votos), 2),
  }));

  if (restParties.length > 0) {
    partyBars.push({
      key: "resto",
      label: `Resto (${restParties.length} partidos)`,
      partido: "OTROS PARTIDOS",
      value: restVotes,
      note: fmtPct(shareOfValid(restVotes), 2),
    });
  }

  const partyMax = partidos[0]?.votos ?? 1;

  return (
    <>
      <PresidentialCantonBar
        cantones={data.cantones}
        selected={selectedCanton}
        onSelect={handleSelect}
      />
      <main id="main" className="canton-page" tabIndex={-1}>
        <section className="canton-hero">
          <div className="wrap">
            <div className="election-head-top">
              <nav className="crumbs" aria-label="Ruta">
                <a href={href.landing()}>Inicio</a>
                <span className="sep" aria-hidden="true">
                  /
                </span>
                <a href={href.presidential()}>Presidencial 2026</a>
                <span className="sep" aria-hidden="true">
                  /
                </span>
                <span>{displayName(selectedCanton.canton)}</span>
              </nav>
            </div>

            {isFallback ? (
              <p className="canton-fallback-note" role="status">
                No se encontró el cantón solicitado. Se muestran los resultados
                de <b>{displayName(selectedCanton.canton)}</b>.
              </p>
            ) : null}

            <div className="canton-hero-grid">
              <div>
                <p className="kicker">
                  Provincia de {displayName(selectedCanton.provincia)}
                </p>
                <h1>{displayName(selectedCanton.canton)}</h1>
                <p className="canton-classification">
                  <span
                    className={`badge${
                      classification.className
                        ? ` ${classification.className}`
                        : ""
                    }`}
                  >
                    {resumen.clasificacion}
                  </span>
                  {classification.threshold ? (
                    <span className="canton-classification-note">
                      {classification.threshold}
                    </span>
                  ) : null}
                </p>
                <p className="deck">
                  Con {fmtInt(resumen.votosGanador)} votos válidos,{" "}
                  <strong>{displayParty(resumen.ganador)}</strong> ganó la
                  presidencial en {displayName(selectedCanton.canton)} por{" "}
                  {fmtInt(resumen.margenVotos)} votos (
                  {ppLabel(resumen.margenPp, resumen.margenVotos)}) sobre{" "}
                  {displayParty(resumen.segundo)}.
                </p>
                <div className="tag-row">
                  <span className="tag">
                    {partidos.length} partidos con votos
                  </span>
                  <span className="tag">
                    {fmtInt(resumen.validos)} votos válidos
                  </span>
                  <span className="tag">
                    {fmtInt(resumen.electorado)} electores
                  </span>
                </div>
              </div>

              <div
                className="duel"
                role="group"
                aria-label="Resultado entre el primero y el segundo lugar"
              >
                <div className={`duel-row ${partyClass(resumen.ganador)}`}>
                  <p className="duel-tag">Ganador</p>
                  <div className="duel-line">
                    <p className="duel-party">
                      {displayParty(resumen.ganador)}
                    </p>
                    <p className="duel-votes">
                      {fmtInt(resumen.votosGanador)}
                      <small>votos</small>
                    </p>
                  </div>
                  <div className="duel-bar">
                    <i style={{ width: `${winnerShare}%` }} />
                  </div>
                  <p className="duel-foot">
                    <span>{fmtPct(winnerShare, 2)} de los votos válidos</span>
                  </p>
                </div>

                <div className={`duel-row ${partyClass(resumen.segundo)}`}>
                  <p className="duel-tag">Segundo lugar</p>
                  <div className="duel-line">
                    <p className="duel-party">
                      {displayParty(resumen.segundo)}
                    </p>
                    <p className="duel-votes">
                      {fmtInt(resumen.votosSegundo)}
                      <small>votos</small>
                    </p>
                  </div>
                  <div className="duel-bar">
                    <i style={{ width: `${secondShare}%` }} />
                  </div>
                  <p className="duel-foot">
                    <span>{fmtPct(secondShare, 2)} de los votos válidos</span>
                  </p>
                </div>

                <p className="duel-margin">
                  <span>Ventaja del ganador</span>
                  <b>
                    {fmtInt(resumen.margenVotos)} votos ·{" "}
                    {ppLabel(resumen.margenPp, resumen.margenVotos)}
                  </b>
                </p>
              </div>
            </div>

            <div
              className="canton-stats"
              role="group"
              aria-label={`Cifras de ${displayName(
                selectedCanton.canton,
              )} en la presidencial 2026`}
            >
              <div className="stat">
                <p className="stat-label">Margen</p>
                <p className="stat-value">
                  {ppLabel(resumen.margenPp, resumen.margenVotos)}
                </p>
                <p className="stat-note">{fmtInt(resumen.margenVotos)} votos</p>
              </div>
              <div className="stat">
                <p className="stat-label">Swing</p>
                <p className="stat-value">
                  {ppLabel(resumen.swingPp, resumen.margenVotos)}
                </p>
                <p className="stat-note">mitad del margen</p>
              </div>
              <div className="stat">
                <p className="stat-label">Cuota del ganador</p>
                <p className="stat-value">
                  {fmtPct(resumen.cuotaGanador, 1)}
                </p>
                <p className="stat-note">de los votos válidos</p>
              </div>
              <div className="stat">
                <p className="stat-label">ENP</p>
                <p className="stat-value">{fmtDecimal(resumen.enp, 2)}</p>
                <p className="stat-note">partidos efectivos</p>
              </div>
              <div className="stat">
                <p className="stat-label">Participación</p>
                <p className="stat-value">
                  {fmtPct(resumen.participacion, 2)}
                </p>
                <p className="stat-note">
                  {fmtInt(resumen.electorado)} electores
                </p>
              </div>
              <div className="stat">
                <p className="stat-label">Abstencionismo</p>
                <p className="stat-value">
                  {fmtPct(resumen.abstencionismo, 2)}
                </p>
                <p className="stat-note">del electorado</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="votacion-heading">
          <div className="wrap">
            <div className="subhead">
              <div>
                <p className="kicker">01 · Presidencial</p>
                <h2 id="votacion-heading">Votación por partido</h2>
              </div>
              <p className="subhead-note">
                El ganador se define por mayoría simple.
              </p>
            </div>

            <figure className="figure figure--flush">
              <figcaption className="figure-head">
                <p className="figure-sub">
                  Votos y porcentaje sobre los {fmtInt(resumen.validos)} votos
                  válidos. {partidos.length} partidos recibieron al menos un
                  voto.
                </p>
              </figcaption>

              <PartyBars
                rows={partyBars}
                max={partyMax}
                unit="votos"
                highlight={resumen.ganador}
              />

              <div
                className="legend"
                role="group"
                aria-label="Cómo leer las barras"
              >
                <span>
                  <i className="legend-win" aria-hidden="true" />
                  El ganador está marcado con 1.º
                </span>
                {restParties.length > 0 ? (
                  <span>
                    Los partidos con menos votos se agrupan en «Resto».
                  </span>
                ) : null}
              </div>

              <details className="disclosure">
                <summary>Ver los {partidos.length} partidos con votos</summary>
                <div className="table-wrap">
                  <table>
                    <caption className="sr-only">
                      Resultados presidenciales en{" "}
                      {displayName(selectedCanton.canton)}
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col" className="num">
                          #
                        </th>
                        <th scope="col">Partido</th>
                        <th scope="col" className="num">
                          Votos
                        </th>
                        <th scope="col" className="num">
                          % válidos
                        </th>
                        <th scope="col" className="num">
                          Diferencia
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {partidos.map((row, index) => {
                        const isWinner = row.partido === resumen.ganador;
                        const difference = isWinner
                          ? null
                          : resumen.votosGanador - row.votos;

                        return (
                          <tr
                            key={row.partido}
                            className={isWinner ? "is-winner" : undefined}
                          >
                            <td className="num">{index + 1}</td>
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
                              {fmtPct(shareOfValid(row.votos), 2)}
                            </td>
                            <td className="num">
                              {difference === null ? "—" : fmtInt(difference)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </details>

              <p className="source">
                Fuente: TSE · Resultados presidenciales por cantón. La
                diferencia se mide contra el partido ganador.
              </p>
            </figure>
          </div>
        </section>

        <section className="section" aria-labelledby="participacion-heading">
          <div className="wrap">
            <div className="subhead">
              <div>
                <p className="kicker">02 · Participación</p>
                <h2 id="participacion-heading">
                  Participación y abstencionismo
                </h2>
              </div>
              <p className="subhead-note">
                Una sola papeleta: presidencial y vicepresidencias.
              </p>
            </div>

            <div className="table-wrap">
              <table className="participation-table">
                <caption className="sr-only">
                  Participación presidencial en{" "}
                  {displayName(selectedCanton.canton)}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Papeleta</th>
                    <th scope="col">Electorado</th>
                    <th scope="col">Votos recibidos</th>
                    <th scope="col">Participación</th>
                    <th scope="col">Abstencionismo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Presidencial</th>
                    <td>{fmtInt(resumen.electorado)}</td>
                    <td>{fmtInt(resumen.votosRecibidos)}</td>
                    <td>{fmtPct(resumen.participacion, 2)}</td>
                    <td>{fmtPct(resumen.abstencionismo, 2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="table-wrap">
              <table>
                <caption className="sr-only">
                  Votos válidos, nulos y blancos en{" "}
                  {displayName(selectedCanton.canton)}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Votos válidos</th>
                    <th scope="col">Votos nulos</th>
                    <th scope="col">Votos blancos</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{fmtInt(resumen.validos)}</td>
                    <td>{fmtInt(resumen.votosNulos)}</td>
                    <td>{fmtInt(resumen.votosBlancos)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="figure-note">
              Los votos válidos son la base de los porcentajes de votación. Los
              votos nulos y blancos se contabilizan aparte y no se asignan a
              ningún partido.
            </p>
            <p className="source">
              Fuente: TSE · La participación se calcula sobre el electorado
              inscrito, no sobre los votos válidos.
            </p>
          </div>
        </section>

        <section className="section" aria-labelledby="glosario-heading">
          <div className="wrap">
            <div className="subhead">
              <div>
                <p className="kicker">Referencia</p>
                <h2 id="glosario-heading">Glosario de términos</h2>
              </div>
              <p className="subhead-note">
                Definiciones de las cifras que aparecen en esta ficha.
              </p>
            </div>

            <dl className="glossary">
              <div>
                <dt>Margen</dt>
                <dd>
                  Diferencia entre el primero y el segundo lugar, en votos y en
                  puntos porcentuales.
                </dd>
              </div>
              <div>
                <dt>Competitividad</dt>
                <dd>
                  Clasificación según el margen del ganador: muy disputado
                  (menos de 5 pp), disputado (5 a 10 pp), poco disputado (10 a
                  20 pp) y dominado (20 pp o más).
                </dd>
              </div>
              <div>
                <dt>Swing</dt>
                <dd>
                  Mitad del margen. Es el cambio de votos, en puntos
                  porcentuales, necesario para que el segundo lugar alcance al
                  primero.
                </dd>
              </div>
              <div>
                <dt>Cuota del ganador</dt>
                <dd>
                  Porcentaje de los votos válidos obtenido por el partido
                  ganador.
                </dd>
              </div>
              <div>
                <dt>ENP</dt>
                <dd>
                  Número efectivo de partidos: 1 dividido entre la suma de los
                  cuadrados de las cuotas de votación.
                </dd>
              </div>
              <div>
                <dt>Votos válidos</dt>
                <dd>
                  Votos contabilizados para la asignación de cargos. Son la base
                  de los porcentajes de votación.
                </dd>
              </div>
              <div>
                <dt>Votos nulos y blancos</dt>
                <dd>
                  Votos que no se asignan a ningún partido. Se suman a los votos
                  válidos para obtener los votos recibidos.
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
