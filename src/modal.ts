import { vaul, SELECTOR } from './lib'

const dialogs = document.querySelectorAll(SELECTOR)

dialogs.forEach(el => {
  vaul(el as HTMLDialogElement)
})
