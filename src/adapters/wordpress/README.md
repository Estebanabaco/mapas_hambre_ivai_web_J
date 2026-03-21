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

## Notas

- `iframe` es la opcion mas estable para produccion en este momento.
- `direct` monta la libreria JS en la pagina WordPress y carga el template desde `index.html`.
- En modo `direct` actualmente se soporta una sola instancia por pagina.
