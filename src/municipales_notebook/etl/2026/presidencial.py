import marimo

__generated_with = "0.25.2"
app = marimo.App(width="medium")


@app.cell
def _(mo):
    mo.md("""
    # ETL — Elecciones nacionales 2026: presidencial

    Este notebook lee el **cuadro 1.2** del cómputo de las elecciones
    nacionales del TSE:

    *Costa Rica: juntas, electorado, participación, votos por partido, nulos,
    blancos y abstencionismo, para presidencia y vicepresidencias, según
    provincia, cantón y extranjero.*

    La unidad de análisis de la presidencial es el **cantón**. El cuadro 1.2
    ya trae una fila por cantón con los 20 partidos, así que no hace falta
    recorrer las hojas provinciales. El cuadro 1.1 se usa como referencia
    independiente para validar los totales por provincia y el total nacional.

    Archivos generados en `src/data/clean/`:

    - `presidencial_2026.csv`: votos por partido y cantón.
    - `participacion_presidencial_2026.csv`: electorado y participación por
      cantón.
    - `resumen_presidencial_canton_2026.csv`: ganador, margen, ENP y
      participación por cantón.
    - `resumen_presidencial_partido_2026.csv`: votos nacionales por partido,
      separando voto cantonal y voto en el extranjero.
    """)
    return


@app.cell
def _():
    import re
    from pathlib import Path

    import marimo as mo
    import openpyxl
    import pandas as pd

    from municipales_notebook.lib.alcaldias import resumir_alcaldias

    return Path, mo, openpyxl, pd, re, resumir_alcaldias


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
        / "Computo de Votos Elecciones 2026 (vf2).xlsm"
    )
    RUTA_PRESIDENCIAL = RAIZ / "src" / "data" / "clean" / "presidencial_2026.csv"
    RUTA_PARTICIPACION = (
        RAIZ / "src" / "data" / "clean" / "participacion_presidencial_2026.csv"
    )
    RUTA_RESUMEN_CANTON = (
        RAIZ / "src" / "data" / "clean" / "resumen_presidencial_canton_2026.csv"
    )
    RUTA_RESUMEN_PARTIDO = (
        RAIZ / "src" / "data" / "clean" / "resumen_presidencial_partido_2026.csv"
    )
    RUTA_NACIONAL = (
        RAIZ / "src" / "data" / "clean" / "presidencial_nacional_2026.csv"
    )

    HOJA = "C1.2"
    HOJA_REFERENCIA = "C1.1"
    return (
        HOJA,
        HOJA_REFERENCIA,
        RUTA_NACIONAL,
        RUTA_PARTICIPACION,
        RUTA_PRESIDENCIAL,
        RUTA_RESUMEN_CANTON,
        RUTA_RESUMEN_PARTIDO,
        RUTA_XLSX,
    )


@app.cell
def _(re):
    # El país tiene 84 cantones desde la creación de Monteverde y
    # Puerto Jiménez (leyes 10019 y 10195).
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
        return limpiar_texto(valor).upper()

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

    return CANTONES_ESPERADOS, a_entero, limpiar_texto, normalizar_canton


@app.cell
def _(
    HOJA,
    HOJA_REFERENCIA,
    a_entero,
    limpiar_texto,
    normalizar_canton,
    pd,
    re,
):
    def columnas_c1_2(filas):
        """
        Localiza las columnas del cuadro 1.2.

        La fila 5 (índice 4) trae las etiquetas de métricas (NULOS, BLANCOS,
        ABSTENCIONISMO...) y la fila 6 (índice 5) los nombres de los partidos.
        """
        fila_metricas = filas[4]
        fila_partidos = filas[5]

        etiquetas = {
            limpiar_texto(valor).upper(): i
            for i, valor in enumerate(fila_metricas)
            if limpiar_texto(valor)
        }
        col_nulos = etiquetas["NULOS"]

        partidos = [
            (i, limpiar_texto(fila_partidos[i]).upper())
            for i in range(6, col_nulos)
            if limpiar_texto(fila_partidos[i])
        ]
        return etiquetas, partidos

    def metricas_de_fila(fila, etiquetas, contexto):
        col_abstencion_pct = next(
            i for etiqueta, i in etiquetas.items() if etiqueta.startswith("%")
        )
        return {
            "juntas": a_entero(fila[1], f"{contexto}/JUNTAS"),
            "electorado": a_entero(fila[2], f"{contexto}/ELECTORADO"),
            "votos_recibidos": a_entero(fila[3], f"{contexto}/VOTOS RECIBIDOS"),
            "participacion": float(fila[4] or 0),
            "votos_validos": a_entero(fila[5], f"{contexto}/VOTOS VÁLIDOS"),
            "votos_nulos": a_entero(
                fila[etiquetas["NULOS"]], f"{contexto}/VOTOS NULOS"
            ),
            "votos_blancos": a_entero(
                fila[etiquetas["BLANCOS"]], f"{contexto}/VOTOS BLANCOS"
            ),
            "abstencionismo_absoluto": a_entero(
                fila[etiquetas["ABSOLUTO"]], f"{contexto}/ABSTENCIONISMO"
            ),
            "abstencionismo_pct": float(fila[col_abstencion_pct] or 0),
        }

    def validar_fila(metricas, votos_partido, contexto):
        """Valida las identidades internas de una fila del cuadro 1.2."""
        if sum(votos_partido) != metricas["votos_validos"]:
            raise ValueError(
                f"Votos válidos inconsistentes en {contexto}: "
                f"partidos={sum(votos_partido)}, "
                f"declarado={metricas['votos_validos']}"
            )

        if (
            metricas["votos_validos"]
            + metricas["votos_nulos"]
            + metricas["votos_blancos"]
            != metricas["votos_recibidos"]
        ):
            raise ValueError(
                f"Votos recibidos inconsistentes en {contexto}: "
                f"válidos+nulos+blancos="
                f"{metricas['votos_validos'] + metricas['votos_nulos'] + metricas['votos_blancos']}, "
                f"declarado={metricas['votos_recibidos']}"
            )

        if metricas["electorado"] <= 0:
            raise ValueError(f"Electorado inválido en {contexto}")

        participacion_calculada = (
            metricas["votos_recibidos"] / metricas["electorado"] * 100
        )
        if abs(participacion_calculada - metricas["participacion"]) > 0.01:
            raise ValueError(
                f"Participación inconsistente en {contexto}: "
                f"calculada={participacion_calculada}, "
                f"declarada={metricas['participacion']}"
            )

        abstencion_absoluta = (
            metricas["electorado"] - metricas["votos_recibidos"]
        )
        if abstencion_absoluta != metricas["abstencionismo_absoluto"]:
            raise ValueError(
                f"Abstencionismo absoluto inconsistente en {contexto}: "
                f"calculado={abstencion_absoluta}, "
                f"declarado={metricas['abstencionismo_absoluto']}"
            )

        abstencion_pct = 100 - participacion_calculada
        if abs(abstencion_pct - metricas["abstencionismo_pct"]) > 0.01:
            raise ValueError(
                f"Abstencionismo inconsistente en {contexto}: "
                f"calculado={abstencion_pct}, "
                f"declarado={metricas['abstencionismo_pct']}"
            )

    def extraer_c1_2(ws, hoja=HOJA):
        """
        Extrae los votos por partido y cantón del cuadro 1.2.

        Devuelve cuatro DataFrames:
        - votos_canton: una fila por partido y cantón.
        - participacion_canton: una fila por cantón.
        - votos_provincia: una fila por partido y provincia (incluye
          ``EXTRANJERO`` como una circunscripción aparte).
        - votos_nacional: una fila por partido con el total del país.
        """
        filas = list(ws.iter_rows(values_only=True))
        etiquetas, partidos = columnas_c1_2(filas)

        registros_canton = []
        registros_participacion = []
        filas_provincia = {}
        fila_nacional = None
        fila_extranjero = None
        provincia = None

        for fila in filas[6:]:
            etiqueta = limpiar_texto(fila[0])
            if not etiqueta:
                continue

            etiqueta_mayus = etiqueta.upper()

            if etiqueta_mayus == "COSTA RICA":
                fila_nacional = fila
                continue

            if etiqueta_mayus.startswith("PROVINCIA "):
                provincia = etiqueta_mayus[len("PROVINCIA ") :].strip()
                filas_provincia[provincia] = fila
                continue

            if etiqueta_mayus == "EXTRANJERO":
                fila_extranjero = fila
                continue

            match = re.match(
                r"CANT[ÓO]N\s+\d+\s+(.+)", etiqueta, re.IGNORECASE
            )
            if not match:
                if etiqueta_mayus.startswith(("1/", "2/", "3/", "FUENTE")):
                    break
                raise ValueError(
                    f"Fila no reconocida en {hoja}: {etiqueta!r}"
                )

            if provincia is None:
                raise ValueError(
                    f"Cantón sin provincia en {hoja}: {etiqueta!r}"
                )

            canton = normalizar_canton(match.group(1))
            metricas = metricas_de_fila(
                fila, etiquetas, f"{hoja}/{provincia}/{canton}"
            )
            votos = [
                a_entero(
                    fila[columna],
                    f"{hoja}/{provincia}/{canton}/{partido}",
                )
                for columna, partido in partidos
            ]
            validar_fila(
                metricas, votos, f"{hoja}/{provincia}/{canton}"
            )

            for (_, partido), voto in zip(partidos, votos):
                registros_canton.append(
                    {
                        "hoja": hoja,
                        "provincia": provincia,
                        "canton": canton,
                        "partido": partido,
                        "votos": voto,
                    }
                )

            registros_participacion.append(
                {
                    "provincia": provincia,
                    "canton": canton,
                    "electorado": metricas["electorado"],
                    "votos_recibidos": metricas["votos_recibidos"],
                    "participacion": round(metricas["participacion"], 2),
                    "abstencionismo": round(
                        100 - metricas["participacion"], 2
                    ),
                    "votos_validos": metricas["votos_validos"],
                    "votos_nulos": metricas["votos_nulos"],
                    "votos_blancos": metricas["votos_blancos"],
                }
            )

        votos_canton = pd.DataFrame(registros_canton)
        participacion_canton = pd.DataFrame(registros_participacion)

        # 1. Cada fila provincial debe coincidir con la suma de sus cantones.
        registros_provincia = []
        for nombre_provincia, fila in filas_provincia.items():
            metricas = metricas_de_fila(
                fila, etiquetas, f"{hoja}/{nombre_provincia}"
            )
            votos = [
                a_entero(
                    fila[columna],
                    f"{hoja}/{nombre_provincia}/{partido}",
                )
                for columna, partido in partidos
            ]
            validar_fila(
                metricas, votos, f"{hoja}/{nombre_provincia}"
            )

            votos_cantones = votos_canton[
                votos_canton["provincia"] == nombre_provincia
            ]
            if votos_cantones.empty:
                raise ValueError(
                    f"Provincia sin cantones en {hoja}: {nombre_provincia}"
                )

            for (_, partido), voto in zip(partidos, votos):
                suma_cantones = int(
                    votos_cantones.loc[
                        votos_cantones["partido"] == partido, "votos"
                    ].sum()
                )
                if suma_cantones != voto:
                    raise ValueError(
                        f"Votos provinciales inconsistentes en "
                        f"{hoja}/{nombre_provincia}/{partido}: "
                        f"cantones={suma_cantones}, declarado={voto}"
                    )
                registros_provincia.append(
                    {
                        "provincia": nombre_provincia,
                        "partido": partido,
                        "votos": voto,
                    }
                )

            participacion_cantones = participacion_canton[
                participacion_canton["provincia"] == nombre_provincia
            ]
            for campo in (
                "electorado",
                "votos_recibidos",
                "votos_validos",
                "votos_nulos",
                "votos_blancos",
            ):
                suma_cantones = int(participacion_cantones[campo].sum())
                if suma_cantones != metricas[campo]:
                    raise ValueError(
                        f"{campo} provincial inconsistente en "
                        f"{hoja}/{nombre_provincia}: "
                        f"cantones={suma_cantones}, "
                        f"declarado={metricas[campo]}"
                    )

        # 2. El extranjero es una circunscripción propia: no se reparte
        #    entre provincias ni cantones, pero sí cuenta para el total país.
        if fila_extranjero is not None:
            metricas = metricas_de_fila(
                fila_extranjero, etiquetas, f"{hoja}/EXTRANJERO"
            )
            votos = [
                a_entero(
                    fila_extranjero[columna],
                    f"{hoja}/EXTRANJERO/{partido}",
                )
                for columna, partido in partidos
            ]
            validar_fila(metricas, votos, f"{hoja}/EXTRANJERO")

            for (_, partido), voto in zip(partidos, votos):
                registros_provincia.append(
                    {
                        "provincia": "EXTRANJERO",
                        "partido": partido,
                        "votos": voto,
                    }
                )

        votos_provincia = pd.DataFrame(registros_provincia)

        # 3. La fila COSTA RICA debe ser igual a la suma de provincias y
        #    extranjero.
        if fila_nacional is not None:
            metricas = metricas_de_fila(
                fila_nacional, etiquetas, f"{hoja}/COSTA RICA"
            )
            votos = [
                a_entero(
                    fila_nacional[columna],
                    f"{hoja}/COSTA RICA/{partido}",
                )
                for columna, partido in partidos
            ]
            validar_fila(metricas, votos, f"{hoja}/COSTA RICA")

            for (_, partido), voto in zip(partidos, votos):
                suma = int(
                    votos_provincia.loc[
                        votos_provincia["partido"] == partido, "votos"
                    ].sum()
                )
                if suma != voto:
                    raise ValueError(
                        f"Votos nacionales inconsistentes en "
                        f"{hoja}/{partido}: "
                        f"provincias+extranjero={suma}, declarado={voto}"
                    )

            votos_nacional = pd.DataFrame(
                [
                    {
                        "partido": partido,
                        "votos": a_entero(
                            fila_nacional[columna],
                            f"{hoja}/COSTA RICA/{partido}",
                        ),
                        "juntas": metricas["juntas"],
                        "electorado": metricas["electorado"],
                        "votos_recibidos": metricas["votos_recibidos"],
                        "votos_validos": metricas["votos_validos"],
                        "votos_nulos": metricas["votos_nulos"],
                        "votos_blancos": metricas["votos_blancos"],
                        "participacion": round(metricas["participacion"], 2),
                        "abstencionismo": round(
                            100 - metricas["participacion"], 2
                        ),
                    }
                    for columna, partido in partidos
                ]
            )
        else:
            raise ValueError(f"No se encontró la fila COSTA RICA en {hoja}")

        return (
            votos_canton,
            participacion_canton,
            votos_provincia,
            votos_nacional,
        )

    def extraer_c1_1(ws, hoja=HOJA_REFERENCIA):
        """
        Lee el cuadro 1.1 como referencia independiente.

        Devuelve un diccionario ``partido -> {circunscripción: votos}`` con
        las columnas COSTA RICA, las siete provincias y EXTRANJERO.
        """
        filas = list(ws.iter_rows(values_only=True))

        fila_cabecera = next(
            i
            for i, fila in enumerate(filas)
            if limpiar_texto(fila[1]).upper() == "COSTA RICA"
        )
        fila_provincias = filas[fila_cabecera + 1]

        columnas = {
            limpiar_texto(valor).upper(): i
            for i, valor in enumerate(fila_provincias)
            if i >= 2 and limpiar_texto(valor)
        }
        columnas["EXTRANJERO"] = next(
            i
            for i, valor in enumerate(filas[fila_cabecera])
            if limpiar_texto(valor).upper() == "EXTRANJERO"
        )
        columnas["COSTA RICA"] = 1

        inicio = next(
            i
            for i, fila in enumerate(filas)
            if limpiar_texto(fila[0]).upper() == "VOTOS VÁLIDOS"
        )
        fin = next(
            i
            for i, fila in enumerate(filas)
            if limpiar_texto(fila[0]).upper() == "VOTOS NULOS"
        )

        partidos = {}
        for fila in filas[inicio + 1 : fin]:
            partido = limpiar_texto(fila[0]).upper()
            if not partido:
                continue
            partidos[partido] = {
                circunscripcion: a_entero(
                    fila[columna],
                    f"{hoja}/{partido}/{circunscripcion}",
                )
                for circunscripcion, columna in columnas.items()
            }

        return columnas, partidos

    return extraer_c1_1, extraer_c1_2


@app.cell
def _(HOJA, HOJA_REFERENCIA, RUTA_XLSX, extraer_c1_1, extraer_c1_2, openpyxl):
    wb = openpyxl.load_workbook(RUTA_XLSX, read_only=True, data_only=True)

    (
        votos_canton,
        participacion_canton,
        votos_provincia,
        votos_nacional,
    ) = extraer_c1_2(wb[HOJA], HOJA)
    _, referencia = extraer_c1_1(wb[HOJA_REFERENCIA], HOJA_REFERENCIA)

    wb.close()

    # El cuadro 1.1 es una fuente independiente. Comparamos partido por
    # partido contra el cuadro 1.2, incluyendo provincias y extranjero.
    for partido, valores in referencia.items():
        for circunscripcion, voto in valores.items():
            if circunscripcion == "COSTA RICA":
                suma = int(
                    votos_nacional.loc[
                        votos_nacional["partido"] == partido, "votos"
                    ].sum()
                )
            else:
                suma = int(
                    votos_provincia.loc[
                        (votos_provincia["provincia"] == circunscripcion)
                        & (votos_provincia["partido"] == partido),
                        "votos",
                    ].sum()
                )
            if suma != voto:
                raise ValueError(
                    f"El cuadro 1.1 y el 1.2 no coinciden en "
                    f"{circunscripcion}/{partido}: "
                    f"1.1={voto}, 1.2={suma}"
                )

    # El total nacional del cuadro 1.1 también sirve para validar los votos
    # válidos y el electorado.
    votos_validos_nacional = int(votos_nacional["votos_validos"].iloc[0])
    if int(votos_nacional["votos"].sum()) != votos_validos_nacional:
        raise ValueError(
            "El total nacional de partidos no coincide con los votos válidos"
        )
    if votos_validos_nacional != sum(
        valores["COSTA RICA"] for valores in referencia.values()
    ):
        raise ValueError(
            "Los votos válidos nacionales no coinciden con el cuadro 1.1"
        )
    return (
        participacion_canton,
        votos_canton,
        votos_nacional,
        votos_provincia,
        votos_validos_nacional,
    )


@app.cell
def _(participacion_canton, resumir_alcaldias, votos_canton):
    # `resumir_alcaldias` implementa los indicadores de una elección de
    # mayoría por cantón (ganador, segundo, margen, ENP). La presidencial se
    # analiza con la misma lógica, cambiando solo la papeleta.
    resumen_canton = resumir_alcaldias(votos_canton)

    resumen_canton = resumen_canton.merge(
        participacion_canton[
            [
                "provincia",
                "canton",
                "electorado",
                "votos_recibidos",
                "participacion",
                "abstencionismo",
                "votos_nulos",
                "votos_blancos",
            ]
        ],
        on=["provincia", "canton"],
        how="left",
        validate="one_to_one",
    )
    resumen_canton = resumen_canton[
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
            "electorado",
            "votos_recibidos",
            "participacion",
            "abstencionismo",
            "votos_nulos",
            "votos_blancos",
        ]
    ]
    return (resumen_canton,)


@app.cell
def _(votos_canton, votos_nacional, votos_provincia):
    # Resumen nacional por partido. `votos` incluye el extranjero; las
    # columnas de cantones y provincias ganadas se calculan solo con el
    # territorio nacional.
    votos_canton_por_partido = (
        votos_canton.groupby("partido", as_index=False)["votos"]
        .sum()
        .rename(columns={"votos": "votos_canton"})
    )
    votos_extranjero = (
        votos_provincia[votos_provincia["provincia"] == "EXTRANJERO"][
            ["partido", "votos"]
        ]
        .rename(columns={"votos": "votos_extranjero"})
    )

    resumen_partido = votos_nacional[["partido", "votos"]].merge(
        votos_canton_por_partido, on="partido", how="left"
    )
    resumen_partido = resumen_partido.merge(
        votos_extranjero, on="partido", how="left"
    )
    resumen_partido[["votos_canton", "votos_extranjero"]] = resumen_partido[
        ["votos_canton", "votos_extranjero"]
    ].fillna(0).astype(int)

    if not (
        resumen_partido["votos_canton"]
        + resumen_partido["votos_extranjero"]
        == resumen_partido["votos"]
    ).all():
        raise ValueError(
            "Los votos nacionales no son la suma de cantón y extranjero"
        )

    resumen_partido["porcentaje_votos"] = (
        resumen_partido["votos"] / resumen_partido["votos"].sum() * 100
    ).round(2)

    # Cantones y provincias ganados: el partido con más votos en cada
    # circunscripción. Se ordena por votos y, en caso de empate, por nombre.
    ganadores_canton = (
        votos_canton.sort_values(
            ["provincia", "canton", "votos", "partido"],
            ascending=[True, True, False, True],
        )
        .drop_duplicates(["provincia", "canton"])
        .groupby("partido")
        .size()
    )
    ganadores_provincia = (
        votos_provincia[votos_provincia["provincia"] != "EXTRANJERO"]
        .sort_values(
            ["provincia", "votos", "partido"],
            ascending=[True, False, True],
        )
        .drop_duplicates("provincia")
        .groupby("partido")
        .size()
    )

    resumen_partido["cantones_ganados"] = (
        resumen_partido["partido"].map(ganadores_canton).fillna(0).astype(int)
    )
    resumen_partido["provincias_ganadas"] = (
        resumen_partido["partido"]
        .map(ganadores_provincia)
        .fillna(0)
        .astype(int)
    )

    resumen_partido = resumen_partido[
        [
            "partido",
            "votos",
            "votos_canton",
            "votos_extranjero",
            "porcentaje_votos",
            "cantones_ganados",
            "provincias_ganadas",
        ]
    ].sort_values("votos", ascending=False, ignore_index=True)
    return (resumen_partido,)


@app.cell
def _(pd, votos_nacional):
    # Totales nacionales de la papeleta presidencial. Incluyen el voto en el
    # extranjero y se usan en el sitio para la banda de cifras nacionales.
    resumen_nacional = pd.DataFrame(
        [
            {
                "juntas": int(votos_nacional["juntas"].iloc[0]),
                "electorado": int(votos_nacional["electorado"].iloc[0]),
                "votos_recibidos": int(
                    votos_nacional["votos_recibidos"].iloc[0]
                ),
                "votos_validos": int(votos_nacional["votos_validos"].iloc[0]),
                "votos_nulos": int(votos_nacional["votos_nulos"].iloc[0]),
                "votos_blancos": int(votos_nacional["votos_blancos"].iloc[0]),
                "participacion": float(
                    votos_nacional["participacion"].iloc[0]
                ),
                "abstencionismo": float(
                    votos_nacional["abstencionismo"].iloc[0]
                ),
            }
        ]
    )
    return (resumen_nacional,)


@app.cell
def _(
    CANTONES_ESPERADOS,
    participacion_canton,
    pd,
    resumen_canton,
    resumen_partido,
    votos_canton,
    votos_nacional,
    votos_validos_nacional,
):
    resumen_provincia = (
        votos_canton.groupby("provincia", as_index=False)
        .agg(
            cantones=("canton", "nunique"),
            partidos=("partido", "nunique"),
            votos=("votos", "sum"),
        )
        .reset_index(drop=True)
    )
    resumen_provincia["cantones_esperados"] = resumen_provincia[
        "provincia"
    ].map(CANTONES_ESPERADOS)
    resumen_provincia["ok_cantones"] = (
        resumen_provincia["cantones"]
        == resumen_provincia["cantones_esperados"]
    )

    votos_canton_total = int(votos_canton["votos"].sum())
    votos_extranjero_total = int(
        votos_nacional["votos"].sum() - votos_canton_total
    )

    chequeos = pd.DataFrame(
        [
            {
                "chequeo": "Provincias",
                "esperado": 7,
                "obtenido": votos_canton["provincia"].nunique(),
            },
            {
                "chequeo": "Cantones",
                "esperado": sum(CANTONES_ESPERADOS.values()),
                "obtenido": votos_canton["canton"].nunique(),
            },
            {
                "chequeo": "Partidos",
                "esperado": 20,
                "obtenido": votos_canton["partido"].nunique(),
            },
            {
                "chequeo": "Filas de votos",
                "esperado": sum(CANTONES_ESPERADOS.values()) * 20,
                "obtenido": len(votos_canton),
            },
            {
                "chequeo": "Filas duplicadas",
                "esperado": 0,
                "obtenido": int(
                    votos_canton.duplicated(
                        ["provincia", "canton", "partido"]
                    ).sum()
                ),
            },
            {
                "chequeo": "Votos negativos",
                "esperado": 0,
                "obtenido": int((votos_canton["votos"] < 0).sum()),
            },
            {
                "chequeo": "Votos nulos (NaN)",
                "esperado": 0,
                "obtenido": int(votos_canton["votos"].isna().sum()),
            },
            {
                "chequeo": "Votos válidos en cantones",
                "esperado": votos_validos_nacional - votos_extranjero_total,
                "obtenido": votos_canton_total,
            },
            {
                "chequeo": "Votos válidos nacionales",
                "esperado": votos_validos_nacional,
                "obtenido": int(votos_nacional["votos"].sum()),
            },
            {
                "chequeo": "Cantones con participación",
                "esperado": sum(CANTONES_ESPERADOS.values()),
                "obtenido": int(participacion_canton["canton"].count()),
            },
            {
                "chequeo": "Cantones en resumen",
                "esperado": sum(CANTONES_ESPERADOS.values()),
                "obtenido": len(resumen_canton),
            },
            {
                "chequeo": "Partidos en resumen nacional",
                "esperado": 20,
                "obtenido": len(resumen_partido),
            },
        ]
    )
    chequeos["ok"] = chequeos["esperado"] == chequeos["obtenido"]

    validacion_ok = bool(
        chequeos["ok"].all() and resumen_provincia["ok_cantones"].all()
    )
    return chequeos, resumen_provincia, validacion_ok


@app.cell
def _(
    chequeos,
    mo,
    participacion_canton,
    resumen_canton,
    resumen_partido,
    resumen_provincia,
    validacion_ok,
    votos_canton,
):
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
            mo.ui.table(
                chequeos,
                selection=None,
                show_data_types=False,
            ),
            mo.md("### Resumen nacional por partido"),
            mo.ui.table(
                resumen_partido,
                selection=None,
                show_data_types=False,
            ),
            mo.md("### Resumen por cantón"),
            mo.ui.table(
                resumen_canton.head(15),
                selection=None,
                show_data_types=False,
            ),
            mo.md("### Participación por cantón"),
            mo.ui.table(
                participacion_canton.head(10),
                selection=None,
                show_data_types=False,
            ),
            mo.md("### Primeras filas de votos"),
            mo.ui.table(
                votos_canton.drop(columns=["hoja"]).head(20),
                selection=None,
                show_data_types=False,
            ),
        ]
    )
    return


@app.cell
def _(
    RUTA_NACIONAL,
    RUTA_PARTICIPACION,
    RUTA_PRESIDENCIAL,
    RUTA_RESUMEN_CANTON,
    RUTA_RESUMEN_PARTIDO,
    mo,
    participacion_canton,
    resumen_canton,
    resumen_nacional,
    resumen_partido,
    validacion_ok,
    votos_canton,
):
    if validacion_ok:
        RUTA_PRESIDENCIAL.parent.mkdir(parents=True, exist_ok=True)

        votos_canton.drop(columns=["hoja"]).to_csv(
            RUTA_PRESIDENCIAL,
            index=False,
            encoding="utf-8",
        )
        participacion_canton[
            [
                "provincia",
                "canton",
                "electorado",
                "votos_recibidos",
                "participacion",
                "abstencionismo",
            ]
        ].to_csv(
            RUTA_PARTICIPACION,
            index=False,
            encoding="utf-8",
        )
        resumen_canton.to_csv(
            RUTA_RESUMEN_CANTON,
            index=False,
            encoding="utf-8",
        )
        resumen_partido.to_csv(
            RUTA_RESUMEN_PARTIDO,
            index=False,
            encoding="utf-8",
        )
        resumen_nacional.to_csv(
            RUTA_NACIONAL,
            index=False,
            encoding="utf-8",
        )

        mensaje = mo.md(
            "CSV guardados en `src/data/clean/`:\n\n"
            f"- `{RUTA_PRESIDENCIAL.name}`: "
            f"**{len(votos_canton):,} filas**\n"
            f"- `{RUTA_PARTICIPACION.name}`: "
            f"**{len(participacion_canton):,} cantones**\n"
            f"- `{RUTA_RESUMEN_CANTON.name}`: "
            f"**{len(resumen_canton):,} cantones**\n"
            f"- `{RUTA_RESUMEN_PARTIDO.name}`: "
            f"**{len(resumen_partido):,} partidos**\n"
            f"- `{RUTA_NACIONAL.name}`: "
            f"**1 fila de totales nacionales**"
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
