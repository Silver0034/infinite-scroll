class InfiniteScroll {
	#block = null
	#content = null
	#wrapper = null
	#defaultSpeed = 10
	#distance = 0
	#maxDistance = 0
	#animationFrame = null
	#playing = false
	#velocity = 0
	#targetVelocity = 0
	#ease = 0.08
	#lastTimestamp = null
	#firstPlay = true
	#screenReaderContent = null
	#visibilityListener = null
	#setupRetryFrame = null
	#setupAttempts = 0
	#maxSetupAttempts = 120
	#isReady = false

	constructor(element) {
		this.#block = element

		this.#defaultSpeed =
			parseFloat(this.#block.dataset.secondsPerWidth) ||
			this.#defaultSpeed

		this.#content = this.#createVisualTemplate()
		this.#moveContentToScreenReaderContent()

		this.#createInitialAnimationContent()
		this.#block.classList.add('is-infinite-scroll-initializing')
		this.#addHoverEventListeners()
		this.#initializeAnimation()
	}

	#initializeAnimation() {
		if (this.#isReady) {
			return
		}

		if (this.#trySetupAnimation()) {
			this.#finalizeSetup()
			return
		}

		if (document.visibilityState !== 'visible') {
			this.#waitForVisibility()
			return
		}

		if (this.#setupAttempts >= this.#maxSetupAttempts) {
			console.warn(
				'Infinite Scroll: Could not determine dimensions. Keeping static content.'
			)
			this.#block.classList.remove('is-infinite-scroll-initializing')
			return
		}

		this.#setupAttempts += 1
		this.#queueSetupRetry()
	}

	#queueSetupRetry() {
		if (this.#setupRetryFrame) {
			return
		}

		this.#setupRetryFrame = requestAnimationFrame(() => {
			this.#setupRetryFrame = null
			this.#initializeAnimation()
		})
	}

	#waitForVisibility() {
		if (this.#visibilityListener) {
			return
		}

		this.#visibilityListener = () => {
			if (document.visibilityState === 'visible') {
				document.removeEventListener(
					'visibilitychange',
					this.#visibilityListener
				)
				this.#visibilityListener = null
				this.#setupAttempts = 0
				this.#initializeAnimation()
			}
		}

		document.addEventListener('visibilitychange', this.#visibilityListener)
	}

	#finalizeSetup() {
		this.#isReady = true
		this.#block.classList.remove('is-infinite-scroll-initializing')
		this.#block.classList.add('is-infinite-scroll-ready')
		this.play(true)
		this.#limitWrapperWidth()
	}

	#trySetupAnimation() {
		if (!this.#wrapper) {
			return false
		}

		this.#maxDistance = this.#wrapper.offsetWidth
		const contentWidth = this.#block.offsetWidth

		if (
			!Number.isFinite(this.#maxDistance) ||
			this.#maxDistance <= 0 ||
			!Number.isFinite(contentWidth) ||
			contentWidth <= 0
		) {
			return false
		}

		const totalCopies = Math.ceil(contentWidth / this.#maxDistance) + 2

		if (!isFinite(totalCopies) || totalCopies < 2) {
			return false
		}

		const fragment = document.createDocumentFragment()
		for (let i = 0; i < totalCopies; i++) {
			fragment.appendChild(this.#content.cloneNode(true))
		}
		this.#wrapper.replaceChildren(fragment)

		this.#block.style.setProperty(
			'--infinite-scroll-distance',
			`-${this.#maxDistance}px`
		)

		this.#targetVelocity = this.#maxDistance / (this.#defaultSpeed * 60)
		return true
	}

	#addHoverEventListeners() {
		// On hover, pause the animation
		this.#block.addEventListener('mouseenter', () => {
			this.pause()
		})

		// On mouse leave, play the animation
		this.#block.addEventListener('mouseleave', () => {
			this.play()
		})
	}

	#createElement(tag, attrs = {}, children = []) {
		const element = document.createElement(tag)

		for (const [key, value] of Object.entries(attrs)) {
			if (key === 'class') {
				element.classList.add(...value.split(' '))
			} else if (key === 'style' && typeof value === 'object') {
				for (const [styleKey, styleValue] of Object.entries(value)) {
					element.style[styleKey] = styleValue
				}
			} else {
				element.setAttribute(key, value)
			}
		}

		if (!Array.isArray(children)) {
			children = [children]
		}
		for (const child of children) {
			if (typeof child === 'string') {
				element.appendChild(document.createTextNode(child))
			} else if (child instanceof Node) {
				element.appendChild(child)
			}
		}

		return element
	}

	#createInitialAnimationContent() {
		this.#wrapper = this.#createElement('div', {
			class: 'infinite-scroll-wrapper',
			'aria-hidden': true
		})

		this.#wrapper.appendChild(this.#content.cloneNode(true))

		this.#block.appendChild(this.#wrapper)
	}

	#createVisualTemplate() {
		const template = this.#block.cloneNode(true)

		this.#removeAttributes(template)

		template.classList.add('infinite-scroll-content')

		this.#removeScreenReaderText(template)

		// replace all <a> elements with <span> elements in the visual copy
		template.querySelectorAll('a').forEach((a) => {
			const attributes = {}
			// Copy all non-link-specific attributes from <a> to <span>
			for (let attr of a.attributes) {
				if (
					![
						'href',
						'target',
						'rel',
						'download',
						'ping',
						'referrerpolicy',
						'type'
					].includes(attr.name.toLowerCase())
				) {
					attributes[attr.name] = attr.value
				}
			}

			const span = this.#createElement('span', attributes)

			// Move all child nodes from <a> to <span>
			while (a.firstChild) {
				span.appendChild(a.firstChild)
			}
			a.replaceWith(span)
		})

		// Add an empty span with the class infinite-scroll-separator to the end of the visual copy
		const separator = this.#createElement('span', {
			class: 'infinite-scroll-separator'
		})

		template.appendChild(separator)

		return template
	}

	#limitWrapperWidth() {
		// set the .infinite-scroll-wrapper to width 0
		this.#wrapper.style.width = '0px'
	}

	#moveContentToScreenReaderContent() {
		const content = this.#createElement('div', {
			class: 'infinite-scroll-screen-reader-content screen-reader-text'
		})

		while (this.#block.firstChild) {
			content.appendChild(this.#block.firstChild)
		}

		this.#screenReaderContent = content

		this.#block.appendChild(this.#screenReaderContent)
	}

	#removeAttributes(element) {
		Array.from(element.attributes).forEach((attr) => {
			element.removeAttribute(attr.name)
		})
	}

	#removeScreenReaderText(element) {
		element
			.querySelectorAll('.screen-reader-text')
			.forEach((el) => el.remove())
	}

	animate(timestamp) {
		if (!this.#wrapper) return // Prevent error if wrapper is not set
		if (!this.#lastTimestamp) this.#lastTimestamp = timestamp
		const elapsed = timestamp - this.#lastTimestamp
		this.#lastTimestamp = timestamp

		// Ease velocity toward target
		this.#velocity += (this.#targetVelocity - this.#velocity) * this.#ease

		// Move distance
		this.#distance += this.#velocity * (elapsed / (1000 / 60))
		if (this.#distance >= this.#maxDistance) {
			this.#distance -= this.#maxDistance
		}
		this.#wrapper.style.transform = `translateX(${-this.#distance}px)`

		if (Math.abs(this.#velocity) > 0.01 || this.#playing) {
			this.#animationFrame = requestAnimationFrame(
				this.animate.bind(this)
			)
		} else {
			this.#animationFrame = null
		}
	}

	pause() {
		this.#playing = false
		this.#block.classList.add('paused')
		this.#targetVelocity = 0
	}

	play(first = false) {
		if (!this.#maxDistance || this.#maxDistance <= 0) {
			return
		}

		this.#playing = true
		this.#block.classList.remove('paused')
		this.#targetVelocity = this.#maxDistance / (this.#defaultSpeed * 60)
		if (first || this.#firstPlay) {
			this.#velocity = this.#targetVelocity
			this.#firstPlay = false
		}
		this.#lastTimestamp = null
		if (!this.#animationFrame) {
			this.#animationFrame = requestAnimationFrame(
				this.animate.bind(this)
			)
		}
	}
}

// Initialize an instance of the class for each infinite scroll element
document
	.querySelectorAll('.wp-block-infinite-scroll-row')
	.forEach((element) => {
		new InfiniteScroll(element)
	})
