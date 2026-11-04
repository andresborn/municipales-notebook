import { useEffect, useMemo, useState } from "react";
import * as Plot from "@observablehq/plot";
import type { PlotOptions } from "@observablehq/plot";

import { CantonSelect } from "../components/CantonSelect";
import { PageFooter } from "../components/PageFooter";
import { PlotFigure } from "../components/PlotFigure";
import {
  alcaldePorCanton,
  alcaldesPartidoPorCanton,
  cantones,
  defaultCantonKey,
  escanosPorCanton,
  regiduriaPorCanton,
} from "../lib/data";
import {
  fmtCompact,
  fmtDecimal,
  fmtInt,
  fmtPct,
  fmtPp,
  slugify,
  truncate,
} from "../lib/format";

const CLASSIFICATION_NOTES: Record<string, string> = {
  "Muy disputado": "Margen menor a 5 pp entre el primero y el segundo lugar.",
  Disputado: "Margen entre 5 y 10 pp entre el primero y el segundo lugar.",
  "Poco disputado":
    "Margen entre 10 y 20 pp entre el primero y el segundo lugar.",
  Dominado: "Margen de 20 pp o más entre el primero y el segundo lugar.",
};

export function CantonPage() {
  const [selectedKey, setSelectedKey] = useState(defaultCantonKey);

  useEffect(() => {
    document.title = "Resultados por cantón · Municipales 2024 · Costa Rica";
  }, []);

  const selectedCanton =
    cantones.find((canton) => canton.key === selectedKey) ?? cantones[0];
  const alcalde = alcaldePorCanton.get(selectedKey);
  const regiduria = regiduriaPorCanton.get(selectedKey);
  const escanos = useMemo(
    () => escanosPorCanton.get(selectedKey) ?? [],
    [selectedKey],
  );
  const alcaldesPartido = useMemo(
    () => alcaldesPartidoPorCanton.get(selectedKey) ?? [],
    [selectedKey],
  );

  const winnerPct = alcalde
    ? (alcalde.votosGanador / alcalde.validos) * 100
    : 0;
  const runnerUpPct = alcalde
    ? (alcalde.votosSegundo / alcalde.validos) * 100
    : 0;

  const alcaldeChartOptions = useMemo<PlotOptions>(() => {
    if (!alcalde) return { marks: [] };

    const data = [
      { rol: "Ganador", votos: alcalde.votosGanador },
      { rol: "Segundo", votos: alcalde.votosSegundo },
    ];

    return {
      height: 140,
      marginLeft: 86,
      marginRight: 18,
      marginTop: 8,
      marginBottom: 32,
      x: {
        grid: true,
        label: "Votos",
        tickFormat: (value) => fmtCompact(Number(value)),
      },
      y: { label: null },
      color: {
        domain: ["Ganador", "Segundo"],
        range: ["#4269d0", "#a8b3c7"],
      },
      marks: [
        Plot.barX(data, {
          x: "votos",
          y: "rol",
          fill: "rol",
          sort: { y: "-x" },
          rx: 3,
        }),
      ],
    };
  }, [alcalde]);

  const escanosChartData = useMemo(
    () =>
      escanos.map((row) => ({
        ...row,
        estado: row.escanos > 0 ? "Con escaño" : "Sin escaño",
      })),
    [escanos],
  );

  const escanosChartOptions = useMemo<PlotOptions>(() => {
    if (!regiduria || escanosChartData.length === 0) return { marks: [] };

    return {
      height: Math.max(240, escanosChartData.length * 26 + 44),
      marginLeft: 154,
      marginRight: 18,
      marginTop: 8,
      marginBottom: 34,
      x: {
        grid: true,
        label: "Votos",
        tickFormat: (value) => fmtCompact(Number(value)),
      },
      y: {
        label: null,
        tickFormat: (value) => truncate(String(value), 22),
      },
      color: {
        domain: ["Con escaño", "Sin escaño"],
        range: ["#4269d0", "#cbd5e1"],
      },
      marks: [
        Plot.barX(escanosChartData, {
          x: "votos",
          y: "partido",
          fill: "estado",
          sort: { y: "-x" },
          rx: 2,
        }),
        Plot.ruleX([regiduria.cociente], {
          stroke: "#4269d0",
          strokeWidth: 1.5,
        }),
        Plot.ruleX([regiduria.subcociente], {
          stroke: "#94a3b8",
          strokeWidth: 1.5,
          strokeDasharray: "4 3",
        }),
      ],
    };
  }, [escanosChartData, regiduria]);

  if (!selectedCanton || !alcalde || !regiduria) {
    return (
      <main className="app-shell">
        <p>No hay datos disponibles para el cantón seleccionado.</p>
      </main>
    );
  }

  const classificationClass = slugify(alcalde.clasificacion);
  const classificationNote = CLASSIFICATION_NOTES[alcalde.clasificacion] ?? "";
  const marginPpLabel =
    alcalde.margenVotos > 0 && alcalde.margenPp < 0.1
      ? "<0,1 pp"
      : fmtPp(alcalde.margenPp);
  const swingPpLabel =
    alcalde.margenVotos > 0 && alcalde.swingPp < 0.1
      ? "<0,1 pp"
      : fmtPp(alcalde.swingPp);

  const cocienteEntero = Math.floor(regiduria.cociente);
  const subcocienteEntero = Math.floor(regiduria.subcociente);

  const otrosPartidos = alcaldesPartido.filter(
    (row) =>
      row.partido !== alcalde.ganador && row.partido !== alcalde.segundo,
  );

  const thresholdFor = (votes: number) => {
    if (votes >= regiduria.cociente) {
      return { className: "threshold-cociente", label: "≥ cociente" };
    }
    if (votes >= regiduria.subcociente) {
      return { className: "threshold-subcociente", label: "≥ subcociente" };
    }
    return { className: "threshold-none", label: "< subcociente" };
  };

  return (
    <main className="app-shell">
      <header className="page-header">
        <a className="back-link" href="#/">
          <span aria-hidden="true">←</span> Volver al contexto nacional
        </a>
        <p className="eyebrow">Elecciones municipales · Costa Rica 2024</p>
        <h1>Resultados por cantón</h1>
        <p className="lede">
          Consulta la elección de alcaldía y la asignación de regidurías en los
          84 cantones del país.
        </p>

        <div className="notice" role="note">
          <span className="notice-icon" aria-hidden="true">
            i
          </span>
          <p>
            <strong>Solo votos válidos.</strong> Los porcentajes de la tabla de
            regidurías se calculan sobre los votos válidos emitidos. La
            participación y el abstencionismo corresponden a la elección de
            alcaldías y se calculan sobre el electorado inscrito.
          </p>
        </div>

        <div className="selector-row">
          <div className="selector-field">
            <span className="selector-label">Cantón</span>
            <CantonSelect
              options={cantones}
              value={selectedKey}
              onChange={setSelectedKey}
            />
          </div>
          <p className="selector-hint">
            Selecciona un cantón para actualizar ambas secciones.
          </p>
        </div>
      </header>

      <section className="section" aria-labelledby="alcaldia-heading">
        <div className="section-heading">
          <div>
            <p className="section-kicker">01 · Alcaldía</p>
            <h2 id="alcaldia-heading">{selectedCanton.canton}</h2>
            <p className="section-subtitle">
              {selectedCanton.provincia} · {fmtInt(alcalde.validos)} votos
              válidos · {alcalde.partidosConVotos} partidos con votos
            </p>
          </div>
          <div className="heading-meta">
            <span className={`badge badge-${classificationClass}`}>
              {alcalde.clasificacion}
            </span>
            <p className="classification-note">{classificationNote}</p>
          </div>
        </div>

        <div className="result-grid">
          <article className="result-card result-card-winner">
            <p className="card-label">
              <span className="dot" aria-hidden="true" />
              Ganador
            </p>
            <h3>{alcalde.ganador}</h3>
            <p className="vote-total">
              {fmtInt(alcalde.votosGanador)}
              <span>votos</span>
            </p>
            <p className="vote-share">
              {fmtPct(winnerPct)} de los votos válidos
            </p>
            <p className="margin-pill">
              Ventaja de {fmtInt(alcalde.margenVotos)} votos
            </p>
          </article>

          <article className="result-card">
            <p className="card-label">
              <span className="dot" aria-hidden="true" />
              Segundo lugar
            </p>
            <h3>{alcalde.segundo}</h3>
            <p className="vote-total">
              {fmtInt(alcalde.votosSegundo)}
              <span>votos</span>
            </p>
            <p className="vote-share">
              {fmtPct(runnerUpPct)} de los votos válidos
            </p>
          </article>
        </div>

        <div className="metric-grid">
          <article className="metric-card">
            <p className="metric-label">Margen</p>
            <p className="metric-value">{marginPpLabel}</p>
            <p className="metric-note">
              {fmtInt(alcalde.margenVotos)} votos de diferencia
            </p>
          </article>
          <article className="metric-card">
            <p className="metric-label">
              <abbr title="Mitad del margen porcentual entre el primero y el segundo lugar.">
                Swing
              </abbr>
            </p>
            <p className="metric-value">{swingPpLabel}</p>
            <p className="metric-note">mitad del margen porcentual</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Cuota del ganador</p>
            <p className="metric-value">{fmtPct(alcalde.cuotaGanador)}</p>
            <p className="metric-note">de los votos válidos</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">
              <abbr title="Número efectivo de partidos: 1 / suma de los cuadrados de las cuotas de votación.">
                ENP
              </abbr>
            </p>
            <p className="metric-value">{fmtDecimal(alcalde.enp, 2)}</p>
            <p className="metric-note">partidos efectivos</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Votos válidos</p>
            <p className="metric-value">{fmtInt(alcalde.validos)}</p>
            <p className="metric-note">base de cálculo</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Partidos con votos</p>
            <p className="metric-value">{alcalde.partidosConVotos}</p>
            <p className="metric-note">en la papeleta de alcaldía</p>
          </article>
        </div>

        <details className="indicator-guide">
          <summary>
            <span className="summary-title">
              <span className="summary-title-row">
                <span className="summary-info-icon" aria-hidden="true">
                  i
                </span>
                <strong>¿Qué significan los indicadores?</strong>
              </span>
              <span className="summary-note">
                Glosario de margen, swing, ENP y otras métricas
              </span>
            </span>
            <span className="summary-action" aria-hidden="true" />
          </summary>
          <dl className="indicator-list">
            <div>
              <dt>Margen</dt>
              <dd>
                Diferencia entre el primer y el segundo lugar, expresada en
                votos y en puntos porcentuales (pp). Un margen menor indica una
                elección más cerrada.
              </dd>
            </div>
            <div>
              <dt>Swing</dt>
              <dd>
                Mitad del margen porcentual. Se interpreta como el cambio de
                votos que tendría que producirse para que el segundo lugar
                alcance al ganador.
              </dd>
            </div>
            <div>
              <dt>Cuota del ganador</dt>
              <dd>
                Porcentaje de los votos válidos que obtuvo el partido ganador.
              </dd>
            </div>
            <div>
              <dt>ENP</dt>
              <dd>
                Número efectivo de partidos. Resume la fragmentación de la
                contienda: valores cercanos a 1 indican una elección dominada
                por un partido; valores altos, una competencia más dispersa.
              </dd>
            </div>
            <div>
              <dt>Votos válidos</dt>
              <dd>
                Total de votos válidos para la alcaldía en el cantón. Es la base
                de todos los porcentajes y márgenes de esta sección.
              </dd>
            </div>
            <div>
              <dt>Partidos con votos</dt>
              <dd>
                Cantidad de partidos que recibieron al menos un voto en la
                elección de alcaldía.
              </dd>
            </div>
            <div>
              <dt>Clasificación</dt>
              <dd>
                Categoría derivada del margen: muy disputado (menos de 5 pp),
                disputado (5–10 pp), poco disputado (10–20 pp) y dominado (20 pp
                o más).
              </dd>
            </div>
          </dl>
        </details>

        <div className="chart-card">
          <div className="card-heading">
            <div>
              <h3>Votación de los dos primeros lugares</h3>
              <p>Votos obtenidos por el ganador y el segundo lugar.</p>
            </div>
          </div>
          <PlotFigure
            options={alcaldeChartOptions}
            ariaLabel={`Votos del ganador ${alcalde.ganador} y del segundo lugar ${alcalde.segundo} en ${selectedCanton.canton}.`}
          />
          <p className="chart-note">
            El gráfico compara solo a los dos primeros lugares; no representa la
            votación de los demás partidos.
          </p>
        </div>

        {otrosPartidos.length > 0 ? (
          <details className="results-details">
            <summary>
              <span className="summary-title">
                <strong>Resultados del resto de partidos</strong>
                <span className="summary-note">
                  {otrosPartidos.length} partidos adicionales · votos y
                  porcentaje sobre votos válidos
                </span>
              </span>
              <span className="summary-action" aria-hidden="true" />
            </summary>
            <div className="table-wrap">
              <table>
                <caption className="sr-only">
                  Resultados del resto de partidos en la elección de alcaldía
                  de {selectedCanton.canton}
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className="num">
                      Posición
                    </th>
                    <th scope="col">Partido</th>
                    <th scope="col" className="num">
                      Votos
                    </th>
                    <th scope="col" className="num">
                      % válidos
                    </th>
                    <th scope="col" className="num">
                      Diferencia con el ganador
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {otrosPartidos.map((row, index) => {
                    const pct = (row.votos / alcalde.validos) * 100;
                    const difference = alcalde.votosGanador - row.votos;

                    return (
                      <tr key={row.partido}>
                        <td className="num">{index + 3}.º</td>
                        <th scope="row">{row.partido}</th>
                        <td className="num">{fmtInt(row.votos)}</td>
                        <td className="num">{fmtPct(pct)}</td>
                        <td className="num">{fmtInt(difference)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        ) : null}
      </section>

      <section className="section" aria-labelledby="regidurias-heading">
        <div className="section-heading">
          <div>
            <p className="section-kicker">02 · Regidurías</p>
            <h2 id="regidurias-heading">{selectedCanton.canton}</h2>
          </div>
        </div>

        <div
          className={`callout${regiduria.tieneMayoria ? " callout-success" : ""}`}
        >
          <span className="callout-marker" aria-hidden="true">
            {regiduria.tieneMayoria ? "✓" : "i"}
          </span>
          <p>
            {regiduria.tieneMayoria ? (
              <>
                <strong>{regiduria.partidoMasEscanos}</strong> alcanzó la mayoría
                absoluta con {regiduria.escanosPrimero} de{" "}
                {regiduria.regidurias} regidurías.
              </>
            ) : (
              <>
                Ningún partido alcanzó la mayoría absoluta de{" "}
                <strong>{regiduria.mayoria} escaños</strong>.{" "}
                <strong>{regiduria.partidoMasEscanos}</strong> encabeza la
                asignación con {regiduria.escanosPrimero}.
              </>
            )}
          </p>
        </div>

        <div className="regidurias-indicators">
          <h3>Indicadores de regidurías</h3>
          <ul className="indicator-bullets">
            <li>
              <span className="indicator-label">Votos válidos</span>
              <strong>{fmtInt(regiduria.votosValidos)}</strong>
            </li>
            <li>
              <span className="indicator-label">Regidurías en disputa</span>
              <strong>{regiduria.regidurias}</strong>
            </li>
            <li>
              <span className="indicator-label">Partidos con escaños</span>
              <strong>
                {regiduria.partidosConEscanos}{" "}
                <span className="indicator-subvalue">
                  de {escanos.length}
                </span>
              </strong>
            </li>
            <li>
              <span className="indicator-label">
                Escaños necesarios para mayoría absoluta en el concejo
              </span>
              <strong>{regiduria.mayoria}</strong>
            </li>
          </ul>

          <div className="indicator-section">
            <h4>Cociente y subcociente</h4>
            <ul className="indicator-bullets indicator-bullets-detailed">
              <li>
                <div className="indicator-bullet-head">
                  <span className="indicator-label">Cociente</span>
                  <strong>{fmtInt(cocienteEntero)} votos</strong>
                </div>
                <p>
                  Votos necesarios para obtener un escaño por cociente. Se
                  calcula dividiendo los votos válidos entre las{" "}
                  {regiduria.regidurias} regidurías en disputa.
                </p>
              </li>
              <li>
                <div className="indicator-bullet-head">
                  <span className="indicator-label">Subcociente</span>
                  <strong>{fmtInt(subcocienteEntero)} votos</strong>
                </div>
                <p>
                  Votación mínima para participar en el reparto de los escaños
                  sobrantes por resto. Equivale a la mitad del cociente.
                </p>
              </li>
            </ul>
          </div>

          <p className="indicator-box-note">
            Los valores de cociente y subcociente se muestran truncados al entero
            inferior. La asignación de escaños se calcula con el valor exacto.
          </p>
        </div>

        <div className="chart-card">
          <div className="card-heading">
            <div>
              <h3>Votos por partido y umbrales</h3>
              <p>
                La posición de cada barra frente a las líneas muestra si el
                partido alcanzó el cociente o el subcociente.
              </p>
            </div>
          </div>
          <PlotFigure
            options={escanosChartOptions}
            ariaLabel={`Votación por partido en ${selectedCanton.canton}. La línea azul marca el cociente y la línea punteada el subcociente.`}
          />
          <div className="chart-legend">
            <span className="legend-item">
              <span className="legend-swatch" aria-hidden="true" />
              Con escaño
            </span>
            <span className="legend-item">
              <span className="legend-swatch muted" aria-hidden="true" />
              Sin escaño
            </span>
            <span className="legend-item">
              <span className="legend-line" aria-hidden="true" />
              Cociente: {fmtInt(cocienteEntero)}
            </span>
            <span className="legend-item">
              <span className="legend-line dashed" aria-hidden="true" />
              Subcociente: {fmtInt(subcocienteEntero)}
            </span>
          </div>
        </div>

        <div className="table-card">
          <div className="table-card-heading">
            <h3>Asignación de regidurías</h3>
            <p>
              Desglose por partido. El total suma{" "}
              {regiduria.escanosAsignados} escaños.
            </p>
          </div>
          <div className="table-wrap">
            <table>
              <caption className="sr-only">
                Asignación de regidurías por partido en{" "}
                {selectedCanton.canton}
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
                  <th scope="col" className="num">
                    Votos por escaño
                  </th>
                  <th scope="col">Umbral</th>
                </tr>
              </thead>
              <tbody>
                {escanos.map((row) => {
                  const pct = (row.votos / regiduria.votosValidos) * 100;
                  const votesPerSeat =
                    row.escanos > 0 ? row.votos / row.escanos : null;
                  const threshold = thresholdFor(row.votos);

                  return (
                    <tr
                      key={row.partido}
                      className={row.escanos > 0 ? "has-seat" : undefined}
                    >
                      <th scope="row">
                        <span className="party-cell">
                          <span
                            className={`party-dot${
                              row.escanos > 0 ? "" : " muted"
                            }`}
                            aria-hidden="true"
                          />
                          {row.partido}
                        </span>
                      </th>
                      <td className="num">{fmtInt(row.votos)}</td>
                      <td className="num">{fmtPct(pct)}</td>
                      <td className="num">
                        {row.escanosCociente || "—"}
                      </td>
                      <td className="num">{row.escanosResto || "—"}</td>
                      <td className="num strong">{row.escanos}</td>
                      <td className="num">
                        {votesPerSeat === null
                          ? "—"
                          : fmtInt(votesPerSeat)}
                      </td>
                      <td>
                        <span className={`threshold ${threshold.className}`}>
                          {threshold.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="table-note">
            <p>
              La columna «Votos por escaño» es un indicador derivado de este
              sitio: votos del partido ÷ escaños obtenidos. No viene en el CSV;
              permite comparar el costo efectivo de cada escaño.
            </p>
            <p>
              Alcanzar el subcociente habilita el reparto por resto, pero no
              garantiza un escaño. Un escaño asignado por resto puede costar
              menos votos que el cociente. Los umbrales se comparan con el
              cociente y el subcociente exactos.
            </p>
          </div>
        </div>
      </section>

      <PageFooter />
    </main>
  );
}
