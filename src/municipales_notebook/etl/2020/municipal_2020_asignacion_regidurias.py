import marimo

__generated_with = "0.25.2"
app = marimo.App(width="medium")


@app.cell
def _(mo):
    mo.md("""
    # ETL — Regidurías 2020: asignación de escaños

    Calcula cuántas regidurías obtuvo cada partido en cada cantón y exporta
    los resultados a `src/data/clean/`:

    - `escanos_regidurias_2020.csv`: una fila por cantón y partido.
        - Muestra los votos que cada partido en cada cantón consiguió para regidurías, y cuántas obtuvo al final, por cociente y subcociente.
    - `resumen_regidurias_canton_2020.csv`: una fila por cantón.
        - Muestra qué partido obtuvo más escaños (más votos) en el cantón, cuántos escaños obtuvo y si tiene mayoría en el concejo municipal.
    - `resumen_regidurias_partido_2020.csv`: una fila por partido con escaños.
        - Muestra un agregado nacional de los votos y regidurías conseguidas por partido.

    La regla se implementa en `municipales_notebook.lib.regidurias` y usa
    cociente, subcociente y resto mayor, repitiendo la operación de resto hasta
    llenar todas las plazas.

    En 2020 son 82 cantones y hay 508 regidurías en juego.
    """)
    return


@app.cell
def _():
    from pathlib import Path

    import marimo as mo
    import pandas as pd

    from municipales_notebook.lib.regidurias import asignar_regidurias

    return Path, asignar_regidurias, mo, pd


@app.cell
def _(Path):
    def raiz_proyecto():
        candidatos = []
        if "__file__" in globals():
            candidatos.append(Path(__file__).resolve())
        candidatos.append(Path.cwd().resolve())
        for inicio in candidatos:
            for base in [inicio, *inicio.parents]:
                if (base / "pyproject.toml").exists():
                    return base
        return Path.cwd().resolve()

    RAIZ = raiz_proyecto()
    RUTA_VOTOS = RAIZ / "src" / "data" / "clean" / "regidurias_2020.csv"
    RUTA_CARGOS = RAIZ / "src" / "data" / "clean" / "cargos_por_canton_2020.csv"
    RUTA_ESCANOS = RAIZ / "src" / "data" / "clean" / "escanos_regidurias_2020.csv"
    RUTA_RESUMEN_CANTON = (
        RAIZ / "src" / "data" / "clean" / "resumen_regidurias_canton_2020.csv"
    )
    RUTA_RESUMEN_PARTIDO = (
        RAIZ / "src" / "data" / "clean" / "resumen_regidurias_partido_2020.csv"
    )
    RUTA_PARTICIPACION = (
        RAIZ / "src" / "data" / "clean" / "participacion_regidurias_2020.csv"
    )
    return (
        RUTA_CARGOS,
        RUTA_ESCANOS,
        RUTA_PARTICIPACION,
        RUTA_RESUMEN_CANTON,
        RUTA_RESUMEN_PARTIDO,
        RUTA_VOTOS,
    )


@app.cell
def _(RUTA_CARGOS, RUTA_PARTICIPACION, RUTA_VOTOS, asignar_regidurias, pd):
    votos = pd.read_csv(RUTA_VOTOS)
    cargos = pd.read_csv(RUTA_CARGOS)
    participacion_canton = pd.read_csv(RUTA_PARTICIPACION)

    asignacion, resumen_canton, resumen_partido = asignar_regidurias(
        votos, cargos
    )

    asignacion_export = asignacion.copy()
    asignacion_export["residual"] = asignacion_export["residual"].round(2)
    asignacion_export["cociente"] = asignacion_export["cociente"].round(2)
    asignacion_export["subcociente"] = asignacion_export["subcociente"].round(2)

    resumen_canton_export = resumen_canton.copy()
    resumen_canton_export["cociente"] = resumen_canton_export["cociente"].round(2)
    resumen_canton_export["subcociente"] = resumen_canton_export[
        "subcociente"
    ].round(2)

    # La participación es un dato del cantón: se agrega al resumen cantonal,
    # no a la tabla de escaños por partido.
    resumen_canton_export = resumen_canton_export.merge(
        participacion_canton[
            [
                "provincia",
                "canton",
                "electorado",
                "votos_recibidos",
                "participacion",
                "abstencionismo",
            ]
        ],
        on=["provincia", "canton"],
        how="left",
        validate="one_to_one",
    )

    resumen_partido_export = resumen_partido[
        resumen_partido["escaños"] > 0
    ].copy()
    resumen_partido_export["porcentaje_escaños"] = resumen_partido_export[
        "porcentaje_escaños"
    ].round(2)
    resumen_partido_export["porcentaje_votos"] = resumen_partido_export[
        "porcentaje_votos"
    ].round(2)
    return (
        asignacion,
        asignacion_export,
        resumen_canton_export,
        resumen_partido_export,
    )


@app.cell
def _(asignacion, pd, resumen_canton_export):
    validacion_cantones = resumen_canton_export.assign(
        ok=lambda datos: datos["escaños_asignados"] == datos["regidurias"]
    )
    total_asignado = int(asignacion["escaños"].sum())
    partidos_con_escanos = int(
        asignacion.loc[asignacion["escaños"] > 0, "partido"].nunique()
    )

    chequeos = pd.DataFrame(
        [
            {
                "chequeo": "Regidurías asignadas",
                "esperado": 508,
                "obtenido": total_asignado,
            },
            {
                "chequeo": "Cantones",
                "esperado": 82,
                "obtenido": int(resumen_canton_export["canton"].nunique()),
            },
            {
                "chequeo": "Cantones con suma correcta",
                "esperado": 82,
                "obtenido": int(validacion_cantones["ok"].sum()),
            },
            {
                "chequeo": "Partidos con escaños",
                "esperado": 63,
                "obtenido": partidos_con_escanos,
            },
            {
                "chequeo": "Cantones con participación",
                "esperado": 82,
                "obtenido": int(
                    resumen_canton_export["abstencionismo"].notna().sum()
                ),
            },
            {
                "chequeo": "Filas duplicadas",
                "esperado": 0,
                "obtenido": int(
                    asignacion.duplicated(
                        ["provincia", "canton", "partido"]
                    ).sum()
                ),
            },
        ]
    )
    chequeos["ok"] = chequeos["esperado"] == chequeos["obtenido"]
    validacion_ok = bool(chequeos["ok"].all())
    return chequeos, validacion_ok


@app.cell
def _(
    asignacion_export,
    chequeos,
    mo,
    resumen_canton_export,
    resumen_partido_export,
    validacion_ok,
):
    estado = "✅ Validación OK" if validacion_ok else "❌ Revisar validación"

    mo.vstack(
        [
            mo.md(f"## {estado}"),
            mo.md("### Chequeos"),
            mo.ui.table(chequeos, selection=None, show_data_types=False),
            mo.md("### Resumen por partido"),
            mo.ui.table(
                resumen_partido_export.head(15),
                selection=None,
                show_data_types=False,
            ),
            mo.md("### Resumen por cantón"),
            mo.ui.table(
                resumen_canton_export.head(15),
                selection=None,
                show_data_types=False,
            ),
            mo.md("### Primeras filas de escaños"),
            mo.ui.table(
                asignacion_export.head(20),
                selection=None,
                show_data_types=False,
            ),
        ]
    )
    return


@app.cell
def _(
    RUTA_ESCANOS,
    RUTA_RESUMEN_CANTON,
    RUTA_RESUMEN_PARTIDO,
    asignacion_export,
    mo,
    resumen_canton_export,
    resumen_partido_export,
    validacion_ok,
):
    if validacion_ok:
        for ruta in (RUTA_ESCANOS, RUTA_RESUMEN_CANTON, RUTA_RESUMEN_PARTIDO):
            ruta.parent.mkdir(parents=True, exist_ok=True)

        asignacion_export.to_csv(RUTA_ESCANOS, index=False, encoding="utf-8")
        resumen_canton_export.to_csv(
            RUTA_RESUMEN_CANTON, index=False, encoding="utf-8"
        )
        resumen_partido_export.to_csv(
            RUTA_RESUMEN_PARTIDO, index=False, encoding="utf-8"
        )

        mensaje = mo.md(
            "CSV guardados:\n\n"
            f"- `{RUTA_ESCANOS}`\n"
            f"- `{RUTA_RESUMEN_CANTON}`\n"
            f"- `{RUTA_RESUMEN_PARTIDO}`"
        )
    else:
        mensaje = mo.md(
            "No se guardaron los CSV porque la validación falló. "
            "Revisá la tabla de chequeos."
        )

    mensaje
    return


if __name__ == "__main__":
    app.run()
