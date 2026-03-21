# Hoja de Ruta de Arquitectura IVAI

## Direccion actual

Este proyecto esta migrando de una aplicacion acoplada a una pagina hacia una arquitectura tipo libreria, para luego integrarse de forma limpia con WordPress.

## Estructura por capas (objetivo)

- `src/core`: estado de la app, eventos y acceso a datos
- `src/tabs`: modulos por pestana (`vulnerability`, `compare`, `evolution`)
- `src/shared`: utilidades reutilizables de UI/mapa (leyendas, popups, escalas)
- `src/adapters`: integraciones por plataforma (wrapper de plugin WordPress)

## Lo que ya esta migrado

- Estado y constantes de mapa movidos a `src/core/store.js`
- Busqueda de elementos DOM centralizada en `src/core/dom-registry.js`
- Se agrega `state.domRoot` y `refreshDomBindings` para preparar desacople de selectores globales
- `js/interfaz.js` ahora resuelve consultas DOM dentro de `state.domRoot` en vez de usar solo `document`
- `createIvaiApp` ahora evita inicializaciones en contenedores distintos y reporta limite de instancia unica
- `js/logica_mapa/mapa.js` inicializa Leaflet con nodos del root activo (`L.map(element)`) en lugar de IDs globales
- Se agrega limpieza de listeners globales por instancia (`state.cleanupHandlers`) y clave de tema configurable
- La clave de tema en storage ahora se deriva del contenedor de montaje (`ivai-theme:<mountKey>`) por defecto
- `destroy()` ahora limpia tambien instancias SlimSelect y banderas de ajuste de mapas para permitir reinicios limpios
- `destroy()` reinicia tambien el runtime de capas base (`currentTileLayers`) para evitar referencias cruzadas
- Se introduce adapter de storage por instancia (`appOptions.storage`) para desacoplar acceso directo a `localStorage`
- `destroy()` limpia caches de datos cargados (catalogo, datasets y configuraciones) para reinicializacion consistente
- Eventos/acciones del core agregados en:
  - `src/core/events.js`
  - `src/core/actions.js`
- Carga de datos extraida a `src/core/data-service.js`
- Flujo de UI de evolucion extraido a `src/tabs/evolution/ui-controller.js`
- Render de mapas de evolucion extraido a `src/tabs/evolution/map-controller.js`
- Render del mapa principal de vulnerabilidad extraido a `src/tabs/vulnerability/map-controller.js`
- Render de mapas comparativos extraido a `src/tabs/compare/map-controller.js`
- Implementacion de helpers compartidos de mapa migrada a `src/shared/map-components.js`
- Punto de entrada publico agregado en `src/index.js` (`createIvaiApp`)
- Bootstrap legacy movido a `src/bootstrap/legacy-app.js` para desacoplar `src/index.js` de `js/main.js`
- `createIvaiApp` ahora admite montaje por contenedor reubicando `#ivai-legacy-root`
- Se agrupo la UI legacy en `#ivai-legacy-root` para facilitar el montaje en contenedores externos
- Adapter WordPress MVP agregado en `src/adapters/wordpress/ivai-wordpress.php` (shortcode en modo `iframe` y `direct` experimental)
- Pipeline base de verificaciones agregado con `package.json` (`npm run check`)
- Build de distribucion agregado con `npm run build` (salida en `dist/`)
- Documentacion de release y versionado inicial agregada en `RELEASE.md` y `CHANGELOG.md`
- Prueba automatizada del adapter WordPress agregada en `scripts/test-wordpress-adapter.php`
- Compatibilidad legacy mantenida mediante wrappers:
  - `js/configuracion.js`
  - `js/manejo_datos.js`

## Siguientes pasos de implementacion

1. Reducir dependencia de IDs globales para soportar multiples instancias reales por contenedor
2. Endurecer adapter WordPress directo (carga de assets, errores y soporte futuro para multiples instancias)
3. Ampliar pruebas de integracion para escenarios de carga remota y errores de red reales
4. Desacoplar el estado global para soportar multiples instancias reales por pagina
