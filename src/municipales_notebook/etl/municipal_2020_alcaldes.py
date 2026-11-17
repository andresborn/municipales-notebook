import marimo

__generated_with = "0.25.2"
app = marimo.App(width="medium")


@app.cell
def _():
    import re
    from pathlib import Path

    import marimo as mo
    import openpyxl
    import pandas as pd

    return Path, mo, openpyxl, pd, re


@app.cell
def _(Path):
    def raiz_proyecto():
        """Busca la raíz del proyecto (donde está pyproject.toml)."""
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
    RUTA_XLSX = (
        RAIZ
        / "src"
        / "data"
        / "raw"
        / "COMPUTO DE VOTOS MUNICIPALES FEB 2020.xlsm"
    )
    return (RUTA_XLSX,)


@app.cell
def _(RUTA_XLSX, openpyxl):
    wb = openpyxl.load_workbook(RUTA_XLSX, read_only=True, data_only=True)
    return (wb,)


@app.cell
def _(mo, pd, re, wb):
    HOJAS = ["2.2", "2.3", "2.4", "2.5", "2.6", "2.7", "2.8"]

    # En 2020 todavía no existían los cantones de Monteverde ni Puerto Jiménez, así que Puntarenas tiene 11 cantones (no 13) y el país suma 82.
    CANTONES_ESPERADOS_2020 = {
        "SAN JOSÉ": 20,
        "ALAJUELA": 16,
        "CARTAGO": 8,
        "HEREDIA": 10,
        "GUANACASTE": 11,
        "PUNTARENAS": 11,
        "LIMÓN": 6,
    }

    def limpiar_texto(valor):
        """Convierte a texto, colapsa espacios y quita extremos."""
        if valor is None:
            return ""
        return re.sub(r"\s+", " ", str(valor)).strip()

    registros = []
    for hoja in HOJAS:
        filas = list(wb[hoja].iter_rows(values_only=True))

        # Suposición a validar: la fila 2 trae el título con la provincia.
        titulo = limpiar_texto(filas[1][0]) if len(filas) > 1 else ""
        match = re.search(r"PROVINCIA\s+([^:]+):", titulo, re.IGNORECASE)
        provincia = limpiar_texto(match.group(1)).upper() if match else ""

        # Suposición a validar: la fila 6 trae los cantones desde la columna C.
        cabecera = filas[5] if len(filas) > 5 else ()
        cantones = [
            limpiar_texto(valor).upper()
            for columna, valor in enumerate(cabecera)
            if columna >= 2 and limpiar_texto(valor)
        ]

        # Suposición a validar: los partidos están entre "VOTOS POR PARTIDO"
        # y "VOTOS NULOS".
        inicio = next(
            (
                i
                for i, fila in enumerate(filas)
                if limpiar_texto(fila[0]).upper() == "VOTOS POR PARTIDO"
            ),
            None,
        )
        fin = (
            next(
                (
                    i
                    for i in range(inicio + 1, len(filas))
                    if limpiar_texto(filas[i][0]).upper() == "VOTOS NULOS"
                ),
                None,
            )
            if inicio is not None
            else None
        )

        partidos = (
            sum(1 for fila in filas[inicio + 1 : fin] if limpiar_texto(fila[0]))
            if inicio is not None and fin is not None
            else None
        )

        esperados = CANTONES_ESPERADOS_2020.get(provincia)
        registros.append(
            {
                "hoja": hoja,
                "provincia": provincia,
                "cantones": len(cantones),
                "cantones_esperados": esperados,
                "ok_cantones": len(cantones) == esperados,
                "partidos": partidos,
                "fila_votos_partido": inicio + 1 if inicio is not None else None,
                "fila_votos_nulos": fin + 1 if fin is not None else None,
                "nombres_cantones": ", ".join(cantones),
            }
        )

    mapa_hojas = pd.DataFrame(registros)
    mapa_hojas["ok_estructura"] = (
        mapa_hojas["provincia"].ne("")
        & mapa_hojas["ok_cantones"]
        & mapa_hojas["fila_votos_partido"].notna()
        & mapa_hojas["fila_votos_nulos"].notna()
    )

    mo.vstack(
        [
            mo.md(
                f"""
                ## Exploración de las hojas de alcaldías 2020

                - Hojas revisadas: **{len(mapa_hojas)}**
                - Provincias detectadas: **{mapa_hojas["provincia"].nunique()}**
                - Cantones detectados: **{mapa_hojas["cantones"].sum()}**
                - Estructura esperada en todas las hojas: **{"sí" if mapa_hojas["ok_estructura"].all() else "no"}**
                """
            ),
            mo.ui.table(mapa_hojas, selection=None, show_data_types=False),
        ]
    )
    return


if __name__ == "__main__":
    app.run()
