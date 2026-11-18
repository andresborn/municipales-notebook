import { useEffect } from "react";

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
            </div>
          </header>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
