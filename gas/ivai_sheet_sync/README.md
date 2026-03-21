# IVAI Google Apps Script Sync

Script de Google Sheets para publicar datasets IVAI hacia la API local:

- Endpoint base por defecto: `http://localhost/ivai2024/api/update.php`
- Spreadsheet ID objetivo: `1kTcXMXd7OnhDTAxs1mZwdywCWyHtv_TLp20OeRZ8JjY`

## Estructura de hojas

- `Config`
  - `B2`: `year` (ej. `2024`)
  - `B3`: `api_base_url` (por defecto localhost)
  - `B4`: referencia (token va en Script Properties)
- `indice` (primera columna: `dept_code`)
- `indicadores` (primera columna: `dept_code`)
- `nutricionales` (primera columna: `dept_code`)
- `ahp_dimensiones`
- `ahp_variables_intra`

## Menú en Sheets

Al abrir la hoja aparece menú `IVAI` con acciones de:

- preparar hojas base,
- publicar por tipo,
- publicar todo,
- configurar token,
- setear localhost.

## Despliegue con clasp

Desde esta carpeta (`gas/ivai_sheet_sync`):

```bash
clasp login
clasp create --type sheets --title "IVAI Sheet Sync" --parentId 1kTcXMXd7OnhDTAxs1mZwdywCWyHtv_TLp20OeRZ8JjY --rootDir .
clasp push
```

Si ya tienes proyecto creado y `scriptId`, configura `.clasp.json` y ejecuta solo `clasp push`.

## Configuración de token

Usa el menú: `IVAI > Configurar token API`.

El token se guarda en `PropertiesService` como `IVAI_API_TOKEN`.
