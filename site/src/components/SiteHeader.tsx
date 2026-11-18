import type { ElectionYear } from "../lib/data";
import { href } from "../lib/routes";

type SiteHeaderProps = {
  currentYear?: ElectionYear;
};

export function SiteHeader({ currentYear }: SiteHeaderProps) {
  return (
    <header className="site-head">
      <div className="wrap site-head-inner">
        <a className="brand" href={href.landing()}>
          Elecciones <span>Costa Rica</span>
        </a>
        <nav className="site-nav" aria-label="Navegación principal">
          <a
            href={href.home(2024)}
            aria-current={currentYear === 2024 ? "page" : undefined}
          >
            Municipal 2024
          </a>
          <a
            href={href.home(2020)}
            aria-current={currentYear === 2020 ? "page" : undefined}
          >
            Municipal 2020
          </a>
          <a
            className="nav-ext"
            href="https://www.tse.go.cr"
            target="_blank"
            rel="noreferrer"
          >
            TSE ↗
          </a>
        </nav>
      </div>
    </header>
  );
}
