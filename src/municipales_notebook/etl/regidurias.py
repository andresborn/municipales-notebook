import marimo

__generated_with = "0.25.2"
app = marimo.App(width="medium")


@app.cell
def _(mo):
    mo.md("""
    # ETL — Elecciones municipales 2024: regidurías

    Este notebook lee las hojas **3.2 a 3.8** del cómputo municipal del TSE.
    Cada hoja corresponde a una provincia y contiene los votos por partido
    para regidurías, desagregados por cantón.

    El resultado es un CSV tidy con las columnas:

    `provincia, canton, partido, votos`

    La regiduría se elige en una circunscripción cantonal, así que cada fila
    representa un partido dentro de un cantón. Se conservan las filas con cero
    votos para mantener completa la estructura partido-cantón.
    """)
    return


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
        / "COMPUTO DE VOTOS MUNICIPALES FEB 2024 FINAL.xlsm"
    )
    RUTA_SALIDA = RAIZ / "src" / "data" / "clean" / "regidurias_2024.csv"
    HOJAS = ["3.2", "3.3", "3.4", "3.5", "3.6", "3.7", "3.8"]
    return HOJAS, RUTA_SALIDA, RUTA_XLSX


@app.cell
def _(re):
    # Correcciones puntuales de nombres que vienen con errores en el Excel.
    CORRECCIONES_CANTONES = {
        "PUERO JIMÉNEZ": "PUERTO JIMÉNEZ",
        "PUERO JIMÉMNEZ": "PUERTO JIMÉNEZ",
    }

    CANTONES_ESPERADOS = {
        "SAN JOSÉ": 20,
        "ALAJUELA": 16,
        "CARTAGO": 8,
        "HEREDIA": 10,
        "GUANACASTE": 11,
        "PUNTARENAS": 13,
        "LIMÓN": 6,
    }

    def limpiar_texto(valor):
        """Convierte a texto, colapsa espacios y quita extremos."""
        if valor is None:
            return ""
        return re.sub(r"\s+", " ", str(valor)).strip()

    def normalizar_canton(valor):
        nombre = limpiar_texto(valor).upper()
        return CORRECCIONES_CANTONES.get(nombre, nombre)

    def a_entero(valor, contexto=""):
        """Convierte celdas numéricas a int, corrigiendo errores de coma flotante."""
        if valor is None:
            return 0
        if isinstance(valor, str):
            texto = valor.strip()
            if texto.upper() in {"", "N.A.", "NA", "-"}:
                return 0
            valor = texto.replace(",", "")

        numero = float(valor)
        entero = round(numero)
        if abs(numero - entero) > 0.01:
            raise ValueError(f"Valor no entero en {contexto}: {numero!r}")
        return int(entero)

    def provincia_desde_titulo(titulo):
        texto = limpiar_texto(titulo)
        match = re.search(r"PROVINCIA\s+([^:]+):", texto, re.IGNORECASE)
        if not match:
            raise ValueError(f"No se pudo extraer la provincia del título: {titulo!r}")
        return limpiar_texto(match.group(1)).upper()

    def extraer_hoja(ws, hoja):
        """
        Extrae los votos por partido y cantón de una hoja provincial.

        Estructura esperada:
        - fila 2: título con el nombre de la provincia
        - fila 6: nombres de los cantones desde la columna C
        - fila con "VOTOS POR PARTIDO": totales por cantón
        - filas siguientes: un partido por fila, hasta "VOTOS NULOS"
        """
        # Leemos toda la hoja. Cada fila es una tupla (A, B, C, ...), y los
        # índices usados abajo son 0-based: 0 = A, 1 = B, 2 = C.
        filas = list(ws.iter_rows(values_only=True))

        # La fila 2 tiene un título como "PROVINCIA SAN JOSÉ: ...", de ahí
        # sacamos la provincia.
        provincia = provincia_desde_titulo(filas[1][0])

        # La fila 6 tiene los nombres de cantón desde la columna C. La columna
        # B es el total provincial (o la etiqueta "Total"), así que se ignora.
        cabecera = filas[5]
        cantones = []
        for columna, valor in enumerate(cabecera):
            if columna < 2 or valor is None:
                continue
            nombre = normalizar_canton(valor)
            if nombre:
                cantones.append((columna, nombre))

        # La fila "VOTOS POR PARTIDO" trae el total declarado de cada cantón
        # (y en la columna B el total provincial).
        inicio = next(
            i
            for i, fila in enumerate(filas)
            if limpiar_texto(fila[0]).upper() == "VOTOS POR PARTIDO"
        )
        fin = next(
            i
            for i in range(inicio + 1, len(filas))
            if limpiar_texto(filas[i][0]).upper() == "VOTOS NULOS"
        )

        fila_total = filas[inicio]
        total_declarado = a_entero(fila_total[1], f"{hoja}/total")
        totales_por_canton = {
            canton: a_entero(fila_total[columna], f"{hoja}/{canton}")
            for columna, canton in cantones
        }

        registros = []
        suma_total = 0
        suma_por_canton = {canton: 0 for _, canton in cantones}

        for fila in filas[inicio + 1 : fin]:
            partido = limpiar_texto(fila[0])
            if not partido:
                continue

            total_partido = a_entero(fila[1], f"{hoja}/{partido}/total")
            votos = [
                a_entero(fila[columna], f"{hoja}/{partido}/{canton}")
                for columna, canton in cantones
            ]

            if sum(votos) != total_partido:
                raise ValueError(
                    f"Total inconsistente en {hoja}, partido {partido!r}: "
                    f"declarado={total_partido}, suma={sum(votos)}"
                )

            suma_total += total_partido
            for (_, canton), voto in zip(cantones, votos):
                suma_por_canton[canton] += voto
                registros.append(
                    {
                        "hoja": hoja,
                        "provincia": provincia,
                        "canton": canton,
                        "partido": partido,
                        "votos": voto,
                    }
                )

        if suma_total != total_declarado:
            raise ValueError(
                f"Total de partidos inconsistente en {hoja}: "
                f"declarado={total_declarado}, suma={suma_total}"
            )

        for canton, total_canton in totales_por_canton.items():
            if suma_por_canton[canton] != total_canton:
                raise ValueError(
                    f"Total de cantón inconsistente en {hoja}, {canton}: "
                    f"declarado={total_canton}, suma={suma_por_canton[canton]}"
                )

        return registros

    def leer_referencia_nacional(ws):
        """Lee de la hoja 3.1 el total nacional y los totales por provincia."""
        filas = list(ws.iter_rows(values_only=True))
        cabecera = filas[5]
        columnas = [
            (i, limpiar_texto(valor).upper())
            for i, valor in enumerate(cabecera)
            if i >= 2 and limpiar_texto(valor)
        ]
        fila_total = next(
            fila
            for fila in filas
            if limpiar_texto(fila[0]).upper() == "VOTOS POR PARTIDO"
        )

        total_nacional = a_entero(fila_total[1], "3.1/total")
        totales_provincia = {
            provincia: a_entero(fila_total[i], f"3.1/{provincia}")
            for i, provincia in columnas
        }
        return total_nacional, totales_provincia

    return (
        CANTONES_ESPERADOS,
        extraer_hoja,
        leer_referencia_nacional,
    )


@app.cell
def _(HOJAS, RUTA_XLSX, extraer_hoja, leer_referencia_nacional, openpyxl, pd):
    wb = openpyxl.load_workbook(RUTA_XLSX, read_only=True, data_only=True)

    registros = []
    for hoja in HOJAS:
        registros.extend(extraer_hoja(wb[hoja], hoja))

    total_nacional_ref, totales_provincia_ref = leer_referencia_nacional(wb["3.1"])
    wb.close()

    df = pd.DataFrame(registros)
    df = df[["hoja", "provincia", "canton", "partido", "votos"]]

    resumen_hojas = (
        df.groupby(["hoja", "provincia"], as_index=False)
        .agg(
            cantones=("canton", "nunique"),
            partidos=("partido", "nunique"),
            votos=("votos", "sum"),
        )
        .reset_index(drop=True)
    )

    return df, resumen_hojas, total_nacional_ref, totales_provincia_ref


@app.cell
def _(
    CANTONES_ESPERADOS,
    df,
    pd,
    total_nacional_ref,
    totales_provincia_ref,
):
    resumen_provincia = (
        df.groupby("provincia", as_index=False)
        .agg(
            cantones=("canton", "nunique"),
            partidos=("partido", "nunique"),
            votos=("votos", "sum"),
        )
        .reset_index(drop=True)
    )
    resumen_provincia["cantones_esperados"] = resumen_provincia["provincia"].map(
        CANTONES_ESPERADOS
    )
    resumen_provincia["votos_3_1"] = resumen_provincia["provincia"].map(
        totales_provincia_ref
    )
    resumen_provincia["dif_votos"] = (
        resumen_provincia["votos"] - resumen_provincia["votos_3_1"]
    )
    resumen_provincia["ok_cantones"] = (
        resumen_provincia["cantones"] == resumen_provincia["cantones_esperados"]
    )
    resumen_provincia["ok_votos"] = resumen_provincia["dif_votos"].eq(0)

    chequeos = pd.DataFrame(
        [
            {
                "chequeo": "Provincias",
                "esperado": 7,
                "obtenido": df["provincia"].nunique(),
            },
            {
                "chequeo": "Cantones",
                "esperado": 84,
                "obtenido": df["canton"].nunique(),
            },
            {
                "chequeo": "Votos totales",
                "esperado": total_nacional_ref,
                "obtenido": int(df["votos"].sum()),
            },
            {
                "chequeo": "Filas duplicadas",
                "esperado": 0,
                "obtenido": int(
                    df.duplicated(["provincia", "canton", "partido"]).sum()
                ),
            },
            {
                "chequeo": "Votos negativos",
                "esperado": 0,
                "obtenido": int((df["votos"] < 0).sum()),
            },
            {
                "chequeo": "Votos nulos (NaN)",
                "esperado": 0,
                "obtenido": int(df["votos"].isna().sum()),
            },
        ]
    )
    chequeos["ok"] = chequeos["esperado"] == chequeos["obtenido"]

    validacion_ok = bool(
        chequeos["ok"].all()
        and resumen_provincia[["ok_cantones", "ok_votos"]].all().all()
    )
    return chequeos, resumen_provincia, validacion_ok


@app.cell
def _(chequeos, df, mo, resumen_hojas, resumen_provincia, validacion_ok):
    estado = "✅ Validación OK" if validacion_ok else "❌ Revisar validación"

    mo.vstack(
        [
            mo.md(f"## {estado}"),
            mo.md("### Resumen por hoja"),
            mo.ui.table(resumen_hojas),
            mo.md("### Resumen por provincia"),
            mo.ui.table(resumen_provincia),
            mo.md("### Chequeos"),
            mo.ui.table(chequeos),
            mo.md("### Primeras filas del CSV"),
            mo.ui.table(df.drop(columns=["hoja"]).head(20)),
        ]
    )
    return


@app.cell
def _(RUTA_SALIDA, df, mo, validacion_ok):
    if validacion_ok:
        RUTA_SALIDA.parent.mkdir(parents=True, exist_ok=True)
        df.drop(columns=["hoja"]).to_csv(
            RUTA_SALIDA,
            index=False,
            encoding="utf-8",
        )
        mensaje = mo.md(
            f"CSV guardado en `{RUTA_SALIDA}` con **{len(df):,} filas**."
        )
    else:
        mensaje = mo.md(
            "No se guardó el CSV porque la validación falló. "
            "Revisá la tabla de chequeos."
        )

    mensaje
    return


if __name__ == "__main__":
    app.run()
