import { sheet, SELECTOR } from './lib'

const dialogs = document.querySelectorAll(SELECTOR)

dialogs.forEach(el => {
  sheet(el as HTMLDialogElement)
})
