<?php

/**
 * Plugin Name: Infinite Scroll
 * Description: Add an infinite horizontal scroll block
 * Version: 2.0.0
 * Author: Jacob Lodes
 */

// Enqueue JS and CSS for infinite scroll
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_script(
        'infinite-scroll',
        plugins_url('infinite-scroll.js', __FILE__),
        array(),
        filemtime(__DIR__ . '/infinite-scroll.js'),
        true
    );
    wp_enqueue_style(
        'infinite-scroll',
        plugins_url('build/style-index.css', __FILE__),
        array(),
        filemtime(__DIR__ . '/build/style-index.css')
    );
});

// Register Infinite Scroll block
add_action('init', function () {
    register_block_type(__DIR__ . '/build');
});
