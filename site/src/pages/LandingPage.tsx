import { useEffect } from "react";

import { ElectionCard } from "../components/ElectionCard";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import {
  defaultCantonKey,
  elections,
  type ElectionData,
  type ElectionYear,
} from "../lib/data";
import { fmtInt, fmtPct } from "../lib/format";
import { presidential2026 } from "../lib/presidential";
import { href } from "../lib/routes";

const defaultCanton = (year: ElectionYear) => {
  const data = elections[year];
  return (
    data.cantones.find((canton) => canton.key === defaultCantonKey) ??
    data.cantones[0]
  );
};

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
  const presidencial = presidential2026;
  const defaultPresidencialCanton =
    presidencial.cantones.find(
      (canton) => canton.key === defaultCantonKey,
    ) ?? presidencial.cantones[0];

  useEffect(() => {
    document.title = "Elecciones Costa Rica · 2020–2026";
  }, []);

  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        <section className="hero hero--solo wrap">
          <div>
            <h1>
              Elecciones en Costa Rica
              <br />
              2020–2026.
            </h1>
            <p className="deck">
              Esta página provee visualizaciones de los resultados de las
              elecciones municipales de 2020 y 2024, y de la elección
              presidencial de 2026 en Costa Rica. Incluye resúmenes a nivel
              nacional y cantonal.
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
              cta="Ver resumen nacional"
              secondaryCta={{
                label: "Ver resultados por cantón",
                href: href.cantones(2024, defaultCanton(2024)),
              }}
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
              cta="Ver resumen nacional"
              secondaryCta={{
                label: "Ver resultados por cantón",
                href: href.cantones(2020, defaultCanton(2020)),
              }}
            />

            <ElectionCard
              category="Nacional"
              status="Resultados"
              year="2026"
              title="Elecciones presidenciales"
              description="Resultados presidenciales en los 84 cantones."
              stats={[
                {
                  value: fmtInt(presidencial.cantones.length),
                  label: "cantones",
                },
                {
                  value: fmtInt(presidencial.partidosNacional.length),
                  label: "partidos",
                },
                {
                  value: fmtPct(presidencial.nacional.participacion, 2),
                  label: "participación",
                },
              ]}
              href={href.presidential()}
              cta="Ver resumen nacional"
              secondaryCta={{
                label: "Ver resultados por cantón",
                href: href.presidentialCantones(defaultPresidencialCanton),
              }}
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
          <div className="method-copy">
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
              <a href="https://www.tse.go.cr" target="_blank" rel="noreferrer">
                Tribunal Supremo de Elecciones (TSE)
              </a>
              . Los resultados de 2026 corresponden a la elección presidencial;
              las diputaciones se incorporarán cuando estén disponibles.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
