# Municipales 2024 · Sitio web

Visualización interactiva de los resultados de alcaldías y regidurías de las
elecciones municipales de Costa Rica de 2024.

## Desarrollo

```bash
npm install
npm run dev
```

## Construcción

```bash
npm run build
npm run preview
```

## Datos

El sitio consume los CSV limpios del repositorio:

- `src/data/clean/alcaldes_2024.csv`
- `src/data/clean/resumen_alcaldes_canton_2024.csv`
- `src/data/clean/resumen_regidurias_canton_2024.csv`
- `src/data/clean/escanos_regidurias_2024.csv`
- `src/data/clean/resumen_regidurias_partido_2024.csv`

La capa de datos está en `src/lib/data.ts`, los formateadores en
`src/lib/format.ts` y el enrutamiento por hash en `src/App.tsx`. El sitio tiene
dos páginas:

- `src/pages/HomePage.tsx`: portada y contexto nacional (participación en
  alcaldías y regidurías agregadas).
- `src/pages/CantonPage.tsx`: selector de cantón y resultados de alcaldía y
  regidurías.

Los gráficos se generan con Observable Plot.

## Nota metodológica

Todos los porcentajes y márgenes de alcaldías y regidurías se calculan sobre
votos válidos. No se considera el abstencionismo ni se incluyen votos nulos o en
blanco. El contexto nacional incluye un bloque separado de participación y
abstencionismo de las alcaldías, calculado sobre el electorado inscrito.
