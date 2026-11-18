# Elecciones Costa Rica · Sitio web

Sitio estático de resultados electorales de Costa Rica. Incluye las elecciones
municipales de 2020 y 2024, con resumen nacional y ficha por cantón, y el módulo
de las elecciones nacionales de 2026 en preparación.

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

El build queda en `site/dist/`.

## Estructura

- `src/pages/LandingPage.tsx`: portada, tarjetas de elección y metodología.
- `src/pages/HomePage.tsx`: resumen nacional de 2020 y 2024.
- `src/pages/CantonPage.tsx`: ficha por cantón.
- `src/pages/SoonPage.tsx`: módulo nacional 2026 en preparación.
- `src/components/`: encabezado, pie, selector de cantón, barras, mapa de
  cuadros, cuadrícula de escaños y tarjetas.
- `src/lib/data.ts`: carga y deriva los datos de ambos años.
- `src/lib/parties.ts`: nombres y colores de partidos.
- `src/lib/format.ts`: formato de números, porcentajes y puntos porcentuales.
- `src/lib/routes.ts`: rutas por hash y enlaces.

## Rutas

- `#/`: portada.
- `#/2020` y `#/2024`: resumen nacional.
- `#/2020/cantones/:provincia/:canton` y
  `#/2024/cantones/:provincia/:canton`: ficha del cantón.
- `#/2026`: módulo nacional en preparación.

El enlace antiguo `#/cantones` se resuelve a `#/2024/cantones`; los años no
reconocidos vuelven a la portada.

## Datos

El sitio consume los CSV limpios del repositorio, para cada año:

- `src/data/clean/alcaldes_{año}.csv`
- `src/data/clean/resumen_alcaldes_canton_{año}.csv`
- `src/data/clean/resumen_regidurias_canton_{año}.csv`
- `src/data/clean/escanos_regidurias_{año}.csv`
- `src/data/clean/resumen_regidurias_partido_{año}.csv`

donde `{año}` es `2020` o `2024`. En 2020 hay 82 cantones: Monteverde y Puerto
Jiménez se crearon después, así que solo aparecen en 2024. Si se abre una ficha
de esos cantones en 2020, el sitio muestra un aviso y conserva el enlace para
volver al cantón al cambiar a 2024.

## Presentación

Las barras, el mapa de cuadros, las cuadrículas de escaños y los waffles se
dibujan con CSS y HTML, sin depender de una librería de gráficos en el bundle
principal. `@observablehq/plot` sigue instalado: `src/components/PlotPartyVotes.tsx`
es una versión inactiva de las barras y `CantonPage.tsx` incluye la nota para
activarla si se necesita.

El módulo de 2026 no muestra cifras simuladas. Se incorporará cuando existan
resultados oficiales y el ETL produzca los CSV limpios equivalentes.

## Nota metodológica

Los porcentajes de votación y los márgenes de alcaldías y regidurías se calculan
sobre votos válidos. La participación y el abstencionismo se calculan sobre el
electorado inscrito, no sobre los votos emitidos. La alcaldía y la regiduría son
papeletas distintas, por eso sus votos recibidos pueden diferir levemente en un
mismo cantón.
