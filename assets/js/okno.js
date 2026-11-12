// OKNO — the page follows a change of the window without a reload.
//
// After any change of the window's width or height the page is built again, as on a reload, but you stay where you
// were and the entrances do not play again. It touches no layout and no CSS: it only calls the page's own clear() and
// build(). Works with plain pages, and with GSAP ScrollTrigger / ScrollSmoother when the page uses them.
//
//   Okno.start({
//     build(rebuilt) { ... },   // makes the page: content that depends on the window, animations, scroll scenes.
//                               // rebuilt is true when this runs after a window change
//     clear() { ... },          // undoes what build() made: kill animations and scroll scenes, revert split text
//     content: element          // optional: the element that holds the page's sections in order.
//                               // Default: ScrollSmoother's content if there is one, else <body>
//   })
//   Okno.dur(1.2)               // an entrance's duration or delay: 0 right after a rebuild, so it does not play again
//
// Phones skip changes of the height alone: the address bar resizes the window while you scroll.

const Okno = (() => {
	let opts = null, settling = false

	const ST = () => window.ScrollTrigger
	const smoother = () => window.ScrollSmoother && window.ScrollSmoother.get()
	const content = () => opts.content || (smoother() ? smoother().content() : document.body)
	const touch = () => matchMedia("(hover: none) and (pointer: coarse)").matches
	const max = () => ST() ? ST().maxScroll(window) : document.documentElement.scrollHeight - window.innerHeight
	const getScroll = () => smoother() ? smoother().scrollTop() : window.scrollY
	const setScroll = y => {
		y = Math.max(0, Math.min(y, max())) // never past the end of the page
		smoother() ? smoother().scrollTop(y) : window.scrollTo(0, y)
		if (ST()) ST().update()
	}
	const pins = () => ST() ? ST().getAll().filter(s => s.pin) : []

	// Remembers the place and returns a function that goes back to it after the page is built again:
	// inside a pinned scene the same moment of the scene, at the very end the end, elsewhere the same point of the same section.
	// A scene pinned in one layout and not in the other keeps its place too
	function keepPlace() {
		if (getScroll() >= max() - 2) return () => setScroll(Infinity)
		const docTop = e => e.getBoundingClientRect().top - content().getBoundingClientRect().top
		const pin = pins().find(s => s.isActive)
		if (pin) {
			const trigger = pin.trigger, p = pin.progress
			// the new layout may have no pin for this scene (e.g. pinned only on desktop): go to the same share of the section
			return () => { const s = pins().find(s => s.trigger === trigger); if (s) setScroll(s.start + p * (s.end - s.start)); else setScroll(docTop(trigger) + p * Math.max(0, trigger.offsetHeight - window.innerHeight)) }
		}
		// a section of the page: layers fixed to the screen or laid over the page do not move with it
		const inFlow = c => { const cs = getComputedStyle(c); return cs.position !== "fixed" && cs.position !== "absolute" && cs.display !== "none" }
		const box = content()
		const el = [...box.children].find(c => { const r = c.getBoundingClientRect(); return inFlow(c) && r.height > 0 && r.bottom > 0 })
		if (!el) return null
		// just past a pinned scene its spacer is still on screen, and the rebuild makes a new one: keep the distance past its end
		if (el.classList.contains("pin-spacer")) {
			const s = pins().find(s => s.pin.parentNode === el)
			if (s) {
				const trigger = s.trigger, past = getScroll() - s.end
				return () => { const n = pins().find(s => s.trigger === trigger); if (n) setScroll(n.end + past); else setScroll(docTop(trigger) + trigger.offsetHeight + past) }
			}
		}
		const frac = el.offsetHeight ? (getScroll() - docTop(el)) / el.offsetHeight : 0
		return () => {
			// the section may be pinned in the new layout: go to the same share of its scene
			const s = pins().find(s => s.trigger === el || s.pin === el)
			if (s) { setScroll(s.start + Math.min(Math.max(frac, 0), 1) * (s.end - s.start)); return }
			const y = docTop(el) + frac * el.offsetHeight; if (Math.abs(y - getScroll()) > 0.5) setScroll(y)
		}
	}

	// Goes back to the place and holds it for a moment while the page still settles (pictures that set the layout once
	// decoded, the document's new length that the browser takes a little later). It lets go at once when you scroll,
	// touch or press a key, so it never works against you. Then entrances animate as usual again
	function settleAt(back) {
		let on = true
		const quit = () => { on = false }, inputs = ["wheel", "touchstart", "keydown", "mousedown"]
		inputs.forEach(e => window.addEventListener(e, quit, { passive: true, once: true }))
		const hold = () => { if (on && back) back() }
		const tick = () => { hold(); if (on) requestAnimationFrame(tick) }
		tick()
		if (ST()) ST().addEventListener("refresh", hold)
		setTimeout(() => {
			on = false
			inputs.forEach(e => window.removeEventListener(e, quit))
			if (ST()) ST().removeEventListener("refresh", hold)
			settling = false
		}, 1500)
	}

	function start(o) {
		opts = o
		opts.build(false)
		// The place is remembered whenever scrolling stops, in the layout you are looking at: by the time the browser
		// reports a window change, the CSS has already laid the page out for the new size
		let lastW = window.innerWidth, lastH = window.innerHeight, resizeTimer = null, place = null, back = null, scrollTimer
		const remember = () => { if (resizeTimer === null) place = keepPlace() }
		window.addEventListener("scroll", () => { clearTimeout(scrollTimer); scrollTimer = setTimeout(remember, 120) }, { passive: true })
		setTimeout(remember, 1000)
		window.addEventListener("resize", () => {
			if (resizeTimer === null) back = place
			clearTimeout(resizeTimer)
			resizeTimer = setTimeout(() => {
				resizeTimer = null
				const w = window.innerWidth, h = window.innerHeight
				if (w === lastW && (h === lastH || touch())) return
				lastW = w; lastH = h
				settling = true
				opts.clear()
				opts.build(true)
				settleAt(back)
				setTimeout(remember, 1600) // the place in the new layout, for the next change
			}, 200)
		})
	}

	return { start, dur: s => settling ? 0 : s, get settling() { return settling } }
})()
