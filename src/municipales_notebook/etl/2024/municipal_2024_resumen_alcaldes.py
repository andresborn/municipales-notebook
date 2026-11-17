import marimo

__generated_with = "0.25.2"
app = marimo.App(width="medium")


@app.cell
def _(mo):
    mo.md("""
    # ETL — Alcaldías 2024: resumen por cantón

    Calcula los indicadores de competitividad de la alcaldía y exporta
    `resumen_alcaldes_canton_2024.csv` a `src/data/clean/`.

    La lógica se implementa en `municipales_notebook.lib.alcaldias` y se
    comparte con `eda/alcaldes.py`.
    """)
    return


@app.cell
def _():
    from pathlib import Path

    import marimo as mo
    import pandas as pd

    from municipales_notebook.lib.alcaldias import resumir_alcaldias

    return Path, mo, pd, resumir_alcaldias


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
    RUTA_VOTOS = RAIZ / "src" / "data" / "clean" / "alcaldes_2024.csv"
    RUTA_RESUMEN = (
        RAIZ / "src" / "data" / "clean" / "resumen_alcaldes_canton_2024.csv"
    )
    return RUTA_RESUMEN, RUTA_VOTOS


@app.cell
def _(RUTA_VOTOS, pd, resumir_alcaldias):
    votos = pd.read_csv(RUTA_VOTOS)
    resumen = resumir_alcaldias(votos)

    resumen_export = resumen.copy()
    for columna in ("margen_pp", "swing_pp", "cuota_ganador"):
        resumen_export[columna] = resumen_export[columna].round(1)
    resumen_export["enp"] = resumen_export["enp"].round(2)

    return resumen, resumen_export, votos


@app.cell
def _(mo, pd, resumen_export, votos):
    total_votos = int(votos["votos"].sum())

    chequeos = pd.DataFrame(
        [
            {
                "chequeo": "Cantones",
                "esperado": 84,
                "obtenido": int(resumen_export["canton"].nunique()),
            },
            {
                "chequeo": "Filas duplicadas",
                "esperado": 0,
                "obtenido": int(
                    resumen_export.duplicated(["provincia", "canton"]).sum()
                ),
            },
            {
                "chequeo": "Votos válidos nacionales",
                "esperado": 1117562,
                "obtenido": total_votos,
            },
            {
                "chequeo": "Cantones con ganador",
                "esperado": 84,
                "obtenido": int(resumen_export["ganador"].notna().sum()),
            },
            {
                "chequeo": "Cantones con segundo lugar",
                "esperado": 84,
                "obtenido": int(resumen_export["segundo"].notna().sum()),
            },
        ]
    )
    chequeos["ok"] = chequeos["esperado"] == chequeos["obtenido"]
    validacion_ok = bool(chequeos["ok"].all())
    return chequeos, validacion_ok


@app.cell
def _(chequeos, mo, resumen_export, validacion_ok):
    estado = "✅ Validación OK" if validacion_ok else "❌ Revisar validación"

    mo.vstack(
        [
            mo.md(f"## {estado}"),
            mo.ui.table(chequeos, selection=None, show_data_types=False),
            mo.md("### Resumen por cantón"),
            mo.ui.table(
                resumen_export.head(15),
                selection=None,
                show_data_types=False,
            ),
        ]
    )
    return


@app.cell
def _(RUTA_RESUMEN, mo, resumen_export, validacion_ok):
    if validacion_ok:
        RUTA_RESUMEN.parent.mkdir(parents=True, exist_ok=True)
        resumen_export.to_csv(RUTA_RESUMEN, index=False, encoding="utf-8")
        mensaje = mo.md(f"CSV guardado en `{RUTA_RESUMEN}`")
    else:
        mensaje = mo.md(
            "No se guardó el CSV porque la validación falló. "
            "Revisá la tabla de chequeos."
        )

    mensaje
    return


if __name__ == "__main__":
    app.run()
