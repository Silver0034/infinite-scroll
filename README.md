# Infinite Scroll (WordPress Block Plugin)

A custom WordPress block plugin that adds an endlessly scrolling horizontal row to your site.

This plugin registers a Gutenberg block named **Infinite Scroll** and powers it with a lightweight front-end script that duplicates content to create a smooth loop.

## What It Does

-   Adds an **Infinite Scroll** block in the block editor.
-   Lets you place heading/paragraph content in a horizontal row.
-   Continuously scrolls the row from right to left in a loop.
-   Includes a block setting to control scrolling speed.
-   Pauses movement on hover for better readability.

## Block Details

-   Block name: `infinite-scroll/row`
-   Title in editor: `Infinite Scroll`
-   Category: `Layout`
-   Alignment support: `Wide`, `Full`
-   Color support: text and background
-   Speed attribute: `secondsPerWidth` (default: `10`)

`secondsPerWidth` means how many seconds it takes to move one full content width. Lower numbers scroll faster.

## Requirements

-   WordPress with Gutenberg block editor support
-   Node.js and npm (for local development/build)

## Install (Plugin)

1. Place this folder in your WordPress plugins directory.
2. In WordPress admin, go to **Plugins**.
3. Activate **Infinite Scroll**.

## Use In The Editor

1. Edit a page or post with the block editor.
2. Insert the **Infinite Scroll** block.
3. Add text content inside the block (currently optimized for headings and paragraphs).
4. In block settings, adjust **Seconds to scroll 1 content width**.
5. Publish or update the page.

## Development

Install dependencies:

```bash
npm install
```

Start watch mode for development:

```bash
npm run start
```

Create a production build:

```bash
npm run build
```

## Project Structure

-   `index.php`: plugin bootstrap, script/style enqueue, block registration.
-   `src/frontend.js`: front-end animation/class logic.
-   `src/`: block source files used during development.
-   `build/`: compiled assets consumed by WordPress at runtime.

## Accessibility Notes

The plugin creates a visual animated copy for presentation while preserving a screen-reader-friendly content layer. Links in the visual animation are converted to non-link elements, while original content remains available for assistive technology.

## Important Behavior

-   Front-end script is conditionally enqueued on public pages with the block via `wp_enqueue_scripts`.
-   Front-end style is loaded from `build/style.min.css`.
-   The plugin duplicates content at runtime to keep the loop continuous.

## Troubleshooting

-   Block does not appear:
    -   Make sure the plugin is activated.
    -   Rebuild assets with `npm run build`.
-   Styles or scrolling not updating:
    -   Clear browser cache.
    -   Confirm the `build/` assets exist and are up to date.
-   Scroll speed feels off:
    -   Increase `secondsPerWidth` for slower movement.
    -   Decrease `secondsPerWidth` for faster movement.

## Version

Plugin header version is currently `2.0.0`.
