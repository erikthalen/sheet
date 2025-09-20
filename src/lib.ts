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

    const variables = {
      '--clip-top': window.scrollY + 'px',
      '--clip-border': settings.borderRadius,
    }

    if (open) {
      document.body.style.transformOrigin = `center ${window.scrollY}px`
      document.body.style.clipPath = `inset(${
        window.scrollY + 'px'
      } 0px -10px round calc((1 - var(--amount, 0)) * var(--clip-border, 0px)))`

      await sleep()

      document.body.style.transition = 'all 500ms var(--vaul-easing)'
      document.documentElement.style.backgroundColor = '#111'

      await sleep()

      Object.entries(variables).forEach(([key, value]) => {
        document.body.style.setProperty(key, value)
      })

      document.body.style.translate = `0 calc((1 - var(--amount, 0)) * ${settings.scaleAmount}px)`
      document.body.style.scale = `calc(1 - (1 - var(--amount, 0)) * ${px2percent(
        settings.scaleAmount * 2,
        window.innerWidth
      )})`
    } else {
      Object.keys(variables).forEach(key => {
        document.body.style.removeProperty(key)
      })

      document.body.style.removeProperty('translate')
      document.body.style.removeProperty('scale')

      setTimeout(() => {
        document.documentElement.style.removeProperty('background-color')
        document.documentElement.style.removeProperty('transform-origin')
        document.body.style.removeProperty('transition')
        document.body.style.removeProperty('clip-path')
        document.body.style.removeProperty('scale')
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

  initDragClose(dialog)

  return () => observer.disconnect()
}

function initDragClose(dialog: HTMLDialogElement) {
  let clicked = false
  let pointer = { x: 0, y: 0 }
  let amount = 0

  const handle = dialog.querySelector('[data-vaul-handle]') as HTMLElement

  if (!handle) return

  handle.addEventListener('pointerdown', e => {
    clicked = true
    // pointer.x = e.clientX
    pointer.y = e.clientY
    document.body.style.transition = 'none'
    dialog.style.transition = 'none'
  })

  window.addEventListener('pointerup', () => {
    clicked = false
    document.body.style.transition = 'all 500ms var(--vaul-easing)'
    dialog.style.removeProperty('transform')
    dialog.style.removeProperty('transition')
    document.body.style.removeProperty('--amount')

    if (amount > 100) dialog.close()

    amount = 0
  })

  window.addEventListener('pointermove', e => {
    if (!clicked) return

    let { height } = dialog.getBoundingClientRect()

    const deltaY =
      amount < 0 ? (e.clientY - pointer.y) / 20 : e.clientY - pointer.y

    amount += deltaY

    dialog.style.transform = `translateY(${amount}px)`
    console.log(height, amount)
    document.body.style.setProperty('--amount', (amount / height).toString())

    pointer.y = e.clientY
  })
}

function px2percent(targetPx: number, px: number) {
  return targetPx / px
}
