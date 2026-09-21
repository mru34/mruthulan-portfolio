import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const root = document.getElementById('root')!

// createRoot's first render into a container that already holds prerendered (non-hydrated)
// markup clears and rebuilds every node in that container, in possibly more than one wave (e.g.
// once for the initial commit, again as lazy-loaded chunks resolve). A user who tabs into the
// page before this script finishes loading is focused on a node that gets destroyed in that
// swap, and focus silently falls back to <body>. Restore it to the equivalent freshly-rendered
// element, and keep re-asserting for a short window since a single attempt can lose the race
// against a later wave of the same startup churn.
const priorFocus = document.activeElement
const restoreSelector =
  priorFocus instanceof HTMLElement && root.contains(priorFocus) ? focusSelector(priorFocus) : null

function focusSelector(el: HTMLElement): string | null {
  if (el.id) return `#${el.id}`
  if (el instanceof HTMLAnchorElement && el.getAttribute('href')) {
    return `a[href="${el.getAttribute('href')}"]`
  }
  return null
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (restoreSelector) {
  const restore = () => {
    if (document.activeElement !== document.body) return
    document.querySelector<HTMLElement>(restoreSelector)?.focus()
  }
  restore()
  const observer = new MutationObserver(restore)
  observer.observe(root, { childList: true, subtree: true })
  // Stop once startup churn has settled and stop trying the moment the visitor takes any real
  // action of their own, so this never fights a focus change the visitor actually intended.
  const stop = () => observer.disconnect()
  setTimeout(stop, 2000)
  document.addEventListener('pointerdown', stop, { once: true, capture: true })
  document.addEventListener('keydown', stop, { once: true, capture: true })
}
