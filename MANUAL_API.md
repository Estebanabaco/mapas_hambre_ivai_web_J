# Manual de Uso: API de Actualizacion de Archivos JSON

## 1. Proposito

Este documento describe como utilizar el endpoint PHP para actualizar de forma remota los archivos JSON de datos del proyecto IVAI.

La API permite reemplazar el contenido de archivos especificos por ano mediante una peticion HTTP autenticada.

## 2. Endpoint

- URL: `http://<servidor>/<ruta_proyecto>/api/update.php?year=<anio>&type=<tipo>`
- Metodo HTTP: `POST`

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

## 4. Parametros y Cuerpo de la Peticion

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

## 5. Validacion de Estructura

La API valida que la estructura de claves del JSON enviado coincida con una plantilla base (`data/2024/...`) para el tipo de archivo seleccionado.

Si la estructura no coincide, la API responde `400`.

## 6. Comportamiento de Escritura

- El archivo se escribe en `data/<year>/...` segun el `type` recibido.
- Si la carpeta `data/<year>` no existe, la API intenta crearla automaticamente.

## 7. Respuestas del Endpoint

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

## 8. Ejemplo con curl

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
