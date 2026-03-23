# Manual de Uso: API de Actualizacion y Gestion de Años

## 1. Proposito

Este documento describe como utilizar los endpoints PHP para actualizar datos por año, consultar estado de activacion y eliminar años publicados en el proyecto IVAI.

La API permite:

- reemplazar el contenido de archivos especificos por año,
- consultar si un año ya esta listo para mostrarse en catalogo,
- eliminar un año completo (datos y referencias de configuracion).

## 2. Endpoints

- Actualizar archivo por tipo: `http://<servidor>/<ruta_proyecto>/api/update.php?year=<anio>&type=<tipo>` (`POST`)
- Consultar estado de año: `http://<servidor>/<ruta_proyecto>/api/year-status.php?year=<anio>` (`GET`)
- Eliminar año completo: `http://<servidor>/<ruta_proyecto>/api/delete-year.php?year=<anio>` (`POST`)

Ejemplo local:

`http://localhost/ivai2024/api/update.php?year=2024&type=indice`

## 3. Autenticacion

La API usa token Bearer en la cabecera `Authorization`.

- Cabecera: `Authorization`
- Formato: `Bearer <TU_TOKEN_SECRETO>`

### Configuracion del token (prioridad)

1. Archivo local no versionado: `api/config.local.php`
2. Variable de entorno: `IVAI_SECRET_TOKEN`

Si ninguna opcion esta configurada, el endpoint responde `500`.

### Estructura de `api/config.local.php`

```php
<?php

return [
    'secret_token' => 'tu_token_super_seguro'
];
```

> Usa `api/config.example.php` como plantilla.

## 4. Autenticacion por endpoint

- `update.php`: requiere token Bearer.
- `delete-year.php`: requiere token Bearer.
- `year-status.php`: consulta publica (no requiere token).

## 5. Parametros y Cuerpo de la Peticion (`update.php`)

### Query Params

- `year` (obligatorio): ano destino de 4 digitos. Ejemplo: `2024`.
- `type` (obligatorio): tipo de archivo a actualizar.

### Tipos de archivo validos (`type`)

| type | Archivo destino |
| --- | --- |
| `indice` | `data/<year>/datos_indice.json` |
| `indicadores` | `data/<year>/datos_indicadores.json` |
| `nutricionales` | `data/<year>/datos_nutricionales.json` |
| `ahp` | `data/<year>/002_Pesos_AHP_Hambre.json` |

### Request Body

- Debe contener JSON valido con el nuevo contenido del archivo.
- Incluye cabecera `Content-Type: application/json`.

## 6. Validacion de Estructura (`update.php`)

La API valida que la estructura de claves del JSON enviado coincida con una plantilla base (`data/2024/...`) para el tipo de archivo seleccionado.

Si la estructura no coincide, la API responde `400`.

## 7. Comportamiento de Escritura y Activacion de Año (`update.php`)

- El archivo se escribe en `data/<year>/...` segun el `type` recibido.
- Si la carpeta `data/<year>` no existe, la API intenta crearla automaticamente.

### Regla de activacion de año

- El sistema actualiza `config/year_status.json` con banderas por año: `indice`, `indicadores`, `nutricionales`, `ahp`, `baseReady`, `updatedAt`.
- Un año solo se agrega/actualiza en `config/metadatos.json` cuando `baseReady=true`.
- `baseReady=true` cuando existen los 3 tipos base cargados: `indice + indicadores + nutricionales`.
- `ahp` es independiente y no bloquea la visibilidad del año en el catalogo.

## 8. Respuestas de `update.php`

- `200 OK`
  - Condicion: archivo validado y actualizado correctamente.
  - Ejemplo:
    - `{"success":true,"message":"Archivo 'datos_indice.json' para el ano 2024 actualizado con exito.","path":"../data/2024/datos_indice.json"}`

- `400 Bad Request`
  - Condiciones: `type` invalido, `year` invalido, JSON invalido o estructura no valida.

- `401 Unauthorized`
  - Condiciones: falta `Authorization`, formato incorrecto, o token invalido.

- `405 Method Not Allowed`
  - Condicion: metodo distinto de `POST`.

- `500 Internal Server Error`
  - Condiciones: token del servidor no configurado, fallo creando carpeta, o fallo escribiendo archivo.

## 9. Endpoint `year-status.php`

Permite consultar el estado de preparacion/visibilidad de un año.

- Metodo: `GET`
- Parametro: `year` (4 digitos)

Ejemplo:

```bash
curl "http://localhost/ivai2024/api/year-status.php?year=2025"
```

Respuesta de ejemplo:

```json
{
  "success": true,
  "year": "2025",
  "status": {
    "indice": true,
    "indicadores": true,
    "nutricionales": true,
    "ahp": false,
    "baseReady": true,
    "updatedAt": "2026-03-23T12:34:56+00:00"
  },
  "visibleInCatalog": true
}
```

Errores comunes:

- `400` si `year` es invalido.

## 10. Endpoint `delete-year.php`

Permite borrar un año completo de datos y referencias.

- Metodo: `POST`
- Requiere `Authorization: Bearer <token>`
- Parametro: `year` (4 digitos)

Acciones que realiza:

- elimina `data/<year>/` de forma recursiva,
- elimina el año de `config/metadatos.json` (`availableYears` y `rutas[year]`),
- ajusta `defaultYear` si el eliminado era el default,
- elimina el año de `config/year_status.json`.

Ejemplo:

```bash
curl -X POST "http://localhost/ivai2024/api/delete-year.php?year=2025" \
  -H "Authorization: Bearer tu_token_secreto_real"
```

Respuesta de ejemplo:

```json
{
  "success": true,
  "year": "2025",
  "dataDirectoryRemoved": true,
  "filesDeleted": 4,
  "catalogUpdated": true,
  "yearStatusRemoved": true
}
```

Errores comunes:

- `401` si no hay token o es invalido,
- `400` si `year` es invalido,
- `500` si falla la eliminacion/escritura de archivos.

## 11. Ejemplo con curl (`update.php`)

```bash
curl -X POST "http://localhost/ivai2024/api/update.php?year=2024&type=indice" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu_token_secreto_real" \
  -d '{
    "5": {
      "Indice": 30.7,
      "Ranking": 17,
      "Clasificacion_Indice": "Media",
      "Pobreza": 10.9,
      "Desempleo_Ingresos": 64.9,
      "Salud_Nutricion": 15.7,
      "Inseguridad_Alimentaria": 30,
      "Factores_Demograficos": 12.8,
      "Acceso_Servicios": 10.7,
      "Acceso_Grupos_Alimentos": 20.4
    }
  }'
```
