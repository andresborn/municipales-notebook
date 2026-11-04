import { csvParse } from "d3";

import resumenAlcaldesCsv from "../../../src/data/clean/resumen_alcaldes_canton_2024.csv?raw";
import alcaldesPartidoCsv from "../../../src/data/clean/alcaldes_2024.csv?raw";
import escanosCsv from "../../../src/data/clean/escanos_regidurias_2024.csv?raw";
import regiduriasCantonCsv from "../../../src/data/clean/resumen_regidurias_canton_2024.csv?raw";
import regiduriasPartidoCsv from "../../../src/data/clean/resumen_regidurias_partido_2024.csv?raw";

type CsvRow = Record<string, unknown>;

const text = (value: unknown) => String(value ?? "").trim();

const num = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const boolean = (value: unknown) => text(value).toLowerCase() === "true";

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
};

export type RegiduriaCantonRow = {
  provincia: string;
  canton: string;
  regidurias: number;
  votosValidos: number;
  cociente: number;
  subcociente: number;
  partidosConEscanos: number;
  partidoMasEscanos: string;
  escanosPrimero: number;
  escanosAsignados: number;
  mayoria: number;
  tieneMayoria: boolean;
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
};

const rows = (source: string) => csvParse(source) as unknown as CsvRow[];

export const cantonKey = (row: { provincia: string; canton: string }) =>
  `${row.provincia}|${row.canton}`;

export const alcaldes: AlcaldeRow[] = rows(resumenAlcaldesCsv).map((row) => ({
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
}));

export const validosAlcaldesNacional = alcaldes.reduce(
  (total, row) => total + row.validos,
  0,
);

export const alcaldesPartido: AlcaldePartidoRow[] = rows(alcaldesPartidoCsv)
  .map((row) => ({
    provincia: text(row.provincia),
    canton: text(row.canton),
    partido: text(row.partido),
    votos: num(row.votos),
  }))
  .filter((row) => row.votos > 0);

export const regiduriasCanton: RegiduriaCantonRow[] = rows(
  regiduriasCantonCsv,
).map((row) => ({
  provincia: text(row.provincia),
  canton: text(row.canton),
  regidurias: num(row.regidurias),
  votosValidos: num(row.votos_validos),
  cociente: num(row.cociente),
  subcociente: num(row.subcociente),
  partidosConEscanos: num(row.partidos_con_escanos),
  partidoMasEscanos: text(row["partido_mas_escaños"]),
  escanosPrimero: num(row["escaños_primero"]),
  escanosAsignados: num(row["escaños_asignados"]),
  mayoria: num(row.mayoria),
  tieneMayoria: boolean(row.tiene_mayoria),
}));

export const escanosPartido: EscanoPartidoRow[] = rows(escanosCsv).map(
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

export const partidosNacional: PartidoNacionalRow[] = rows(
  regiduriasPartidoCsv,
).map((row) => ({
  partido: text(row.partido),
  votos: num(row.votos),
  escanos: num(row["escaños"]),
  porcentajeEscanos: num(row["porcentaje_escaños"]),
  porcentajeVotos: num(row.porcentaje_votos),
}));

/** Totales oficiales de participación de las elecciones municipales de 2024. */
export const participacionNacional = {
  electorado: 3_570_807,
  votosRecibidos: 1_141_935,
};

export const alcaldePorCanton = new Map(
  alcaldes.map((row) => [cantonKey(row), row]),
);

export const alcaldesPartidoPorCanton = new Map<
  string,
  AlcaldePartidoRow[]
>();

for (const row of alcaldesPartido) {
  const key = cantonKey(row);
  const current = alcaldesPartidoPorCanton.get(key) ?? [];
  current.push(row);
  alcaldesPartidoPorCanton.set(key, current);
}

for (const current of alcaldesPartidoPorCanton.values()) {
  current.sort((a, b) => b.votos - a.votos);
}

export const regiduriaPorCanton = new Map(
  regiduriasCanton.map((row) => [cantonKey(row), row]),
);

export const escanosPorCanton = new Map<string, EscanoPartidoRow[]>();

for (const row of escanosPartido) {
  const key = cantonKey(row);
  const current = escanosPorCanton.get(key) ?? [];
  current.push(row);
  escanosPorCanton.set(key, current);
}

for (const current of escanosPorCanton.values()) {
  current.sort((a, b) => b.escanos - a.escanos || b.votos - a.votos);
}

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

const cantonMap = new Map<string, CantonOption>();

for (const row of [...alcaldes, ...regiduriasCanton]) {
  const key = cantonKey(row);
  if (!cantonMap.has(key)) {
    cantonMap.set(key, {
      key,
      provincia: row.provincia,
      canton: row.canton,
    });
  }
}

export const cantones = [...cantonMap.values()].sort(
  (a, b) =>
    provinceRank(a.provincia) - provinceRank(b.provincia) ||
    a.canton.localeCompare(b.canton, "es"),
);

export const defaultCantonKey = "SAN JOSÉ|SAN JOSÉ";
