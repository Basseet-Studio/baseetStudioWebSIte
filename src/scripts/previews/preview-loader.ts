import type { PreviewController } from './types'

type PreviewType = 'matrix' | 'moneybox' | 'numu' | 'baseetims'

const controllers = new WeakMap<HTMLElement, PreviewController>()

async function loadInit(type: PreviewType) {
  switch (type) {
    case 'matrix':
      return (await import('./matrix')).initMatrixPreview
    case 'moneybox':
      return (await import('./moneybox')).initMoneyBoxPreview
    case 'numu':
      return (await import('./numu')).initNumuPreview
    case 'baseetims':
      return (await import('./baseetims')).initBaseetIMSPreview
  }
}

function mountPreview(root: HTMLElement, type: PreviewType): void {
  if (controllers.has(root)) return
  void loadInit(type).then((init) => {
    if (controllers.has(root)) return
    controllers.set(root, init(root))
    root.dataset.previewMounted = 'true'
  })
}

function unmountPreview(root: HTMLElement): void {
  const ctrl = controllers.get(root)
  if (ctrl) {
    ctrl.destroy()
    controllers.delete(root)
    delete root.dataset.previewMounted
  }
}

export function initPreviewLoader(scope: ParentNode = document): () => void {
  const roots = scope.querySelectorAll<HTMLElement>('[data-preview-type]')
  if (roots.length === 0) return () => {}

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement
        const type = el.dataset.previewType as PreviewType | undefined
        if (!type) return
        if (entry.isIntersecting) {
          mountPreview(el, type)
        } else {
          unmountPreview(el)
        }
      })
    },
    { root: null, rootMargin: '64px 0px', threshold: 0 },
  )

  roots.forEach((root) => observer.observe(root))

  function onBeforeSwap(): void {
    roots.forEach(unmountPreview)
    observer.disconnect()
  }

  document.addEventListener('astro:before-swap', onBeforeSwap)

  return () => {
    onBeforeSwap()
    document.removeEventListener('astro:before-swap', onBeforeSwap)
  }
}
