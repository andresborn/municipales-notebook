import { useEffect } from "react";

import { ArrowIcon } from "../components/ArrowIcon";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { href } from "../lib/routes";

export function SoonPage() {
  useEffect(() => {
    document.title = "Nacionales 2026 · En preparación · Elecciones Costa Rica";
  }, []);

  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        <div className="wrap">
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
              <span className="badge badge--hot">En preparación</span>
            </div>

            <div className="election-title">
              <p className="kicker">Nacional · Costa Rica 2026</p>
              <h1>Elecciones nacionales 2026</h1>
              <p className="deck">
                El módulo se incorporará cuando los resultados estén
                disponibles. Reutilizará la estructura de las municipales:
                resumen nacional y detalle por cantón.
              </p>
              <p className="byline">
                <span>
                  Módulo en preparación · <b>sin datos aún</b>
                </span>
                <span>Presidencial · 57 diputaciones</span>
                <span>7 provincias · 84 cantones</span>
              </p>
            </div>
          </header>

          <section
            className="section"
            aria-labelledby="alcance-heading"
          >
            <div className="section-head">
              <div>
                <p className="kicker">Alcance</p>
                <h2 id="alcance-heading">Qué incluirá el módulo</h2>
                <p className="deck">
                  La unidad de análisis cambia: la presidencial se lee por
                  cantón y las diputaciones, por provincia.
                </p>
              </div>
              <p className="section-head-side">
                Diseño reutilizable
                <br />
                del módulo municipal
              </p>
            </div>

            <div className="soon-grid">
              <article className="soon-card">
                <span className="status">Elección presidencial</span>
                <h3>Votación y margen</h3>
                <p>
                  Votación por candidatura, diferencia entre el primero y el
                  segundo lugar, y mapa por cantón. Si hay segunda vuelta, se
                  mostrará como una sección aparte.
                </p>
              </article>
              <article className="soon-card">
                <span className="status">Asamblea Legislativa</span>
                <h3>57 diputaciones por provincia</h3>
                <p>
                  Asignación de escaños por provincia con cociente, subcociente
                  y resto, el mismo procedimiento que se usa para las
                  regidurías municipales.
                </p>
              </article>
              <article className="soon-card">
                <span className="status">Participación</span>
                <h3>Electorado y abstencionismo</h3>
                <p>
                  Electorado inscrito, votos recibidos y abstención por cantón,
                  con la misma ficha y el mismo selector que las elecciones
                  municipales.
                </p>
              </article>
            </div>

            <div className="callout callout--dark">
              <span className="marker" aria-hidden="true">
                *
              </span>
              <p>
                <b>Sin cifras provisionales.</b> Este módulo no muestra
                resultados simulados. Se activará cuando existan datos
                oficiales y el ETL produzca los mismos CSV limpios que
                alimentan las municipales.
              </p>
            </div>

            <p className="figure-note">
              Mientras tanto, las municipales de 2020 y 2024 están completas y
              disponibles en el sitio.
            </p>
          </section>
        </div>

        <section className="cta">
          <div className="wrap cta-inner">
            <div>
              <h2>Mientras llega 2026, revisa 2024</h2>
              <p>
                La elección municipal más reciente, con los 84 cantones y sus
                concejos.
              </p>
            </div>
            <a className="btn btn--light" href={href.home(2024)}>
              Ver municipales 2024
              <ArrowIcon />
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
