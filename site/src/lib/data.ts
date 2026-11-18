import { csvParse } from "d3-dsv";

import { slugify } from "./format";
import alcaldesPartido2020Csv from "../../../src/data/clean/alcaldes_2020.csv?raw";
import escanos2020Csv from "../../../src/data/clean/escanos_regidurias_2020.csv?raw";
import regiduriasCanton2020Csv from "../../../src/data/clean/resumen_regidurias_canton_2020.csv?raw";
import regiduriasPartido2020Csv from "../../../src/data/clean/resumen_regidurias_partido_2020.csv?raw";
import resumenAlcaldes2020Csv from "../../../src/data/clean/resumen_alcaldes_canton_2020.csv?raw";
import alcaldesPartido2024Csv from "../../../src/data/clean/alcaldes_2024.csv?raw";
import escanos2024Csv from "../../../src/data/clean/escanos_regidurias_2024.csv?raw";
import regiduriasCanton2024Csv from "../../../src/data/clean/resumen_regidurias_canton_2024.csv?raw";
import regiduriasPartido2024Csv from "../../../src/data/clean/resumen_regidurias_partido_2024.csv?raw";
import resumenAlcaldes2024Csv from "../../../src/data/clean/resumen_alcaldes_canton_2024.csv?raw";

type CsvRow = Record<string, unknown>;

const text = (value: unknown) => String(value ?? "").trim();

const num = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const boolean = (value: unknown) => text(value).toLowerCase() === "true";

export type ElectionYear = 2020 | 2024;

export type AlcaldeRow = {
  provincia: string;
  canton: string;
  clasificacion: string;
  ganador: string;
  segundo: string;
  votosGanador: number;
  votosSegundo: number;
  margenVotos: number;
  margenPp: number;
  swingPp: number;
  cuotaGanador: number;
  enp: number;
  validos: number;
  partidosConVotos: number;
  electorado: number;
  votosRecibidos: number;
  participacion: number;
  abstencionismo: number;
};

export type RegiduriaCantonRow = {
  provincia: string;
  canton: string;
  regidurias: number;
  votosValidos: number;
  cociente: number;
  subcociente: number;
  partidosConEscanos: number;
  partidoMasVotos: string;
  escanosPrimero: number;
  escanosAsignados: number;
  mayoria: number;
  tieneMayoria: boolean;
  electorado: number;
  votosRecibidos: number;
  participacion: number;
  abstencionismo: number;
};

export type EscanoPartidoRow = {
  provincia: string;
  canton: string;
  partido: string;
  votos: number;
  escanosCociente: number;
  escanosResto: number;
  escanos: number;
  residual: number;
  cociente: number;
  subcociente: number;
  regidurias: number;
};

export type PartidoNacionalRow = {
  partido: string;
  votos: number;
  escanos: number;
  porcentajeEscanos: number;
  porcentajeVotos: number;
};

export type AlcaldePartidoRow = {
  provincia: string;
  canton: string;
  partido: string;
  votos: number;
};

export type CantonOption = {
  key: string;
  provincia: string;
  canton: string;
  slugProvincia: string;
  slugCanton: string;
};

export type CantonSlug = {
  provincia: string;
  canton: string;
};

export type AlcaldiasPartidoRow = {
  partido: string;
  cantones: number;
  votos: number;
};

export type PartidoAlcaldiaNacionalRow = {
  partido: string;
  votos: number;
  porcentajeVotos: number;
  cantonesConVotos: number;
  alcaldias: number;
  porcentajeAlcaldias: number;
};

export type ElectionData = {
  year: ElectionYear;
  alcaldes: AlcaldeRow[];
  validosAlcaldesNacional: number;
  alcaldesPartido: AlcaldePartidoRow[];
  alcaldiasPorPartido: AlcaldiasPartidoRow[];
  partidosAlcaldiaNacional: PartidoAlcaldiaNacionalRow[];
  partidosConAlcaldias: number;
  regiduriasCanton: RegiduriaCantonRow[];
  escanosPartido: EscanoPartidoRow[];
  partidosNacional: PartidoNacionalRow[];
  validosRegiduriasNacional: number;
  partidosRegiduriaNacional: PartidoNacionalRow[];
  participacionNacional: {
    electorado: number;
    votosRecibidos: number;
  };
  alcaldePorCanton: Map<string, AlcaldeRow>;
  alcaldesPartidoPorCanton: Map<string, AlcaldePartidoRow[]>;
  regiduriaPorCanton: Map<string, RegiduriaCantonRow>;
  escanosPorCanton: Map<string, EscanoPartidoRow[]>;
  cantonPorSlug: Map<string, CantonOption>;
  cantones: CantonOption[];
};

const rows = (source: string) => csvParse(source) as unknown as CsvRow[];

export const cantonKey = (row: { provincia: string; canton: string }) =>
  `${row.provincia}|${row.canton}`;

export const defaultCantonKey = "SAN JOSÉ|SAN JOSÉ";

type CsvSources = {
  resumenAlcaldes: string;
  alcaldesPartido: string;
  escanos: string;
  regiduriasCanton: string;
  regiduriasPartido: string;
};

const csvSources: Record<ElectionYear, CsvSources> = {
  2020: {
    resumenAlcaldes: resumenAlcaldes2020Csv,
    alcaldesPartido: alcaldesPartido2020Csv,
    escanos: escanos2020Csv,
    regiduriasCanton: regiduriasCanton2020Csv,
    regiduriasPartido: regiduriasPartido2020Csv,
  },
  2024: {
    resumenAlcaldes: resumenAlcaldes2024Csv,
    alcaldesPartido: alcaldesPartido2024Csv,
    escanos: escanos2024Csv,
    regiduriasCanton: regiduriasCanton2024Csv,
    regiduriasPartido: regiduriasPartido2024Csv,
  },
};

const PROVINCE_ORDER = [
  "SAN JOSÉ",
  "ALAJUELA",
  "CARTAGO",
  "HEREDIA",
  "GUANACASTE",
  "PUNTARENAS",
  "LIMÓN",
];

const provinceRank = (provincia: string) => {
  const index = PROVINCE_ORDER.indexOf(provincia);
  return index === -1 ? PROVINCE_ORDER.length : index;
};

const buildElection = (year: ElectionYear): ElectionData => {
  const source = csvSources[year];

  const alcaldes: AlcaldeRow[] = rows(source.resumenAlcaldes).map((row) => ({
    provincia: text(row.provincia),
    canton: text(row.canton),
    clasificacion: text(row.clasificacion),
    ganador: text(row.ganador),
    segundo: text(row.segundo),
    votosGanador: num(row.votos_ganador),
    votosSegundo: num(row.votos_segundo),
    margenVotos: num(row.margen_votos),
    margenPp: num(row.margen_pp),
    swingPp: num(row.swing_pp),
    cuotaGanador: num(row.cuota_ganador),
    enp: num(row.enp),
    validos: num(row.validos),
    partidosConVotos: num(row.partidos_con_votos),
    electorado: num(row.electorado),
    votosRecibidos: num(row.votos_recibidos),
    participacion: num(row.participacion),
    abstencionismo: num(row.abstencionismo),
  }));

  const validosAlcaldesNacional = alcaldes.reduce(
    (total, row) => total + row.validos,
    0,
  );

  const alcaldiasPorPartido = [
    ...alcaldes
      .reduce((map, row) => {
        const current = map.get(row.ganador) ?? {
          partido: row.ganador,
          cantones: 0,
          votos: 0,
        };
        current.cantones += 1;
        current.votos += row.votosGanador;
        map.set(row.ganador, current);
        return map;
      }, new Map<string, AlcaldiasPartidoRow>())
      .values(),
  ].sort(
    (a, b) =>
      b.cantones - a.cantones ||
      a.partido.localeCompare(b.partido, "es"),
  );

  const alcaldesPartido: AlcaldePartidoRow[] = rows(source.alcaldesPartido)
    .map((row) => ({
      provincia: text(row.provincia),
      canton: text(row.canton),
      partido: text(row.partido),
      votos: num(row.votos),
    }))
    .filter((row) => row.votos > 0);

  const regiduriasCanton: RegiduriaCantonRow[] = rows(
    source.regiduriasCanton,
  ).map((row) => ({
    provincia: text(row.provincia),
    canton: text(row.canton),
    regidurias: num(row.regidurias),
    votosValidos: num(row.votos_validos),
    cociente: num(row.cociente),
    subcociente: num(row.subcociente),
    partidosConEscanos: num(row.partidos_con_escanos),
    partidoMasVotos: text(row["partido_mas_votos"]),
    escanosPrimero: num(row["escaños_primero"]),
    escanosAsignados: num(row["escaños_asignados"]),
    mayoria: num(row.mayoria),
    tieneMayoria: boolean(row.tiene_mayoria),
    electorado: num(row.electorado),
    votosRecibidos: num(row.votos_recibidos),
    participacion: num(row.participacion),
    abstencionismo: num(row.abstencionismo),
  }));

  const escanosPartido: EscanoPartidoRow[] = rows(source.escanos).map(
    (row) => ({
      provincia: text(row.provincia),
      canton: text(row.canton),
      partido: text(row.partido),
      votos: num(row.votos),
      escanosCociente: num(row["escaños_cociente"]),
      escanosResto: num(row["escaños_resto"]),
      escanos: num(row["escaños"]),
      residual: num(row.residual),
      cociente: num(row.cociente),
      subcociente: num(row.subcociente),
      regidurias: num(row.regidurias),
    }),
  );

  const partidosNacional: PartidoNacionalRow[] = rows(
    source.regiduriasPartido,
  ).map((row) => ({
    partido: text(row.partido),
    votos: num(row.votos),
    escanos: num(row["escaños"]),
    porcentajeEscanos: num(row["porcentaje_escaños"]),
    porcentajeVotos: num(row.porcentaje_votos),
  }));

  const validosRegiduriasNacional = regiduriasCanton.reduce(
    (total, row) => total + row.votosValidos,
    0,
  );

  const totalEscanosNacional = partidosNacional.reduce(
    (total, row) => total + row.escanos,
    0,
  );

  const votosRegiduriaPorPartido = new Map<
    string,
    { votos: number; escanos: number }
  >();

  for (const row of escanosPartido) {
    if (row.votos <= 0) continue;

    const current = votosRegiduriaPorPartido.get(row.partido) ?? {
      votos: 0,
      escanos: 0,
    };

    current.votos += row.votos;
    current.escanos += row.escanos;
    votosRegiduriaPorPartido.set(row.partido, current);
  }

  const partidosRegiduriaNacional: PartidoNacionalRow[] = [
    ...votosRegiduriaPorPartido.entries(),
  ]
    .map(([partido, row]) => ({
      partido,
      votos: row.votos,
      escanos: row.escanos,
      porcentajeEscanos:
        totalEscanosNacional > 0
          ? (row.escanos / totalEscanosNacional) * 100
          : 0,
      porcentajeVotos:
        validosRegiduriasNacional > 0
          ? (row.votos / validosRegiduriasNacional) * 100
          : 0,
    }))
    .sort(
      (a, b) =>
        b.votos - a.votos ||
        b.escanos - a.escanos ||
        a.partido.localeCompare(b.partido, "es"),
    );

  /** Totales nacionales de participación de la elección de alcaldías. */
  const participacionNacional = alcaldes.reduce(
    (totals, row) => ({
      electorado: totals.electorado + row.electorado,
      votosRecibidos: totals.votosRecibidos + row.votosRecibidos,
    }),
    { electorado: 0, votosRecibidos: 0 },
  );

  const alcaldePorCanton = new Map(
    alcaldes.map((row) => [cantonKey(row), row]),
  );

  const alcaldesPartidoPorCanton = new Map<string, AlcaldePartidoRow[]>();

  for (const row of alcaldesPartido) {
    const key = cantonKey(row);
    const current = alcaldesPartidoPorCanton.get(key) ?? [];
    current.push(row);
    alcaldesPartidoPorCanton.set(key, current);
  }

  for (const current of alcaldesPartidoPorCanton.values()) {
    current.sort((a, b) => b.votos - a.votos);
  }

  const regiduriaPorCanton = new Map(
    regiduriasCanton.map((row) => [cantonKey(row), row]),
  );

  const escanosPorCanton = new Map<string, EscanoPartidoRow[]>();

  for (const row of escanosPartido) {
    const key = cantonKey(row);
    const current = escanosPorCanton.get(key) ?? [];
    current.push(row);
    escanosPorCanton.set(key, current);
  }

  for (const current of escanosPorCanton.values()) {
    current.sort((a, b) => b.escanos - a.escanos || b.votos - a.votos);
  }

  const cantonMap = new Map<string, CantonOption>();

  for (const row of [...alcaldes, ...regiduriasCanton]) {
    const key = cantonKey(row);
    if (!cantonMap.has(key)) {
      cantonMap.set(key, {
        key,
        provincia: row.provincia,
        canton: row.canton,
        slugProvincia: slugify(row.provincia),
        slugCanton: slugify(row.canton),
      });
    }
  }

  const cantones = [...cantonMap.values()].sort(
    (a, b) =>
      provinceRank(a.provincia) - provinceRank(b.provincia) ||
      a.canton.localeCompare(b.canton, "es"),
  );

  const cantonPorSlug = new Map(
    cantones.map((canton) => [
      `${canton.slugProvincia}/${canton.slugCanton}`,
      canton,
    ]),
  );

  const alcaldiasGanadas = new Map(
    alcaldiasPorPartido.map((row) => [row.partido, row.cantones]),
  );

  const votosPorPartido = new Map<
    string,
    { votos: number; cantones: Set<string>; alcaldias: number }
  >();

  for (const row of alcaldesPartido) {
    const current = votosPorPartido.get(row.partido) ?? {
      votos: 0,
      cantones: new Set<string>(),
      alcaldias: alcaldiasGanadas.get(row.partido) ?? 0,
    };

    current.votos += row.votos;
    current.cantones.add(cantonKey(row));
    votosPorPartido.set(row.partido, current);
  }

  const partidosAlcaldiaNacional: PartidoAlcaldiaNacionalRow[] = [
    ...votosPorPartido.entries(),
  ]
    .map(([partido, row]) => ({
      partido,
      votos: row.votos,
      porcentajeVotos: (row.votos / validosAlcaldesNacional) * 100,
      cantonesConVotos: row.cantones.size,
      alcaldias: row.alcaldias,
      porcentajeAlcaldias: (row.alcaldias / cantones.length) * 100,
    }))
    .sort(
      (a, b) =>
        b.votos - a.votos ||
        b.alcaldias - a.alcaldias ||
        a.partido.localeCompare(b.partido, "es"),
    );

  return {
    year,
    alcaldes,
    validosAlcaldesNacional,
    alcaldesPartido,
    alcaldiasPorPartido,
    partidosAlcaldiaNacional,
    partidosConAlcaldias: alcaldiasPorPartido.length,
    regiduriasCanton,
    escanosPartido,
    partidosNacional,
    validosRegiduriasNacional,
    partidosRegiduriaNacional,
    participacionNacional,
    alcaldePorCanton,
    alcaldesPartidoPorCanton,
    regiduriaPorCanton,
    escanosPorCanton,
    cantonPorSlug,
    cantones,
  };
};

export const elections: Record<ElectionYear, ElectionData> = {
  2020: buildElection(2020),
  2024: buildElection(2024),
};

export const cantonSlugKey = (slug: CantonSlug) =>
  `${slug.provincia}/${slug.canton}`;

export const findCantonBySlug = (
  data: ElectionData,
  slug?: CantonSlug,
): CantonOption | undefined =>
  slug ? data.cantonPorSlug.get(cantonSlugKey(slug)) : undefined;
