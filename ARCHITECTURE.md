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
- Eventos/acciones del core agregados en:
  - `src/core/events.js`
  - `src/core/actions.js`
- Carga de datos extraida a `src/core/data-service.js`
- Flujo de UI de evolucion extraido a `src/tabs/evolution/ui-controller.js`
- Render de mapas de evolucion extraido a `src/tabs/evolution/map-controller.js`
- Render del mapa principal de vulnerabilidad extraido a `src/tabs/vulnerability/map-controller.js`
- Render de mapas comparativos extraido a `src/tabs/compare/map-controller.js`
- Helpers compartidos de mapa ahora se consumen via `src/shared/map-components.js`
- Punto de entrada publico agregado en `src/index.js` (`createIvaiApp`)
- Compatibilidad legacy mantenida mediante wrappers:
  - `js/configuracion.js`
  - `js/manejo_datos.js`

## Siguientes pasos de implementacion

1. Terminar de migrar implementaciones de helpers desde `js/logica_mapa/componentes.js` hacia `src/shared/*`
2. Desacoplar `src/index.js` del bootstrap legacy y soportar montaje en contenedor personalizado
3. Agregar adapter de WordPress en `src/adapters/wordpress`
4. Agregar pipeline de build/tests para distribuir la libreria
