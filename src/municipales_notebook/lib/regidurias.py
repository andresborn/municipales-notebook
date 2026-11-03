"""Asignación de regidurías por el sistema de cociente y subcociente."""

from __future__ import annotations

import pandas as pd


def _asignar_canton(grupo: pd.DataFrame) -> pd.DataFrame:
    """Asigna las regidurías de un solo cantón."""
    grupo = grupo.sort_values("votos", ascending=False).reset_index(drop=True)
    regidurias = int(grupo["regidurias"].iloc[0])
    validos = int(grupo["votos"].sum())

    # Cociente = validos / regidurias. Con división entera evitamos floats:
    # escaños por cociente = floor(votos * N / V).
    escaños_cociente = (grupo["votos"] * regidurias) // validos

    # Residual escalado por N: residual * N = votos * N - escaños * V.
    # Así el orden por residual es exacto con enteros.
    residual = grupo["votos"] * regidurias - escaños_cociente * validos
    resto = regidurias - int(escaños_cociente.sum())

    resultado = grupo.copy()
    resultado["escaños_cociente"] = escaños_cociente
    resultado["escaños_resto"] = 0
    resultado["residual"] = residual / regidurias

    # Solo participan del resto los partidos cuya votación total alcanza el
    # subcociente: votos >= validos / (2 * regidurias).
    elegibles = resultado[2 * regidurias * resultado["votos"] >= validos]
    elegibles = elegibles.assign(_residual=residual[elegibles.index]).sort_values(
        ["_residual", "votos", "partido"],
        ascending=[False, False, True],
    )
    orden = list(elegibles.index)

    if resto > 0 and not orden:
        raise ValueError(f"No hay partidos elegibles para {resto} escaños restantes")

    # Si sobran más escaños que partidos elegibles, la operación se repite
    # desde el mayor residual hasta asignar todas las plazas.
    for i in range(resto):
        idx = orden[i % len(orden)]
        resultado.loc[idx, "escaños_resto"] += 1

    resultado["escaños"] = resultado["escaños_cociente"] + resultado["escaños_resto"]
    resultado["cociente"] = validos / regidurias
    resultado["subcociente"] = validos / (2 * regidurias)
    return resultado


def _resumir_canton(grupo: pd.DataFrame) -> pd.Series:
    grupo = grupo.sort_values(["escaños", "votos"], ascending=False)
    regidurias = int(grupo["regidurias"].iloc[0])
    validos = int(grupo["votos"].sum())
    primero = grupo.iloc[0]
    mayoria = regidurias // 2 + 1
    return pd.Series(
        {
            "regidurias": regidurias,
            "votos_validos": validos,
            "cociente": validos / regidurias,
            "subcociente": validos / (2 * regidurias),
            "partidos_con_escanos": int((grupo["escaños"] > 0).sum()),
            "partido_mas_escaños": primero["partido"],
            "escaños_primero": int(primero["escaños"]),
            "escaños_asignados": int(grupo["escaños"].sum()),
            "mayoria": mayoria,
            "tiene_mayoria": bool(primero["escaños"] >= mayoria),
        }
    )


def asignar_regidurias(
    votos: pd.DataFrame,
    cargos: pd.DataFrame,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Asigna regidurías por cantón usando cociente, subcociente y resto mayor.

    Parámetros
    ----------
    votos:
        DataFrame con columnas ``provincia, canton, partido, votos``.
    cargos:
        DataFrame con columnas ``provincia, canton, regidurias``.

    Devuelve
    --------
    asignacion:
        Una fila por partido y cantón, con escaños por cociente, por resto y
        total.
    resumen_canton:
        Una fila por cantón, con totales, mayoría y partido con más escaños.
    resumen_partido:
        Totales nacionales por partido.
    """
    votos_con_votos = votos[votos["votos"] > 0].copy()
    datos = votos_con_votos.merge(
        cargos[["provincia", "canton", "regidurias"]],
        on=["provincia", "canton"],
        how="inner",
        validate="many_to_one",
    )

    partes = []
    for (provincia, canton), grupo in datos.groupby(["provincia", "canton"]):
        parte = _asignar_canton(grupo)
        parte["provincia"] = provincia
        parte["canton"] = canton
        partes.append(parte)

    asignacion = pd.concat(partes, ignore_index=True)
    asignacion = (
        asignacion[
            [
                "provincia",
                "canton",
                "partido",
                "votos",
                "escaños_cociente",
                "escaños_resto",
                "escaños",
                "residual",
                "cociente",
                "subcociente",
                "regidurias",
            ]
        ]
        .sort_values(
            ["provincia", "canton", "escaños", "votos"],
            ascending=[True, True, False, False],
        )
        .reset_index(drop=True)
    )

    resumen_canton = (
        asignacion.groupby(["provincia", "canton"])
        .apply(_resumir_canton, include_groups=False)
        .reset_index()
        .sort_values(["provincia", "canton"])
        .reset_index(drop=True)
    )

    resumen_partido = (
        asignacion.groupby("partido", as_index=False)
        .agg(votos=("votos", "sum"), escaños=("escaños", "sum"))
        .sort_values(["escaños", "votos"], ascending=False)
        .reset_index(drop=True)
    )
    resumen_partido["porcentaje_escaños"] = (
        resumen_partido["escaños"] / resumen_partido["escaños"].sum() * 100
    )
    resumen_partido["porcentaje_votos"] = (
        resumen_partido["votos"] / resumen_partido["votos"].sum() * 100
    )

    return asignacion, resumen_canton, resumen_partido
