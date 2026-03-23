<?php

/**
 * Plugin Name: Infinite Scroll
 * Description: Add an infinite horizontal scroll block
 * Version: 2.0.0
 * Author: Jacob Lodes
 */

define('INFINITE_SCROLL_PLUGIN_VERSION', '2.0.0');

// Register Infinite Scroll block
add_action('init', function () {
    register_block_type(__DIR__ . '/build');
});
