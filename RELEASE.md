# Flujo de Release

## Precondiciones

- Rama `desarrollo` sin cambios pendientes.
- Checks locales en verde.

## Pasos

1. Ejecutar verificaciones:

```bash
npm run check
```

2. Generar artefactos de distribucion:

```bash
npm run build
```

3. Revisar salida en `dist/`:

- `dist/ivai2024-web`
- `dist/wordpress-plugin/ivai-map-embed`
- `dist/build-info.json`

4. Actualizar `CHANGELOG.md` con la version a publicar.
5. Crear tag de version (semver) y publicar en remoto.

## Convencion de version

- `0.x.y` para iteraciones previas a estabilizacion completa.
- Incrementar:
  - `y` para fixes,
  - `x` para cambios de alcance/modulos grandes.
