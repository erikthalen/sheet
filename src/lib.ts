export const SELECTOR = '[data-vaul]'

const sleep = (ms = 0) => new Promise(r => setTimeout(r, ms))

export function vaul(dialog: HTMLDialogElement) {
  const observer = new MutationObserver(async ([record]) => {
    const open = dialog.getAttribute('open') !== null

    const computedStyle = getComputedStyle(document.body)

    const settings = {
      scaleAmount: parseFloat(
        computedStyle.getPropertyValue('--vaul-scale-amount') || '20px'
      ),
      borderRadius:
        computedStyle.getPropertyValue('--vaul-border-radius') || '10px',
    }

    const backgroundStyles = {
      'background-color': '#111',
    }

    const dynamicStyles = {
      scale: `${1 - px2percent(settings.scaleAmount * 2, window.innerWidth)}`,
      translate: `0 ${settings.scaleAmount}px`,
      'border-radius': settings.borderRadius,
    }

    const transitionStyles = {
      transition: 'all 500ms var(--vaul-easing)',
    }

    if (open) {
      // initDragClose(dialog)

      Object.assign(document.body.style, {
        'transform-origin': `center ${window.scrollY}px`,
      })

      await sleep()

      Object.assign(document.body.style, transitionStyles)
      Object.assign(document.documentElement.style, backgroundStyles)

      await sleep()

      Object.assign(document.body.style, dynamicStyles)
    } else {
      Object.keys(dynamicStyles).forEach(property => {
        document.body.style.removeProperty(property)
      })

      setTimeout(() => {
        document.body.addEventListener(
          'transitionend',
          () => {
            Object.keys(transitionStyles).forEach(property => {
              document.body.style.removeProperty(property)
            })

            Object.keys(backgroundStyles).forEach(property => {
              document.documentElement.style.removeProperty(property)
            })

            document.documentElement.style.removeProperty('transform-origin')
          },
          { once: true }
        )
      })
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

  return () => observer.disconnect()
}

function initDragClose(dialog: HTMLElement) {
  let clicked = false

  const content = dialog.querySelector('[data-vaul-content]')

  dialog.addEventListener('pointerdown', () => (clicked = true))
  dialog.addEventListener('pointermove', () => {
    if (!clicked) return

    console.log('DRAG')
    const scrollY = content?.scrollTop

    console.log(scrollY)
  })
}

function px2percent(targetPx: number, px: number) {
  return targetPx / px
}
