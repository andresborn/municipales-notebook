import { href } from "../lib/routes";
import { Brand } from "./Brand";

export function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="wrap site-foot-inner">
        <div>
          <Brand />
          <p className="mt-16">
            Resultados de las elecciones de Costa Rica. Fuente: Tribunal Supremo
            de Elecciones (TSE).
          </p>
        </div>
        <nav className="foot-links" aria-label="Enlaces del pie">
          <a href={href.landing()}>Inicio</a>
          <a href={href.home(2024)}>Municipal 2024</a>
          <a href={href.home(2020)}>Municipal 2020</a>
          <a href={href.presidential()}>Nacional 2026</a>
        </nav>
      </div>
    </footer>
  );
}
