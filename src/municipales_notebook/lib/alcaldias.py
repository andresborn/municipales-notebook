"""Indicadores de competitividad de las elecciones de alcaldía."""

from __future__ import annotations

import pandas as pd


def _resumir_canton(grupo: pd.DataFrame) -> pd.Series:
    """Resume la alcaldía de un solo cantón."""
    grupo = grupo[grupo["votos"] > 0].sort_values(
        ["votos", "partido"],
        ascending=[False, True],
    ).reset_index(drop=True)

    if grupo.empty:
        raise ValueError("El cantón no tiene votos para alcaldía")

    validos = int(grupo["votos"].sum())
    cuotas = grupo["votos"] / validos
    primero = grupo.iloc[0]

    if len(grupo) > 1:
        segundo = grupo.iloc[1]
        votos_segundo = int(segundo["votos"])
        margen = int(primero["votos"] - segundo["votos"])
    else:
        segundo = None
        votos_segundo = 0
        margen = int(primero["votos"])

    return pd.Series(
        {
            "validos": validos,
            "partidos_con_votos": len(grupo),
            "ganador": primero["partido"],
            "segundo": segundo["partido"] if segundo is not None else None,
            "votos_ganador": int(primero["votos"]),
            "votos_segundo": votos_segundo,
            "margen_votos": margen,
            "margen_pp": margen / validos * 100,
            "cuota_ganador": primero["votos"] / validos * 100,
            "enp": 1 / (cuotas**2).sum(),
        }
    )


def resumir_alcaldias(votos: pd.DataFrame) -> pd.DataFrame:
    """
    Calcula indicadores de competitividad por cantón para alcaldías.

    Parámetros
    ----------
    votos:
        DataFrame con columnas ``provincia, canton, partido, votos``. Las filas
        con cero votos se ignoran.

    Devuelve
    --------
    DataFrame con una fila por cantón y columnas de participación, margen,
    cuota del ganador, ENP y clasificación de competitividad.
    """
    votos_con_partido = votos[votos["votos"] > 0].copy()
    resumen = (
        votos_con_partido.groupby(["provincia", "canton"])
        .apply(_resumir_canton, include_groups=False)
        .reset_index()
    )

    resumen["margen_pp"] = resumen["margen_pp"].round(1)
    resumen["swing_pp"] = (resumen["margen_pp"] / 2).round(1)
    resumen["cuota_ganador"] = resumen["cuota_ganador"].round(1)
    resumen["enp"] = resumen["enp"].round(2)

    resumen["clasificacion"] = pd.cut(
        resumen["margen_pp"],
        bins=[-float("inf"), 5, 10, 20, float("inf")],
        labels=["Muy disputado", "Disputado", "Poco disputado", "Dominado"],
        right=False,
    )

    return (
        resumen[
            [
                "provincia",
                "canton",
                "clasificacion",
                "ganador",
                "segundo",
                "votos_ganador",
                "votos_segundo",
                "margen_votos",
                "margen_pp",
                "swing_pp",
                "cuota_ganador",
                "enp",
                "validos",
                "partidos_con_votos",
            ]
        ]
        .sort_values("margen_pp")
        .reset_index(drop=True)
    )
