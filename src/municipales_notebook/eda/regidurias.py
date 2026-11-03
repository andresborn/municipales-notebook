import marimo

__generated_with = "0.25.2"
app = marimo.App(width="medium")


@app.cell
def _(mo):
    mo.md("""
    # EDA — Regidurías 2024

    Lectura del CSV limpio `src/data/clean/regidurias_2024.csv`.

    Las regidurías se eligen con listas partidarias en una circunscripción
    cantonal. Este EDA mira votos, presencia territorial, fragmentación y,
    al final, la asignación de escaños por cociente, subcociente y resto.
    """)
    return


@app.cell
def _():
    from pathlib import Path

    import altair as alt
    import marimo as mo
    import openpyxl
    import pandas as pd

    return Path, alt, mo, openpyxl, pd


@app.cell
def _(Path, pd):
    RUTA = (
        Path(__file__).resolve().parents[3]
        / "src"
        / "data"
        / "clean"
        / "regidurias_2024.csv"
    )
    df = pd.read_csv(RUTA)
    return (df,)


@app.cell
def _(Path, pd):
    RUTA_CARGOS = (
        Path(__file__).resolve().parents[3]
        / "src"
        / "data"
        / "clean"
        / "cargos_por_canton_2024.csv"
    )
    RUTA_XLSX = (
        Path(__file__).resolve().parents[3]
        / "src"
        / "data"
        / "raw"
        / "COMPUTO DE VOTOS MUNICIPALES FEB 2024 FINAL.xlsm"
    )
    cargos = pd.read_csv(RUTA_CARGOS)
    return RUTA_XLSX, cargos


@app.cell
def _(df, mo):
    total_votos = int(df["votos"].sum())
    partidos = (
        df.groupby("partido", as_index=False)["votos"]
        .sum()
        .sort_values("votos", ascending=False)
        .reset_index(drop=True)
    )
    partidos["porcentaje"] = (partidos["votos"] / total_votos * 100).round(1)
    top15 = partidos.head(15)
    partidos_con_votos = int((partidos["votos"] > 0).sum())

    mo.vstack(
        [
            mo.md(
                f"""
                ## Resumen

                - **{len(df):,}** filas
                - **{df["canton"].nunique()}** cantones
                - **{partidos_con_votos}** partidos con votos
                - **{total_votos:,}** votos
                """
            ),
            mo.md("### Top 15 partidos"),
            mo.ui.table(top15, selection=None, show_data_types=False),
        ]
    )
    return top15, total_votos


@app.cell
def _(alt, top15, total_votos):
    alt.Chart(top15).mark_bar().encode(
        x=alt.X("votos:Q", title="Votos"),
        y=alt.Y("partido:N", sort="-x", title="Partido"),
        tooltip=["partido:N", "votos:Q", "porcentaje:Q"],
    ).properties(
        height=360,
        title=f"Votos por partido — {total_votos:,} votos válidos",
    )
    return


@app.cell
def _(df, mo):
    partido = mo.ui.dropdown(
        options=sorted(df["partido"].unique()),
        value="LIBERACIÓN NACIONAL",
        label="Partido",
        searchable=True,
    )
    partido
    return (partido,)


@app.cell
def _(alt, df, mo, partido):
    total_por_canton = (
        df.groupby(["provincia", "canton"], as_index=False)["votos"]
        .sum()
        .rename(columns={"votos": "total_canton"})
    )
    ranking = (
        df[
            (df["partido"] == partido.value)
            & (df["votos"] > 0)
        ]
        .groupby(["provincia", "canton"], as_index=False)["votos"]
        .sum()
        .merge(total_por_canton, on=["provincia", "canton"])
        .sort_values("votos", ascending=False)
        .head(10)
        .reset_index(drop=True)
    )
    ranking["porcentaje"] = (
        ranking["votos"] / ranking["total_canton"] * 100
    ).round(1)

    chart = (
        alt.Chart(ranking)
        .mark_bar()
        .encode(
            x=alt.X("votos:Q", title="Votos"),
            y=alt.Y("canton:N", sort="-x", title="Cantón"),
            tooltip=[
                "provincia:N",
                "canton:N",
                "votos:Q",
                "porcentaje:Q",
            ],
        )
        .properties(height=300, title=f"Top cantones — {partido.value}")
    )

    mo.vstack([mo.ui.table(ranking, selection=None), chart])
    return


@app.cell
def _(df, mo):
    presencia = (
        df[df["votos"] > 0]
        .groupby("partido", as_index=False)
        .agg(cantones=("canton", "nunique"), votos=("votos", "sum"))
        .sort_values(["cantones", "votos"], ascending=False)
        .reset_index(drop=True)
    )
    presencia["porcentaje_cantones"] = (
        presencia["cantones"] / df["canton"].nunique() * 100
    ).round(1)

    locales = int((presencia["cantones"] == 1).sum())
    nacionales = int((presencia["cantones"] > 1).sum())

    mo.vstack(
        [
            mo.md(
                f"""
                ### Presencia territorial

                **{nacionales}** partidos compiten en más de un cantón y
                **{locales}** solo en uno. Los partidos locales explican buena
                parte de la fragmentación y no aparecen en el resto del país.
                """
            ),
            mo.ui.table(presencia, selection=None, show_data_types=False),
        ]
    )
    return (presencia,)


@app.cell
def _(alt, presencia):
    alt.Chart(presencia.head(15)).mark_bar().encode(
        x=alt.X("cantones:Q", title="Cantones donde obtuvo votos"),
        y=alt.Y("partido:N", sort="-x", title="Partido"),
        tooltip=["partido:N", "cantones:Q", "porcentaje_cantones:Q", "votos:Q"],
    ).properties(height=340, title="Partidos con presencia en más cantones")
    return


@app.cell
def _(df):
    con_votos = df[df["votos"] > 0].copy()
    return (con_votos,)


@app.cell
def _(con_votos, pd):
    def resumir_fragmentacion(grupo):
        validos = grupo["votos"].sum()
        cuotas = grupo["votos"] / validos
        return pd.Series(
            {
                "validos": int(validos),
                "partidos": len(grupo),
                "enp": 1 / (cuotas**2).sum(),
                "cuota_primero": grupo["votos"].max() / validos * 100,
            }
        )

    fragmentacion = (
        con_votos.groupby(["provincia", "canton"])
        .apply(resumir_fragmentacion, include_groups=False)
        .reset_index()
    )
    fragmentacion["enp"] = fragmentacion["enp"].round(2)
    fragmentacion["cuota_primero"] = fragmentacion["cuota_primero"].round(1)
    fragmentacion = fragmentacion.sort_values("enp", ascending=False).reset_index(
        drop=True
    )
    return (fragmentacion,)


@app.cell
def _(fragmentacion, mo):
    mo.vstack(
        [
            mo.md("""
            ### Fragmentación por cantón

            El **ENP** (número efectivo de partidos) mide cuántos partidos
            tienen peso real en el cantón. Se calcula en tres pasos:

            1. Para cada partido con votos en el cantón, se calcula su cuota:
               `pᵢ = votos del partido i / votos válidos del cantón`.
            2. Se eleva cada cuota al cuadrado y se suman: `Σ pᵢ²`.
            3. El ENP es el inverso de esa suma: `ENP = 1 / Σ pᵢ²`.

            Un ENP alto indica un sistema de partidos más fragmentado; un ENP
            cercano a 1 indica dominancia de un solo partido. Por ejemplo:

            - Dos partidos con 50% cada uno: `ENP = 1 / (0,5² + 0,5²) = 2`.
            - Un partido con 100%: `ENP = 1 / 1² = 1`.
            - Cuotas de 40%, 30%, 20% y 10%: `ENP = 1 / 0,30 ≈ 3,33`.

            `cuota_primero` es el porcentaje del partido más votado. La tabla
            está ordenada de mayor a menor fragmentación.
            """),
            mo.ui.table(fragmentacion, selection=None, show_data_types=False),
        ]
    )
    return


@app.cell
def _(alt, fragmentacion):
    alt.Chart(fragmentacion.head(15)).mark_bar().encode(
        x=alt.X("enp:Q", title="Número efectivo de partidos (ENP)"),
        y=alt.Y("canton:N", sort="-x", title="Cantón"),
        color=alt.Color("enp:Q", scale=alt.Scale(scheme="viridis"), legend=None),
        tooltip=[
            "provincia:N",
            "canton:N",
            "enp:Q",
            "partidos:Q",
            "cuota_primero:Q",
            "validos:Q",
        ],
    ).properties(height=340, title="Cantones más fragmentados")
    return


@app.cell
def _(con_votos, pd):
    def resumir_resultado(grupo):
        grupo = grupo.sort_values("votos", ascending=False).reset_index(drop=True)
        validos = int(grupo["votos"].sum())
        primero = grupo.iloc[0]
        segundo = grupo.iloc[1] if len(grupo) > 1 else primero
        return pd.Series(
            {
                "partido_mas_votado": primero["partido"],
                "votos": int(primero["votos"]),
                "porcentaje": primero["votos"] / validos * 100,
                "segundo": segundo["partido"],
                "margen_votos": int(primero["votos"] - segundo["votos"]),
                "margen_pp": (primero["votos"] - segundo["votos"]) / validos * 100,
            }
        )

    resultado_canton = (
        con_votos.groupby(["provincia", "canton"])
        .apply(resumir_resultado, include_groups=False)
        .reset_index()
    )
    resultado_canton["porcentaje"] = resultado_canton["porcentaje"].round(1)
    resultado_canton["margen_pp"] = resultado_canton["margen_pp"].round(1)
    resultado_canton = resultado_canton.sort_values("margen_pp").reset_index(
        drop=True
    )

    cantones_por_partido = (
        resultado_canton.groupby("partido_mas_votado", as_index=False)
        .agg(cantones=("canton", "size"), votos=("votos", "sum"))
        .sort_values(["cantones", "votos"], ascending=False)
        .reset_index(drop=True)
    )
    return cantones_por_partido, resultado_canton


@app.cell
def _(cantones_por_partido, mo, resultado_canton):
    mo.vstack(
        [
            mo.md("""
            ### Partido más votado por cantón

            Ojo: en regidurías **ser el más votado no equivale a ganar más
            escaños**. La asignación es proporcional y depende del cociente,
            el subcociente y los restos. Esta tabla es una lectura de fuerza
            electoral, no de composición del concejo.
            """),
            mo.md("#### Cantones donde cada partido fue el más votado"),
            mo.ui.table(cantones_por_partido, selection=None, show_data_types=False),
            mo.md("""
            #### Detalle por cantón, ordenado por margen

            El **margen** mide la distancia entre el partido más votado y el
            segundo:

            - `margen_votos = votos del primero − votos del segundo`.
            - `margen_pp = margen_votos / votos válidos del cantón × 100`.

            Un margen pequeño indica una competencia cerrada por el primer
            lugar; un margen grande indica dominancia. La tabla está ordenada
            de menor a mayor `margen_pp`, así que los cantones más reñidos
            aparecen primero. Recordá que este margen es de votos, no de
            escaños.
            """),
            mo.ui.table(resultado_canton, selection=None, show_data_types=False),
        ]
    )
    return


@app.cell
def _(alt, cantones_por_partido):
    alt.Chart(cantones_por_partido.head(12)).mark_bar().encode(
        x=alt.X("cantones:Q", title="Cantones donde fue el más votado"),
        y=alt.Y("partido_mas_votado:N", sort="-x", title="Partido"),
        tooltip=["partido_mas_votado:N", "cantones:Q", "votos:Q"],
    ).properties(height=320, title="Partido más votado por cantón")
    return


@app.cell
def _(mo):
    mo.md("""
    ## Asignación de regidurías

    Ahora calculamos cuántas regidurías obtuvo cada partido en cada cantón.
    La regla es la de los artículos 203 a 205 del Código Electoral:

    1. `cociente = votos válidos del cantón / regidurías a elegir`.
    2. Cada partido recibe `floor(votos / cociente)` escaños por cociente.
    3. `residual = votos − escaños_por_cociente × cociente`.
    4. `subcociente = cociente / 2`.
    5. Solo participan del resto los partidos cuya **votación total** alcanza
       o supera el subcociente. No se usa el residual como umbral.
    6. Los escaños restantes se asignan en orden decreciente de residual.
       Si todavía quedan plazas, **se repite la operación** desde el mayor
       residual hasta llenar todas las regidurías.

    El último punto importa: en cantones como Oreamuno sobran más escaños que
    partidos elegibles, y el partido con mayor residual recibe más de una plaza
    en rondas sucesivas.

    Usamos aritmética entera para evitar problemas de coma flotante en los
    umbrales. La cantidad de regidurías por cantón viene de
    `cargos_por_canton_2024.csv`.
    """)
    return


@app.cell
def _(cargos, con_votos):
    from municipales_notebook.lib.regidurias import asignar_regidurias

    asignacion, resumen_canton, asignacion_nacional = asignar_regidurias(
        con_votos, cargos
    )

    asignacion["residual"] = asignacion["residual"].round(1)
    asignacion["cociente"] = asignacion["cociente"].round(1)
    asignacion["subcociente"] = asignacion["subcociente"].round(1)

    resumen_canton["cociente"] = resumen_canton["cociente"].round(1)
    resumen_canton["subcociente"] = resumen_canton["subcociente"].round(1)

    asignacion_nacional["porcentaje_escaños"] = asignacion_nacional[
        "porcentaje_escaños"
    ].round(1)
    asignacion_nacional["porcentaje_votos"] = asignacion_nacional[
        "porcentaje_votos"
    ].round(1)
    return asignacion, asignacion_nacional, resumen_canton


@app.cell
def _(asignacion_nacional, mo):
    con_escanos = asignacion_nacional[
        asignacion_nacional["escaños"] > 0
    ].reset_index(drop=True)

    mo.vstack(
        [
            mo.md("### Regidurías por partido — nacional"),
            mo.md(
                "`porcentaje_escaños` usa el total de 518 regidurías y "
                "`porcentaje_votos` el total de votos válidos para regidurías. "
                "Se muestran solo los partidos que obtuvieron al menos un escaño."
            ),
            mo.ui.table(con_escanos, selection=None, show_data_types=False),
        ]
    )
    return (con_escanos,)


@app.cell
def _(alt, con_escanos):
    alt.Chart(con_escanos.head(15)).mark_bar().encode(
        x=alt.X("escaños:Q", title="Regidurías"),
        y=alt.Y("partido:N", sort="-x", title="Partido"),
        tooltip=["partido:N", "escaños:Q", "porcentaje_escaños:Q", "votos:Q"],
    ).properties(height=360, title="Regidurías por partido")
    return


@app.cell
def _(asignacion, mo):
    asignacion_con_escanos = asignacion[asignacion["escaños"] > 0]

    mo.vstack(
        [
            mo.md("### Detalle de escaños por cantón y partido"),
            mo.md(
                "Una fila por cada partido que obtuvo al menos una regiduría "
                "en un cantón. `escaños_cociente` y `escaños_resto` muestran "
                "cómo se compone el total."
            ),
            mo.ui.table(
                asignacion_con_escanos[
                    [
                        "provincia",
                        "canton",
                        "partido",
                        "votos",
                        "escaños_cociente",
                        "escaños_resto",
                        "escaños",
                    ]
                ],
                selection=None,
                show_data_types=False,
            ),
        ]
    )
    return


@app.cell
def _(asignacion, mo):
    cantones_asignacion = (
        asignacion[["provincia", "canton"]]
        .drop_duplicates()
        .sort_values(["provincia", "canton"])
    )
    opciones_canton = {
        f"{fila.canton} ({fila.provincia})": f"{fila.provincia}|{fila.canton}"
        for fila in cantones_asignacion.itertuples()
    }
    canton_reg = mo.ui.dropdown(
        options=opciones_canton,
        value="SAN JOSÉ (SAN JOSÉ)",
        label="Cantón",
        searchable=True,
    )
    canton_reg
    return (canton_reg,)


@app.cell
def _(asignacion, canton_reg, mo, resumen_canton):
    provincia_reg, canton_reg_nombre = canton_reg.value.split("|")
    detalle_canton = (
        asignacion[
            (asignacion["provincia"] == provincia_reg)
            & (asignacion["canton"] == canton_reg_nombre)
        ]
        .sort_values(["escaños", "votos"], ascending=False)
        .reset_index(drop=True)
    )
    resumen_reg = resumen_canton[
        (resumen_canton["provincia"] == provincia_reg)
        & (resumen_canton["canton"] == canton_reg_nombre)
    ].iloc[0]

    estado_mayoria = (
        "con mayoría propia"
        if resumen_reg["tiene_mayoria"]
        else "sin mayoría propia"
    )
    votos_validos_texto = f"{int(resumen_reg['votos_validos']):,}".replace(",", ".")

    mo.vstack(
        [
            mo.md(f"### {canton_reg_nombre} ({provincia_reg})"),
            mo.md(
                f"**{int(resumen_reg['regidurias'])}** regidurías · "
                f"**{votos_validos_texto}** votos válidos · "
                f"cociente **{resumen_reg['cociente']:.1f}** · "
                f"subcociente **{resumen_reg['subcociente']:.1f}** · "
                f"mayoría **{int(resumen_reg['mayoria'])}**"
            ),
            mo.md(
                f"Partido con más escaños: **{resumen_reg['partido_mas_escaños']}** "
                f"({int(resumen_reg['escaños_primero'])}) — {estado_mayoria}."
            ),
            mo.ui.table(
                detalle_canton[
                    [
                        "partido",
                        "votos",
                        "escaños_cociente",
                        "escaños_resto",
                        "escaños",
                        "residual",
                    ]
                ],
                selection=None,
                show_data_types=False,
            ),
        ]
    )
    return


@app.cell
def _(mo, resumen_canton):
    mo.vstack(
        [
            mo.md("### Resumen por cantón"),
            mo.md(
                "`escaños_asignados` debe coincidir con `regidurias` en los 84 "
                "cantones. `tiene_mayoria` indica si el partido con más escaños "
                "alcanza la mayoría absoluta del concejo."
            ),
            mo.ui.table(resumen_canton, selection=None, show_data_types=False),
        ]
    )
    return


@app.cell
def _(asignacion, mo, pd, resumen_canton):
    validacion_cantones = resumen_canton.assign(
        ok=lambda datos: datos["escaños_asignados"] == datos["regidurias"]
    )
    total_asignado = int(asignacion["escaños"].sum())
    partidos_con_escanos = int(
        asignacion.loc[asignacion["escaños"] > 0, "partido"].nunique()
    )

    chequeos_regidurias = pd.DataFrame(
        [
            {
                "chequeo": "Regidurías asignadas",
                "esperado": 518,
                "obtenido": total_asignado,
            },
            {
                "chequeo": "Cantones",
                "esperado": 84,
                "obtenido": int(resumen_canton["canton"].nunique()),
            },
            {
                "chequeo": "Cantones con suma correcta",
                "esperado": 84,
                "obtenido": int(validacion_cantones["ok"].sum()),
            },
            {
                "chequeo": "Partidos con escaños",
                "esperado": 58,
                "obtenido": partidos_con_escanos,
            },
        ]
    )
    chequeos_regidurias["ok"] = (
        chequeos_regidurias["esperado"] == chequeos_regidurias["obtenido"]
    )
    validacion_ok = bool(chequeos_regidurias["ok"].all())

    estado = "✅ Asignación OK" if validacion_ok else "❌ Revisar asignación"
    contenido = [
        mo.md(f"### {estado}"),
        mo.ui.table(chequeos_regidurias, selection=None, show_data_types=False),
    ]
    if not validacion_ok:
        contenido.append(
            mo.ui.table(
                validacion_cantones[~validacion_cantones["ok"]],
                selection=None,
                show_data_types=False,
            )
        )

    mo.vstack(contenido)
    return


@app.cell
def _(RUTA_XLSX, asignacion_nacional, mo, openpyxl, pd):
    import unicodedata

    def clave_partido(nombre):
        sin_tildes = "".join(
            caracter
            for caracter in unicodedata.normalize("NFD", str(nombre))
            if unicodedata.category(caracter) != "Mn"
        )
        return sin_tildes.upper().strip()

    def leer_oficial(ruta):
        wb = openpyxl.load_workbook(ruta, read_only=True, data_only=True)
        filas = list(wb["1.10"].iter_rows(values_only=True))
        wb.close()

        inicio = next(
            i
            for i, fila in enumerate(filas)
            if fila[0] is not None
            and str(fila[0]).strip().upper() == "TOTAL"
        )
        oficial = {}
        for fila in filas[inicio + 1 :]:
            nombre = "" if fila[0] is None else str(fila[0]).strip()
            if not nombre:
                continue
            if nombre.upper().startswith(("1/", "FUENTE")):
                break
            if nombre.upper() == "TOTAL":
                continue
            oficial[nombre] = int(fila[6])
        return oficial

    oficial = pd.Series(
        {
            clave_partido(nombre): escaños
            for nombre, escaños in leer_oficial(RUTA_XLSX).items()
        },
        name="oficial",
    )
    calculado = pd.Series(
        {
            clave_partido(nombre): escaños
            for nombre, escaños in asignacion_nacional.set_index("partido")[
                "escaños"
            ].items()
        },
        name="calculado",
    )
    comparacion_oficial = (
        pd.concat([oficial, calculado], axis=1)
        .fillna(0)
        .astype(int)
        .reset_index()
        .rename(columns={"index": "partido"})
    )
    comparacion_oficial["diferencia"] = (
        comparacion_oficial["calculado"] - comparacion_oficial["oficial"]
    )
    diferencias_oficial = comparacion_oficial[
        comparacion_oficial["diferencia"] != 0
    ].reset_index(drop=True)

    mo.vstack(
        [
            mo.md("### Comparación con la hoja 1.10 del TSE"),
            mo.md(
                "Los nombres se normalizan sin tildes para poder comparar. "
                "La tabla muestra solo las diferencias."
            ),
            mo.ui.table(
                diferencias_oficial, selection=None, show_data_types=False
            ),
            mo.md("""
            La hoja `1.10` tiene una inconsistencia conocida: registra un
            escaño para **PUEBLO SOBERANO** y no registra a
            **PURISCAL EN MARCHA**. La declaratoria del TSE para Puriscal
            confirma que ese escaño es de Puriscal en Marcha. Al corregir la
            etiqueta, los 58 partidos con escaños coinciden y el total sigue
            siendo 518.
            """),
        ]
    )
    return


if __name__ == "__main__":
    app.run()
