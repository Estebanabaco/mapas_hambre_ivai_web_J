# Changelog

## 0.1.0 - Unreleased

- Se migra la arquitectura hacia modulos en `src/core`, `src/tabs` y `src/shared`.
- Se agrega API publica inicial con `createIvaiApp` y montaje por contenedor.
- Se incorpora adapter WordPress con shortcode `ivai_map` en modos `iframe` y `direct` (experimental).
- Se unifica configuracion del sitio en `config/metadatos.json` y se elimina `site_config`.
- Se externaliza el token del endpoint `api/update.php` a configuracion local/entorno.
- Se agrega pipeline base de verificacion (`npm run check`) y build de distribucion (`npm run build`).
