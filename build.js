const { execSync, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const CleanCSS = require('clean-css')
const sass = require('sass')
const { minify } = require('terser')

const rootDir = __dirname
const buildDir = path.join(rootDir, 'build')
const isWatchMode = process.argv.includes('--watch')

let customBuildTimer = null
let customBuildInProgress = false
let customBuildQueued = false

function read(filePath) {
	return fs.readFileSync(filePath, 'utf8')
}

function write(filePath, content) {
	fs.writeFileSync(filePath, content, 'utf8')
}

function patchBuiltBlockJson() {
	const builtBlockJsonPath = path.join(buildDir, 'block.json')
	if (!fs.existsSync(builtBlockJsonPath)) {
		fs.copyFileSync('./src/block.json', './build/block.json')
	}

	const builtBlockJson = JSON.parse(read(builtBlockJsonPath))
	const nextViewScript = 'file:./frontend.min.js'
	const nextStyle = 'file:./style.min.css'
	const needsWrite =
		builtBlockJson.viewScript !== nextViewScript ||
		builtBlockJson.style !== nextStyle

	if (!needsWrite) {
		return
	}

	builtBlockJson.viewScript = nextViewScript
	builtBlockJson.style = nextStyle
	write(builtBlockJsonPath, JSON.stringify(builtBlockJson, null, 2))
}

async function runCustomBuildSteps() {
	if (customBuildInProgress) {
		customBuildQueued = true
		return
	}

	customBuildInProgress = true

	try {
		const scssSourcePath = path.join(rootDir, 'src', 'style.scss')
		const cssSourcePath = path.join(buildDir, 'style.css')
		const compiledScss = sass.compile(scssSourcePath, {
			style: 'expanded'
		})
		write(cssSourcePath, compiledScss.css)

		const cssMinPath = path.join(buildDir, 'style.min.css')
		const cssMinified = new CleanCSS({ level: 2 }).minify(
			read(cssSourcePath)
		)

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
		patchBuiltBlockJson()
	} finally {
		customBuildInProgress = false
	}

	if (customBuildQueued) {
		customBuildQueued = false
		await runCustomBuildSteps()
	}
}

function queueCustomBuild(reason) {
	if (customBuildTimer) {
		clearTimeout(customBuildTimer)
	}

	customBuildTimer = setTimeout(async () => {
		customBuildTimer = null
		console.log(`Syncing custom assets (${reason})...`)
		await runCustomBuildSteps()
		console.log('Custom assets synced.')
	}, 100)
}

function watchCustomAssets() {
	const watchedPaths = [
		path.join(rootDir, 'src', 'style.scss'),
		path.join(rootDir, 'src', 'frontend.js'),
		path.join(rootDir, 'src', 'block.json'),
		path.join(buildDir, 'block.json')
	]

	for (const filePath of watchedPaths) {
		if (!fs.existsSync(filePath)) {
			continue
		}

		fs.watch(filePath, () => {
			queueCustomBuild(path.basename(filePath))
		})
	}
}

function startWpScriptsWatch() {
	const child = spawn('npx wp-scripts start', {
		stdio: 'inherit',
		shell: true
	})

	const stopChild = () => {
		if (!child.killed) {
			child.kill('SIGINT')
		}
	}

	process.on('SIGINT', stopChild)
	process.on('SIGTERM', stopChild)

	child.on('close', (code) => {
		process.exit(code ?? 0)
	})
}

async function runBuild() {
	console.log('Building Infinite Scroll block...')

	execSync('npx wp-scripts build', { stdio: 'inherit' })
	await runCustomBuildSteps()

	console.log('Build complete.')
}

async function runStart() {
	console.log('Starting Infinite Scroll dev build...')

	await runCustomBuildSteps()
	watchCustomAssets()
	startWpScriptsWatch()

	console.log('Watching for changes...')
}

const runner = isWatchMode ? runStart : runBuild

runner().catch((error) => {
	console.error('Build failed:', error)
	process.exit(1)
})
