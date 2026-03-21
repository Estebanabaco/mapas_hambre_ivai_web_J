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
- `height`: alto del iframe en pixeles.
- `title`: titulo accesible del iframe.

Ejemplo:

```text
[ivai_map src="https://tu-dominio.com/ivai2024/index.html" height="980" title="Visor IVAI Colombia"]
```

## Notas

- Este adapter MVP usa `iframe` para integracion rapida y estable.
- La siguiente fase es un adapter que monte la libreria JS directamente sin iframe.
