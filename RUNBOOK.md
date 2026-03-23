# Runbook Operativo IVAI (GAS -> API -> WordPress)

## 1) Objetivo

Este runbook resume el flujo operativo para:

- cargar/actualizar datos por año desde Google Sheets (GAS),
- activar años en el catalogo de la app,
- validar el visor web,
- publicar/embeder en WordPress.

## 2) Prerrequisitos

- API accesible por HTTPS (no localhost para GAS).
- Token configurado en servidor (`api/config.local.php` o `IVAI_SECRET_TOKEN`).
- Hoja de Google con menu `IVAI` activo.
- WordPress con plugin `ivai-wordpress.php` instalado (si aplica).

## 3) Flujo estandar de carga anual

1. En Google Sheets, definir año en `Config!B2` (ej. `2025`).
2. Verificar `base_url` en `Config!B3` (publico y correcto).
3. Ejecutar `IVAI > Precargar datos base` (si necesitas iniciar desde datos remotos).
4. Revisar/editar hojas de trabajo (`indice`, `indicadores`, `nutricionales`).
5. Ejecutar `IVAI > Publicar datos base`.
6. Confirmar mensaje de estado:
   - si base completa: año listo/visible,
   - si incompleta: revisar que falte `indice`, `indicadores` o `nutricionales`.
7. (Opcional) Ejecutar `IVAI > Publicar AHP` cuando corresponda.

## 4) Reglas de activacion del año

- Un año se vuelve visible en `config/metadatos.json` solo cuando estan cargados:
  - `indice`,
  - `indicadores`,
  - `nutricionales`.
- `AHP` es independiente y no bloquea visibilidad.
- Estado por año se guarda en `config/year_status.json`.

## 5) Validacion rapida post-publicacion

1. Abrir app web y confirmar que aparece el nuevo año en selector.
2. Verificar que la app inicia en el año mas reciente disponible.
3. Probar 3 tabs:
   - Mapa de Vulnerabilidad,
   - Mapas Comparativos,
   - Evolucion Temporal.
4. Confirmar comparativos entre año nuevo y años previos.
5. Si no hay AHP aun, validar que la app no se rompe (se muestra sin ponderaciones AHP).

## 6) Endpoints de soporte (operacion)

- Actualizar archivo por tipo:
  - `POST /api/update.php?year=<YYYY>&type=<indice|indicadores|nutricionales|ahp>`
- Consultar estado de año:
  - `GET /api/year-status.php?year=<YYYY>`
- Eliminar año completo:
  - `POST /api/delete-year.php?year=<YYYY>`

Notas:

- `update.php` y `delete-year.php` requieren `Authorization: Bearer <token>`.
- `year-status.php` no requiere token.

## 7) Reversion / borrado de un año

Desde Google Sheets:

1. Definir en `Config!B2` el año a borrar.
2. Ejecutar `IVAI > Borrar año publicado`.
3. Confirmar doble dialogo.

Efecto esperado:

- elimina `data/<year>/`,
- elimina referencias del año en `config/metadatos.json`,
- elimina estado en `config/year_status.json`,
- ajusta `Config!B2` al siguiente año disponible (o vacio si no hay).

## 8) WordPress (modo recomendado actual)

- Modo recomendado: `direct` con autoaltura por viewport.

Shortcode base sugerido:

```text
[ivai_map mode="direct" src="https://estadisticas.abaco.org.co/dev_ivai_web2024/index.html" base_url="https://estadisticas.abaco.org.co/dev_ivai_web2024" auto_height="viewport" offset_px="12" min_height="680" max_height="1200" timeout_ms="20000" fallback="iframe" title="Visor IVAI Colombia"]
```

## 9) Incidencias comunes y solucion

- Año no aparece en app:
  - validar publicacion de los 3 tipos base,
  - consultar `year-status.php`.
- GAS no conecta a API:
  - confirmar `base_url` publico HTTPS,
  - revisar token.
- Comparativo no carga:
  - validar rutas en `metadatos.json`,
  - revisar consola del navegador.
- Menu de GAS no muestra cambios:
  - ejecutar `clasp -u personal push --force`, recargar Sheet.

## 10) Comandos utiles

```bash
npm run check
npm run build
clasp -u personal push --force
```
