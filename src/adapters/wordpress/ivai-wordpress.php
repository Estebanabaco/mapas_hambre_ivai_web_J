<?php
/**
 * Plugin Name: IVAI Map Embed
 * Description: Inserta el visor IVAI mediante shortcode en WordPress.
 * Version: 0.1.0
 * Author: Equipo IVAI
 */

if (!defined('ABSPATH')) {
    exit;
}

function ivai_map_embed_styles() {
    $css = '
    .ivai-map-embed {
        width: 100%;
        max-width: 100%;
    }
    .ivai-map-embed__frame {
        width: 100%;
        border: 0;
        border-radius: 8px;
        display: block;
    }
    ';

    wp_register_style('ivai-map-embed-inline', false, array(), '0.1.0');
    wp_enqueue_style('ivai-map-embed-inline');
    wp_add_inline_style('ivai-map-embed-inline', $css);
}
add_action('wp_enqueue_scripts', 'ivai_map_embed_styles');

function ivai_map_embed_shortcode($atts) {
    $defaults = array(
        'src' => home_url('/ivai2024/index.html'),
        'base_url' => '',
        'mode' => 'iframe',
        'fallback' => 'iframe',
        'timeout_ms' => '15000',
        'height' => '900',
        'title' => 'Visor IVAI',
    );

    $args = shortcode_atts($defaults, $atts, 'ivai_map');

    $src = esc_url($args['src']);
    $mode = sanitize_key($args['mode']);
    if ($mode !== 'direct') {
        $mode = 'iframe';
    }

    $fallback = sanitize_key($args['fallback']);
    if ($fallback !== 'none') {
        $fallback = 'iframe';
    }

    $base_url_raw = trim((string) $args['base_url']);
    if ($base_url_raw === '') {
        $base_url_raw = untrailingslashit(dirname($src));
    }
    $base_url = esc_url_raw(untrailingslashit($base_url_raw));

    $height = absint($args['height']);
    if ($height <= 0) {
        $height = 900;
    }

    $timeout_ms = absint($args['timeout_ms']);
    if ($timeout_ms < 1000) {
        $timeout_ms = 15000;
    }
    if ($timeout_ms > 60000) {
        $timeout_ms = 60000;
    }

    $title = sanitize_text_field($args['title']);
    if ($title === '') {
        $title = 'Visor IVAI';
    }

    if ($mode === 'direct') {
        $container_id = 'ivai-map-' . wp_rand(1000, 999999);

        $payload = array(
            'containerId' => $container_id,
            'baseUrl' => $base_url,
            'indexUrl' => $src,
            'fallback' => $fallback,
            'timeoutMs' => $timeout_ms,
            'height' => $height,
            'title' => $title,
        );

        $script = <<<'JS'
<script type="module">
(() => {
    const cfg = %s;
    const mount = document.getElementById(cfg.containerId);
    if (!mount) return;

    const fallbackToIframe = () => {
        if (cfg.fallback !== 'iframe') return false;
        mount.innerHTML = `<iframe class="ivai-map-embed__frame" src="${cfg.indexUrl}" height="${cfg.height}" loading="lazy" title="${cfg.title || 'Visor IVAI'}"></iframe>`;
        return true;
    };

    const withTimeout = (promise, message) => {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error(message)), cfg.timeoutMs || 15000);
            promise
                .then((result) => {
                    clearTimeout(timer);
                    resolve(result);
                })
                .catch((error) => {
                    clearTimeout(timer);
                    reject(error);
                });
        });
    };

    if (!cfg.baseUrl || !cfg.indexUrl) {
        if (!fallbackToIframe()) {
            mount.innerHTML = '<div style="padding:12px;border:1px solid #d33;background:#fff5f5;color:#8b0000;border-radius:8px;">Configuracion invalida para modo directo.</div>';
        }
        return;
    }

    const cssAssets = [
        'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
        'https://cdn.jsdelivr.net/npm/leaflet.fullscreen@2.4.0/Control.FullScreen.css',
        'https://cdn.jsdelivr.net/npm/slim-select@2.8.2/dist/slimselect.min.css',
        `${cfg.baseUrl}/css/base.css`,
        `${cfg.baseUrl}/css/layout.css`,
        `${cfg.baseUrl}/css/componentes.css`,
        `${cfg.baseUrl}/css/sidebar.css`,
        `${cfg.baseUrl}/css/sidebar_accordion.css`,
        `${cfg.baseUrl}/css/mapa.css`,
        `${cfg.baseUrl}/css/dark-mode.css`
    ];

    const jsAssets = [
        'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
        'https://cdn.jsdelivr.net/npm/leaflet.sync@0.2.4/L.Map.Sync.min.js',
        'https://cdn.jsdelivr.net/npm/leaflet.fullscreen@2.4.0/Control.FullScreen.js',
        'https://cdn.jsdelivr.net/npm/slim-select@2.8.2/dist/slimselect.min.js'
    ];

    const ensureCss = (href) => {
        if (document.querySelector(`link[data-ivai-asset="${href}"]`)) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.setAttribute('data-ivai-asset', href);
        document.head.appendChild(link);
    };

    const ensureScript = (src) => new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[data-ivai-asset="${src}"]`);
        if (existing) {
            if (existing.dataset.loaded === 'true') {
                resolve();
                return;
            }
            existing.addEventListener('load', () => resolve(), { once: true });
            existing.addEventListener('error', () => reject(new Error(`No se pudo cargar ${src}`)), { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = false;
        script.setAttribute('data-ivai-asset', src);
        script.addEventListener('load', () => {
            script.dataset.loaded = 'true';
            resolve();
        }, { once: true });
        script.addEventListener('error', () => reject(new Error(`No se pudo cargar ${src}`)), { once: true });
        document.head.appendChild(script);
    });

    const showError = (message) => {
        mount.innerHTML = `<div style="padding:12px;border:1px solid #d33;background:#fff5f5;color:#8b0000;border-radius:8px;">${message}</div>`;
    };

    const bootstrap = async () => {
        try {
            mount.style.minHeight = `${cfg.height}px`;
            mount.innerHTML = '<div style="padding:8px;color:#555;">Cargando visor IVAI...</div>';

            cssAssets.forEach(ensureCss);
            for (const src of jsAssets) {
                await withTimeout(ensureScript(src), `Tiempo de espera agotado cargando ${src}`);
            }

            let legacyRoot = document.getElementById('ivai-legacy-root');
            if (legacyRoot && !mount.contains(legacyRoot)) {
                if (!fallbackToIframe()) {
                    showError('Ya existe una instancia IVAI montada en esta pagina. Actualmente el modo directo soporta una instancia por pagina.');
                }
                return;
            }

            if (!legacyRoot) {
                const htmlText = await withTimeout(fetch(cfg.indexUrl, { cache: 'no-store' }).then(r => {
                    if (!r.ok) throw new Error('No se pudo descargar el template del visor.');
                    return r.text();
                }), 'Tiempo de espera agotado al descargar el template del visor.');
                const doc = new DOMParser().parseFromString(htmlText, 'text/html');
                legacyRoot = doc.getElementById('ivai-legacy-root');
                if (!legacyRoot) {
                    throw new Error('El template no contiene #ivai-legacy-root.');
                }
                mount.innerHTML = '';
                mount.appendChild(legacyRoot);
            }

            const moduleUrl = `${cfg.baseUrl}/src/index.js`;
            const api = await withTimeout(import(moduleUrl), 'Tiempo de espera agotado al cargar la libreria IVAI.');
            await withTimeout(api.createIvaiApp(`#${cfg.containerId}`), 'Tiempo de espera agotado al iniciar IVAI.');
        } catch (error) {
            if (!fallbackToIframe()) {
                showError(error.message || 'No fue posible iniciar el visor IVAI.');
            }
        }
    };

    bootstrap();
})();
</script>
JS;

        return sprintf(
            '<div class="ivai-map-embed"><div id="%1$s" class="ivai-map-embed__direct" style="min-height:%2$dpx;" aria-label="%3$s"></div></div>%4$s',
            esc_attr($container_id),
            $height,
            esc_attr($title),
            sprintf($script, wp_json_encode($payload))
        );
    }

    return sprintf(
        '<div class="ivai-map-embed"><iframe class="ivai-map-embed__frame" src="%1$s" height="%2$d" loading="lazy" title="%3$s"></iframe></div>',
        $src,
        $height,
        esc_attr($title)
    );
}
add_shortcode('ivai_map', 'ivai_map_embed_shortcode');
