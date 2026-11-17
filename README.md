# Municipales Costa Rica

Análisis de las elecciones municipales de Costa Rica de 2020 y 2024.

## Estructura

- `src/data/raw/`: archivos originales del TSE.
- `src/data/clean/`: CSV limpios generados por los ETL.
- `src/municipales_notebook/etl/2024/`: notebooks que leen el Excel de 2024 y exportan CSV.
- `src/municipales_notebook/etl/2020/`: notebooks que leen el Excel de 2020 y exportan CSV.
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

### 2024

Orden de ejecución:

1. `etl/2024/municipal_2024_alcaldes.py` genera `alcaldes_2024.csv` y `participacion_alcaldes_2024.csv`.
2. `etl/2024/municipal_2024_regidurias_votos.py` genera `regidurias_2024.csv` y `participacion_regidurias_2024.csv`.
3. `etl/2024/municipal_2024_cargos.py` genera `cargos_por_canton_2024.csv`.
4. `etl/2024/municipal_2024_asignacion_regidurias.py` aplica cociente, subcociente y resto, y genera:
   - `escanos_regidurias_2024.csv`
   - `resumen_regidurias_canton_2024.csv` (incluye participación y abstencionismo)
   - `resumen_regidurias_partido_2024.csv`
5. `etl/2024/municipal_2024_resumen_alcaldes.py` genera `resumen_alcaldes_canton_2024.csv` (incluye participación y abstencionismo).

### 2020

Mismo orden, leyendo `COMPUTO DE VOTOS MUNICIPALES FEB 2020.xlsm`:

1. `etl/2020/municipal_2020_alcaldes.py` genera `alcaldes_2020.csv` y `participacion_alcaldes_2020.csv`.
2. `etl/2020/municipal_2020_regidurias_votos.py` genera `regidurias_2020.csv` y `participacion_regidurias_2020.csv`.
3. `etl/2020/municipal_2020_cargos.py` genera `cargos_por_canton_2020.csv`.
4. `etl/2020/municipal_2020_asignacion_regidurias.py` genera:
   - `escanos_regidurias_2020.csv`
   - `resumen_regidurias_canton_2020.csv` (incluye participación y abstencionismo)
   - `resumen_regidurias_partido_2020.csv`
5. `etl/2020/municipal_2020_resumen_alcaldes.py` genera `resumen_alcaldes_canton_2020.csv` (incluye participación y abstencionismo).

En 2020 el país tenía 82 cantones: Monteverde y Puerto Jiménez se crearon
después (leyes 10019 y 10195), así que Puntarenas suma 11 cantones en lugar de
13.

Los CSV `participacion_*` tienen una fila por cantón y elección:
`provincia, canton, electorado, votos_recibidos, participacion, abstencionismo`.
`participacion` y `abstencionismo` son porcentajes de 0 a 100. La alcaldía y la
regiduría son papeletas distintas, por eso sus votos recibidos —y su
abstencionismo— pueden diferir levemente en un mismo cantón.

Para abrir un ETL:

```bash
uv run marimo edit src/municipales_notebook/etl/2024/municipal_2024_resumen_alcaldes.py
```

Para ejecutarlo sin interfaz:

```bash
uv run marimo export session \
  src/municipales_notebook/etl/2024/municipal_2024_resumen_alcaldes.py \
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
