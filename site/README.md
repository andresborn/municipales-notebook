# Elecciones Costa Rica · Sitio web

Sitio estático de resultados electorales de Costa Rica. Incluye las elecciones
municipales de 2020 y 2024, y la elección presidencial de 2026, con resumen
nacional y ficha por cantón.

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
- `src/pages/CantonPage.tsx`: ficha municipal por cantón.
- `src/pages/PresidentialHomePage.tsx`: resumen nacional presidencial 2026.
- `src/pages/PresidentialCantonPage.tsx`: ficha presidencial por cantón.
- `src/components/`: encabezado, pie, selector de cantón, barras, mapa de
  cuadros, cuadrícula de escaños, tiras de regidurías por cantón y tarjetas.
- `src/lib/data.ts`: carga y deriva los datos municipales de 2020 y 2024.
- `src/lib/presidential.ts`: carga y deriva los datos presidenciales de 2026.
- `src/lib/parties.ts`: nombres y colores de partidos.
- `src/lib/format.ts`: formato de números, porcentajes y puntos porcentuales.
- `src/lib/classification.ts`: clasificación de competitividad y etiquetas de
  margen.
- `src/lib/routes.ts`: rutas por hash y enlaces.

## Rutas

- `#/`: portada.
- `#/2020` y `#/2024`: resumen nacional.
- `#/2020/cantones` y `#/2024/cantones`: ficha del cantón por defecto
  (San José).
- `#/2020/cantones/:provincia/:canton` y
  `#/2024/cantones/:provincia/:canton`: ficha del cantón.
- `#/2026`: resumen nacional presidencial.
- `#/2026/cantones` y `#/2026/cantones/:provincia/:canton`: ficha presidencial
  por cantón.

El enlace antiguo `#/cantones` se resuelve a `#/2024/cantones`; si incluye
provincia y cantón, conserva la ficha correspondiente. Los años no reconocidos
vuelven a la portada.

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

Además, `src/lib/data.ts` deriva los votos totales de cada partido en las
papeletas de alcaldía y regidurías, y los cruza con las alcaldías y regidurías
ganadas. Esos totales se calculan en el sitio; no requieren un CSV adicional.

Para 2026 el sitio consume los cinco CSV presidenciales generados por el ETL:

- `src/data/clean/presidencial_2026.csv`
- `src/data/clean/participacion_presidencial_2026.csv`
- `src/data/clean/resumen_presidencial_canton_2026.csv`
- `src/data/clean/resumen_presidencial_partido_2026.csv`
- `src/data/clean/presidencial_nacional_2026.csv`

`src/lib/presidential.ts` construye los mapas por cantón y el resumen nacional.
El voto en el extranjero se incluye en los totales nacionales, pero no se asigna
a ningún cantón.

## Presentación

Las barras, el mapa de cuadros, las cuadrículas de escaños y los waffles se
dibujan con CSS y HTML, sin depender de una librería de gráficos en el bundle
principal. `@observablehq/plot` sigue instalado: `src/components/PlotPartyVotes.tsx`
es una versión inactiva de las barras y `CantonPage.tsx` incluye la nota para
activarla si se necesita.

El módulo de 2026 reutiliza las barras, el mapa de cuadros y los estilos de
ficha municipal. La presidencial se muestra por cantón; las diputaciones se
incorporarán cuando el ETL produzca sus CSV.

## Nota metodológica

Los porcentajes de votación y los márgenes de alcaldías, regidurías y
presidencial se calculan sobre votos válidos. La participación y el
abstencionismo se calculan sobre el electorado inscrito, no sobre los votos
emitidos. La alcaldía y la regiduría son papeletas distintas, por eso sus votos
recibidos pueden diferir levemente en un mismo cantón.
