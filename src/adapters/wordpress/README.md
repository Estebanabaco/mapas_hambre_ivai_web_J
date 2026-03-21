# Adapter WordPress (MVP)

Este directorio contiene un adapter inicial para integrar el visor IVAI en WordPress mediante shortcode.

## Archivo principal

- `ivai-wordpress.php`

## Uso rapido

1. Copia `ivai-wordpress.php` dentro de una carpeta de plugin en tu instalacion WordPress.
2. Activa el plugin desde el panel de WordPress.
3. Inserta el shortcode en una pagina o entrada:

```text
[ivai_map]
```

## Parametros del shortcode

- `src`: URL del `index.html` del visor.
- `base_url`: URL base del proyecto (`/ivai2024`), usada para cargar assets y `src/index.js` en modo directo.
- `mode`: `iframe` (por defecto) o `direct`.
- `fallback`: `iframe` (por defecto) o `none` para desactivar fallback automatico en modo directo.
- `timeout_ms`: tiempo maximo de espera por fase en modo directo (1000-60000, por defecto 15000).
- `height`: alto del iframe en pixeles.
- `title`: titulo accesible del iframe.

Ejemplo:

```text
[ivai_map src="https://tu-dominio.com/ivai2024/index.html" height="980" title="Visor IVAI Colombia"]
```

Ejemplo modo directo (experimental):

```text
[ivai_map mode="direct" src="https://tu-dominio.com/ivai2024/index.html" base_url="https://tu-dominio.com/ivai2024" height="980"]
```

Ejemplo modo directo sin fallback:

```text
[ivai_map mode="direct" fallback="none" timeout_ms="20000" src="https://tu-dominio.com/ivai2024/index.html" base_url="https://tu-dominio.com/ivai2024"]
```

## Notas

- `iframe` es la opcion mas estable para produccion en este momento.
- `direct` monta la libreria JS en la pagina WordPress y carga el template desde `index.html`.
- En modo `direct` actualmente se soporta una sola instancia por pagina.
- Si `direct` falla, por defecto se hace fallback a `iframe` automaticamente.

## Verificacion automatizada

Puedes validar el adapter sin instalar WordPress ejecutando:

```bash
npm run test:wp-adapter
```
