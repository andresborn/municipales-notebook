import marimo

__generated_with = "0.25.2"
app = marimo.App(width="medium")


@app.cell(hide_code=True)
def _(mo):
    mo.md("""
    # EDA — Alcaldías 2024

    Lectura rápida del CSV limpio `src/data/clean/alcaldes_2024.csv`.
    """)
    return


@app.cell(hide_code=True)
def _():
    from pathlib import Path

    import altair as alt
    import marimo as mo
    import numpy as np
    import pandas as pd

    return Path, alt, mo, np, pd


@app.cell(hide_code=True)
def _(Path, pd):
    RUTA = (
        Path(__file__).resolve().parents[3]
        / "src"
        / "data"
        / "clean"
        / "alcaldes_2024.csv"
    )
    df = pd.read_csv(RUTA)
    return (df,)


@app.cell(hide_code=True)
def _(df, mo):
    total = int(df["votos"].sum())
    partidos = (
        df.groupby("partido", as_index=False)["votos"]
        .sum()
        .sort_values("votos", ascending=False)
        .reset_index(drop=True)
    )
    partidos["porcentaje"] = (partidos["votos"] / total * 100).round(2)
    top10 = partidos.head(10)

    mo.vstack(
        [
            mo.md(
                f"""
                ## Resumen

                - **{len(df):,}** filas
                - **{df["canton"].nunique()}** cantones
                - **{df["partido"].nunique()}** partidos
                - **{total:,}** votos
                """
            ),
            mo.md("### Top 10 partidos"),
            mo.ui.table(top10),
        ]
    )
    return


@app.cell(hide_code=True)
def _(df, mo):
    partido = mo.ui.dropdown(
        options=sorted(df["partido"].unique()),
        value="LIBERACIÓN NACIONAL",
        label="Partido",
    )
    partido
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md("""
    ## Ganador por cantón

    Elegí un cantón para ver el partido ganador y el resto de partidos
    con al menos un voto.
    """)
    return


@app.cell(hide_code=True)
def _(df, mo):
    cantones = (
        df[["provincia", "canton"]]
        .drop_duplicates()
        .sort_values(["provincia", "canton"])
    )
    opciones = {
        f"{fila.canton} ({fila.provincia})": f"{fila.provincia}|{fila.canton}"
        for fila in cantones.itertuples()
    }
    canton = mo.ui.dropdown(
        options=opciones,
        value="SAN JOSÉ (SAN JOSÉ)",
        label="Cantón",
        searchable=True,
    )
    canton
    return (canton,)


@app.cell(hide_code=True)
def _(canton, df, mo):
    provincia, nombre_canton = canton.value.split("|")
    votos = (
        df[
            (df["provincia"] == provincia)
            & (df["canton"] == nombre_canton)
            & (df["votos"] > 0)
        ]
        .sort_values("votos", ascending=False)
        .reset_index(drop=True)
    )
    _total_canton = int(votos["votos"].sum())
    votos["porcentaje"] = (votos["votos"] / _total_canton * 100).round(1)
    votos.insert(0, "puesto", range(1, len(votos) + 1))

    ganador = votos.iloc[0]
    ventaja = ganador["votos"] - votos.iloc[1]["votos"] if len(votos) > 1 else 0

    mo.vstack(
        [
            mo.md(f"### {nombre_canton} ({provincia})"),
            mo.md(
                f"**Ganador: {ganador['partido']}** — "
                f"{int(ganador['votos']):,} votos "
                f"({ganador['porcentaje']:.1f}% del cantón), "
                f"ventaja de {int(ventaja):,} votos."
            ),
            mo.ui.table(votos, selection=None, show_data_types=False),
        ]
    )
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md("""
    ## Partido ganador en cada cantón

    Un ganador por cantón y, debajo, la agregación por partido.
    """)
    return


@app.cell(hide_code=True)
def _(df):
    votos_validos = df[df["votos"] > 0].copy()
    maximo = votos_validos.groupby(["provincia", "canton"])["votos"].transform("max")
    ganadores = votos_validos[votos_validos["votos"] == maximo]

    total_por_canton = (
        votos_validos.groupby(["provincia", "canton"], as_index=False)["votos"]
        .sum()
        .rename(columns={"votos": "total_canton"})
    )
    ganadores = ganadores.merge(total_por_canton, on=["provincia", "canton"])
    ganadores["porcentaje"] = (
        ganadores["votos"] / ganadores["total_canton"] * 100
    ).round(1)
    ganadores = (
        ganadores[["provincia", "canton", "partido", "votos", "porcentaje"]]
        .sort_values(["provincia", "canton"])
        .reset_index(drop=True)
    )
    return (ganadores,)


@app.cell(hide_code=True)
def _(ganadores, mo):
    _partidos = ganadores.groupby("partido").size().sort_values(ascending=False).index
    _bloques = []
    for _partido in _partidos:
        _filas = ganadores[ganadores["partido"] == _partido].sort_values("canton")
        _items = "\n".join(
            f"- {_fila.canton} - {f'{_fila.votos:,}'.replace(',', '.')}"
            for _fila in _filas.itertuples()
        )
        _bloques.append(f"**{_partido}**\n\n{_items}")

    mo.md(f"**{len(ganadores)} cantones**\n\n" + "\n\n".join(_bloques))
    return


@app.cell(hide_code=True)
def _(ganadores):
    por_partido = (
        ganadores.groupby("partido", as_index=False)
        .agg(cantones=("canton", "size"), votos=("votos", "sum"))
        .sort_values(["cantones", "votos"], ascending=False)
        .reset_index(drop=True)
    )
    por_partido["porcentaje_cantones"] = (
        por_partido["cantones"] / len(ganadores) * 100
    ).round(1)
    return (por_partido,)


@app.cell(hide_code=True)
def _(mo, por_partido):
    mo.vstack(
        [
            mo.md("### Cantones ganados por partido"),
            mo.ui.table(por_partido, selection=None, show_data_types=False),
        ]
    )
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md("""
    ## ¿Qué cantones son disputables?

    "Disputable" no significa que el cantón vaya a cambiar de partido: con una
    sola elección no podemos predecir eso. Significa que el resultado de la
    alcaldía fue **estructuralmente cerrado**. Para medirlo calculamos, por cantón:

    - **Votos válidos**: suma de los votos de todos los partidos (sin nulos ni blancos).
    - **Margen en votos**: votos del ganador menos votos del segundo.
    - **Margen en pp**: margen en votos como porcentaje de los votos válidos.
    - **Swing para voltear**: `margen_pp / 2`. Es el porcentaje de votos que tendría
      que moverse del ganador al segundo para empatar.
    - **Cuota del ganador**: porcentaje de votos válidos del partido ganador.
    - **ENP**: número efectivo de partidos, `1 / Σ(pᵢ²)`. Más alto significa un
      cantón más fragmentado, con más partidos con peso real.

    La clasificación usa el margen:

    | Clasificación | Margen |
    |---|---|
    | Muy disputado | menos de 5 pp |
    | Disputado | entre 5 y 10 pp |
    | Poco disputado | entre 10 y 20 pp |
    | Dominado | 20 pp o más |

    El margen por sí solo no cuenta toda la historia: un cantón con 8 pp de margen
    y cinco partidos relevantes es más disputable que uno con 8 pp de margen y solo
    dos partidos. Por eso el gráfico combina margen y ENP.
    """)
    return


@app.cell(hide_code=True)
def _(df, np, pd):
    def resumir_canton(grupo):
        grupo = grupo.sort_values("votos", ascending=False).reset_index(drop=True)
        validos = int(grupo["votos"].sum())
        cuotas = grupo["votos"] / validos
        primero = grupo.iloc[0]
        segundo = grupo.iloc[1]
        margen = int(primero["votos"] - segundo["votos"])
        return pd.Series(
            {
                "validos": validos,
                "partidos_con_votos": len(grupo),
                "ganador": primero["partido"],
                "segundo": segundo["partido"],
                "votos_ganador": int(primero["votos"]),
                "votos_segundo": int(segundo["votos"]),
                "margen_votos": margen,
                "margen_pp": margen / validos * 100,
                "cuota_ganador": primero["votos"] / validos * 100,
                "enp": 1 / (cuotas**2).sum(),
            }
        )

    votos_con_partido = df[df["votos"] > 0]
    competitividad = (
        votos_con_partido.groupby(["provincia", "canton"])
        .apply(resumir_canton, include_groups=False)
        .reset_index()
    )

    competitividad["margen_pp"] = competitividad["margen_pp"].round(1)
    competitividad["swing_pp"] = (competitividad["margen_pp"] / 2).round(1)
    competitividad["cuota_ganador"] = competitividad["cuota_ganador"].round(1)
    competitividad["enp"] = competitividad["enp"].round(2)

    competitividad["clasificacion"] = pd.cut(
        competitividad["margen_pp"],
        bins=[-np.inf, 5, 10, 20, np.inf],
        labels=["Muy disputado", "Disputado", "Poco disputado", "Dominado"],
        right=False,
    )
    competitividad = (
        competitividad[
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
    return (competitividad,)


@app.cell(hide_code=True)
def _(competitividad, mo):
    mo.vstack(
        [
            mo.md("### Ranking de competitividad"),
            mo.md(
                "Los cantones aparecen de menor a mayor margen. `swing_pp` indica "
                "cuánto tendría que moverse el voto para empatar y `enp` mide la "
                "fragmentación del sistema de partidos local."
            ),
            mo.ui.table(competitividad, selection=None, show_data_types=False),
        ]
    )
    return


@app.cell(hide_code=True)
def _(competitividad, mo):
    resumen_clasificacion = (
        competitividad.groupby("clasificacion", observed=False)
        .agg(
            cantones=("canton", "size"),
            margen_promedio=("margen_pp", "mean"),
            enp_promedio=("enp", "mean"),
        )
        .reset_index()
    )
    resumen_clasificacion["porcentaje"] = (
        resumen_clasificacion["cantones"] / len(competitividad) * 100
    ).round(1)
    resumen_clasificacion["margen_promedio"] = resumen_clasificacion[
        "margen_promedio"
    ].round(1)
    resumen_clasificacion["enp_promedio"] = resumen_clasificacion["enp_promedio"].round(2)
    resumen_clasificacion = resumen_clasificacion[
        ["clasificacion", "cantones", "porcentaje", "margen_promedio", "enp_promedio"]
    ]

    mo.vstack(
        [
            mo.md("### Cantones por clasificación"),
            mo.ui.table(resumen_clasificacion, selection=None, show_data_types=False),
        ]
    )
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md("""
    ### Mapa de competitividad

    Cada punto es un cantón. El eje horizontal es el margen de la alcaldía y el
    vertical es la fragmentación (ENP). El tamaño del punto representa los votos
    válidos del cantón.

    Los cantones **más disputables** están en la esquina inferior izquierda:
    margen pequeño y muchos partidos con peso. Los **más dominados** están a la
    derecha, con márgenes amplios y pocos partidos relevantes. Las líneas
    verticales marcan los cortes de 5, 10 y 20 pp.

    Pasá el cursor sobre un punto para ver el cantón, el ganador, el segundo y
    sus métricas.
    """)
    return


@app.cell(hide_code=True)
def _(alt, competitividad, pd):
    _colores = alt.Scale(
        domain=["Muy disputado", "Disputado", "Poco disputado", "Dominado"],
        range=["#d73027", "#fc8d59", "#fee090", "#4575b4"],
    )
    _puntos = (
        alt.Chart(competitividad)
        .mark_circle(opacity=0.8, stroke="white", strokeWidth=0.5)
        .encode(
            x=alt.X("margen_pp:Q", title="Margen ganador − segundo (pp)"),
            y=alt.Y("enp:Q", title="Número efectivo de partidos (ENP)"),
            size=alt.Size(
                "validos:Q",
                title="Votos válidos",
                scale=alt.Scale(range=[30, 700]),
            ),
            color=alt.Color("clasificacion:N", title="Clasificación", scale=_colores),
            tooltip=[
                alt.Tooltip("provincia:N", title="Provincia"),
                alt.Tooltip("canton:N", title="Cantón"),
                alt.Tooltip("ganador:N", title="Ganador"),
                alt.Tooltip("segundo:N", title="Segundo"),
                alt.Tooltip("margen_votos:Q", title="Margen (votos)"),
                alt.Tooltip("margen_pp:Q", title="Margen (pp)"),
                alt.Tooltip("enp:Q", title="ENP"),
            ],
        )
    )
    _reglas = (
        alt.Chart(pd.DataFrame({"margen_pp": [5, 10, 20]}))
        .mark_rule(color="#999999", strokeDash=[4, 4])
        .encode(x="margen_pp:Q")
    )
    (_puntos + _reglas).properties(
        width=680,
        height=380,
        title="Competitividad de la alcaldía por cantón",
    )
    return


@app.cell(hide_code=True)
def _(competitividad, mo):
    _columnas = [
        "provincia",
        "canton",
        "ganador",
        "segundo",
        "votos_ganador",
        "votos_segundo",
        "margen_votos",
        "margen_pp",
        "enp",
    ]
    mas_disputados = competitividad.nsmallest(10, "margen_pp")[
        _columnas
    ].reset_index(drop=True)
    mas_dominados = competitividad.nlargest(10, "margen_pp")[
        _columnas
    ].reset_index(drop=True)

    mo.vstack(
        [
            mo.md("### Los 10 cantones más disputados"),
            mo.ui.table(mas_disputados, selection=None, show_data_types=False),
            mo.md("### Los 10 cantones más dominados"),
            mo.ui.table(mas_dominados, selection=None, show_data_types=False),
        ]
    )
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md("""
    ### Cómo leer estos resultados

    - **Muy disputado no significa que vaya a cambiar.** Con una sola elección
      medimos qué tan cerrado fue el resultado, no una probabilidad de cambio.
    - **El margen absoluto importa.** En Orotina, 2 votos decidieron la alcaldía;
      en un cantón grande, un margen del mismo porcentaje son miles de votos.
      Por eso mostramos margen en votos y en puntos porcentuales.
    - **Cantones pequeños y partidos locales.** Cada cantón tiene su propio sistema
      de partidos. El ENP permite comparar fragmentación, pero no reemplaza la
      lectura política local.
    - **La alcaldía es una papeleta aparte de las regidurías.** Este análisis no
      dice todavía qué tan disputado está el concejo municipal. Esa dimensión
      viene cuando incorporemos los regidores.
    """)
    return


if __name__ == "__main__":
    app.run()
