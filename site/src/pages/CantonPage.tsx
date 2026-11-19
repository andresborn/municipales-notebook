import { useEffect } from "react";

import { CantonBar } from "../components/CantonBar";
import { PartyBars, type PartyBarRow } from "../components/PartyBars";
import { SiteFooter } from "../components/SiteFooter";
import {
  defaultCantonKey,
  elections,
  findCantonBySlug,
  type CantonSlug,
  type ElectionYear,
} from "../lib/data";
import { fmtDecimal, fmtInt, fmtPct, fmtPp } from "../lib/format";
import { displayName, displayParty, partyClass } from "../lib/parties";
import { href, type CantonLink } from "../lib/routes";

type CantonPageProps = {
  year: ElectionYear;
  cantonSlug?: CantonSlug;
};

/** Un margen puede ser positivo y aun así redondear a 0,0 pp. */
const ppLabel = (value: number, votes: number) =>
  votes > 0 && value < 0.1 ? "<0,1 pp" : fmtPp(value);

const CLASSIFICATION_INFO: Record<
  string,
  { className: string; threshold: string }
> = {
  "Muy disputado": {
    className: "badge--hot",
    threshold: "Margen menor a 5 pp",
  },
  Disputado: {
    className: "badge--dark",
    threshold: "Margen entre 5 y 10 pp",
  },
  "Poco disputado": {
    className: "badge--soft",
    threshold: "Margen entre 10 y 20 pp",
  },
  Dominado: {
    className: "",
    threshold: "Margen de 20 pp o más",
  },
};

export function CantonPage({ year, cantonSlug }: CantonPageProps) {
  const data = elections[year];
  const otherYear: ElectionYear = year === 2020 ? 2024 : 2020;
  const routeCanton = findCantonBySlug(data, cantonSlug);
  const isFallback = Boolean(cantonSlug) && !routeCanton;
  const selectedCanton =
    routeCanton ??
    data.cantones.find((canton) => canton.key === defaultCantonKey) ??
    data.cantones[0];

  const alcalde = selectedCanton
    ? data.alcaldePorCanton.get(selectedCanton.key)
    : undefined;
  const regiduria = selectedCanton
    ? data.regiduriaPorCanton.get(selectedCanton.key)
    : undefined;
  const escanos = selectedCanton
    ? (data.escanosPorCanton.get(selectedCanton.key) ?? [])
    : [];
  const partidos = selectedCanton
    ? (data.alcaldesPartidoPorCanton.get(selectedCanton.key) ?? [])
    : [];

  /**
   * Si el enlace pide un cantón que no existía en este año (Monteverde y
   * Puerto Jiménez en 2020), se muestra el cantón por defecto y se conserva el
   * enlace original para poder volver a él al cambiar de año.
   */
  const missingCanton =
    isFallback && cantonSlug
      ? findCantonBySlug(elections[otherYear], cantonSlug)
      : undefined;

  useEffect(() => {
    const title = selectedCanton
      ? `${displayName(selectedCanton.canton)} · Municipales ${year} · Elecciones Costa Rica`
      : `Resultados por cantón · Municipales ${year} · Elecciones Costa Rica`;
    // oxlint-disable-next-line react/immutability
    document.title = title;
  }, [selectedCanton, year]);

  const cantonByYear: Partial<Record<ElectionYear, CantonLink>> = {};

  if (selectedCanton) {
    cantonByYear[year] = selectedCanton;

    const targetData = elections[otherYear];

    if (isFallback && cantonSlug) {
      // Volver desde un cantón que no existía en este año debe llevar al
      // cantón original (por ejemplo, Monteverde 2024).
      const original = findCantonBySlug(targetData, cantonSlug);
      if (original) cantonByYear[otherYear] = original;
    } else {
      const sameCanton = targetData.cantones.find(
        (canton) => canton.key === selectedCanton.key,
      );

      cantonByYear[otherYear] = sameCanton ?? {
        slugProvincia: selectedCanton.slugProvincia,
        slugCanton: selectedCanton.slugCanton,
      };
    }
  }

  const handleSelect = (key: string) => {
    const canton = data.cantones.find((option) => option.key === key);
    if (!canton) return;
    window.location.hash = href.cantones(year, canton);
  };

  if (!selectedCanton || !alcalde) {
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
    alcalde.validos > 0 ? (votos / alcalde.validos) * 100 : 0;

  const classification = CLASSIFICATION_INFO[alcalde.clasificacion] ?? {
    className: "",
    threshold: "",
  };

  const winnerShare = shareOfValid(alcalde.votosGanador);
  const secondShare = shareOfValid(alcalde.votosSegundo);

  const topParties = partidos.slice(0, 10);
  const restParties = partidos.slice(10);
  const restVotes = restParties.reduce((total, row) => total + row.votos, 0);

  const alcaldiaBars: PartyBarRow[] = topParties.map((row) => ({
    key: row.partido,
    label: displayParty(row.partido),
    partido: row.partido,
    value: row.votos,
    note: fmtPct(shareOfValid(row.votos), 2),
  }));

  if (restParties.length > 0) {
    alcaldiaBars.push({
      key: "resto",
      label: `Resto (${restParties.length} partidos)`,
      partido: "OTROS PARTIDOS",
      value: restVotes,
      note: fmtPct(shareOfValid(restVotes), 2),
    });
  }

  const alcaldiaMax = partidos[0]?.votos ?? 1;
  const seatParties = escanos.filter((row) => row.escanos > 0);
  const seatTotal = seatParties.reduce((total, row) => total + row.escanos, 0);
  const regiduriasTotal = regiduria?.regidurias ?? seatTotal;
  const seatSummary = seatParties
    .map((row) => `${displayParty(row.partido)}: ${row.escanos}`)
    .join("; ");

  const thresholdFor = (votos: number) => {
    if (regiduria && votos >= regiduria.cociente) {
      return { className: "chip--q", label: "≥ cociente" };
    }
    if (regiduria && votos >= regiduria.subcociente) {
      return { className: "chip--sq", label: "≥ subcociente" };
    }
    return { className: "chip--no", label: "< subcociente" };
  };

  const partiesWithoutSeats = regiduria
    ? Math.max(0, escanos.length - regiduria.partidosConEscanos)
    : 0;

  return (
    <>
      <CantonBar
        year={year}
        cantones={data.cantones}
        selected={selectedCanton}
        onSelect={handleSelect}
        cantonByYear={cantonByYear}
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
                <a href={href.home(year)}>Municipales {year}</a>
                <span className="sep" aria-hidden="true">
                  /
                </span>
                <span>{displayName(selectedCanton.canton)}</span>
              </nav>
            </div>

            {missingCanton ? (
              <p className="canton-fallback-note" role="status">
                <b>{displayName(missingCanton.canton)}</b> no aparece en los
                resultados de {year}. Se muestran los resultados de{" "}
                <b>{displayName(selectedCanton.canton)}</b>.
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
                    {alcalde.clasificacion}
                  </span>
                  {classification.threshold ? (
                    <span className="canton-classification-note">
                      {classification.threshold}
                    </span>
                  ) : null}
                </p>
                <p className="deck">
                  Con {fmtInt(alcalde.votosGanador)} votos válidos,{" "}
                  <strong>{displayParty(alcalde.ganador)}</strong> ganó la
                  alcaldía por {fmtInt(alcalde.margenVotos)} votos (
                  {ppLabel(alcalde.margenPp, alcalde.margenVotos)}) sobre{" "}
                  {displayParty(alcalde.segundo)}.
                </p>
                <div className="tag-row">
                  <span className="tag">
                    {partidos.length} partidos con votos
                  </span>
                  <span className="tag">
                    {fmtInt(regiduriasTotal)} regidurías
                  </span>
                  <span className="tag">
                    {fmtInt(alcalde.validos)} votos válidos
                  </span>
                </div>
              </div>

              <div
                className="duel"
                role="group"
                aria-label="Resultado entre el primero y el segundo lugar"
              >
                <div className={`duel-row ${partyClass(alcalde.ganador)}`}>
                  <p className="duel-tag">Ganador</p>
                  <div className="duel-line">
                    <p className="duel-party">
                      {displayParty(alcalde.ganador)}
                    </p>
                    <p className="duel-votes">
                      {fmtInt(alcalde.votosGanador)}
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

                <div className={`duel-row ${partyClass(alcalde.segundo)}`}>
                  <p className="duel-tag">Segundo lugar</p>
                  <div className="duel-line">
                    <p className="duel-party">
                      {displayParty(alcalde.segundo)}
                    </p>
                    <p className="duel-votes">
                      {fmtInt(alcalde.votosSegundo)}
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
                    {fmtInt(alcalde.margenVotos)} votos ·{" "}
                    {ppLabel(alcalde.margenPp, alcalde.margenVotos)}
                  </b>
                </p>
              </div>
            </div>

            <div
              className="canton-stats"
              role="group"
              aria-label={`Cifras de ${displayName(selectedCanton.canton)} en ${year}`}
            >
              <div className="stat">
                <p className="stat-label">Margen</p>
                <p className="stat-value">
                  {ppLabel(alcalde.margenPp, alcalde.margenVotos)}
                </p>
                <p className="stat-note">{fmtInt(alcalde.margenVotos)} votos</p>
              </div>
              <div className="stat">
                <p className="stat-label">Swing</p>
                <p className="stat-value">
                  {ppLabel(alcalde.swingPp, alcalde.margenVotos)}
                </p>
                <p className="stat-note">mitad del margen</p>
              </div>
              <div className="stat">
                <p className="stat-label">Cuota del ganador</p>
                <p className="stat-value">{fmtPct(alcalde.cuotaGanador, 1)}</p>
                <p className="stat-note">de los votos válidos</p>
              </div>
              <div className="stat">
                <p className="stat-label">ENP</p>
                <p className="stat-value">{fmtDecimal(alcalde.enp, 2)}</p>
                <p className="stat-note">partidos efectivos</p>
              </div>
              <div className="stat">
                <p className="stat-label">Participación</p>
                <p className="stat-value">{fmtPct(alcalde.participacion, 2)}</p>
                <p className="stat-note">
                  {fmtInt(alcalde.electorado)} electores
                </p>
              </div>
              <div className="stat">
                <p className="stat-label">Abstencionismo</p>
                <p className="stat-value">
                  {fmtPct(alcalde.abstencionismo, 2)}
                </p>
                <p className="stat-note">del electorado</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="alcaldia-heading">
          <div className="wrap">
            <div className="subhead">
              <div>
                <p className="kicker">01 · Alcaldía</p>
                <h2 id="alcaldia-heading">Votación por partido</h2>
              </div>
              <p className="subhead-note">
                El ganador se define por mayoría simple. No hay segunda vuelta
                en las elecciones municipales.
              </p>
            </div>

            <figure className="figure figure--flush">
              <figcaption className="figure-head">
                <p className="figure-sub">
                  Votos y porcentaje sobre los {fmtInt(alcalde.validos)} votos
                  válidos. {partidos.length} partidos recibieron al menos un
                  voto.
                </p>
              </figcaption>

              {/*
                Para volver a Observable Plot, importa PlotPartyVotes y cambia
                <PartyBars /> por:
                <PlotPartyVotes rows={alcaldiaBars} max={alcaldiaMax} unit="votos" />
                PlotPartyVotes vive en ../components/PlotPartyVotes.tsx y no se
                importa por defecto para mantener Plot fuera del bundle.
              */}
              <PartyBars
                rows={alcaldiaBars}
                max={alcaldiaMax}
                unit="votos"
                highlight={alcalde.ganador}
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
                      Resultados de alcaldía en{" "}
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
                        const isWinner = row.partido === alcalde.ganador;
                        const difference = isWinner
                          ? null
                          : alcalde.votosGanador - row.votos;

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
                Fuente: TSE · Resultados de alcaldía. La diferencia se mide
                contra el partido ganador.
              </p>
            </figure>
          </div>
        </section>

        <section className="section" aria-labelledby="concejo-heading">
          <div className="wrap">
            <div className="subhead">
              <div>
                <p className="kicker">02 · Concejo municipal</p>
                <h2 id="concejo-heading">Composición del concejo</h2>
              </div>
              <p className="subhead-note">
                {fmtInt(regiduriasTotal)} regidurías en disputa.
                {regiduria
                  ? ` La mayoría absoluta requiere ${regiduria.mayoria} escaños.`
                  : null}
              </p>
            </div>

            {regiduria ? (
              <div className="callout">
                <span className="marker" aria-hidden="true">
                  {regiduria.tieneMayoria ? "✓" : "i"}
                </span>
                <p>
                  {regiduria.tieneMayoria ? (
                    <>
                      <b>{displayParty(regiduria.partidoMasVotos)}</b> alcanzó
                      la mayoría absoluta con {regiduria.escanosPrimero} de{" "}
                      {regiduria.regidurias} regidurías.
                    </>
                  ) : (
                    <>
                      Ningún partido alcanzó la mayoría absoluta de{" "}
                      <b>{regiduria.mayoria} escaños</b>. El partido con más
                      votos fue <b>{displayParty(regiduria.partidoMasVotos)}</b>
                      , con {regiduria.escanosPrimero} de {regiduria.regidurias}{" "}
                      regidurías.
                    </>
                  )}
                </p>
              </div>
            ) : null}

            <div className="canton-layout">
              <div>
                <div
                  className="seat-waffle"
                  role="img"
                  aria-label={`Distribución de las ${fmtInt(
                    regiduriasTotal,
                  )} regidurías. ${seatSummary}.`}
                >
                  {seatParties.flatMap((row) =>
                    Array.from({ length: row.escanos }, (_, index) => (
                      <i
                        key={`${row.partido}-${index}`}
                        className={partyClass(row.partido)}
                        title={displayParty(row.partido)}
                      />
                    )),
                  )}
                </div>

                <div className="seat-legend">
                  {seatParties.map((row) => (
                    <div className="seat-legend-row" key={row.partido}>
                      <span
                        className={`party-dot ${partyClass(row.partido)}`}
                        aria-hidden="true"
                      />
                      <span className="name">{displayParty(row.partido)}</span>
                      <span className="s">{fmtInt(row.votos)} votos</span>
                      <span className="n">{row.escanos}</span>
                    </div>
                  ))}
                </div>
                <p className="source">
                  Cada cuadro es una regiduría. El color identifica al partido.
                </p>
              </div>

              <div>
                {regiduria ? (
                  <>
                    <div className="threshold-strip">
                      <div className="threshold">
                        <span>Cociente</span>
                        <b>{fmtInt(Math.floor(regiduria.cociente))} votos</b>
                        <p>
                          Votos válidos ÷ {regiduria.regidurias} regidurías.
                          Valor exacto: {fmtDecimal(regiduria.cociente, 2)}.
                        </p>
                      </div>
                      <div className="threshold">
                        <span>Subcociente</span>
                        <b>{fmtInt(Math.floor(regiduria.subcociente))} votos</b>
                        <p>
                          Mitad del cociente. Mínimo para entrar al reparto por
                          resto.
                        </p>
                      </div>
                    </div>

                    <p className="note">
                      <span className="note-mark">i</span>
                      <span>
                        Los umbrales se comparan con los valores exactos; aquí
                        se muestran truncados al entero. Alcanzar el subcociente
                        habilita el reparto por resto, pero no garantiza un
                        escaño.
                      </span>
                    </p>

                    <div className="callout callout--dark">
                      <span className="marker" aria-hidden="true">
                        *
                      </span>
                      <p>
                        {regiduria.partidosConEscanos} partidos obtuvieron al
                        menos una regiduría.{" "}
                        {partiesWithoutSeats === 0
                          ? "Todos los partidos con votos obtuvieron representación."
                          : partiesWithoutSeats === 1
                            ? "1 partido con votos se quedó sin representación."
                            : `${partiesWithoutSeats} partidos con votos se quedaron sin representación.`}
                      </p>
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <caption className="sr-only">
                  Asignación de regidurías en{" "}
                  {displayName(selectedCanton.canton)}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Partido</th>
                    <th scope="col" className="num">
                      Votos
                    </th>
                    <th scope="col" className="num">
                      % válidos
                    </th>
                    <th scope="col" className="num">
                      Por cociente
                    </th>
                    <th scope="col" className="num">
                      Por resto
                    </th>
                    <th scope="col" className="num">
                      Total
                    </th>
                    <th scope="col">Umbral</th>
                  </tr>
                </thead>
                <tbody>
                  {escanos.map((row) => {
                    const threshold = thresholdFor(row.votos);
                    const share =
                      regiduria && regiduria.votosValidos > 0
                        ? (row.votos / regiduria.votosValidos) * 100
                        : 0;

                    return (
                      <tr
                        key={row.partido}
                        className={row.escanos > 0 ? "has-seat" : undefined}
                      >
                        <th scope="row">
                          <span
                            className={`party-dot ${partyClass(row.partido)}`}
                            aria-hidden="true"
                          />
                          {displayParty(row.partido)}
                        </th>
                        <td className="num">{fmtInt(row.votos)}</td>
                        <td className="num">{fmtPct(share, 2)}</td>
                        <td className="num">{row.escanosCociente || "—"}</td>
                        <td className="num">{row.escanosResto || "—"}</td>
                        <td className="num strong">{row.escanos}</td>
                        <td>
                          <span className={`chip ${threshold.className}`}>
                            {threshold.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="source">
              Fuente: TSE · Escaños de regiduría asignados por cantón.
            </p>
          </div>
        </section>

        <section className="section" aria-labelledby="participacion-heading">
          <div className="wrap">
            <div className="subhead">
              <div>
                <p className="kicker">03 · Participación</p>
                <h2 id="participacion-heading">
                  Participación y abstencionismo
                </h2>
              </div>
              <p className="subhead-note">
                Alcaldía y regiduría son papeletas distintas: sus votos
                recibidos pueden diferir.
              </p>
            </div>

            <div className="table-wrap">
              <table className="participation-table">
                <caption className="sr-only">
                  Participación por papeleta en{" "}
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
                    <th scope="row">Alcaldía</th>
                    <td>{fmtInt(alcalde.electorado)}</td>
                    <td>{fmtInt(alcalde.votosRecibidos)}</td>
                    <td>{fmtPct(alcalde.participacion, 2)}</td>
                    <td>{fmtPct(alcalde.abstencionismo, 2)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Regiduría</th>
                    <td>
                      {fmtInt(regiduria?.electorado ?? alcalde.electorado)}
                    </td>
                    <td>
                      {fmtInt(
                        regiduria?.votosRecibidos ?? alcalde.votosRecibidos,
                      )}
                    </td>
                    <td>
                      {fmtPct(
                        regiduria?.participacion ?? alcalde.participacion,
                        2,
                      )}
                    </td>
                    <td>
                      {fmtPct(
                        regiduria?.abstencionismo ?? alcalde.abstencionismo,
                        2,
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
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
                <dt>Cociente</dt>
                <dd>
                  Votos válidos de la papeleta de regiduría divididos entre el
                  número de regidurías en disputa.
                </dd>
              </div>
              <div>
                <dt>Subcociente</dt>
                <dd>
                  Mitad del cociente. Es el mínimo para participar en el reparto
                  de escaños por resto.
                </dd>
              </div>
              <div>
                <dt>Mayoría absoluta</dt>
                <dd>
                  Más de la mitad de las regidurías en disputa en el concejo
                  municipal.
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
