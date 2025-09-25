export const SELECTOR = '[data-sheet]'

const AMOUNT_TO_CLOSE = 100
const TRANSITION = `all var(--sheet-duration, 500ms) var(--sheet-easing)`

const sleep = (ms = 0) => new Promise(r => setTimeout(r, ms))

export function sheet(dialog: HTMLDialogElement) {
  const abortController = new AbortController()

  const observer = new MutationObserver(async () => {
    const open = dialog.getAttribute('open') !== null

    const settings = getDefaultValues()

    const variables = {
      '--clip-top': window.scrollY + 'px',
      '--clip-border': settings.borderRadius,
    }

    if (open) {
      // styles to go from
      document.body.style.transformOrigin = `center ${window.scrollY}px`
      document.body.style.clipPath = `inset(${
        window.scrollY + 'px'
      } 0px -1000000000000px round calc((1 - var(--amount, 0)) * var(--clip-border, 0px)))`

      await sleep(25)

      document.body.style.transition = TRANSITION
      document.documentElement.style.backgroundColor = '#111'

      await sleep(25)

      // apply transition
      document.body.style.transition = TRANSITION

      await sleep(25)

      // styles to go to
      Object.entries(variables).forEach(([key, value]) => {
        document.body.style.setProperty(key, value)
      })

      document.body.style.translate = `0 calc((1 - var(--amount, 0)) * ${settings.scale}px)`
      document.body.style.scale = `calc(1 - (1 - var(--amount, 0)) * ${
        (settings.scale * 2) / window.innerWidth
      })`
    } else {
      Object.keys(variables).forEach(key => {
        document.body.style.removeProperty(key)
      })

      document.body.style.removeProperty('translate')
      document.body.style.removeProperty('scale')

      // cleanup after transition is done
      setTimeout(() => {
        document.documentElement.style.removeProperty('background-color')
        document.body.style.removeProperty('transform-origin')
        document.body.style.removeProperty('transition')
        document.body.style.removeProperty('clip-path')
      }, settings.duration)
    }
  })

  if (dialog.tagName !== 'DIALOG') {
    console.warn(
      `Element with ${SELECTOR} must be <dialog>, received:`,
      dialog.tagName
    )
    return
  }

  observer.observe(dialog, { attributeFilter: ['open'] })

  Object.assign(dialog.style, dialogStaticStyles())

  const destroyDragClose = initDragClose(dialog)
  const destroyViewportResize = initViewportResize()

  return () => {
    observer.disconnect()
    abortController.abort()
    destroyDragClose()
    destroyViewportResize()
  }
}

function initDragClose(dialog: HTMLDialogElement) {
  const abortController = new AbortController()

  let clicked = false
  let pointer = { x: 0, y: 0 }
  let amount = 0

  const handle = dialog.querySelector('[data-sheet-handle]') as HTMLElement

  handle.style.touchAction = 'none'

  if (!handle) return () => abortController.abort()

  handle.addEventListener(
    'pointerdown',
    e => {
      clicked = true
      pointer.y = e.clientY

      document.body.style.transition = 'none'
      dialog.style.transition = 'none'
    },
    { signal: abortController.signal }
  )

  window.addEventListener(
    'pointerup',
    async () => {
      clicked = false

      document.body.style.transition = TRANSITION
      document.body.style.removeProperty('--amount')

      dialog.style.removeProperty('transition')

      await sleep()

      dialog.style.removeProperty('transform')

      if (amount > AMOUNT_TO_CLOSE) dialog.close()

      amount = 0
    },
    { signal: abortController.signal }
  )

  window.addEventListener(
    'pointermove',
    e => {
      if (!clicked) return

      let { height } = dialog.getBoundingClientRect()

      const deltaY = e.clientY - pointer.y

      amount += amount < 0 ? deltaY / 20 : deltaY

      dialog.style.transform = `translateY(${amount}px)`
      document.body.style.setProperty('--amount', (amount / height).toString())

      pointer.y = e.clientY
    },
    { signal: abortController.signal }
  )

  return () => {
    abortController.abort()
  }
}

function initViewportResize() {
  const abortController = new AbortController()

  function viewportHandler() {
    document.body.style.setProperty(
      '--vvh',
      window.visualViewport?.height + 'px'
    )
  }

  viewportHandler()

  window.visualViewport?.addEventListener(
    'scroll',
    e => {
      console.log('e', e)
    },
    {
      signal: abortController.signal,
    }
  )

  window.visualViewport?.addEventListener('resize', viewportHandler, {
    signal: abortController.signal,
  })

  return () => abortController.abort()
}

function getDefaultValues() {
  const cs = getComputedStyle(document.body)

  return {
    duration: parseFloat(cs.getPropertyValue('--sheet-duration') || '500ms'),
    scale: parseFloat(
      cs.getPropertyValue('--sheet-background-scale-amount') || '20px'
    ),
    borderRadius:
      cs.getPropertyValue('--sheet-background-border-radius') || '10px',
  }
}

function dialogStaticStyles() {
  return {
    'max-height': 'none',
    height: 'calc(var(--vvh, 100dvh) - var(--sheet-top-margin, 3rem) + 20px)',
    'padding-bottom': '20px',
    position: 'fixed',
    top: 'var(--sheet-top-margin, 3rem)',
    bottom: 'auto',
    overflow: 'auto',
    'overscroll-behavior': 'contain',
  }
}
