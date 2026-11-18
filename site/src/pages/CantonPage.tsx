import { useEffect, useState } from "react";

import { CantonBar } from "../components/CantonBar";
import { SiteFooter } from "../components/SiteFooter";
import {
  defaultCantonKey,
  elections,
  findCantonBySlug,
  type CantonSlug,
  type ElectionYear,
} from "../lib/data";
import { displayName } from "../lib/parties";
import { href } from "../lib/routes";

type CantonPageProps = {
  year: ElectionYear;
  cantonSlug?: CantonSlug;
};

export function CantonPage({ year, cantonSlug }: CantonPageProps) {
  const data = elections[year];
  const routeCanton = findCantonBySlug(data, cantonSlug);
  const [selectedKey, setSelectedKey] = useState(
    routeCanton?.key ?? defaultCantonKey,
  );

  const selectedCanton =
    routeCanton ??
    data.cantones.find((canton) => canton.key === selectedKey) ??
    data.cantones.find((canton) => canton.key === defaultCantonKey) ??
    data.cantones[0];

  useEffect(() => {
    document.title = selectedCanton
      ? `${displayName(selectedCanton.canton)} · Municipales ${year} · Elecciones Costa Rica`
      : `Resultados por cantón · Municipales ${year} · Elecciones Costa Rica`;
  }, [selectedCanton, year]);

  if (!selectedCanton) {
    return (
      <>
        <main id="main" className="wrap page-body" tabIndex={-1}>
          <p>No hay datos disponibles para el cantón seleccionado.</p>
        </main>
        <SiteFooter />
      </>
    );
  }

  const handleSelect = (key: string) => {
    const canton = data.cantones.find((option) => option.key === key);
    if (!canton) return;
    setSelectedKey(key);
    window.location.hash = href.cantones(year, canton);
  };

  return (
    <>
      <CantonBar
        year={year}
        cantones={data.cantones}
        selected={selectedCanton}
        onSelect={handleSelect}
      />
      <main id="main" tabIndex={-1}>
        <section className="canton-hero">
          <div className="wrap">
            <p className="kicker">
              Provincia de {displayName(selectedCanton.provincia)}
            </p>
            <h1>{displayName(selectedCanton.canton)}</h1>
            <p className="deck">
              Resultados de alcaldía, concejo municipal y participación en{" "}
              {year}.
            </p>
            <div className="tag-row">
              <span className="tag">Elecciones municipales {year}</span>
              <span className="tag">{data.cantones.length} cantones en el país</span>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
