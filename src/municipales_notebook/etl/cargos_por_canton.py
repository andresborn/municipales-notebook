import marimo

__generated_with = "0.25.2"
app = marimo.App(width="medium")


@app.cell
def _(mo):
    mo.md("""
    # ETL — Elecciones municipales 2024: cargos por cantón

    Este notebook lee la hoja **1.20** del cómputo municipal del TSE:

    > Candidaturas electas a regidurías, sindicaturas y concejalías en propiedad,
    > por sexo, según provincia y cantón.

    La hoja trae los totales por cantón en tres columnas:

    - `B`: regidurías en propiedad.
    - `G`: sindicaturas en propiedad.
    - `L`: concejalías en propiedad.

    El resultado es un CSV con una fila por cantón:

    `provincia, canton, regidurias, sindicaturas, concejales`

    En 2024 estos totales coinciden con la cantidad de puestos a elegir en cada
    cantón, y suman 518 regidurías, 491 sindicaturas y 1963 concejalías.
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
    RUTA_SALIDA = RAIZ / "src" / "data" / "clean" / "cargos_por_canton_2024.csv"
    HOJA = "1.20"
    return HOJA, RUTA_SALIDA, RUTA_XLSX


@app.cell
def _(re):
    # Orden de las provincias en la hoja. Sirve para distinguir una fila de
    # total provincial de una fila de cantón con el mismo nombre.
    PROVINCIAS = [
        "SAN JOSÉ",
        "ALAJUELA",
        "CARTAGO",
        "HEREDIA",
        "GUANACASTE",
        "PUNTARENAS",
        "LIMÓN",
    ]

    CANTONES_ESPERADOS = {
        "SAN JOSÉ": 20,
        "ALAJUELA": 16,
        "CARTAGO": 8,
        "HEREDIA": 10,
        "GUANACASTE": 11,
        "PUNTARENAS": 13,
        "LIMÓN": 6,
    }

    # La hoja 1.20 usa nombres antiguos o sin tilde en dos casos. Los
    # alineamos con los nombres que ya usa alcaldes_2024.csv.
    CORRECCIONES_CANTONES = {
        "AGUIRRE": "QUEPOS",
        "RIO CUARTO": "RÍO CUARTO",
    }

    # Índices 0-based de las columnas de total en la hoja 1.20.
    COLUMNAS = {
        "regidurias": 1,  # columna B
        "sindicaturas": 6,  # columna G
        "concejales": 11,  # columna L
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
            raise ValueError(f"Valor vacío en {contexto}")

        if isinstance(valor, str):
            texto = valor.strip()
            if texto.upper() in {"", "N.A.", "NA", "-"}:
                raise ValueError(f"Valor vacío en {contexto}: {valor!r}")
            valor = texto.replace(",", "")

        numero = float(valor)
        entero = round(numero)
        if abs(numero - entero) > 0.01:
            raise ValueError(f"Valor no entero en {contexto}: {numero!r}")
        return int(entero)

    def extraer_cargos(ws, hoja):
        """
        Extrae los totales de regidurías, sindicaturas y concejales por cantón.

        Estructura esperada:
        - fila 6: cabecera con los bloques de regidurías, sindicaturas y concejalías.
        - fila 10: total nacional "COSTA RICA".
        - luego, por cada provincia: una fila de total provincial y una fila
          por cantón. Algunos cantones se llaman igual que su provincia
          (SAN JOSÉ, ALAJUELA, CARTAGO, etc.), por eso usamos el orden de
          `PROVINCIAS` para saber cuándo empieza un bloque provincial.
        """
        filas = list(ws.iter_rows(values_only=True))

        # 1. Validamos la cabecera para detectar cambios de estructura.
        cabecera = filas[5]
        if limpiar_texto(cabecera[0]).upper() != "PROVINCIA Y CANTÓN":
            raise ValueError(
                f"Cabecera inesperada en {hoja}: {limpiar_texto(cabecera[0])!r}"
            )
        for nombre_columna, indice in COLUMNAS.items():
            texto = limpiar_texto(cabecera[indice]).upper()
            if not texto:
                raise ValueError(
                    f"Falta la cabecera de {nombre_columna} en {hoja}, columna {indice}"
                )

        # 2. Fila de total nacional. La buscamos por etiqueta para no depender
        #    de un número de fila fijo.
        inicio = next(
            i
            for i, fila in enumerate(filas)
            if limpiar_texto(fila[0]).upper() == "COSTA RICA"
        )
        fila_pais = filas[inicio]
        totales_nacionales = {
            nombre: a_entero(fila_pais[indice], f"{hoja}/COSTA RICA/{nombre}")
            for nombre, indice in COLUMNAS.items()
        }

        # 3. Recorremos las filas siguientes. `indice_provincia` avanza cada vez
        #    que encontramos la fila de total de la siguiente provincia.
        registros = []
        totales_provincia = {}
        provincia_actual = None
        indice_provincia = 0

        for fila in filas[inicio + 1 :]:
            etiqueta = limpiar_texto(fila[0])
            if not etiqueta:
                continue
            if etiqueta.upper().startswith(("1/", "FUENTE")):
                break

            es_provincia = (
                indice_provincia < len(PROVINCIAS)
                and etiqueta.upper() == PROVINCIAS[indice_provincia]
            )
            if es_provincia:
                provincia_actual = etiqueta.upper()
                totales_provincia[provincia_actual] = {
                    nombre: a_entero(
                        fila[indice],
                        f"{hoja}/{provincia_actual}/{nombre}",
                    )
                    for nombre, indice in COLUMNAS.items()
                }
                indice_provincia += 1
                continue

            if provincia_actual is None:
                raise ValueError(
                    f"Cantón {etiqueta!r} antes de encontrar una provincia en {hoja}"
                )

            registros.append(
                {
                    "provincia": provincia_actual,
                    "canton": normalizar_canton(etiqueta),
                    **{
                        nombre: a_entero(
                            fila[indice],
                            f"{hoja}/{provincia_actual}/{etiqueta}/{nombre}",
                        )
                        for nombre, indice in COLUMNAS.items()
                    },
                }
            )

        return registros, totales_nacionales, totales_provincia

    return (
        CANTONES_ESPERADOS,
        PROVINCIAS,
        extraer_cargos,
    )


@app.cell
def _(HOJA, RUTA_XLSX, extraer_cargos, openpyxl, pd):
    wb = openpyxl.load_workbook(RUTA_XLSX, read_only=True, data_only=True)
    registros, totales_nacionales, totales_provincia = extraer_cargos(
        wb[HOJA], HOJA
    )
    wb.close()

    df = pd.DataFrame(registros)
    df = df[["provincia", "canton", "regidurias", "sindicaturas", "concejales"]]
    df = df.sort_values(["provincia", "canton"]).reset_index(drop=True)
    return df, totales_nacionales, totales_provincia


@app.cell
def _(
    CANTONES_ESPERADOS,
    df,
    pd,
    totales_nacionales,
    totales_provincia,
):
    resumen_provincia = (
        df.groupby("provincia", as_index=False)
        .agg(
            cantones=("canton", "nunique"),
            regidurias=("regidurias", "sum"),
            sindicaturas=("sindicaturas", "sum"),
            concejales=("concejales", "sum"),
        )
        .reset_index(drop=True)
    )

    esperado_provincia = pd.DataFrame(
        [
            {
                "provincia": provincia,
                "regidurias_esperadas": valores["regidurias"],
                "sindicaturas_esperadas": valores["sindicaturas"],
                "concejales_esperadas": valores["concejales"],
            }
            for provincia, valores in totales_provincia.items()
        ]
    )
    resumen_provincia = resumen_provincia.merge(
        esperado_provincia, on="provincia", how="left"
    )
    resumen_provincia["cantones_esperados"] = resumen_provincia["provincia"].map(
        CANTONES_ESPERADOS
    )

    resumen_provincia["ok_cantones"] = (
        resumen_provincia["cantones"] == resumen_provincia["cantones_esperados"]
    )
    for nombre in ["regidurias", "sindicaturas", "concejales"]:
        resumen_provincia[f"ok_{nombre}"] = (
            resumen_provincia[nombre] == resumen_provincia[f"{nombre}_esperadas"]
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
                "obtenido": int(df.duplicated(["provincia", "canton"]).sum()),
            },
            {
                "chequeo": "Regidurías",
                "esperado": totales_nacionales["regidurias"],
                "obtenido": int(df["regidurias"].sum()),
            },
            {
                "chequeo": "Sindicaturas",
                "esperado": totales_nacionales["sindicaturas"],
                "obtenido": int(df["sindicaturas"].sum()),
            },
            {
                "chequeo": "Concejales",
                "esperado": totales_nacionales["concejales"],
                "obtenido": int(df["concejales"].sum()),
            },
            {
                "chequeo": "Valores nulos",
                "esperado": 0,
                "obtenido": int(
                    df[["regidurias", "sindicaturas", "concejales"]]
                    .isna()
                    .any(axis=1)
                    .sum()
                ),
            },
            {
                "chequeo": "Valores negativos o cero",
                "esperado": 0,
                "obtenido": int(
                    (
                        df[["regidurias", "sindicaturas", "concejales"]] <= 0
                    )
                    .any(axis=1)
                    .sum()
                ),
            },
        ]
    )
    chequeos["ok"] = chequeos["esperado"] == chequeos["obtenido"]

    columnas_ok = [columna for columna in resumen_provincia if columna.startswith("ok_")]
    validacion_ok = bool(
        chequeos["ok"].all() and resumen_provincia[columnas_ok].all().all()
    )
    return chequeos, resumen_provincia, validacion_ok


@app.cell
def _(
    chequeos,
    df,
    mo,
    resumen_provincia,
    totales_nacionales,
    validacion_ok,
):
    estado = "✅ Validación OK" if validacion_ok else "❌ Revisar validación"

    mo.vstack(
        [
            mo.md(f"## {estado}"),
            mo.md(
                "Totales nacionales leídos de la hoja `1.20`: "
                f"**{totales_nacionales['regidurias']}** regidurías, "
                f"**{totales_nacionales['sindicaturas']}** sindicaturas y "
                f"**{totales_nacionales['concejales']}** concejalías."
            ),
            mo.md("### Resumen por provincia"),
            mo.ui.table(resumen_provincia, selection=None),
            mo.md("### Chequeos"),
            mo.ui.table(chequeos, selection=None),
            mo.md("### Primeras filas del CSV"),
            mo.ui.table(df.head(20), selection=None),
        ]
    )
    return


@app.cell
def _(RUTA_SALIDA, df, mo, validacion_ok):
    if validacion_ok:
        RUTA_SALIDA.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(RUTA_SALIDA, index=False, encoding="utf-8")
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
