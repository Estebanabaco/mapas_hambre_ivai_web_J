# IVAI Architecture Roadmap

## Current Direction

This project is transitioning from a page-coupled app to a library-style architecture that can later be integrated into WordPress.

## Layered Structure (target)

- `src/core`: app state, events, data access
- `src/tabs`: feature modules per tab (`vulnerability`, `compare`, `evolution`)
- `src/shared`: reusable UI/map helpers (legends, popups, scales)
- `src/adapters`: host-specific integration (WordPress plugin wrapper)

## What is already migrated

- State and map constants moved to `src/core/store.js`
- DOM lookup centralized in `src/core/dom-registry.js`
- Core events/actions added in:
  - `src/core/events.js`
  - `src/core/actions.js`
- Data loading extracted to `src/core/data-service.js`
- Evolution tab UI flow extracted to `src/tabs/evolution/ui-controller.js`
- Evolution map rendering extracted to `src/tabs/evolution/map-controller.js`
- Legacy compatibility retained through wrappers:
  - `js/configuracion.js`
  - `js/manejo_datos.js`

## Next implementation steps

1. Continue tab-specific extraction into `src/tabs/*`
2. Move shared helpers (legend/popup/formatters) to `src/shared/*`
3. Build public API (`createIvaiApp`) in `src/index.js`
4. Add WordPress adapter in `src/adapters/wordpress`
