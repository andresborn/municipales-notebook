import { href } from "../lib/routes";

export function Brand() {
  return (
    <a className="brand" href={href.landing()} aria-label="Elecciones Costa Rica">
      <span className="brand-full" aria-hidden="true">
        Elecciones <span className="brand-accent">Costa Rica</span>
      </span>
      <span className="brand-short" aria-hidden="true">
        E<span className="brand-accent">CR</span>
      </span>
    </a>
  );
}
