import { csvParse } from "d3-dsv";

import presidencialNacionalCsv from "../../../src/data/clean/presidencial_nacional_2026.csv?raw";
import presidencialCantonCsv from "../../../src/data/clean/presidencial_2026.csv?raw";
import participacionPresidencialCsv from "../../../src/data/clean/participacion_presidencial_2026.csv?raw";
import resumenPresidencialCantonCsv from "../../../src/data/clean/resumen_presidencial_canton_2026.csv?raw";
import resumenPresidencialPartidoCsv from "../../../src/data/clean/resumen_presidencial_partido_2026.csv?raw";
import {
  cantonKey,
  provinceRank,
  type CantonOption,
  type CantonSlug,
} from "./data";
import { slugify } from "./format";

type CsvRow = Record<string, unknown>;

const text = (value: unknown) => String(value ?? "").trim();

const num = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const rows = (source: string) => csvParse(source) as unknown as CsvRow[];

export type PresidentialYear = 2026;

export type PresidentialCantonVoteRow = {
  provincia: string;
  canton: string;
  partido: string;
  votos: number;
};

export type PresidentialParticipationRow = {
  provincia: string;
  canton: string;
  electorado: number;
  votosRecibidos: number;
  participacion: number;
  abstencionismo: number;
};

export type PresidentialCantonRow = {
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
  votosNulos: number;
  votosBlancos: number;
};

export type PresidentialPartyRow = {
  partido: string;
  votos: number;
  votosCanton: number;
  votosExtranjero: number;
  porcentajeVotos: number;
  cantonesGanados: number;
  provinciasGanadas: number;
};

export type PresidentialNationalRow = {
  juntas: number;
  electorado: number;
  votosRecibidos: number;
  votosValidos: number;
  votosNulos: number;
  votosBlancos: number;
  participacion: number;
  abstencionismo: number;
};

export type PresidentialData = {
  year: PresidentialYear;
  votos: PresidentialCantonVoteRow[];
  votosPorCanton: Map<string, PresidentialCantonVoteRow[]>;
  resumenCanton: PresidentialCantonRow[];
  resumenPorCanton: Map<string, PresidentialCantonRow>;
  participacion: PresidentialParticipationRow[];
  participacionPorCanton: Map<string, PresidentialParticipationRow>;
  partidosNacional: PresidentialPartyRow[];
  nacional: PresidentialNationalRow;
  cantones: CantonOption[];
  cantonPorSlug: Map<string, CantonOption>;
};

const buildPresidential = (): PresidentialData => {
  const votos: PresidentialCantonVoteRow[] = rows(presidencialCantonCsv).map(
    (row) => ({
      provincia: text(row.provincia),
      canton: text(row.canton),
      partido: text(row.partido),
      votos: num(row.votos),
    }),
  );

  const resumenCanton: PresidentialCantonRow[] = rows(
    resumenPresidencialCantonCsv,
  ).map((row) => ({
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
    votosNulos: num(row.votos_nulos),
    votosBlancos: num(row.votos_blancos),
  }));

  const participacion: PresidentialParticipationRow[] = rows(
    participacionPresidencialCsv,
  ).map((row) => ({
    provincia: text(row.provincia),
    canton: text(row.canton),
    electorado: num(row.electorado),
    votosRecibidos: num(row.votos_recibidos),
    participacion: num(row.participacion),
    abstencionismo: num(row.abstencionismo),
  }));

  const partidosNacional: PresidentialPartyRow[] = rows(
    resumenPresidencialPartidoCsv,
  ).map((row) => ({
    partido: text(row.partido),
    votos: num(row.votos),
    votosCanton: num(row.votos_canton),
    votosExtranjero: num(row.votos_extranjero),
    porcentajeVotos: num(row.porcentaje_votos),
    cantonesGanados: num(row.cantones_ganados),
    provinciasGanadas: num(row.provincias_ganadas),
  }));

  const nacionalRow = rows(presidencialNacionalCsv)[0];

  if (!nacionalRow) {
    throw new Error("No se encontró el resumen nacional presidencial 2026");
  }

  const nacional: PresidentialNationalRow = {
    juntas: num(nacionalRow.juntas),
    electorado: num(nacionalRow.electorado),
    votosRecibidos: num(nacionalRow.votos_recibidos),
    votosValidos: num(nacionalRow.votos_validos),
    votosNulos: num(nacionalRow.votos_nulos),
    votosBlancos: num(nacionalRow.votos_blancos),
    participacion: num(nacionalRow.participacion),
    abstencionismo: num(nacionalRow.abstencionismo),
  };

  const cantonMap = new Map<string, CantonOption>();

  for (const row of resumenCanton) {
    const key = cantonKey(row);
    if (cantonMap.has(key)) continue;

    cantonMap.set(key, {
      key,
      provincia: row.provincia,
      canton: row.canton,
      slugProvincia: slugify(row.provincia),
      slugCanton: slugify(row.canton),
    });
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

  const votosPorCanton = new Map<string, PresidentialCantonVoteRow[]>();

  for (const row of votos) {
    const key = cantonKey(row);
    const current = votosPorCanton.get(key) ?? [];
    current.push(row);
    votosPorCanton.set(key, current);
  }

  for (const current of votosPorCanton.values()) {
    current.sort(
      (a, b) =>
        b.votos - a.votos || a.partido.localeCompare(b.partido, "es"),
    );
  }

  return {
    year: 2026,
    votos,
    votosPorCanton,
    resumenCanton,
    resumenPorCanton: new Map(
      resumenCanton.map((row) => [cantonKey(row), row]),
    ),
    participacion,
    participacionPorCanton: new Map(
      participacion.map((row) => [cantonKey(row), row]),
    ),
    partidosNacional,
    nacional,
    cantones,
    cantonPorSlug,
  };
};

export const presidential2026 = buildPresidential();

export const findPresidentialCantonBySlug = (
  slug?: CantonSlug,
): CantonOption | undefined =>
  slug
    ? presidential2026.cantonPorSlug.get(
        `${slug.provincia}/${slug.canton}`,
      )
    : undefined;
