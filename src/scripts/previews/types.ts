export type AutoLoopStep = (done: () => void) => void

export interface GhostCursor {
  moveTo: (el: Element) => void
  click: () => void
  show: () => void
  hide: () => void
  destroy: () => void
}

export interface AutoLoop {
  start: () => void
  stop: () => void
  destroy: () => void
}

export interface PreviewController {
  destroy: () => void
}
