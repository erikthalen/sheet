import './style.css'
import './modal'

function viewportHandler() {
  document.body.style.setProperty('--vvh', window.visualViewport?.height + 'px')
}

viewportHandler()

// window.visualViewport?.addEventListener('scroll', viewportHandler)
window.visualViewport?.addEventListener('resize', viewportHandler)
