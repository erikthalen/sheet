export const SELECTOR = '[data-sheet]'

const AMOUNT_TO_CLOSE = 100
const TRANSITION = 'all 500ms var(--sheet-easing)'

const sleep = (ms = 0) => new Promise(r => setTimeout(r, ms))

export function sheet(dialog: HTMLDialogElement) {
  const abortController = new AbortController()

  const observer = new MutationObserver(async () => {
    const open = dialog.getAttribute('open') !== null

    const computedStyle = getComputedStyle(document.body)

    const settings = {
      scale: parseFloat(
        computedStyle.getPropertyValue('--sheet-scale-amount') || '20px'
      ),
      borderRadius:
        computedStyle.getPropertyValue('--sheet-border-radius') || '10px',
    }

    const variables = {
      '--clip-top': window.scrollY + 'px',
      '--clip-border': settings.borderRadius,
    }

    if (open) {
      document.body.style.transformOrigin = `center ${window.scrollY}px`
      document.body.style.clipPath = `inset(${
        window.scrollY + 'px'
      } 0px -10px round calc((1 - var(--amount, 0)) * var(--clip-border, 0px)))`

      await sleep(25)

      document.body.style.transition = TRANSITION
      document.documentElement.style.backgroundColor = '#111'

      await sleep(25)

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

      setTimeout(() => {
        document.documentElement.style.removeProperty('background-color')
        document.body.style.removeProperty('transform-origin')
        document.body.style.removeProperty('transition')
        document.body.style.removeProperty('clip-path')
      }, 500)
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

  const destroyDragClose = initDragClose(dialog)

  function viewportHandler() {
    dialog.style.setProperty('--vvh', window.visualViewport?.height + 'px')
  }

  const styles = {
    'max-height': 'none',
    height: 'calc(var(--vvh, 100dvh) - var(--sheet-top-margin, 3rem))',
    position: 'fixed',
    top: 'var(--sheet-top-margin, 3rem)',
    bottom: 'auto',
    overflow: 'auto',
    'overscroll-behavior': 'contain',
  }

  Object.assign(dialog.style, styles)

  viewportHandler()

  // window.visualViewport?.addEventListener('scroll', viewportHandler)
  window.visualViewport?.addEventListener('resize', viewportHandler, {
    signal: abortController.signal,
  })

  return () => {
    observer.disconnect()
    abortController.abort()
    destroyDragClose()
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
    () => {
      clicked = false

      document.body.style.transition = TRANSITION
      document.body.style.removeProperty('--amount')

      dialog.style.removeProperty('transform')
      dialog.style.removeProperty('transition')

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
