# Manual de Uso: API de Actualización de Archivos JSON

## 1. Propósito

Este documento describe cómo utilizar el endpoint de PHP para actualizar de forma remota los archivos de configuración JSON del proyecto Mapas de Hambre IVAI.

La API permite reemplazar el contenido de archivos específicos a través de una petición HTTP segura y validada.

## 2. Endpoint

- **URL:** `http://<servidor>/<ruta_proyecto>/api/update.php?file=<clave_del_archivo>`
- **Método HTTP:** `POST`

**Ejemplo de URL local:**
`http://localhost/mapas_hambre_ivai_web/api/update.php?file=datos_indice`

## 3. Autenticación

La API utiliza un **Token Bearer** para la autenticación. Debes incluir una cabecera `Authorization` en tu petición.

- **Cabecera:** `Authorization`
- **Formato:** `Bearer <TU_TOKEN_SECRETO>`

El token secreto se configura en la constante `SECRET_TOKEN` dentro del propio archivo `api/update.php`.

```php
// api/update.php
define('SECRET_TOKEN', 'token_de_ejemplo_cambiar_por_uno_seguro');
```

## 4. Parámetros y Cuerpo de la Petición

### Parámetro de URL (Query Param)

- **`file`** (string, obligatorio): Es la clave que identifica el archivo JSON que se desea actualizar.

### Cuerpo de la Petición (Request Body)

- El cuerpo de la petición debe contener el **nuevo contenido para el archivo en formato JSON válido**.
- Debes incluir la cabecera `Content-Type: application/json`.

## 5. Claves de Archivo Válidas (`file`)

La siguiente tabla muestra las claves permitidas para el parámetro `file` y el archivo de destino que se modificará.

| Clave (`file`)             | Archivo de Destino                                       | Plantilla de Validación                                       |
| -------------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `site_config`              | `config/site_config.json`                                | `config/site_config.example.json`                             |
| `configuracion_app`        | `data_example/configuracion_app.json`                    | `data_example/configuracion_app.json`                         |
| `pesos_ahp`                | `data_example/002_Pesos_AHP_Hambre.json`                 | `data_example/002_Pesos_AHP_Hambre.json`                      |
| `datos_indice`             | `data_example/datos_indice.json`                         | `data_example/datos_indice.json`                              |
| `datos_nutricionales`      | `data_example/datos_nutricionales.json`                  | `data_example/datos_nutricionales.json`                       |
| `pesos_ahp_2023`           | `data/2023/002_Pesos_AHP_Hambre.json`                    | `data_example/2023/002_Pesos_AHP_Hambre.json`                 |
| `datos_indice_2023`        | `data/2023/datos_indice.json`                            | `data_example/2023/datos_indice.json`                         |
| `datos_nutricionales_2023` | `data/2023/datos_nutricionales.json`                     | `data_example/2023/datos_nutricionales.json`                  |

## 6. Validación de Estructura

La API valida que la estructura de claves del JSON enviado en el cuerpo de la petición sea **idéntica** a la estructura del archivo de plantilla correspondiente. Si hay claves de más o de menos (incluso en objetos anidados), la API rechazará la petición con un error `400 Bad Request`.

## 7. Respuestas del Endpoint

- **`200 OK` (Éxito)**
  - **Condición:** El archivo fue validado y actualizado correctamente.
  - **Cuerpo:** `{"success":"File \'<clave>\' updated successfully."}`

- **`400 Bad Request` (Petición Incorrecta)**
  - **Condiciones:** Falta el parámetro `file`, la clave no es válida, el JSON del cuerpo es inválido o la estructura del JSON no coincide con la plantilla.
  - **Cuerpo:** `{"error":"<mensaje descriptivo del error>"}`

- **`401 Unauthorized` (No Autorizado)**
  - **Condiciones:** Falta la cabecera `Authorization` o el token es incorrecto.
  - **Cuerpo:** `{"error":"Invalid token."}`

- **`405 Method Not Allowed` (Método no Permitido)**
  - **Condición:** Se utiliza un método HTTP diferente de `POST`.
  - **Cuerpo:** `{"error":"Method Not Allowed. Only POST is accepted."}`

- **`500 Internal Server Error` (Error del Servidor)**
  - **Condiciones:** El script no pudo escribir en el archivo de destino (problemas de permisos) o no encontró el archivo de plantilla para la validación.
  - **Cuerpo:** `{"error":"<mensaje descriptivo del error>"}`

## 8. Ejemplo de Uso con `curl`

Este ejemplo actualiza el archivo `datos_indice` (`data_example/datos_indice.json`).

```bash
curl -X POST "http://localhost/mapas_hambre_ivai_web/api/update.php?file=datos_indice" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer tu_token_secreto_real" \
-d \
'{ 
    "actualizacion": "2025-10-15",
    "fuente": "Datos actualizados desde cURL",
    "datos": [
        {
            "municipio": "Xalapa",
            "valor": 0.9999
        },
        {
            "municipio": "Veracruz",
            "valor": 0.8888
        }
    ]
}'
```
