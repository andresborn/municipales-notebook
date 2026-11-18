# Municipales 2020 y 2024 · Sitio web

Visualización interactiva de los resultados de alcaldías y regidurías de las
elecciones municipales de Costa Rica de 2020 y 2024.

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

El sitio consume los CSV limpios del repositorio, para cada año:

- `src/data/clean/alcaldes_{año}.csv`
- `src/data/clean/resumen_alcaldes_canton_{año}.csv`
- `src/data/clean/resumen_regidurias_canton_{año}.csv`
- `src/data/clean/escanos_regidurias_{año}.csv`
- `src/data/clean/resumen_regidurias_partido_{año}.csv`

donde `{año}` es `2020` o `2024`. La capa de datos está en `src/lib/data.ts`
(construye `elections[2020]` y `elections[2024]`), los formateadores en
`src/lib/format.ts` y el enrutamiento por hash en `src/lib/routes.ts`. El sitio
tiene dos páginas:

- `src/pages/HomePage.tsx`: portada y contexto nacional (participación en
  alcaldías y regidurías agregadas).
- `src/pages/CantonPage.tsx`: selector de cantón y resultados de alcaldía y
  regidurías.

El selector de año del encabezado cambia entre ambas elecciones. Las rutas son
`#/2020`, `#/2020/cantones`, `#/2024` y `#/2024/cantones`; los enlaces antiguos
`#/` y `#/cantones` se resuelven a 2024. En 2020 hay 82 cantones: Monteverde y
Puerto Jiménez se crearon después, así que solo aparecen en 2024.

Los gráficos se generan con Observable Plot.

## Nota metodológica

Todos los porcentajes y márgenes de alcaldías y regidurías se calculan sobre
votos válidos. No se considera el abstencionismo ni se incluyen votos nulos o en
blanco. El contexto nacional incluye un bloque separado de participación y
abstencionismo de las alcaldías, calculado sobre el electorado inscrito.
