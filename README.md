# Municipales 2024

Análisis de las elecciones municipales de Costa Rica de febrero 2024.

## Estructura

- `src/data/raw/`: archivos originales del TSE.
- `src/data/clean/`: CSV limpios generados por los ETL.
- `src/municipales_notebook/etl/`: notebooks que leen los Excel y exportan CSV.
- `src/municipales_notebook/eda/`: notebooks de análisis exploratorio.
- `src/municipales_notebook/lib/`: funciones de cálculo compartidas.

## Requisitos

- Python 3.12
- `uv`

Instalación:

```bash
uv sync
```

## ETL

Orden de ejecución:

1. `etl/municipal_2024_alcaldes.py` genera `alcaldes_2024.csv`.
2. `etl/municipal_2024_regidurias_votos.py` genera `regidurias_2024.csv`.
3. `etl/municipal_2024_cargos.py` genera `cargos_por_canton_2024.csv`.
4. `etl/municipal_2024_regidurias.py` aplica cociente, subcociente y resto, y genera:
   - `escanos_regidurias_2024.csv`
   - `resumen_regidurias_canton_2024.csv`
   - `resumen_regidurias_partido_2024.csv`
5. `etl/municipal_2024_resumen_alcaldes.py` genera `resumen_alcaldes_canton_2024.csv`.

Para abrir un ETL:

```bash
uv run marimo edit src/municipales_notebook/etl/municipal_2024_resumen_alcaldes.py
```

Para ejecutarlo sin interfaz:

```bash
uv run marimo export session \
  src/municipales_notebook/etl/municipal_2024_resumen_alcaldes.py \
  --no-sandbox --force-overwrite
```

## EDA

```bash
uv run marimo edit src/municipales_notebook/eda/alcaldes.py
uv run marimo edit src/municipales_notebook/eda/regidurias.py
```

## Lógica compartida

- `lib/alcaldias.py`: ganador, segundo lugar, margen, ENP y competitividad.
- `lib/regidurias.py`: asignación de escaños por cociente, subcociente y resto.

## Sitio web

La capa de presentación vive en `site/` y usa React, Vite y Observable Plot. El
sitio tiene una portada con el contexto nacional y una página aparte para
consultar los resultados por cantón. El notebook de marimo queda como entorno de
ETL y análisis; el sitio estático se construye en `site/dist/`.
