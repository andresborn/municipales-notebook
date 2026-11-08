import marimo

__generated_with = "0.25.2"
app = marimo.App(width="medium")


@app.cell
def _(mo):
    mo.md("""
    # ETL — Elecciones municipales 2024: alcaldías

    Este notebook lee las hojas **2.2 a 2.8** del cómputo municipal del TSE.
    Cada hoja corresponde a una provincia y contiene los votos por partido
    para alcaldías, desagregados por cantón.

    El resultado es un CSV tidy con las columnas:

    `provincia, canton, partido, votos`
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
    RUTA_SALIDA = RAIZ / "src" / "data" / "clean" / "alcaldes_2024.csv"
    HOJAS = ["2.2", "2.3", "2.4", "2.5", "2.6", "2.7", "2.8"]
    return HOJAS, RUTA_SALIDA, RUTA_XLSX


@app.cell
def _(re):
    # Correcciones puntuales de nombres que vienen con errores en el Excel.
    CORRECCIONES_CANTONES = {
        "MONTES  DE OCA": "MONTES DE OCA",
        "MONTES  DE ORO": "MONTES DE ORO",
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
        # 1. Leemos toda la hoja en memoria. Cada fila es una tupla de celdas
        #    (A, B, C, ...) y los índices de abajo son 0-based:
        #    índice 0 = columna A, índice 1 = columna B, índice 2 = columna C.
        filas = list(ws.iter_rows(values_only=True))

        # 2. La fila 2 (índice 1) tiene un título como
        #    "PROVINCIA SAN JOSÉ: ALCALDES"; de ahí sacamos el nombre.
        provincia = provincia_desde_titulo(filas[1][0])

        # 3. La fila 6 (índice 5) es la cabecera con los nombres de cantón.
        #    La columna A (0) es la etiqueta de la fila y la B (1) el total
        #    provincial, así que los cantones empiezan en la columna C (2).
        #    Guardamos pares (índice_de_columna, nombre_normalizado) para
        #    saber después en qué columna está cada cantón.
        cabecera = filas[5]
        cantones = []
        for columna, valor in enumerate(cabecera):
            if columna < 2 or valor is None:
                continue
            nombre = normalizar_canton(valor)
            if nombre:
                cantones.append((columna, nombre))

        # 4. Buscamos la fila que dice "VOTOS POR PARTIDO". Esa fila es el
        #    total declarado por cantón (y en la columna B el total
        #    provincial). `inicio` es su índice 0-based.
        inicio = next(
            i
            for i, fila in enumerate(filas)
            if limpiar_texto(fila[0]).upper() == "VOTOS POR PARTIDO"
        )

        # 5. Buscamos dónde termina la tabla: la fila "VOTOS NULOS". Todo lo
        #    que está entre `inicio + 1` y `fin - 1` son filas de partidos.
        fin = next(
            i
            for i in range(inicio + 1, len(filas))
            if limpiar_texto(filas[i][0]).upper() == "VOTOS NULOS"
        )

        # 6. Leemos los totales declarados de la fila "VOTOS POR PARTIDO":
        #    - columna B (1): total provincial.
        #    - columnas de cada cantón: total de ese cantón.
        #    Los usaremos al final para validar que las sumas coincidan.
        fila_total = filas[inicio]
        total_declarado = a_entero(fila_total[1], f"{hoja}/total")
        totales_por_canton = {
            canton: a_entero(fila_total[columna], f"{hoja}/{canton}")
            for columna, canton in cantones
        }

        # 7. Acumuladores para las validaciones y lista donde armamos el
        #    resultado en formato largo (una fila por partido y cantón).
        registros = []
        suma_total = 0
        suma_por_canton = {canton: 0 for _, canton in cantones}

        # 8. Recorremos solo las filas de partidos (entre "VOTOS POR PARTIDO"
        #    y "VOTOS NULOS").
        for fila in filas[inicio + 1 : fin]:
            # 8a. Columna A: nombre del partido. Si está vacía, saltamos la
            #     fila (puede ser una fila de separación).
            partido = limpiar_texto(fila[0])
            if not partido:
                continue

            # 8b. Columna B: total de ese partido en la provincia.
            total_partido = a_entero(fila[1], f"{hoja}/{partido}/total")

            # 8c. Una celda por cantón, en el mismo orden que `cantones`.
            votos = [
                a_entero(fila[columna], f"{hoja}/{partido}/{canton}")
                for columna, canton in cantones
            ]

            # 8d. Validación 1: la suma de los votos por cantón debe ser
            #     igual al total del partido declarado en la columna B.
            if sum(votos) != total_partido:
                raise ValueError(
                    f"Total inconsistente en {hoja}, partido {partido!r}: "
                    f"declarado={total_partido}, suma={sum(votos)}"
                )

            # 8e. Acumulamos para las validaciones globales de la hoja.
            suma_total += total_partido
            for (_, canton), voto in zip(cantones, votos):
                suma_por_canton[canton] += voto

                # 8f. "Derretimos" la tabla: en vez de una fila por partido
                #     con muchos cantones en columnas, generamos una fila por
                #     cada combinación partido-cantón.
                registros.append(
                    {
                        "hoja": hoja,
                        "provincia": provincia,
                        "canton": canton,
                        "partido": partido,
                        "votos": voto,
                    }
                )

        # 9. Validación 2: la suma de los totales de todos los partidos debe
        #    coincidir con el total provincial declarado en "VOTOS POR PARTIDO".
        if suma_total != total_declarado:
            raise ValueError(
                f"Total de partidos inconsistente en {hoja}: "
                f"declarado={total_declarado}, suma={suma_total}"
            )

        # 10. Validación 3: para cada cantón, la suma de sus votos entre todos
        #     los partidos debe coincidir con el total declarado en la fila
        #     "VOTOS POR PARTIDO".
        for canton, total_canton in totales_por_canton.items():
            if suma_por_canton[canton] != total_canton:
                raise ValueError(
                    f"Total de cantón inconsistente en {hoja}, {canton}: "
                    f"declarado={total_canton}, suma={suma_por_canton[canton]}"
                )

        # 11. Devolvemos las filas limpias de esta hoja; el notebook las
        #     concatena con las de las demás provincias.
        return registros

    return CANTONES_ESPERADOS, extraer_hoja


@app.cell
def _(HOJAS, RUTA_XLSX, extraer_hoja, openpyxl, pd):
    wb = openpyxl.load_workbook(RUTA_XLSX, read_only=True, data_only=True)

    registros = []
    for hoja in HOJAS:
        registros.extend(extraer_hoja(wb[hoja], hoja))

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
    return df, resumen_hojas


@app.cell
def _(CANTONES_ESPERADOS, df, pd):
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
    resumen_provincia["ok_cantones"] = (
        resumen_provincia["cantones"] == resumen_provincia["cantones_esperados"]
    )

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
        chequeos["ok"].all() and resumen_provincia["ok_cantones"].all()
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
