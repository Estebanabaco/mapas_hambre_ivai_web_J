# IVAI Google Apps Script Sync

Sincronizador bidireccional (precarga + publicación) entre Google Sheets y JSON IVAI.

## Objetivo

- **Precargar** un año existente desde JSON remoto hacia hojas de edición.
- **Publicar** cambios de hojas hacia `api/update.php` por tipo y año.
- Separar AHP del flujo base para evitar publicaciones accidentales.

## Configuración

Hoja `Config`:

- `B2`: `year` (ej. `2024`)
- `B3`: `base_url` (default: `http://localhost/ivai2024`)
- `B4`: referencia visual (token se guarda en Script Properties)

Token:

- Menú `IVAI > Configurar token API`
- Se guarda como `IVAI_API_TOKEN` en `PropertiesService`.

## Estructura de hojas

- `indice` (columna clave: `dept_code`)
- `indicadores` (columna clave: `dept_code`)
- `nutricionales` (columna clave: `dept_code`)
- `ahp_dimensiones`
- `ahp_indicadores`

## Menú IVAI

- `1) Preparar hojas base`
- `Precargar año (datos base)`
- `Precargar AHP del año`
- `Publicar índice`
- `Publicar indicadores`
- `Publicar nutricionales`
- `Publicar datos base` (sin AHP)
- `Publicar AHP`
- `Publicar TODO (incluye AHP)`
- `Configurar URL base`
- `Configurar token API`
- `Ver configuración activa`

## Flujo recomendado

1. Configurar `year` y `base_url` en `Config`.
2. Ejecutar `Precargar año (datos base)`.
3. Revisar/editar datos.
4. Publicar con `Publicar datos base`.
5. Publicar `AHP` solo cuando aplique.

## Notas

- La precarga crea copia de respaldo de cada hoja (`*_backup_YYYYMMDD_HHMMSS`) antes de sobrescribir.
- Desde `base_url`, el script deriva automáticamente:
  - API update: `.../api/update.php`
  - Data JSON: `.../data/<year>/archivo.json`
- Para `indicadores`, el script convierte automáticamente nombres JSON legibles a columnas cortas de la hoja (y viceversa al publicar).
- Usa una URL pública accesible desde internet para que Apps Script pueda precargar/publicar correctamente.

## Estructura de archivos GAS

- `00_constants.gs`: constantes y encabezados de hojas.
- `10_menu.gs`: menú de entrada (`onOpen`).
- `20_setup.gs`: creación/actualización de hojas base.
- `30_publish.gs`: publicación a API por tipo.
- `40_preload.gs`: precarga de JSON por año.
- `50_settings.gs`: configuración de URL/token y lectura de settings.
- `60_sheet_utils.gs`: utilidades de lectura/escritura en Sheets.

### Compatibilidad

Si ya existe la hoja antigua `ahp_variables_intra`, el setup la renombra automáticamente a `ahp_indicadores`.
