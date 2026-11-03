# /// script
# dependencies = [
#     "altair==6.3.0",
#     "marimo>=0.25.2",
#     "pandas==3.1.0",
#     "marimo-studio==0.4.1"
# ]
# requires-python = ">=3.10,<3.15"
#
# [tool.marimo-studio]
# default = "dashboard"
#
# [tool.marimo-studio.cells]
# cell-1 = {ref = "cell:v1:226c2a9c0eb002af3d130a139f8e8ca0790171d35bf5e28520f52930144a734b:d6a8e6c5a06f297709aba02aca0f3122691425d839860c75f03c1ed446aab381:0"}
# cell-4 = {ref = "cell:v1:ad61045e9e5d44e478223316b88b4ccd98c7a9fcfdba4c093073f1daa032be85:36939270abd174cfcaa33deadf1726c19f4d8c515a94a58a63af795e5f274430:0"}
# cell-5 = {ref = "cell:v1:53f3d04ecf743f29e2d8226413cd8473da8382ffcf5dfd27100472999e7ff058:53f3d04ecf743f29e2d8226413cd8473da8382ffcf5dfd27100472999e7ff058:0"}
# cell-6 = {ref = "cell:v1:e87655284687ee6245dc2f8df440b1bbc53cde91b306935c1eaf813d727a4d23:e87655284687ee6245dc2f8df440b1bbc53cde91b306935c1eaf813d727a4d23:0"}
# cell-7 = {ref = "cell:v1:8f7fd2e6a077aa94a7db5bcabd4d2cdf91dc9a77eec13e5a7e3c11e05822046a:8f7fd2e6a077aa94a7db5bcabd4d2cdf91dc9a77eec13e5a7e3c11e05822046a:0"}
# cell-8 = {ref = "cell:v1:776d89556ff35f780e77ce47fe49fcfede39c3fc23b28bd224b90f8da621ff75:fbe75665f1f741e44c5e6c8881c561f3bbe8b35801f34a311fa3de85f53df4c7:0"}
# cell-9 = {ref = "cell:v1:f0fb6e3983b895abedfa99aeabae4f76c8b70477e245c2adddbd9158609b1da1:f0fb6e3983b895abedfa99aeabae4f76c8b70477e245c2adddbd9158609b1da1:0"}
# cell-12 = {ref = "cell:v1:477e410410da27883fdcb8e262e2b3a656f743de0b3d7592332a636533fe0c71:9cddcb9c38dff274ac28e2f29b3b6c240938962bef6a9c7e7e0c031a56fc20f9:0"}
# cell-13 = {ref = "cell:v1:d26d61754b2101cff20f9c214ba4c87e51f27da4f7f19a8925c627cca5e8f3ef:d26d61754b2101cff20f9c214ba4c87e51f27da4f7f19a8925c627cca5e8f3ef:0"}
# cell-15 = {ref = "cell:v1:4d45b854de61de59e02ba216fda57c999d9d0f2eb5d3cc8dddb2bb09a65c0b0c:81de4c3945636dda5d6b2e847bfe52b557c31c10a94c3d8fd54a9fd3a800113d:0"}
# cell-16 = {ref = "cell:v1:8fe64a298f9a85fdef3fe446db8b388050dfa3899621cfad5b4b05b96430bf98:8fe64a298f9a85fdef3fe446db8b388050dfa3899621cfad5b4b05b96430bf98:0"}
# cell-17 = {ref = "cell:v1:8ff7abb8ffc29127a58d11fe511618637cf106ad636edbbc6235352fa72615b1:93ee46d1d9fd82c3de70f1a7fafd498be7da07c5c78560a9d2e0a63462b9639c:0"}
# ///
import marimo

__generated_with = "0.25.2"
app = marimo.App(width="medium")


@app.cell
def _(mo):
    mo.md("""
    # EDA — Regidurías 2024

    Lectura del CSV limpio `src/data/clean/regidurias_2024.csv`.

    Las regidurías se eligen con listas partidarias en una circunscripción
    cantonal. Por eso este EDA mira votos, presencia territorial y
    fragmentación; **todavía no** asignamos escaños. La cantidad de regidores
    por partido requiere cociente, subcociente y resto, y se calcula en un paso
    posterior.
    """)
    return


@app.cell
def _():
    from pathlib import Path

    import altair as alt
    import marimo as mo
    import pandas as pd

    return Path, alt, mo, pd


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
    ### Lo que falta

    Este EDA no asigna escaños. Para saber cuántos regidores consiguió cada
    partido hay que aplicar la regla municipal en cada cantón:

    - `cociente = votos válidos / regidurías a elegir`
    - `subcociente = cociente / 2`
    - escaños por cociente
    - escaños restantes por resto mayor entre los partidos que superan el
      subcociente

    La cantidad de regidurías por cantón ya está en
    `cargos_por_canton_2024.csv`. El siguiente paso es la asignación y su
    validación contra las 518 regidurías del país.
    """)
    return


if __name__ == "__main__":
    app.run()
