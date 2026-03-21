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
        'height' => '900',
        'title' => 'Visor IVAI',
    );

    $args = shortcode_atts($defaults, $atts, 'ivai_map');

    $src = esc_url($args['src']);
    $height = absint($args['height']);
    if ($height <= 0) {
        $height = 900;
    }

    $title = sanitize_text_field($args['title']);
    if ($title === '') {
        $title = 'Visor IVAI';
    }

    return sprintf(
        '<div class="ivai-map-embed"><iframe class="ivai-map-embed__frame" src="%1$s" height="%2$d" loading="lazy" title="%3$s"></iframe></div>',
        $src,
        $height,
        esc_attr($title)
    );
}
add_shortcode('ivai_map', 'ivai_map_embed_shortcode');
