<?php

declare(strict_types=1);

if (!defined('ABSPATH')) {
    define('ABSPATH', __DIR__ . '/');
}

$GLOBALS['ivai_test_shortcodes'] = [];

if (!function_exists('add_action')) {
    function add_action($hook, $callback) {
        return true;
    }
}

if (!function_exists('add_shortcode')) {
    function add_shortcode($tag, $callback) {
        $GLOBALS['ivai_test_shortcodes'][$tag] = $callback;
        return true;
    }
}

if (!function_exists('wp_register_style')) {
    function wp_register_style($handle, $src = false, $deps = [], $ver = false) {
        return true;
    }
}

if (!function_exists('wp_enqueue_style')) {
    function wp_enqueue_style($handle, $src = '', $deps = [], $ver = false, $media = 'all') {
        return true;
    }
}

if (!function_exists('wp_add_inline_style')) {
    function wp_add_inline_style($handle, $data) {
        return true;
    }
}

if (!function_exists('home_url')) {
    function home_url($path = '') {
        return 'https://example.test' . $path;
    }
}

if (!function_exists('shortcode_atts')) {
    function shortcode_atts($pairs, $atts, $shortcode = '') {
        $atts = is_array($atts) ? $atts : [];
        return array_merge($pairs, $atts);
    }
}

if (!function_exists('esc_url')) {
    function esc_url($url) {
        return (string) $url;
    }
}

if (!function_exists('sanitize_key')) {
    function sanitize_key($key) {
        $key = strtolower((string) $key);
        return preg_replace('/[^a-z0-9_\-]/', '', $key);
    }
}

if (!function_exists('untrailingslashit')) {
    function untrailingslashit($value) {
        return rtrim((string) $value, '/\\');
    }
}

if (!function_exists('esc_url_raw')) {
    function esc_url_raw($url) {
        return (string) $url;
    }
}

if (!function_exists('absint')) {
    function absint($maybeint) {
        return abs((int) $maybeint);
    }
}

if (!function_exists('sanitize_text_field')) {
    function sanitize_text_field($str) {
        return trim(strip_tags((string) $str));
    }
}

if (!function_exists('wp_rand')) {
    function wp_rand($min = null, $max = null) {
        $min = $min ?? 0;
        $max = $max ?? mt_getrandmax();
        return random_int((int) $min, (int) $max);
    }
}

if (!function_exists('esc_attr')) {
    function esc_attr($text) {
        return htmlspecialchars((string) $text, ENT_QUOTES, 'UTF-8');
    }
}

if (!function_exists('wp_json_encode')) {
    function wp_json_encode($value) {
        return json_encode($value);
    }
}

require __DIR__ . '/../src/adapters/wordpress/ivai-wordpress.php';

function ivai_assert_true($condition, string $message): void {
    if (!$condition) {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }
}

function ivai_assert_contains(string $needle, string $haystack, string $message): void {
    ivai_assert_true(strpos($haystack, $needle) !== false, $message . " (missing: {$needle})");
}

ivai_assert_true(isset($GLOBALS['ivai_test_shortcodes']['ivai_map']), 'No se registro el shortcode ivai_map.');

$defaultOutput = ivai_map_embed_shortcode([]);
ivai_assert_contains('<iframe', $defaultOutput, 'El modo por defecto debe renderizar iframe.');
ivai_assert_contains('ivai-map-embed__frame', $defaultOutput, 'Debe usar clase del iframe embed.');

$directOutput = ivai_map_embed_shortcode([
    'mode' => 'direct',
    'src' => 'https://example.test/ivai2024/index.html',
    'base_url' => 'https://example.test/ivai2024',
    'timeout_ms' => '12000',
]);

ivai_assert_contains('type="module"', $directOutput, 'Modo direct debe incluir script module.');
ivai_assert_contains('createIvaiApp', $directOutput, 'Modo direct debe montar la libreria.');
ivai_assert_contains('ivai-legacy-root', $directOutput, 'Modo direct debe buscar ivai-legacy-root.');
ivai_assert_contains('"timeoutMs":12000', $directOutput, 'Modo direct debe propagar timeout_ms.');

$directNoFallbackOutput = ivai_map_embed_shortcode([
    'mode' => 'direct',
    'fallback' => 'none',
    'timeout_ms' => '999999',
    'src' => 'https://example.test/ivai2024/index.html',
    'base_url' => 'https://example.test/ivai2024',
]);

ivai_assert_contains('"fallback":"none"', $directNoFallbackOutput, 'Debe respetar fallback=none.');
ivai_assert_contains('"timeoutMs":60000', $directNoFallbackOutput, 'timeout_ms debe limitarse a 60000.');

echo "OK: pruebas del adapter WordPress completadas.\n";
