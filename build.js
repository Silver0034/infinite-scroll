const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const CleanCSS = require('clean-css')
const sass = require('sass')
const { minify } = require('terser')

const rootDir = __dirname
const buildDir = path.join(rootDir, 'build')

function read(filePath) {
	return fs.readFileSync(filePath, 'utf8')
}

function write(filePath, content) {
	fs.writeFileSync(filePath, content, 'utf8')
}

async function runBuild() {
	console.log('Building Infinite Scroll block...')

	execSync('npx wp-scripts build', { stdio: 'inherit' })

	fs.copyFileSync('./src/block.json', './build/block.json')

	const scssSourcePath = path.join(rootDir, 'src', 'style.scss')
	const cssSourcePath = path.join(buildDir, 'style.css')
	const compiledScss = sass.compile(scssSourcePath, {
		style: 'expanded'
	})
	write(cssSourcePath, compiledScss.css)

	const cssMinPath = path.join(buildDir, 'style.min.css')
	const cssMinified = new CleanCSS({ level: 2 }).minify(read(cssSourcePath))

	if (cssMinified.errors.length > 0) {
		throw new Error(cssMinified.errors.join('\n'))
	}

	write(cssMinPath, cssMinified.styles)

	const jsSourcePath = path.join(rootDir, 'src', 'frontend.js')
	const jsMinPath = path.join(buildDir, 'frontend.min.js')
	const jsMinified = await minify(read(jsSourcePath), {
		compress: true,
		mangle: true,
		module: false
	})

	if (!jsMinified.code) {
		throw new Error('Terser did not produce output.')
	}

	write(jsMinPath, jsMinified.code)

	const builtBlockJsonPath = path.join(buildDir, 'block.json')
	const builtBlockJson = JSON.parse(read(builtBlockJsonPath))
	builtBlockJson.viewScript = 'file:./frontend.min.js'
	builtBlockJson.style = 'file:./style.min.css'
	write(builtBlockJsonPath, JSON.stringify(builtBlockJson, null, 2))

	console.log('Build complete.')
}

runBuild().catch((error) => {
	console.error('Build failed:', error)
	process.exit(1)
})
