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
    RUTA_SALIDA = RAIZ / "src" / "data" / "clean" / "alcaldes_2020.csv"
    RUTA_PARTICIPACION = (
        RAIZ / "src" / "data" / "clean" / "participacion_alcaldes_2020.csv"
    )
    return RUTA_PARTICIPACION, RUTA_SALIDA, RUTA_XLSX


@app.cell
def _(RUTA_XLSX, openpyxl):
    wb = openpyxl.load_workbook(RUTA_XLSX, read_only=True, data_only=True)
    return (wb,)


@app.cell
def _():
    # Hojas provinciales con los votos de alcaldías por cantón.
    HOJAS = ["2.2", "2.3", "2.4", "2.5", "2.6", "2.7", "2.8"]

    # En 2020 todavía no existían los cantones de Monteverde ni Puerto
    # Jiménez, así que Puntarenas tiene 11 cantones (no 13) y el país suma 82.
    CANTONES_ESPERADOS_2020 = {
        "SAN JOSÉ": 20,
        "ALAJUELA": 16,
        "CARTAGO": 8,
        "HEREDIA": 10,
        "GUANACASTE": 11,
        "PUNTARENAS": 11,
        "LIMÓN": 6,
    }

    # En 2024 hay que corregir nombres con errores en el Excel. En 2020 las
    # cabeceras de las hojas 2.2 a 2.8 ya coinciden con las de 2024.
    CORRECCIONES_CANTONES_2020 = {}
    return CANTONES_ESPERADOS_2020, CORRECCIONES_CANTONES_2020, HOJAS


@app.cell
def _(CORRECCIONES_CANTONES_2020, re):
    def limpiar_texto(valor):
        """Convierte a texto, colapsa whitespaces y quita extremos."""
        if valor is None:
            return ""
        return re.sub(r"\s+", " ", str(valor)).strip()

    def normalizar_canton(valor):
        nombre = limpiar_texto(valor).upper()
        return CORRECCIONES_CANTONES_2020.get(nombre, nombre)

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

    return a_entero, limpiar_texto, normalizar_canton, provincia_desde_titulo


@app.cell
def _(
    CANTONES_ESPERADOS_2020,
    HOJAS,
    RUTA_PARTICIPACION,
    a_entero,
    limpiar_texto,
    mo,
    normalizar_canton,
    pd,
    provincia_desde_titulo,
    wb,
):
    def extraer_participacion(ws, hoja):
        """
        Extrae electorado, votos recibidos y participación por cantón.

        Filas usadas: "ELECTORADO", "VOTOS RECIBIDOS" y
        "PORCENTAJE DE PARTICIPACIÓN" (esta última solo en alcaldías, donde
        sirve como chequeo independiente del cálculo).
        """
        filas = list(ws.iter_rows(values_only=True))
        provincia = provincia_desde_titulo(filas[1][0])

        cantones = [
            (columna, normalizar_canton(valor))
            for columna, valor in enumerate(filas[5])
            if columna >= 2 and normalizar_canton(valor)
        ]

        def fila_de(etiqueta):
            return filas[
                next(
                    i
                    for i, fila in enumerate(filas)
                    if limpiar_texto(fila[0]).upper() == etiqueta
                )
            ]

        fila_electorado = fila_de("ELECTORADO")
        fila_recibidos = fila_de("VOTOS RECIBIDOS")
        fila_porcentaje = fila_de("PORCENTAJE DE PARTICIPACIÓN")

        registros = []
        for columna, canton in cantones:
            electorado = a_entero(
                fila_electorado[columna], f"{hoja}/{canton}/ELECTORADO"
            )
            recibidos = a_entero(
                fila_recibidos[columna], f"{hoja}/{canton}/VOTOS RECIBIDOS"
            )
            if electorado <= 0 or recibidos > electorado:
                raise ValueError(
                    f"Electorado inválido en {hoja}/{canton}: "
                    f"electorado={electorado}, recibidos={recibidos}"
                )

            participacion = recibidos / electorado * 100
            declarado = float(fila_porcentaje[columna] or 0)
            if abs(participacion - declarado) > 0.01:
                raise ValueError(
                    f"Participación inconsistente en {hoja}/{canton}: "
                    f"declarada={declarado}, calculada={participacion}"
                )

            registros.append(
                {
                    "provincia": provincia,
                    "canton": canton,
                    "electorado": electorado,
                    "votos_recibidos": recibidos,
                    "participacion": participacion,
                }
            )

        # Las sumas por cantón deben coincidir con el total provincial (col. B).
        if sum(r["electorado"] for r in registros) != a_entero(fila_electorado[1]):
            raise ValueError(f"Electorado inconsistente en {hoja}")
        if sum(r["votos_recibidos"] for r in registros) != a_entero(
            fila_recibidos[1]
        ):
            raise ValueError(f"Votos recibidos inconsistentes en {hoja}")

        return registros

    registros_participacion = []
    for hoja_participacion in HOJAS:
        registros_participacion.extend(
            extraer_participacion(wb[hoja_participacion], hoja_participacion)
        )

    participacion = pd.DataFrame(registros_participacion)
    participacion["abstencionismo"] = 100 - participacion["participacion"]
    participacion["participacion"] = participacion["participacion"].round(2)
    participacion["abstencionismo"] = participacion["abstencionismo"].round(2)

    if len(participacion) != sum(CANTONES_ESPERADOS_2020.values()):
        raise ValueError(
            f"Se esperaban {sum(CANTONES_ESPERADOS_2020.values())} cantones, "
            f"se obtuvieron {len(participacion)}"
        )

    RUTA_PARTICIPACION.parent.mkdir(parents=True, exist_ok=True)
    participacion.to_csv(RUTA_PARTICIPACION, index=False, encoding="utf-8")

    mo.vstack(
        [
            mo.md(
                f"CSV guardado en `{RUTA_PARTICIPACION}` con "
                f"**{len(participacion)} cantones**."
            ),
            mo.ui.table(
                participacion.head(10),
                selection=None,
                show_data_types=False,
            ),
        ]
    )
    return


@app.cell
def _(
    CANTONES_ESPERADOS_2020,
    HOJAS,
    limpiar_texto,
    mo,
    pd,
    provincia_desde_titulo,
    wb,
):
    mapa_registros = []
    for hoja_mapa in HOJAS:
        filas = list(wb[hoja_mapa].iter_rows(values_only=True))

        # Suposición a validar: la fila 2 trae el título con la provincia.
        titulo = filas[1][0] if len(filas) > 1 else ""
        try:
            provincia = provincia_desde_titulo(titulo)
        except ValueError:
            provincia = ""

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
        mapa_registros.append(
            {
                "hoja": hoja_mapa,
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

    mapa_hojas = pd.DataFrame(mapa_registros)
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


@app.cell
def _(
    HOJAS,
    a_entero,
    limpiar_texto,
    normalizar_canton,
    pd,
    provincia_desde_titulo,
    wb,
):
    def extraer_hoja(ws, hoja):
        """
        Extrae los votos por partido y cantón de una hoja provincial de 2020.

        Estructura esperada:
        - fila 2: título con el nombre de la provincia
        - fila 6: nombres de los cantones desde la columna C
        - fila con "VOTOS POR PARTIDO": totales por cantón
        - filas siguientes: un partido por fila, hasta "VOTOS NULOS"
        """
        # Leemos toda la hoja. Cada fila es una tupla de celdas (A, B, C, ...)
        # y los índices de abajo son 0-based: 0 = A, 1 = B, 2 = C.
        filas = list(ws.iter_rows(values_only=True))

        # La fila 2 tiene un título como
        # "CUADRO 2.2 PROVINCIA SAN JOSÉ: ..."; de ahí sacamos el nombre.
        provincia = provincia_desde_titulo(filas[1][0])

        # La fila 6 es la cabecera con los nombres de cantón. La columna A (0)
        # es la etiqueta de la fila y la B (1) el total provincial, así que los
        # cantones empiezan en la columna C (2).
        cabecera = filas[5]

        cantones = []
        for columna, valor in enumerate(cabecera):
            if columna < 2 or valor is None:
                continue
            nombre = normalizar_canton(valor)
            if nombre:
                cantones.append((columna, nombre))

        # La fila "VOTOS POR PARTIDO" trae el total declarado de cada cantón
        # (y en la columna B el total provincial). La fila "VOTOS NULOS" marca
        # el final de las filas de partidos.
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

        # Recorremos solo las filas de partidos, entre "VOTOS POR PARTIDO" y
        # "VOTOS NULOS".
        for fila in filas[inicio + 1 : fin]:
            partido = limpiar_texto(fila[0])
            if not partido:
                continue

            # Columna B: total de ese partido en la provincia.
            total_partido = a_entero(fila[1], f"{hoja}/{partido}/total")
        
            # Una celda por cantón, en el mismo orden que `cantones`.
            votos = [
                a_entero(fila[columna], f"{hoja}/{partido}/{canton}")
                for columna, canton in cantones
            ]

            # Validación 1: la suma de los votos por cantón debe ser igual al
            # total del partido declarado en la columna B.
            if sum(votos) != total_partido:
                raise ValueError(
                    f"Total inconsistente en {hoja}, partido {partido!r}: "
                    f"declarado={total_partido}, suma={sum(votos)}"
                )

            suma_total += total_partido
            for (_, canton), voto in zip(cantones, votos):
                suma_por_canton[canton] += voto

                # "Derretimos" la tabla: una fila por partido y cantón.
                registros.append(
                    {
                        "hoja": hoja,
                        "provincia": provincia,
                        "canton": canton,
                        "partido": partido,
                        "votos": voto,
                    }
                )

        # Validación 2: la suma de los totales de todos los partidos debe
        # coincidir con el total provincial declarado.
        if suma_total != total_declarado:
            raise ValueError(
                f"Total de partidos inconsistente en {hoja}: "
                f"declarado={total_declarado}, suma={suma_total}"
            )

        # Validación 3: para cada cantón, la suma de sus votos entre todos los
        # partidos debe coincidir con el total declarado.
        for canton, total_canton in totales_por_canton.items():
            if suma_por_canton[canton] != total_canton:
                raise ValueError(
                    f"Total de cantón inconsistente en {hoja}, {canton}: "
                    f"declarado={total_canton}, suma={suma_por_canton[canton]}"
                )

        return registros

    registros_extraidos = []
    for hoja_actual in HOJAS:
        registros_extraidos.extend(
            extraer_hoja(wb[hoja_actual], hoja_actual)
        )

    df = pd.DataFrame(registros_extraidos)
    df = df[["hoja", "provincia", "canton", "partido", "votos"]]
    return (df,)


@app.cell
def _(CANTONES_ESPERADOS_2020, df, pd):
    resumen_provincia = (
        df.groupby(["hoja", "provincia"], as_index=False)
        .agg(
            cantones=("canton", "nunique"),
            partidos=("partido", "nunique"),
            votos=("votos", "sum"),
        )
        .reset_index(drop=True)
    )
    resumen_provincia["cantones_esperados"] = resumen_provincia["provincia"].map(
        CANTONES_ESPERADOS_2020
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
                "esperado": sum(CANTONES_ESPERADOS_2020.values()),
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
def _(chequeos, df, mo, resumen_provincia, validacion_ok):
    estado = "✅ Validación OK" if validacion_ok else "❌ Revisar validación"

    mo.vstack(
        [
            mo.md(f"## {estado}"),
            mo.md("### Resumen por provincia"),
            mo.ui.table(
                resumen_provincia,
                selection=None,
                show_data_types=False,
            ),
            mo.md("### Chequeos"),
            mo.ui.table(chequeos, selection=None, show_data_types=False),
            mo.md("### Primeras filas del CSV"),
            mo.ui.table(
                df.drop(columns=["hoja"]).head(20),
                selection=None,
                show_data_types=False,
            ),
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
