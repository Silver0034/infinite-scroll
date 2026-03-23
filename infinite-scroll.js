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

	constructor(element) {
		this.#block = element

		this.#defaultSpeed =
			parseFloat(this.#block.dataset.secondsPerWidth) ||
			this.#defaultSpeed

		this.#content = this.#createVisualTemplate()
		this.#moveContentToScreenReaderContent()

		this.#createInitialAnimationContent()

		window.addEventListener('load', () => {
			console.log('Window loaded, starting infinite scroll animation')
			requestAnimationFrame(this.#addDuplicateAnimationContent.bind(this))
			this.play(true)
			this.#addHoverEventListeners()
			setTimeout(() => {
				this.#limitWrapperWidth()
			}, 500)
		})
	}

	#addDuplicateAnimationContent() {
		this.#maxDistance = this.#wrapper.offsetWidth
		const contentWidth = this.#block.offsetWidth

		console.log(
			'Content Width:',
			contentWidth,
			'Max Distance:',
			this.#maxDistance
		)

		// get the number of copies needed to cover the width plus one extra
		const copiesNeeded = Math.ceil(contentWidth / this.#maxDistance) + 1

		// stop if there's a problem or copiesNeeded is infinity
		if (!isFinite(copiesNeeded) || copiesNeeded <= 1) {
			console.warn(
				'Infinite Scroll: Unable to calculate copies needed. Animation will not run.'
			)
			return
		}

		console.log('calculation:', Math.ceil(contentWidth / this.#maxDistance))

		console.log('Copies Needed:', copiesNeeded - 1)

		// Add the required number of copies to the wrapper
		for (let i = 0; i < copiesNeeded; i++) {
			this.#wrapper.appendChild(this.#content.cloneNode(true))
		}

		this.#block.style.setProperty(
			'--infinite-scroll-distance',
			`-${this.#maxDistance}px`
		)

		this.#targetVelocity = this.#maxDistance / (this.#defaultSpeed * 60) // px per frame at 60fps
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
