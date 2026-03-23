const { execSync } = require('child_process')
const fs = require('fs')

console.log('Building Infinite Scroll block...')

try {
	execSync('npx wp-scripts build', { stdio: 'inherit' })
	// Copy block.json, style.css, and index.js to build directory
	fs.copyFileSync('./src/block.json', './build/block.json')
	fs.copyFileSync('./src/style.css', './build/style.css')
	fs.copyFileSync('./src/index.js', './build/index.js')
	console.log('Build complete.')
} catch (e) {
	console.error('Build failed:', e)
	process.exit(1)
}
