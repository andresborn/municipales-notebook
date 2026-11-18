import { useEffect } from "react";

import { ElectionCard } from "../components/ElectionCard";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { elections, type ElectionData } from "../lib/data";
import { fmtInt, fmtPct } from "../lib/format";
import { href } from "../lib/routes";

const statsFor = (data: ElectionData) => ({
  cantones: data.cantones.length,
  regidurias: data.regiduriasCanton.reduce(
    (total, row) => total + row.regidurias,
    0,
  ),
  participacion:
    (data.participacionNacional.votosRecibidos /
      data.participacionNacional.electorado) *
    100,
});

export function LandingPage() {
  const municipal2024 = statsFor(elections[2024]);
  const municipal2020 = statsFor(elections[2020]);

  useEffect(() => {
    document.title = "Elecciones Costa Rica · 2020–2026";
  }, []);

  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        <section className="hero hero--solo wrap">
          <div>
            <p className="kicker">Costa Rica · Elecciones 2020–2026</p>
            <h1>
              Elecciones en Costa Rica
              <br />
              2020–2026.
            </h1>
            <p className="deck">
              Resultados de las elecciones municipales de 2020 y 2024, cantón
              por cantón. El módulo de las elecciones nacionales de 2026 está en
              preparación.
            </p>
          </div>
        </section>

        <section
          className="section section--tight wrap"
          id="elecciones"
          aria-labelledby="elecciones-heading"
        >
          <div className="section-head">
            <div>
              <p className="kicker">Resultados oficiales</p>
              <h2 id="elecciones-heading">Elige una elección</h2>
              <p className="deck">
                Resumen nacional y ficha por cantón, con la misma estructura en
                cada año.
              </p>
            </div>
            <p className="section-head-side">Datos del TSE</p>
          </div>

          <div className="election-grid">
            <ElectionCard
              category="Municipal"
              status="Resultados"
              year="2024"
              title="Resultados de las elecciones municipales"
              description="Alcaldías y regidurías en los 84 cantones."
              stats={[
                { value: fmtInt(municipal2024.cantones), label: "cantones" },
                {
                  value: fmtInt(municipal2024.regidurias),
                  label: "regidurías",
                },
                {
                  value: fmtPct(municipal2024.participacion, 2),
                  label: "participación",
                },
              ]}
              href={href.home(2024)}
              cta="Ver resultados"
            />

            <ElectionCard
              category="Municipal"
              status="Resultados"
              year="2020"
              title="Resultados de las elecciones municipales"
              description="Alcaldías y regidurías en los 82 cantones anteriores a Monteverde y Puerto Jiménez."
              stats={[
                { value: fmtInt(municipal2020.cantones), label: "cantones" },
                {
                  value: fmtInt(municipal2020.regidurias),
                  label: "regidurías",
                },
                {
                  value: fmtPct(municipal2020.participacion, 2),
                  label: "participación",
                },
              ]}
              href={href.home(2020)}
              cta="Ver resultados"
            />

            <ElectionCard
              category="Nacional"
              status="En preparación"
              year="2026"
              title="Elecciones nacionales"
              description="Presidencial y 57 diputaciones. El módulo se incorporará cuando los resultados estén disponibles."
              stats={[
                { value: "57", label: "diputaciones" },
                { value: "7", label: "provincias" },
                { value: "84", label: "cantones" },
              ]}
              href={href.soon()}
              cta="Ver el módulo"
              soon
            />
          </div>
        </section>

        <section
          className="method wrap"
          id="metodologia"
          aria-labelledby="metodologia-heading"
        >
          <div>
            <p className="kicker">Metodología</p>
            <h2 id="metodologia-heading">Cómo se calculan los resultados</h2>
          </div>
          <div>
            <p>
              Los porcentajes de votación y los márgenes se calculan sobre{" "}
              <strong>votos válidos</strong>. La participación y el
              abstencionismo se calculan sobre el{" "}
              <strong>electorado inscrito</strong>, no sobre los votos emitidos.
            </p>
            <p>
              Las regidurías se asignan por cociente, subcociente y resto en
              cada cantón. En 2020 hubo 82 cantones; en 2024, 84, tras la
              creación de Monteverde y Puerto Jiménez.
            </p>
            <p>
              Fuente:{" "}
              <a
                href="https://www.tse.go.cr"
                target="_blank"
                rel="noreferrer"
              >
                Tribunal Supremo de Elecciones (TSE)
              </a>
              . Los resultados de 2026 se incorporarán cuando estén
              disponibles.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
